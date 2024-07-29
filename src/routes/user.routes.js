import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middelware/multer.middleware.js";
import { VerifyJWT } from "../middelware/auth.middleware.js";

const router = Router();

router.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);
// The above code is equivalent to:  -> // router.route("/register").post(registerUser);

// login
router.route("/login").post(loginUser);

// secured route
//    -> logout
router.route("/logout").post(VerifyJWT, logoutUser);
// The above code is equivalent to:  -> // router.post("/logout", VerifyJWT, logoutUser);

//    ->get new access token
router.post("/refresh-token", refreshAccessToken);

export default router;
