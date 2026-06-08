import { asyncHandler } from "../utils/asyncHandler.js";
import { Project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import {
  generateImage,
  generateCollage,
  editImage,
  analyseImage,
} from "../utils/image.util.js";
import { generateVideo } from "../utils/video.util.js";
import { uploadOnCloudinary } from "../utils/uploadToCloudinary.js";
import fs from "fs";
import { cleanPrompt } from "../utils/promptValidator.js";

const createImageUsingPrompt = asyncHandler(async (req, res) => {
  const { prompt, size, user_id } = req.body;

  if (!prompt) {
    return res
      .status(200)
      .json({ success: false, message: "Prompt is required!" });
  }

  if (prompt.toLowerCase().includes("[PASSWORD]")) {
    return res.status(200).json({
      success: false,
      message: "Unable to create image because of sensitve text in prompt!",
    });
  }

  const clearedPrompt = cleanPrompt(prompt);
  const base64_json = await generateImage(clearedPrompt);
  const imageFile = `data:image/png;base64,${base64_json}`;
  const aiImage = await uploadOnCloudinary(imageFile, "IMAGES");
  const image_url = aiImage.url;

  const project = await Project.create({
    prompt,
    size,
    category: "Image",
    operation: "Create Image",
    image_url,
    user: user_id,
  });

  if (!project) {
    return res
      .status(200)
      .json({ success: false, message: "Failed to create image!" });
  }

  const user = await User.findById(user_id);
  const updatedUser = await updateCredit(user);

  return res.status(200).json({
    success: true,
    message: "Image created successfully!",
    image_url: image_url,
    credits: updatedUser.credits,
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
    .select("_id operation image_url createdAt")
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

const createCollageUsingPrompt = asyncHandler(async (req, res) => {
  try {
    const { prompt, size, user_id } = req.body;
    if (prompt.toLowerCase().includes("[PASSWORD]")) {
      return res.status(200).json({
        success: false,
        message: "Unable to create image because of sensitve text in prompt!",
      });
    }

    const clearedPrompt = cleanPrompt(prompt);
    const images = req.files.images;

    const base64_json = await generateCollage(clearedPrompt, size, images);
    const collageFile = `data:image/png;base64,${base64_json}`;
    const collageImage = await uploadOnCloudinary(collageFile, "COLLAGE");
    const collage_url = collageImage.url;

    const project = await Project.create({
      prompt,
      size,
      category: "Collage",
      operation: "Image Collage",
      image_url: collage_url,
      user: user_id,
    });

    if (!project) {
      return res
        .status(200)
        .json({ success: false, message: "Failed to create image collage!" });
    }

    const user = await User.findById(user_id);
    const updatedUser = await updateCredit(user);

    return res.status(200).json({
      success: true,
      message: "Image collage created successfully!",
      collage_url: collage_url,
      credits: updatedUser.credits,
    });
  } catch (error) {
    return res
      .status(200)
      .json({ success: false, message: "Failed to create image collage!" });
  }
});

const editImageUsingPrompt = asyncHandler(async (req, res) => {
  try {
    const { prompt, size, user_id } = req.body;
    const imageFile = req.files.userImage[0];

    if (prompt.toLowerCase().includes("[PASSWORD]")) {
      return res.status(200).json({
        success: false,
        message: "Unable to create image because of sensitve text in prompt!",
      });
    }

    const clearedPrompt = cleanPrompt(prompt);
    const base64_json = await editImage(clearedPrompt, size, imageFile);
    const editedFile = `data:image/png;base64,${base64_json}`;
    const editedImage = await uploadOnCloudinary(editedFile, "EDIT");
    const edited_url = editedImage.url;

    const project = await Project.create({
      prompt,
      size,
      category: "Image",
      operation: "Edit Image",
      image_url: edited_url,
      user: user_id,
    });

    if (!project) {
      return res
        .status(200)
        .json({ success: false, message: "Failed to edit image!" });
    }

    const user = await User.findById(user_id);
    const updatedUser = await updateCredit(user);

    return res.status(200).json({
      success: true,
      message: "Image edit successfully!",
      edited_url: edited_url,
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(200)
      .json({ success: false, message: "Failed to edit image!" });
  }
});

const analyseImageUsingPrompt = asyncHandler(async (req, res) => {
  try {
    const { prompt, user_id } = req.body;
    const userImage = req.files.userImage[0];

    if (prompt.toLowerCase().includes("[PASSWORD]")) {
      return res.status(200).json({
        success: false,
        message: "Unable to create image because of sensitve text in prompt!",
      });
    }

    const clearedPrompt = cleanPrompt(prompt);
    const imageBuffer = fs.readFileSync(userImage.path);

    if (!userImage) {
      return res.status(200).json({
        success: false,
        message: "Please upload an image to analyse!",
      });
    }

    const analysis = await analyseImage(
      imageBuffer,
      userImage.mimetype,
      clearedPrompt,
    );

    const userImagePath = userImage.path;
    const image = await uploadOnCloudinary(userImagePath, "ANALYSIS_IMAGES");

    const image_url = image.url;
    const project = await Project.create({
      prompt,
      size: "",
      category: "Image",
      operation: "Analyse Image",
      analysis_text: analysis,
      image_url: image_url,
      user: user_id,
    });

    if (!project) {
      return res
        .status(200)
        .json({ success: false, message: "Failed to edit image!" });
    }

    const user = await User.findById(user_id);
    const updatedUser = await updateCredit(user);

    return res.status(200).json({
      success: true,
      message: "Image analysed successfully!",
      analysis_text: analysis,
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(200)
      .json({ success: false, message: "Failed to analyse image!" });
  }
});

const updateCredit = async (user) => {
  const response = await User.findByIdAndUpdate(
    user._id,
    { $inc: { credits: -25 } },
    { new: true },
  );
  return response;
};

const createVideoUsingPrompt = asyncHandler(async (req, res) => {
  try {
    const { prompt, user_id } = req.body;

    if (!prompt) {
      return res
        .status(200)
        .json({ success: false, message: "Prompt is required!" });
    }

    if (prompt.toLowerCase().includes("[PASSWORD]")) {
      return res.status(200).json({
        success: false,
        message: "Unable to create video because of sensitve text in prompt!",
      });
    }

    const clearedPrompt = cleanPrompt(prompt);

    const videoUrl = await generateVideo(clearedPrompt);

    const project = await Project.create({
      prompt,
      size: "",
      category: "Video",
      operation: "Create Video",
      analysis_text: "",
      image_url: videoUrl,
      user: user_id,
    });

    if (!project) {
      return res
        .status(200)
        .json({ success: false, message: "Failed to create video!" });
    }

    const user = await User.findById(user_id);
    const updatedUser = await updateCredit(user);

    return res.status(200).json({
      success: true,
      message: "Video created successfully!",
      video_url: videoUrl,
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(200)
      .json({ success: false, message: "Failed to create video!" });
  }
});

export {
  createImageUsingPrompt,
  getAllProjectByUserId,
  deleteProjectById,
  updateLikeDislike,
  createCollageUsingPrompt,
  editImageUsingPrompt,
  analyseImageUsingPrompt,
  createVideoUsingPrompt,
};