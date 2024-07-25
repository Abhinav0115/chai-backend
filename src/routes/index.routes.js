import { Router } from "express";
import userRoutes from "./user.routes.js";
// import videoRoutes from "./video.routes.js";

const router = Router();

router.get("/", (req, res) => {
    res.json({ message: "API v1" });
});

router.use("/user", userRoutes);
// router.use("/video", videoRoutes);

export default router;
