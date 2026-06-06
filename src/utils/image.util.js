import { openai } from "../config/openai.js";
import fs from "fs";
import { toFile } from "openai";
import path from "path";
import sharp from "sharp";

export const generateImage = async (prompt, size = "1024x1024") => {
  try {
    const optimizedPrompt = `
    ${prompt}

    High quality digital artwork.
    Ultra detailed.
    Professional lighting.
    Sharp focus.
    Premium aesthetic.
    Vibrant colors.
    Realistic shadows.
    Modern composition.
    `;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: optimizedPrompt.replace(/\n/g, " ").replace(/\s+/g, " ").trim(),
      size,
      quality: "medium",
    });

    if (
      !response ||
      !response.data ||
      !response.data[0] ||
      !response.data[0].b64_json
    ) {
      throw new Error("Failed to generate image");
    }

    return response.data[0].b64_json;
  } catch (error) {
    if (error.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }

    if (error.status === 400) {
      throw new Error("Invalid prompt or image size.");
    }

    if (error.status === 401) {
      throw new Error("Invalid OpenAI API key.");
    }

    throw new Error(error.message || "Image generation failed");
  }
};

export const generateCollage = async (prompt, size, images) => {
  try {
    const optimizedBuffers = await Promise.all(
      images.map(async (file) => {
        return await sharp(file.path)
          .resize(800, 800, {
            fit: "cover",
          })
          .jpeg({
            quality: 80,
          })
          .toBuffer();
      }),
    );

    const canvasWidth = 1200;
    const canvasHeight = 1200;
    const gap = 20;

    const collage = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: "#f5f5f5",
      },
    });

    const composites = [];
    optimizedBuffers.forEach((buffer, index) => {
      const left = index % 2 === 0 ? gap : canvasWidth / 2 + gap / 2;

      const top = index < 2 ? gap : canvasHeight / 2 + gap / 2;

      composites.push({
        input: buffer,
        left,
        top,
      });
    });

    const collageBuffer = await collage
      .composite(composites)
      .jpeg({
        quality: 90,
      })
      .toBuffer();

    const collageFile = await toFile(collageBuffer, "collage.jpg", {
      type: "image/jpeg",
    });

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: [collageFile],
      prompt: `
      Create a premium instagram-style collage.

      Requirements:
      - ${prompt}
      - Geometric magazine-style composition
      - Thick white borders between images
      - Asymmetrical photo placement
      - Canva premium collage template
      - Editorial fashion layout
      - Modern scrapbook poster
      - Maintain original faces and objects
      - Rounded corners
      - Cinematic lighting
      - Luxury aesthetic
      - High-end social media design
      - Premium color grading
      - Realistic shadows
      - Stylish depth
      - Visually appealing composition

      Important:
      - Preserve original faces
      - Preserve original composition
      - Do not distort people
      - Do not crop important objects
      - Keep collage realistic
      - Keep collage aesthetic
      `,

      size: size || "1024x1024",
    });

    images.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    return response.data[0].b64_json;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

export const editImage = async (prompt, size, image) => {
  try {
    const optimizedBuffer = await sharp(image.path)
      .resize(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
      })
      .toBuffer();

    const imageFile = await toFile(
      optimizedBuffer,
      image.originalname || "image.jpg",
      {
        type: "image/jpeg",
      },
    );

    const optimizedPrompt = `
    ${prompt}

    Requirements:
    - Preserve original face
    - Preserve image realism
    - High quality editing
    - Professional lighting
    - Detailed enhancement
    - Natural colors
    - Cinematic aesthetic
    - Sharp details
    - Premium visual quality

    Important:
    - Do not distort face
    - Do not change identity
    - Keep image realistic
    `
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: [imageFile],
      prompt: optimizedPrompt,
      size: size || "1024x1024",
    });

    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    if (
      !response ||
      !response.data ||
      !response.data[0] ||
      !response.data[0].b64_json
    ) {
      throw new Error("Failed to edit image");
    }

    return response.data[0].b64_json;
  } catch (error) {
    console.log("Edit Image Error:", error);

    if (error.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }

    if (error.status === 400) {
      throw new Error("Invalid image or prompt.");
    }

    if (error.status === 401) {
      throw new Error("Invalid OpenAI API key.");
    }

    throw new Error(error.message || "Failed to edit image");
  }
};