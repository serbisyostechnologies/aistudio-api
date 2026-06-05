import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  removeProfilePhoto,
  updateProfilePhoto,
  updateDeviceIdentities
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/remove-profile-photo").post(removeProfilePhoto);
router.route("/upload-profile-photo").post(upload.fields([{ name: "avatar", maxCount: 1,}]), updateProfilePhoto);
router.route("/update-device-identities").post(updateDeviceIdentities);

export default router;