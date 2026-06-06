import { Router } from "express";
import {
  createImageUsingPrompt,
  getAllProjectByUserId,
  deleteProjectById,
  updateLikeDislike,
  createCollageUsingPrompt,
  editImageUsingPrompt
} from "../controllers/project.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-image-using-prompt").post(createImageUsingPrompt);
router.route("/get-all-by-user-id").post(getAllProjectByUserId);
router.route("/delete-project-by-id").post(deleteProjectById);
router.route("/update-project-like").post(updateLikeDislike);
router.route("/create-collage-using-prompt").post(upload.fields([{ name: "images", maxCount: 10,}]), createCollageUsingPrompt);
router.route("/edit-image-using-prompt").post(upload.fields([{ name: "file", maxCount: 1,}]), editImageUsingPrompt);

export default router;