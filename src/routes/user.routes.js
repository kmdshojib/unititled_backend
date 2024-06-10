import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.conroller.js";
import { upload } from './../middlewares/multer.middlewere.js';
import { verfyJWT } from "../middlewares/auth.middlewere.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);
router.route("/login").post(loginUser)
router.route("/logout").post(verfyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;