# Rekall-IQ — Local Test Kit

Sample documents + a question bank for verifying retrieval quality before beta.
All facts below are intentionally specific so you can check the AI's answers exactly.

---

## 1. Run locally (Next.js + Inngest)

Document processing (parse → chunk → embed → index → intelligence) runs through **Inngest**,
so you need both the app **and** the Inngest dev server running.

```bash
# Terminal 1 — the app
npm run dev                       # http://localhost:3000

# Terminal 2 — the Inngest dev server (point it at the app's serve route)
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

- Inngest dev dashboard: **http://localhost:8288** (watch runs, retries, and errors here).
- If uploads stay stuck on "processing", add `INNGEST_DEV=1` to `.env.local` and restart `npm run dev`.
  (⚠️ never set `INNGEST_DEV` in Vercel/production.)
- Make sure `.env.local` has Supabase, Qdrant, Gemini, Voyage, and LlamaParse keys, and that the
  SQL migrations in `/sql/` have been applied.

---

## 2. Sample documents (in this folder)

| File | Format | Suggested collection |
|------|--------|----------------------|
| `hr-remote-work-policy.txt` | TXT | HR |
| `employee-handbook.txt` | TXT | HR |
| `it-acceptable-use-policy.txt` | TXT | IT |
| `q1-2026-sales-by-region.csv` | CSV | Sales (or Finance) |
| `company-metrics-q1-2026.xlsx` | XLSX (2 sheets) | Finance |

**PDF / DOCX / PPTX:** the parse path is identical once text is extracted — to test those formats,
open any `.txt` above in Word/Google Docs and **export as PDF or DOCX**, then upload that. (Public
sample decks/PDFs from file-examples.com or the Microsoft templates gallery also work.)

> Tip: upload into the matching collections so you can test **scoping** (section 5).

---

## 3. Grounding tests — answers ARE in the documents

The AI should answer confidently and cite the right file.

**HR remote-work policy**
- "How many days a week can I work remotely?" → *Up to 3 days/week, with manager approval.*
- "When do I become eligible for remote work?" → *After 90 days of continuous employment.*
- "What home-office stipend can I claim?" → *A one-time USD 500 after 90 days; monitor reimbursed up to USD 250.*
- "What are the core hours?" → *10:00–15:00 in the assigned office time zone.*
- "Can I work from another country?" → *Yes, up to 20 consecutive days; beyond that needs written HR approval.*

**Employee handbook**
- "How much PTO do I get and how much carries over?" → *25 days/year; max 5 days carryover.*
- "What is the parental leave?" → *16 weeks primary caregiver, 4 weeks secondary.*
- "What's the notice period for a manager?" → *3 months.*
- "Can I expense alcohol on a business trip?" → *No — alcohol is not reimbursable.* (in-document "no")

**IT acceptable-use policy**
- "What are the password requirements?" → *At least 14 characters, rotated every 180 days, MFA mandatory.*
- "Can I store confidential data on a USB stick?" → *No — USB is prohibited for Confidential and Restricted data.*
- "How quickly must I report a security incident?" → *Within 1 hour of discovery.*
- "What are the data classification levels?" → *Public, Internal, Confidential, Restricted.*

---

## 4. Tabular / spreadsheet intelligence

**`q1-2026-sales-by-region.csv`**
- "Which region had the highest revenue in March 2026?" → *North America (≈ $41,162).*
- "What were total Business units sold in January?" → *125 (60 + 45 + 20).*
- "Did APAC revenue grow from January to March?" → *Yes (≈ $10,930 → ≈ $18,088).*

**`company-metrics-q1-2026.xlsx`** (sheets: Revenue, Headcount)
- "What was Q1 2026 revenue for EMEA?" → *$86,000.*
- "How many open roles are there in Engineering?" → *6.*
- "Which department has the most headcount?" → *Engineering (42).*
- "Describe what this spreadsheet contains." → *Should mention a Revenue sheet (by region/quarter) and a Headcount sheet (by department) — tests document intelligence.*

---

## 5. Scoping tests (collections)

Upload the HR files to **HR** and the IT file to **IT**, then use the **Scope** selector in chat:
- Ask "What are the password rules?" scoped to **HR** → should find nothing / say it doesn't know.
- Same question scoped to **IT** or **All documents** → should answer correctly.
This proves the collection filter is actually constraining retrieval.

---

## 6. Refusal tests — answers are NOT in any document (the trust guarantee)

These must return the "I don't know based on the uploaded documents" style answer — **not** a guess.
If any of these get answered, that's a problem to flag.
- "What is Acme's revenue forecast for 2027?" → *not in the documents → should decline.*
- "Who is the CEO of Acme Corporation?" → *not in the documents → should decline.*
- "What is the capital of France?" → *outside knowledge → must decline (proves no public-internet use).*
- "What's our pet-insurance policy?" → *not covered → should decline.*

---

## 7. Behaviour checks
- **Answer modes:** ask one HR question in Summary, Detailed, Executive, and Technical — compare tone/length.
- **Confidence:** direct facts should show **High** confidence + the correct source; vague questions lower.
- **Citations:** expand sources and click through — the cited file should open in the preview drawer.
- **Follow-ups / regenerate / edit:** confirm these behave as expected.
- **Feedback:** mark an answer "Not helpful" and confirm it appears under Unanswered Questions / analytics.
