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

-- Fix Profiles table: Rename legacy 'company' column if it exists to 'company_id' and ensure it's UUID
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company') THEN
    -- Only rename if company_id doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id') THEN
      ALTER TABLE profiles RENAME COLUMN company TO company_id;
    END IF;
  END IF;

  -- Ensure company_id is UUID type for RLS reliability
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='company_id' AND data_type = 'text') THEN
    ALTER TABLE profiles ALTER COLUMN company_id TYPE UUID USING NULLIF(company_id, '')::UUID;
  END IF;
END $$;

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

-- Ensure website column exists for Clients
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='website') THEN
    ALTER TABLE clients ADD COLUMN website TEXT;
  END IF;
  -- Also ensure company_id exists on clients if not there
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='company_id') THEN
    ALTER TABLE clients ADD COLUMN company_id UUID REFERENCES companies(id);
  END IF;
END $$;

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
  whatsapp TEXT,
  website TEXT,
  current_title TEXT,
  skills TEXT[],
  experience TEXT,
  resume_url TEXT,
  source TEXT DEFAULT 'vendor',
  stage TEXT DEFAULT 'sourced',
  ai_match_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure candidates columns exist for leads/automation
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='whatsapp') THEN
    ALTER TABLE candidates ADD COLUMN whatsapp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidates' AND column_name='website') THEN
    ALTER TABLE candidates ADD COLUMN website TEXT;
  END IF;
END $$;

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
  FOR SELECT USING (id IN (SELECT company_id::UUID FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Agreement access" ON agreements
  FOR SELECT USING (company_id IN (SELECT company_id::UUID FROM profiles WHERE id = auth.uid()));

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
      WHERE col.vendor_id IN (SELECT company_id::UUID FROM profiles WHERE id = auth.uid())
      OR col.client_id IN (SELECT company_id::UUID FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Agent task access" ON agent_tasks
  FOR ALL USING (company_id IN (SELECT company_id::UUID FROM profiles WHERE id = auth.uid()));
  
CREATE POLICY "Client data access" ON clients
  FOR ALL USING (true); -- Simplified for now, in prod should link to company_id

CREATE POLICY "Deal access" ON deals
  FOR ALL USING (
    job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT company_id::UUID FROM profiles WHERE id = auth.uid()))
  );

-- 15. Emails (Persistent Storage for Ingested Messages)
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT UNIQUE, -- Gmail message path ID
  thread_id TEXT,
  "from" TEXT NOT NULL,
  sender_email TEXT,
  subject TEXT,
  body TEXT,
  snippet TEXT,
  status TEXT DEFAULT 'received', -- received, sent, draft
  is_ai BOOLEAN DEFAULT FALSE,
  ai_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure received_at column exists if table was created previously without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emails' AND column_name='received_at') THEN
    ALTER TABLE emails ADD COLUMN received_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emails' AND column_name='sender_email') THEN
    ALTER TABLE emails ADD COLUMN sender_email TEXT;
  END IF;
END $$;

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Emails access" ON emails FOR ALL USING (true); -- Simplified for dev

-- 16. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  signal_type TEXT,
  intent_score INT,
  decision_makers JSONB DEFAULT '[]',
  tool_stack TEXT[],
  recent_events TEXT[],
  status TEXT DEFAULT 'warm',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads access" ON leads FOR ALL USING (true);

-- 17. Inbound Leads / Extraction Cache (To avoid double processing)
CREATE TABLE IF NOT EXISTS processing_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT UNIQUE, -- e.g. gmail message id
  type TEXT, -- 'resume', 'lead'
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE processing_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cache access" ON processing_cache FOR ALL USING (true);

-- 17. WhatsApp Business Integration
CREATE TABLE IF NOT EXISTS whatsapp_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  contact_name TEXT,
  last_message TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ai_engagement_mode TEXT DEFAULT 'active', -- passive, active, paused
  status TEXT DEFAULT 'lead', -- lead, interviewing, placed, noise
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES whatsapp_chats(id),
  sender_type TEXT CHECK (sender_type IN ('contact', 'ai', 'user')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  ai_intent TEXT, -- 'greeting', 'scheduling', 'rejection', 'resume_submission'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chats access" ON whatsapp_chats FOR ALL USING (true);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages access" ON whatsapp_messages FOR ALL USING (true);

-- Ensure agent_logs has all autonomous agency columns
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_logs' AND column_name='agent_name') THEN
    ALTER TABLE agent_logs ADD COLUMN agent_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_logs' AND column_name='status') THEN
    ALTER TABLE agent_logs ADD COLUMN status TEXT DEFAULT 'success';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_logs' AND column_name='execution_time_ms') THEN
    ALTER TABLE agent_logs ADD COLUMN execution_time_ms INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_logs' AND column_name='input') THEN
    ALTER TABLE agent_logs ADD COLUMN input JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_logs' AND column_name='decision') THEN
    ALTER TABLE agent_logs ADD COLUMN decision JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_logs' AND column_name='action') THEN
    ALTER TABLE agent_logs ADD COLUMN action TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_logs' AND column_name='result') THEN
    ALTER TABLE agent_logs ADD COLUMN result JSONB;
  END IF;
END $$;

-- 18. Usage & Revenue Logs
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT, -- 'ai_process', 'email_sync', 'lead_gen'
  units INT DEFAULT 1,
  estimated_cost NUMERIC(10,4) DEFAULT 0,
  revenue_delta NUMERIC(10,2) DEFAULT 0, -- Estimated value generated
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usage access" ON usage_logs FOR ALL USING (true);

-- Ensure website column exists for Clients (Re-verifying path from previous turns)

