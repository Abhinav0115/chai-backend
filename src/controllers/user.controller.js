import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error while generating tokens");
    }
};

export const registerUser = asyncHandler(async (req, res) => {
    //IMP: get user details from frontend

    const { username, fullName, email, password } = req.body;

    //IMP: validation user -  not empty, email valid, user exists, images, avatar
    //Method 1
    // if (!username || !fullName || !email || !password) {
    //     throw new ApiError(400, "All fields are required");
    // }

    //Method 2
    if (
        [username, fullName, email, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }
    // check if email is valid
    if (email.includes("@") === false || email.includes(".") === false) {
        throw new ApiError(400, "Invalid email");
    }

    //IMP: check if user already exists: username, email

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (user) {
        throw new ApiError(409, "User already exists");
    }

    //IMP: check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files?.coverImage && req.files?.coverImage[0]) {
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    //IMP: upload them to cloudinary, avatar

    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Error uploading avatar");
    }

    //IMP: create user object — create entry in db
    const newUser = new User({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
    });

    await newUser.save();

    //IMP: remove password and refresh token field from response

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    );

    //IMP: check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Error while registering user");
    }

    //IMP: return res

    return res
        .status(201)
        .json(new ApiResponse(201, "User register successfully", createdUser));
});

export const loginUser = asyncHandler(async (req, res) => {
    // take imput from user
    const { email, password, username } = req.body;

    // check if user wrote both field

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }
    //alternative way
    // if (!(username || email)) {
    //     throw new ApiError(400, "Username or email is required");
    // }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    // check if user is available or not
    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // match password
    const isPasswordvalid = await user.isPasswordMatch(password);

    if (!isPasswordvalid) {
        throw new ApiError(401, "Invalid password");
    }
    ``;

    // generate access and refersh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    //send access token and refrsh token in cookie

    const option = {
        httpOnly: true,
        // expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        secure: true,
    };

    // send response

    res.cookie("accessToken", accessToken, option).cookie(
        "refreshToken",
        refreshToken,
        option
    );

    return res.status(200).json(
        new ApiResponse(200, "User logged in successfully", {
            user: loggedInUser,
            accessToken,
            refreshToken,
        })
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: null } },
        { new: true }
    );

    const option = {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});


export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiError(401, "No refresh token provided");
    }

    try {
        const decoded = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decoded?._id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        if (user?.refreshToken !== incommingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const option = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefreshToken(user._id);

        res.cookie("accessToken", accessToken, option).cookie(
            "refreshToken",
            newRefreshToken,
            option
        );

        return res.status(200).json(
            new ApiResponse(200, "Access token refreshed successfully", {
                accessToken,
                refreshToken: newRefreshToken,
            })
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Password does not match");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordMatch = await user.isPasswordMatch(oldPassword);

    if (!isPasswordMatch) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});


export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

export const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadToCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar?.url,
            },
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path;

    if (!coverLocalPath) {
        throw new ApiError(400, "Cover Image is required");
    }

    const coverImage = await uploadToCloudinary(coverLocalPath);

    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage?.url,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});
