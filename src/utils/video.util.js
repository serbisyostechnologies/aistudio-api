import { openai } from "../config/openai.js";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/uploadToCloudinary.js";

const DEFAULT_PROMPT = `
Create a cinematic, ultra realistic, high-quality video
with smooth camera motion, professional lighting,
realistic shadows, cinematic depth of field,
dynamic movement, and visually stunning storytelling.
`;

export const generateVideo = async (prompt) => {
  try {

    const finalPrompt = `${DEFAULT_PROMPT} Scene: ${prompt}`;

    const video = await openai.videos.create({
      model: "sora-2",
      prompt: finalPrompt,
      size: "1280x720",
      seconds: 12,
    });
    let result = video;

    while (
      result.status === "queued" ||
      result.status === "in_progress"
    ) {

      console.log(
        `Generating... ${result.progress || 0}%`
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 10000)
      );

      result = await openai.videos.retrieve(video.id);
    }

    if (result.status !== "completed") {
      throw new Error("Video generation failed");
    }

    console.log("Downloading video...");

    const content = await openai.videos.downloadContent(
      result.id
    );

    const arrayBuffer = await content.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = `./public/temp/video-${Date.now()}.mp4`;
    fs.writeFileSync(filePath, buffer);

    console.log("Video saved locally");

    const newVideo = await uploadOnCloudinary(
      filePath,
      "VIDEO"
    );

    return newVideo.url;

  } catch (error) {
    console.log(error);
    throw error;
  }
};