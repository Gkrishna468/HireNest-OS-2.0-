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

-- Legacy Clients Table (to match existing code)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  industry TEXT,
  budget TEXT,
  contact_person TEXT,
  website TEXT,
  client_code TEXT,
  notes TEXT,
  user_id UUID, -- Added for simplified Dev RLS
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4b. Vendors Table (Mirroring Clients for code compatibility)
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type TEXT DEFAULT 'vendor',
  company TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  specialization TEXT[],
  is_recruiter BOOLEAN DEFAULT false,
  recruiter_company TEXT,
  vendor_code TEXT,
  user_id UUID,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Jobs (Marketplace Ready)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id), -- The client's company
  user_id UUID,
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
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  current_title TEXT,
  skills TEXT[],
  experience TEXT,
  resume_url TEXT,
  source TEXT DEFAULT 'vendor',
  stage TEXT DEFAULT 'sourced',
  ai_match_score NUMERIC DEFAULT 0,
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
  vendor_name TEXT,
  vendor_id UUID REFERENCES companies(id),
  revenue_amount NUMERIC DEFAULT 0,
  payout_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pipeline', -- pipeline, placed, lost
  payment_received BOOLEAN DEFAULT false,
  msa_signed BOOLEAN DEFAULT false,
  nda_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Resumes
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  url TEXT,
  source TEXT DEFAULT 'direct',
  status TEXT DEFAULT 'pending',
  extracted_text TEXT,
  parsed_data JSONB DEFAULT '{}',
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created previously without them
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resumes' AND column_name='source') THEN
    ALTER TABLE resumes ADD COLUMN source TEXT DEFAULT 'direct';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resumes' AND column_name='url') THEN
    ALTER TABLE resumes ADD COLUMN url TEXT;
  END IF;
END $$;

-- 12. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resumes access" ON resumes
  FOR ALL USING (true); -- Simplified for now, should be company based in production

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- 13. Security Policies (The Fortress)
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
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Candidate access" ON candidates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Client access" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Vendor access" ON vendors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Collaboration access" ON collaborations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
  
CREATE POLICY "Client data access" ON clients
  FOR ALL USING (true); -- Simplified for now, in prod should link to company_id

CREATE POLICY "Deal access" ON deals
  FOR ALL USING (
    job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  );

-- 14. Discovery & Intent Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'hiring_surge', 'content_engagement', 'tech_shift'
  intent_score INTEGER DEFAULT 0,
  decision_makers JSONB DEFAULT '[]',
  tool_stack JSONB DEFAULT '[]',
  recent_events TEXT[],
  status TEXT DEFAULT 'warm', -- 'warm', 'approached', 'deal_converted'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads access" ON leads FOR ALL USING (true);

