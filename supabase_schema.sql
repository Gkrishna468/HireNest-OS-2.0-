-- 1. Organizations (Multi-tenant Root)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('client', 'vendor', 'internal')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agreements (MSA/NDA Tracking)
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type TEXT CHECK (type IN ('MSA', 'NDA')),
  file_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, signed, expired
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  company_id UUID REFERENCES companies(id),
  role TEXT CHECK (role IN ('admin', 'client_manager', 'vendor_manager', 'recruiter')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Clients (Extended)
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  industry TEXT,
  client_tier TEXT DEFAULT 'standard', -- standard, silver, gold
  margin_preferred NUMERIC DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Jobs (Marketplace Ready)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id), -- The client's company
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  type TEXT,
  skills TEXT[],
  budget NUMERIC, -- Gross budget from client
  adjusted_budget NUMERIC, -- Net budget after HireNest margin
  status TEXT DEFAULT 'open',
  broadcast_to_vendors BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Candidates (Vendor Owned)
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  current_title TEXT,
  skills TEXT[],
  experience TEXT,
  resume_url TEXT,
  source TEXT DEFAULT 'vendor',
  stage TEXT DEFAULT 'sourced',
  ai_match_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Collaborations (The Marketplace Meet-point)
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  vendor_id UUID REFERENCES companies(id),
  client_id UUID REFERENCES companies(id),
  status TEXT DEFAULT 'proposed', -- proposed, collaborated, interviewing, rejected, placed
  match_score INT,
  client_feedback TEXT,
  vendor_notes TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Messaging (Group Chat)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_id UUID REFERENCES collaborations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_ai_assisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Agent Infrastructure (Updated)
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type TEXT,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  priority INT DEFAULT 1,
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  retries INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  type TEXT,
  message TEXT,
  level TEXT DEFAULT 'info',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Financials (The Deals / Revenue Layer)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  client_name TEXT,
  job_title TEXT,
  candidate_name TEXT,
  revenue_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pipeline', -- pipeline, placed, lost
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- 11. Security Policies (The Fortress)
-- Allow users to see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (except role/company_id)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Company Data Isolation: The "Master Gate"
-- Users can only see data belonging to their company
CREATE POLICY "Company wide data access" ON companies
  FOR SELECT USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Agreement access" ON agreements
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Job access" ON jobs
  FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Candidate access" ON candidates
  FOR ALL USING (vendor_company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Collaboration access" ON collaborations
  FOR ALL USING (
    vendor_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()) OR
    client_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Message access" ON messages
  FOR ALL USING (
    sender_id = auth.uid() OR
    conversation_id IN (
      SELECT conv.id FROM conversations conv
      JOIN collaborations col ON conv.collaboration_id = col.id
      WHERE col.vendor_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
      OR col.client_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Agent task access" ON agent_tasks
  FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Deal access" ON deals
  FOR ALL USING (
    job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

