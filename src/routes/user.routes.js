import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middelware/multer.middleware.js";

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

export default router;
