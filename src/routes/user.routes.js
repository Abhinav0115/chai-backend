import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.post("/register", registerUser);
// The above code is equivalent to:  -> // router.route("/register").post(registerUser);

export default router;
