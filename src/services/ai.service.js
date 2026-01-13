import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate Facebook post content
 */
export async function generatePost({
  type,
  title,
  content,
  location = "London, ON"
}) {
  const prompt = `
You are a local Canadian Facebook page admin.

Write a short, clear, engaging Facebook post about the following ${type}.
Target audience: People living in ${location}.

Rules:
- Friendly, local tone
- No emojis overload (max 2)
- Clear and factual
- No hashtags
- Max 3 short paragraphs
- Call to action at the end

Title:
${title}

Details:
${content}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content.trim();
}
