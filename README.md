# HireNest Enterprise AI Operating System

A high-performance Recruitment ERP & Autonomous Workflow engine designed for modern staffing enterprises. HireNest leverage specialized AI agents to automate the entire fulfillment lifecycle—from job ingestion to candidate placement.

## 🚀 Key Architectural Pillars

### 1. Neural Matching Core
- **Semantic Scoring:** Instead of simple keyword matching, we use the `Gemini-1.5-Flash` model to evaluate candidate-to-job relevance at a conceptual level.
- **Auto-Decisioning:** Low-confidence matches are flagged for human review, while high-confidence (85%+) matches can be automatically advanced in the pipeline.

### 2. Autonomous Multi-Agent "Crew"
- **Decision Agent:** Scans the candidate pool against open requisitions and moves profiles through stages.
- **Outreach Agent:** Executes automated, personalized follow-ups via WhatsApp and Email (simulated/API ready).
- **CFO Agent:** Monitors deal margins and projected revenue, automatically adjusting job budgets to maintain profitability.
- **Learning Agent:** Analyzes historical outcomes to improve match precision over time.

### 3. Integrated Marketplace & Collaboration
- **Vendor-Broadcasting:** Instantly release jobs to a verified pool of vendors with automated budget adjustments.
- **Collaboration Hub:** A unified interface for clients and vendors to communicate, exchange resumes, and track status.
- **WhatsApp Business Center:** Dedicated command center for high-speed mobile communication with vendors and candidates.

## 🛠 Tech Stack

- **Frontend:** React 19 (Vite) + Tailwind CSS (v4)
- **Backend/DB:** Supabase (PostgreSQL + Realtime)
- **Intelligence:** Google Gemini AI SDK (`@google/genai`)
- **Animation:** Motion (formerly Framer Motion)
- **Icons:** Lucide React

## 📂 Project Structure

```text
/src
  /agents         - Autonomous logic controllers (Decision, Outreach, etc.)
  /components     - Reusable atomic UI components
  /contexts       - Global state management (Auth, Data Sync)
  /lib/api        - Supabase service layer
  /pages          - Dedicated strategic dashboards (ExecSuite, IntelligenceCenter)
  /services       - Business logic (Financials, AI Intelligence, Marketplace)
  /utils          - Safety helpers and formatting
```

## 🔋 Getting Started

1. **Environment Variables:**
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `GEMINI_API_KEY`: Google AI Studio API Key

2. **Schema Setup:**
   Run the provided `supabase_schema.sql` in your Supabase SQL Editor.

3. **Development:**
   ```bash
   npm run dev
   ```

## 🧠 Strategic Roadmap v1.5
- [ ] Integration with LinkedIn Recruiter API.
- [ ] Live Gmail & WhatsApp API Webhooks.
- [ ] Predictive Revenue Forecasting based on historical fulfillment speed.
- [ ] PDF Text extraction optimization for multilingual resumes.

---
**License:** Apache-2.0  
**Founding Director:** Gopala Krishna
