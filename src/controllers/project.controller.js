import { asyncHandler } from "../utils/asyncHandler.js";
import { Project } from "../models/project.model.js";
import { generateImage } from "../utils/image.util.js";
import { uploadOnCloudinary } from "../utils/uploadToCloudinary.js";

const createImageUsingPrompt = asyncHandler(async (req, res) => {
  const { prompt, size, user_id } = req.body;

  if (!prompt) {
    return res
      .status(200)
      .json({ success: false, message: "Prompt is required!" });
  }

  const base64_json = await generateImage(prompt);
  const imageFile = `data:image/png;base64,${base64_json}`;
  const aiImage = await uploadOnCloudinary(imageFile, "IMAGES");
  const image_url = aiImage.url;

  const project = await Project.create({
    prompt,
    size,
    category: "Image",
    operation: "New Image",
    image_url,
    user: user_id,
  });

  if (!project) {
    return res
      .status(200)
      .json({ success: false, message: "Failed to create image!" });
  }

  return res.status(200).json({
    success: true,
    message: "Image created successfully!",
    image_url: image_url,
  });
});

const getAllProjectByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res
      .status(200)
      .json({ success: false, message: "User id is required!" });
  }

  const projects = await Project.find({ user: userId })
    .select("prompt category operation image_url is_liked createdAt")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, projects: projects });
});

const deleteProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return res
      .status(200)
      .json({ success: false, message: "Project id is required!" });
  }

  const deletedProject = Project.findByIdAndDelete(projectId);
  if (!deletedProject) {
    return res
      .status(200)
      .json({ success: false, message: "Failed to delete project!" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Project deleted successfully!" });
});

const updateLikeDislike = asyncHandler(async (req, res) => {
  const { projectId, userId, isLiked, reason } = req.body;

  if (!projectId || !userId) {
    return res
      .status(200)
      .json({ success: false, message: "Project and user ids are required!" });
  }

  const feedback = await ProjectFeedback.findOneAndUpdate(
    {
      _id: projectId,
      user: userId,
    },
    {
      is_liked: isLiked,
      reason,
    },
  );

  if (!feedback) {
    return res
      .status(200)
      .json({ success: false, message: "Failed to update feedback!" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Feedback updated successfully!" });
});

export {
  createImageUsingPrompt,
  getAllProjectByUserId,
  deleteProjectById,
  updateLikeDislike,
};