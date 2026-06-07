import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      trim: true,
    },
    size: {
      type: String
    },
    category: {
      type: String,
    },
    operation: {
      type: String,
    },
    image_url: {
      type: String,
    },
    analysis_text: {
      type: String,
      default: ""
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    is_liked: {
      type: String,
      default: ""
    },
    dislike_reason: {
      type: String,
      default: ""
    }
  },
  { timestamps: true },
);

export const Project = mongoose.model("Project", projectSchema);