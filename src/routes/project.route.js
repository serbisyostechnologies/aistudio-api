import { Router } from "express";
import {
  createImageUsingPrompt,
  getAllProjectByUserId,
  deleteProjectById,
  updateLikeDislike,
  createCollageUsingPrompt,
  editImageUsingPrompt,
  analyseImageUsingPrompt,
  createVideoUsingPrompt,
  createVideoUsingImages
} from "../controllers/project.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-image-using-prompt").post(createImageUsingPrompt);
router.route("/get-all-by-user-id").post(getAllProjectByUserId);
router.route("/delete-project-by-id").post(deleteProjectById);
router.route("/update-project-like").post(updateLikeDislike);
router.route("/create-collage-using-prompt").post(upload.fields([{ name: "images", maxCount: 10,}]), createCollageUsingPrompt);
router.route("/edit-image-using-prompt").post(upload.fields([{ name: "userImage", maxCount: 1,}]), editImageUsingPrompt);
router.route("/analyse-image-using-prompt").post(upload.fields([{ name: "userImage", maxCount: 1,}]), analyseImageUsingPrompt);
router.route("/create-video-using-prompt").post(createVideoUsingPrompt);
router.route("/create-video-using-images").post(upload.fields([{ name: "images", maxCount: 10,}]), createVideoUsingImages);

export default router;