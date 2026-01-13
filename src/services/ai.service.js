import OpenAI from "openai";
import logger from "../utils/logger.js";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is missing");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generatePost({
  type,
  title,
  content,
  location = "London, ON"
}) {
  if (!title && !content) return "";

  const prompt = `
You are a local Canadian Facebook page admin.

Write a short, clear, engaging Facebook post about the following ${type}.
Target audience: People living in ${location}.

Rules:
- Friendly, local tone
- Max 2 emojis
- Clear and factual
- No hashtags
- Max 3 short paragraphs
- Call to action at the end

Title:
${title}

Details:
${content}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }]
    });

    return response.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    logger.error("OpenAI post generation failed", { error: err.message });

    // Optional fallback to GPT-3.5
    try {
      const fallback = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.6,
        messages: [{ role: "user", content: prompt }]
      });
      return fallback.choices?.[0]?.message?.content?.trim() || "";
    } catch (e) {
      logger.error("OpenAI fallback failed", { error: e.message });
      return "";
    }
  }
}
