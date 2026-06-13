import { openai } from "../config/openai.js";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/uploadToCloudinary.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import sharp from "sharp";
import { templates } from "./templates.js";

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
      size: "720x1280",
      seconds: 12,
    });
    let result = video;

    while (result.status === "queued" || result.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      result = await openai.videos.retrieve(video.id);
    }

    if (result.status !== "completed") {
      throw new Error("Video generation failed");
    }

    const content = await openai.videos.downloadContent(result.id);

    const arrayBuffer = await content.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = `./public/temp/video-${Date.now()}.mp4`;
    fs.writeFileSync(filePath, buffer);

    const newVideo = await uploadOnCloudinary(filePath, "VIDEO");

    return newVideo.url;
  } catch (error) {
    throw Error(error.message);
  }
};

export const createReel = async ({
  tempDir,
  musicPath,
  outputPath,
  templateId,
}) => {
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true,
    });
  }

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  outputPath = path.resolve(outputPath);

  let images = fs
    .readdirSync(tempDir)
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
    .map((file) => path.join(tempDir, file));

  if (images.length === 0) {
    throw new Error("No images found in temp directory");
  }

  const safeImages = [];
  for (let i = 0; i < images.length; i++) {
    const output = path.join(tempDir, `image${i}.jpg`);
    await sharp(images[i]).jpeg({ quality: 90 }).toFile(output);
    safeImages.push(output);
  }

  const imagePattern = path.join(tempDir, "image%d.jpg");

  try {
    await new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(imagePattern)
        .inputOptions(["-loop 1", "-t 5"])
        .videoFilters(templates[templateId || 'cinematicZoomIn'])
        .videoCodec("libx264")
        .outputOptions([
          "-pix_fmt yuv420p",
          "-preset medium",
          "-crf 23",
        ])
        .format("mp4");

      if (musicPath) {
        command = command
          .input(musicPath)
          .audioCodec("aac")
          .outputOptions(["-shortest"]);
      }

      command
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .save(outputPath);
    });

    const uploadResult = await uploadOnCloudinary(outputPath, "VIDEO");

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    images.forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    safeImages.forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    return uploadResult.url;
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    images.forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    safeImages.forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    throw Error(error.message);
  }
};