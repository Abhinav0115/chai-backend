import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// const watchHistorySchema = new mongoose.Schema(
//   {
//     videoId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Video",
//     },
//     watchedAt: {
//       type: Date,
//     },
//   },
//   { timestamps: true }
// );

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            require: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            require: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            require: [true, "Full name is required"],
            trim: true,
            index: true,
        },
        password: {
            type: String,
            require: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },

        coverImage: {
            type: String, //cloudinary url
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },

        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.isPasswordMatch = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
