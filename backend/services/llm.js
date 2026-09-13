import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.Groq });

/**
 * Generate a professional email reply using Groq LLM (streaming collected).
 * @param {string} incomingEmail
 * @param {Array<{customerEmail: string, referenceReply: string}>} examples
 * @returns {Promise<string>}
 */
export async function generateReply(incomingEmail, examples) {
  const examplesText = examples
    .map(
      (ex, i) =>
        `Example ${i + 1}:\nCustomer: ${ex.customerEmail}\nReply: ${ex.referenceReply}`
    )
    .join('\n\n');

  const systemPrompt = `You are a professional customer support agent. Your job is to write clear, helpful, and polite replies to customer emails.
Use the provided examples as reference for tone and style.
Always be empathetic, specific, and solution-focused.
Keep replies concise but complete — typically 3–5 short paragraphs.`;

  const userPrompt = `Here are some reference email/reply examples:

${examplesText}

Now write a professional reply to this customer email:
---
${incomingEmail}
---

Reply:`;

  const stream = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    model: 'openai/gpt-oss-120b',
    temperature: 0.7,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
    reasoning_effort: 'medium',
    stop: null,
  });

  let reply = '';
  for await (const chunk of stream) {
    reply += chunk.choices[0]?.delta?.content || '';
  }
  return reply.trim();
}
