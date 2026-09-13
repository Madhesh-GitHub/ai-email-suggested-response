import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.Groq });

/**
 * Evaluate a generated email reply using Groq LLM.
 * Returns structured scores and explanation.
 */
export async function evaluateReply(incomingEmail, generatedReply, referenceReply = null) {
  const refSection = referenceReply
    ? `Reference Reply (for context):\n${referenceReply}\n\n`
    : '';

  const prompt = `You are an expert evaluator of customer support email responses.

Evaluate the following generated reply against the customer's email.

Customer Email:
${incomingEmail}

${refSection}Generated Reply:
${generatedReply}

Score the reply on each dimension from 1 to 10 (10 = perfect):
- relevance: Does the reply address the specific issue raised in the email?
- correctness: Is the information accurate and free of errors?
- completeness: Does the reply fully address all parts of the customer's concern?
- helpfulness: Will this reply actually help the customer resolve their issue?
- professionalTone: Is the reply professional, polite, and appropriately formal?

Also provide a brief explanation (2-3 sentences) justifying your scores.

Respond ONLY with valid JSON in this exact format:
{
  "relevance": <number 1-10>,
  "correctness": <number 1-10>,
  "completeness": <number 1-10>,
  "helpfulness": <number 1-10>,
  "professionalTone": <number 1-10>,
  "explanation": "<string>"
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'openai/gpt-oss-20b',
    temperature: 0.2,
    max_completion_tokens: 512,
    stream: false,
  });

  const text = completion.choices[0]?.message?.content || '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse evaluation JSON from LLM response');

  const scores = JSON.parse(jsonMatch[0]);

  // Weighted overall score: helpfulness & relevance weighted higher
  const overall = +(
    (scores.relevance * 0.25 +
      scores.correctness * 0.2 +
      scores.completeness * 0.2 +
      scores.helpfulness * 0.25 +
      scores.professionalTone * 0.1)
  ).toFixed(2);

  return { ...scores, overall };
}
