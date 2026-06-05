import { Router } from "express";
import {
  createImageUsingPrompt,
  getAllProjectByUserId,
  deleteProjectById,
  updateLikeDislike
} from "../controllers/project.controller.js";

const router = Router();

router.route("/create-image-using-prompt").post(createImageUsingPrompt);
router.route("/get-all-by-user-id").post(getAllProjectByUserId);
router.route("/delete-project-by-id").post(deleteProjectById);
router.route("/update-project-like").post(updateLikeDislike);

export default router;