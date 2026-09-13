# AI Email Suggested-Response System
**Hiver 100-Minute Open Challenge**

---

## What I Built

Given an incoming customer email → retrieve the most relevant past email–reply pairs from a dataset → feed them as context to an LLM → generate a professional suggested reply → evaluate that reply across 5 quality dimensions → show per-response and system-wide scores.

Everything — generation, evaluation, and human validation — runs in a single local app.

---

## My Thought Process

The task description said *"measure accuracy — the core of this challenge."* That phrase shaped every decision.

**First thing I asked: what does "accurate" even mean for an email reply?**

A reply can be worded completely differently from a reference reply and still be perfect. Exact-match or BLEU would penalize creative-but-correct phrasing and reward memorized outputs. That's backwards. I needed a metric that evaluates *intent* — did the reply actually help the customer?

**So I broke "good" into five things a support team lead would actually check:**

| Dimension | Weight | Why |
|---|---|---|
| Relevance | 25% | A reply that misses the point is worthless |
| Helpfulness | 25% | Support is ultimately about solving problems |
| Correctness | 20% | Wrong info causes harm |
| Completeness | 20% | Partial answer = another email = wasted time |
| Professional Tone | 10% | Important, but tone without substance is empty |

**Why RAG instead of just prompting the LLM directly?**

Pure prompting with no context produces generic, brand-less replies. RAG grounds every response in *your actual past emails* — making replies stylistically consistent and more specific. It's also transparent: the UI shows you exactly which 3 examples influenced each reply, so you can audit and trust the output.

**Why Groq + Gemini embeddings?**

Speed. In a 100-minute challenge, iteration time matters. Gemini's `gemini-embedding-001` gives 3072-dimension embeddings with strong semantic quality. Groq runs `openai/gpt-oss-120b` fast enough to generate and evaluate a reply in under 30 seconds.

**Human validation as a sanity check, not an afterthought.**

An automated metric that doesn't correlate with human judgment is just a number. I added a human validation page — rate replies 1–10, then compute Pearson r between human scores and automated scores. If they don't align, the metric needs fixing. That's the honest way to validate it.

---

## Architecture

```
Incoming Email (from React UI)
        │
        ▼
  Gemini Embedding API
  (gemini-embedding-001, 3072 dims)
        │
        ▼
  MongoDB: cosine similarity search
  (Atlas $vectorSearch or in-memory fallback)
        │
        ▼
  Top-3 similar email+reply pairs retrieved
        │
        ▼
  Groq LLM (openai/gpt-oss-120b)
  System prompt + 3 examples + incoming email
        │
        ▼
  Generated Reply
        │
        ▼
  Evaluator (same Groq LLM, temp=0.2)
  Returns structured JSON: 5 scores + explanation
        │
        ▼
  Weighted Overall Score saved to MongoDB
        │
        ▼
  React UI: per-response scores + history + human rating
```

**Stack:** React + Vite + Tailwind · Node.js + Express · MongoDB Atlas · Gemini Embeddings · Groq LLM

---

## The Dataset

**Size:** 24 email–reply pairs across 9 categories  
**Source:** Synthetic — hand-authored with AI assistance, then reviewed and edited.

| Category | Pairs | Category | Pairs |
|---|---|---|---|
| Billing | 3 | Delivery | 3 |
| Refund | 3 | Complaint | 2 |
| Account | 3 | Product | 2 |
| Subscription | 3 | Technical | 2 |
| General | 2 | | |

**Why synthetic?** Starting from zero, I needed coverage across realistic support scenarios without access to real customer data. The emails include specific details (order numbers, amounts, scenarios) to be representative, not vague. I used Claude and Gemini to draft initial pairs, reviewed every single one, and edited for realism.

**Honest limitations:** 24 pairs is a proof of concept. Production needs thousands. The data skews toward clean resolutions — real support has messier edge cases.

Each pair is embedded using `gemini-embedding-001` and stored in MongoDB. The seeder script generates all embeddings automatically.

---

## Screenshots

**Dashboard — dataset overview and live eval history**
![Dashboard](image1.png)

**Generate Reply — enter any customer email**
![Generate Reply](image2.png)

**RAG in action — 3 retrieved examples with similarity scores, then the generated reply**
![RAG + Generated Reply](image3.png)

**Per-response evaluation — 5-dimension score bars + LLM explanation**
![Evaluation Scores](image4.png)

**Batch evaluation — system-wide scores across N random test emails**
![Batch Evaluation](image5.png)

**Human validation — compare your rating vs automated score, see Pearson correlation**
![Human Validation](image6.png)

---

## Evaluation — The Honest Part

**The formula:**
```
Overall = (relevance × 0.25) + (correctness × 0.20) + (completeness × 0.20)
        + (helpfulness × 0.25) + (professionalTone × 0.10)
```

**Known bias:** Using the same LLM family for generation and evaluation means the model may favor its own outputs. Mitigations: evaluation uses temperature 0.2 (more deterministic), a strict scoring rubric, and human validation to cross-check.

**Results observed:**
- Avg overall score: **~9.3–9.96 / 10** on batch runs
- Human vs automated correlation: positive, with minor divergence on "completeness" (automated tends to score higher than humans on this dimension)
- Strongest dimension: Professional Tone (~10.0)
- Most variable: Helpfulness (humans and model sometimes disagree on whether the reply "solved" the issue)

---

## How to Run

**1. Clone and install backend**
```bash
cd backend
npm install
```

**2. Configure `.env`** (already populated in the repo for demo)
```
PORT=5000
Groq=your_groq_api_key
Gemini=your_gemini_api_key
MongoDB=your_mongodb_atlas_uri
```

**3. Seed the database** *(generates embeddings — takes ~2 min)*
```bash
npm run seed
```

**4. Start backend**
```bash
npm run dev
```

**5. Install and start frontend**
```bash
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:5173**

> If port is occupied, Vite will use `5174`. Check terminal output.

### Optional: MongoDB Atlas Vector Search Index
Create an index named `vector_index` on the `emailpairs` collection:
```json
{
  "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 3072, "similarity": "cosine" }]
}
```
Without it, the system falls back to in-memory cosine scan (same accuracy, slower at scale).

---

## How I Used AI Tools

I'll be straight about this:

- **Claude & Gemini** — generated the initial synthetic email dataset drafts, which I reviewed and edited
- **Gemini API** (`gemini-embedding-001`) — live in production for all embedding generation
- **Groq API** (`openai/gpt-oss-120b`) — live in production for reply generation and evaluation
- **Antigravity (AI coding assistant)** — used for scaffolding the Express routes, React components, and boilerplate. I directed the architecture, made all design decisions, and debugged the integration.

The evaluation methodology, scoring weights, dataset curation decisions, and this README were written by me. AI accelerated the build; the thinking is mine.

---

## Trade-offs

| Decision | Trade-off |
|---|---|
| Same LLM for generation + evaluation | Speed > perfect objectivity at this scale |
| 24-pair synthetic dataset | Enough to prove the system works; not production-ready |
| In-memory cosine fallback | No Atlas setup required; slower at 10k+ docs |
| No fine-tuning | RAG is cheaper, faster, and fully explainable |
| No auth | Out of scope per challenge spec |

---

*Built in ~100 minutes for the Hiver Open Challenge.*
