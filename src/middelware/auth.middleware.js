import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const VerifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.headers?.authorization.split(" ")[1] ||
            req.headers?.Authorization.split("")[1] ||
            req.header("Authorization").split(" ")[1] ||
            req.header("authorization").split(" ")[1];

        if (!token) {
            throw new ApiError(401, "No token provided");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            //TODO:
            throw new ApiError(404, "User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        next(new ApiError(401, "Unauthorized"));
    }
});
