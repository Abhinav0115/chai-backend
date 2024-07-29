import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

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

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            }),
            "User logged in successfully"
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    const id = req.user._id;

    await findByIdAndUpdate(
        id,
        { $set: { refreshToken: null } },
        { new: true }
    );

    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .clearCookies("accessToken", option)
        .clearCookies("refreshToken", option)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});
