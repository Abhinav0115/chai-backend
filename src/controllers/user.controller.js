import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
    //IMP: get user details from frontend

    const { username, fullName, email, password } = req.body;

    //IMP: validation user -  not empty

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

    const user = User.findOne({ $or: [{ username }, { email }] });

    if (user) {
        throw new ApiError(409, "User already exists");
    }

    //IMP: check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
        avatar: avatar.url,
        coverImage: coverImage?.url || null,
    });

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
        .json(new ApiResponse(201, createdUser, "User register successfully"));
});
