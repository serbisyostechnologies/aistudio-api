import { openai } from "../config/openai.js";

export const generateImage = async (prompt, size) => {
  try {
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: size,
    });

    return response.data[0].b64_json;
  } catch (error) {
    throw new Error(error.message);
  }
};