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
      model: "gpt-image-1-mini",
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
      model: "gpt-image-1-mini",
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

      Rules:
      - Do not provide suggestions
      - Do not give recommendations
      - Do not include improvement tips
      - Do not ask follow-up questions
      - Only describe and analyze what is visible
      - Keep response concise and structured
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

    Rules:
      - Do not provide suggestions
      - Do not give recommendations
      - Do not include improvement tips
      - Do not ask follow-up questions
      - Only describe and analyze what is visible
      - Keep response concise and structured
    `
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const response = await openai.images.edit({
      model: "gpt-image-1-mini",
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

export const analyseImage = async (imageBuffer, mimeType, prompt) => {
  try {
    const base64Image = imageBuffer.toString("base64");
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    const defaultPrompt = `
      Analyze this image in detail.
      
      Include:
      - Main subject
      - Scene description
      - Colors and lighting
      - Objects present
      - Mood and atmosphere
      - Style/aesthetic
      - Important details
      
      Rules:
      - Do not provide suggestions
      - Do not give recommendations
      - Do not include improvement tips
      - Do not ask follow-up questions
      - Only describe and analyze what is visible
      - Keep response concise and structured
      Keep the response clear and well-structured.
    `;

    const finalPrompt = `
      ${defaultPrompt}

      Additional User Request:
      ${prompt || "No additional instructions provided."}
    `;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: finalPrompt,
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
            },
          ],
        },
      ],
    });

    return response.output_text;
  } catch (error) {
    if (error.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }

    if (error.status === 400) {
      throw new Error(
        error?.error?.message || error.message || "OpenAI request failed",
      );
    }

    if (error.status === 401) {
      throw new Error("Invalid OpenAI API key.");
    }

    throw new Error(
      error?.error?.message || error.message || "OpenAI request failed",
    );
  }
};