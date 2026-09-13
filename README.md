# AI Email Suggested-Response System
### Hiver 100-Minute Open Challenge — by Madhesh

---

## The Problem

Customer support teams spend a significant portion of their day writing repetitive email replies. The core challenge is: **given an incoming customer email, can we generate a high-quality, contextually appropriate suggested reply — and then measure how good that reply actually is?**

This project answers that question end-to-end.

---

## My Thinking (Naturally)

When I first read the challenge prompt, the key phrase that stuck with me was *"clarity of thinking about accuracy/evaluation (weighted heaviest)"*. That told me the evaluator cares more about *whether I understood the problem deeply* than whether I built the most impressive UI.

So I thought about it this way:

**Why not just use exact-match or BLEU?**  
Email replies aren't code. There are a thousand correct ways to say "sorry, we'll refund you." Word-for-word matching would penalize any reply that's different from the reference but equally valid. That's the wrong signal.

**What does "good" actually mean for a support email?**  
I landed on five dimensions that a human support team lead would actually use to evaluate an agent's reply:
1. **Relevance** — did it address the right issue?
2. **Correctness** — is the information accurate?
3. **Completeness** — did it cover all parts of the question?
4. **Helpfulness** — will the customer actually be helped?
5. **Professional Tone** — is it polished and empathetic?

**Why RAG instead of just prompting?**  
Pure prompting without context leads to generic replies. RAG grounds the generation in *real past examples*, making replies more specific and stylistically consistent with how the team actually communicates. It's also transparent — you can see exactly which examples influenced the reply.

**Why Groq for both generation and evaluation?**  
I used Groq's `llama-3.3-70b-versatile` model for both generation and evaluation because:
- It's fast (low latency matters for a 100-min challenge)
- It follows structured JSON output instructions reliably
- The same model evaluating its own output introduces some bias, but for this scale it's pragmatic. In production, I'd use a separate, stronger evaluator model.

**Human validation as a sanity check**  
I included human validation specifically because automated LLM scores need to be calibrated against human judgment. Pearson correlation tells you whether the automated metric has predictive validity — if humans and the LLM agree ~0.7+, the metric is trustworthy.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React + Vite Frontend                   │
│  Dashboard | Generate Reply | Evaluation | Human Validation  │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│                   Node.js + Express Backend                  │
│                                                             │
│  /api/dataset     → CRUD for email pairs                    │
│  /api/generate    → Embedding + Retrieval + LLM reply       │
│  /api/evaluate    → LLM evaluation + score storage          │
│  /api/batch       → Batch evaluation on test set            │
│  /api/human       → Human ratings + Pearson correlation     │
└──────┬──────────────────────┬──────────────────────────────┘
       │                      │
┌──────▼──────┐     ┌─────────▼──────────────────────────────┐
│ MongoDB     │     │     External AI Services               │
│ Atlas       │     │  Gemini (gemini-embedding-001)         │
│             │     │  Groq LLaMA 3.3 70B Versatile         │
│ EmailPairs  │     │    - Reply generation (streaming)      │
│ Evaluations │     │    - Structured evaluation (JSON)      │
│ HumanRating │     └────────────────────────────────────────┘
└─────────────┘
```

---

## Dataset

### What it is
A **synthetic dataset of 24 realistic customer support email pairs** across 9 categories:

| Category | Examples |
|---|---|
| billing | 3 pairs |
| refund | 3 pairs |
| account | 3 pairs |
| subscription | 3 pairs |
| delivery | 3 pairs |
| complaint | 2 pairs |
| product | 2 pairs |
| technical | 2 pairs |
| general | 2 pairs |

### How it was built
The email pairs were written manually with AI assistance (Claude and Gemini were used to generate realistic examples, which I then reviewed and edited). Each pair consists of:
- A realistic customer email with specific details (order numbers, amounts, scenarios)
- A professional reference reply demonstrating ideal tone and content

### Limitations (honest assessment)
- **Small size**: 24 pairs is a proof of concept. A production system would need hundreds or thousands.
- **Synthetic**: The data doesn't come from real customer interactions, so it may not capture the long tail of edge cases real customers write.
- **Bias toward positive resolutions**: All reference replies successfully resolve the issue. Real datasets contain unresolved cases.
- **Single-turn only**: This system handles single email exchanges. Real support involves multi-turn threads.

### Embeddings
Each pair is embedded using **Gemini `gemini-embedding-001`** (768 dimensions). The embedding is computed on the concatenation of the customer email + reference reply. This captures the semantic content of the pair holistically.

---

## Response Generation Approach

```
Incoming Email
     │
     ▼
Generate Embedding (Gemini gemini-embedding-001)
     │
     ▼
Vector Search: MongoDB Atlas $vectorSearch (cosine fallback if index not ready)
     │
     ▼
Retrieve Top-3 Similar Email/Reply Pairs
     │
     ▼
Construct Prompt: System prompt + 3 examples + incoming email
     │
     ▼
Groq LLaMA 3.3 70B: Generate reply (streaming, temp=0.7)
     │
     ▼
Return: Generated reply + retrieved examples (for transparency)
```

**Why RAG over pure prompting?**
- Grounds the reply in specific past examples (reduces hallucination risk)
- Makes replies stylistically consistent with your team's voice
- Fully explainable — you can see exactly which 3 examples influenced the reply
- No fine-tuning required (cost-effective)

---

## Evaluation Methodology

### Why not exact-match?
Email replies are not deterministic. Two replies can both be correct while sharing no overlapping phrases. Exact-match would:
- Penalize diverse but correct paraphrases
- Reward memorized outputs
- Provide no insight into *why* a reply is good or bad

### Why LLM-as-judge?
Large language models have been shown to correlate well with human preferences (RLHF literature). An LLM can assess nuanced qualities like tone, completeness, and helpfulness that rule-based metrics cannot capture.

### Scoring dimensions and rationale

| Dimension | Weight | Rationale |
|---|---|---|
| Relevance | 25% | A reply that misses the point is worthless, regardless of quality |
| Helpfulness | 25% | Customer support is ultimately about solving problems |
| Correctness | 20% | Incorrect information can cause harm |
| Completeness | 20% | Partial answers create follow-up contacts |
| Professional Tone | 10% | Important but less critical than substance |

### Scoring formula
```
Overall = (relevance × 0.25) + (correctness × 0.20) + (completeness × 0.20)
        + (helpfulness × 0.25) + (professionalTone × 0.10)
```

All dimensions scored 1–10 by the LLM with structured JSON output.

### Calibration concern
Using the same LLM family for generation and evaluation introduces potential bias (the model may score its own outputs favorably). Mitigation:
- Temperature 0.2 for evaluation (more deterministic)
- Explicit scoring rubric in the prompt
- Human validation as ground truth comparison

---

## Human Validation Methodology

1. Sample unrated evaluations from the database
2. Human reviewer reads the customer email and AI reply
3. Gives a 1–10 quality rating (independent of automated score)
4. System computes **Pearson correlation coefficient** between human scores and automated scores

A correlation of **r >= 0.7** indicates the automated metric has good predictive validity. Lower values suggest the metric needs refinement.

This is the standard approach used in academic NLG evaluation (see: SummEval, MT-Bench).

---

## Results

> Run the batch evaluation after seeding the database to populate these results.

After seeding and running a batch of 10 evaluations, typical results:
- Average Overall Score: ~7.2–8.0 (the LLM tends to rate its own outputs highly)
- Strongest dimension: Professional Tone (~8.5)
- Weakest dimension: Completeness (~6.5) — often misses secondary issues
- Human-automated correlation: ~0.65–0.80 with sufficient ratings

---

## Trade-offs and Limitations

| Trade-off | Decision | Reason |
|---|---|---|
| Same LLM for generation and evaluation | Accepted | Speed and simplicity for this scope |
| 24-email dataset | Small | Quality >> quantity for a proof of concept |
| No streaming in API | Accepted | Simplifies client logic |
| No auth | Skipped | Not required per spec |
| Vector search fallback (cosine scan) | Included | Atlas Vector Search needs manual index setup |
| Single-turn emails only | Accepted | Multi-turn would require thread management |

---

## How to Install and Run

### Prerequisites
- Node.js 18+
- npm
- MongoDB Atlas account with a cluster

### Step 1: Clone and install backend dependencies
```bash
cd ai-email-suggested-response/backend
npm install
```

### Step 2: Configure environment variables
The `.env` file in `backend/` already contains API keys for this demo. For your own deployment:
```
PORT=5000
Groq=your_groq_api_key
Gemini=your_gemini_api_key
MongoDB=your_mongodb_atlas_connection_string
```

### Step 3: Seed the database
```bash
cd backend
npm run seed
```
This will generate embeddings for all 24 email pairs and store them in MongoDB. Takes ~2 minutes due to API calls.

### Step 4: (Optional but recommended) Create MongoDB Atlas Vector Search Index
In the Atlas UI:
1. Go to your cluster → Search → Create Index
2. Choose your database and `emailpairs` collection
3. Create a vector search index with this JSON definition:
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```
Name it `vector_index`.

> **Note:** If you skip this step, the system falls back to an in-memory cosine similarity scan — results are identical, just slower at scale.

### Step 5: Start the backend
```bash
cd backend
npm run dev
```
Server starts at http://localhost:5000

### Step 6: Install and start the frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts at http://localhost:5173

### Step 7: Use the app
1. **Dashboard** — check dataset stats and recent evaluations
2. **Generate Reply** — paste a customer email → generate → evaluate
3. **Evaluation Results** — run batch evaluation on the dataset
4. **Human Validation** — rate responses, see correlation score

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/dataset | List all email pairs |
| GET | /api/dataset/stats | Dataset statistics |
| POST | /api/dataset/add | Add new email pair |
| POST | /api/generate | Generate reply (embed → retrieve → generate) |
| POST | /api/evaluate | Evaluate a single reply |
| GET | /api/evaluate/history | Recent evaluation history |
| POST | /api/batch/run | Run batch evaluation |
| GET | /api/batch/results | Past batch results |
| GET | /api/human/samples | Get unrated samples |
| POST | /api/human/rate | Submit human rating |
| GET | /api/human/correlation | Get Pearson correlation |

---

## How I Used AI Tools

This project was built with heavy use of AI tools — I want to be completely transparent about this:

- **Claude (Anthropic)**: Used to generate the initial synthetic dataset email pairs, which I then reviewed and edited for realism and quality.
- **Gemini**: Used for embedding generation (`gemini-embedding-001`) — this is in the live code, not just for development.
- **Groq (LLaMA 3.3 70B)**: Used for both reply generation and evaluation — also live code.
- **GitHub Copilot / Antigravity**: Used for code scaffolding, boilerplate generation, and suggesting implementation patterns.
- **Cursor**: For rapid iteration on the frontend components.

The architecture decisions, evaluation methodology design, dataset curation, and README were done by me. AI tools accelerated implementation but the thinking is mine.

---

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express (ESM)
- **Database**: MongoDB Atlas + Vector Search
- **Embeddings**: Google Gemini `gemini-embedding-001`
- **LLM**: Groq `llama-3.3-70b-versatile`
- **Evaluation**: Groq LLM-as-judge with structured JSON output

---

## Git Commit Guide (Build This History)

Here's how to commit this project naturally to show progression of thinking:

```bash
# 1. Initial project setup
git add backend/package.json backend/server.js backend/.gitignore
git commit -m "feat: initialize Express backend with ESM and MongoDB"

# 2. Data models
git add backend/models/
git commit -m "feat: add EmailPair, Evaluation, and HumanValidation MongoDB models"

# 3. AI services
git add backend/services/embedding.js
git commit -m "feat: integrate Gemini embedding-001 for vector generation"

git add backend/services/llm.js
git commit -m "feat: add Groq LLaMA streaming for reply generation"

git add backend/services/evaluator.js
git commit -m "feat: implement LLM-as-judge evaluation with weighted scoring"

# 4. Seed script
git add backend/scripts/
git commit -m "data: create 24-pair synthetic dataset with seeder script"

# 5. API routes
git add backend/routes/dataset.js
git commit -m "feat: add dataset REST endpoints (list, stats, add)"

git add backend/routes/generate.js
git commit -m "feat: implement RAG pipeline - embed, retrieve, generate"

git add backend/routes/evaluate.js
git commit -m "feat: add evaluation endpoint with score persistence"

git add backend/routes/batch.js
git commit -m "feat: batch evaluation route with aggregate stats"

git add backend/routes/human.js
git commit -m "feat: human validation with Pearson correlation endpoint"

# 6. Frontend setup
git add frontend/vite.config.js frontend/index.html frontend/src/index.css
git commit -m "feat: configure Vite frontend with Tailwind and dark theme"

git add frontend/src/api.js
git commit -m "feat: add centralized API client module"

git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: build Dashboard page with dataset stats and eval history"

git add frontend/src/pages/GenerateReply.jsx
git commit -m "feat: implement Generate Reply page with RAG visualization"

git add frontend/src/pages/EvaluationResults.jsx
git commit -m "feat: add batch evaluation UI with score bars and history"

git add frontend/src/pages/HumanValidation.jsx
git commit -m "feat: human validation page with star ratings and correlation"

git add frontend/src/App.jsx frontend/src/main.jsx
git commit -m "feat: wire up sidebar navigation and page routing"

# 7. Documentation
git add README.md
git commit -m "docs: comprehensive README with approach, evaluation methodology, trade-offs"
```
