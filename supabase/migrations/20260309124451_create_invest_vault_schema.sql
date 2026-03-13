/*
  # Invest Vault Platform Schema

  ## Overview
  Complete database schema for the Invest Vault fintech platform connecting startups with investors.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key) - links to auth.users
  - `email` (text)
  - `full_name` (text)
  - `role` (text) - 'investor', 'startup', or 'admin'
  - `phone` (text)
  - `location` (text)
  - `bio` (text)
  - `avatar_url` (text)
  - `verification_status` (text) - 'pending', 'verified', 'rejected'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `kyc_documents`
  KYC verification documents for users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `document_type` (text) - 'government_id', 'company_registration', 'pan', 'gst'
  - `document_url` (text)
  - `status` (text) - 'pending', 'verified', 'rejected'
  - `admin_notes` (text)
  - `uploaded_at` (timestamptz)
  - `reviewed_at` (timestamptz)

  ### 3. `startups`
  Startup company information
  - `id` (uuid, primary key)
  - `founder_id` (uuid, foreign key to profiles)
  - `company_name` (text)
  - `tagline` (text)
  - `description` (text)
  - `industry` (text)
  - `stage` (text) - 'idea', 'mvp', 'early_revenue', 'growth', 'scale'
  - `location` (text)
  - `founded_date` (date)
  - `website` (text)
  - `logo_url` (text)
  - `funding_goal` (decimal)
  - `current_funding` (decimal)
  - `valuation` (decimal)
  - `equity_offered` (decimal)
  - `revenue` (decimal)
  - `monthly_growth` (decimal)
  - `team_size` (integer)
  - `business_model` (text)
  - `market_size` (text)
  - `status` (text) - 'draft', 'active', 'funded', 'closed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `bids`
  Investor bids on startups
  - `id` (uuid, primary key)
  - `investor_id` (uuid, foreign key to profiles)
  - `startup_id` (uuid, foreign key to startups)
  - `amount` (decimal)
  - `equity_requested` (decimal)
  - `message` (text)
  - `status` (text) - 'pending', 'accepted', 'rejected', 'negotiating'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `investments`
  Completed investments
  - `id` (uuid, primary key)
  - `investor_id` (uuid, foreign key to profiles)
  - `startup_id` (uuid, foreign key to startups)
  - `bid_id` (uuid, foreign key to bids)
  - `amount` (decimal)
  - `equity` (decimal)
  - `payment_status` (text) - 'pending', 'completed', 'failed'
  - `payment_date` (timestamptz)
  - `agreement_signed` (boolean)
  - `created_at` (timestamptz)

  ### 6. `watchlist`
  Investor watchlist for startups
  - `id` (uuid, primary key)
  - `investor_id` (uuid, foreign key to profiles)
  - `startup_id` (uuid, foreign key to startups)
  - `created_at` (timestamptz)

  ### 7. `investor_preferences`
  Investor preferences for AI recommendations
  - `id` (uuid, primary key)
  - `investor_id` (uuid, foreign key to profiles)
  - `industries` (text[])
  - `min_investment` (decimal)
  - `max_investment` (decimal)
  - `risk_appetite` (text) - 'low', 'medium', 'high'
  - `preferred_stages` (text[])
  - `updated_at` (timestamptz)

  ### 8. `chat_messages`
  Messages between investors and startups
  - `id` (uuid, primary key)
  - `sender_id` (uuid, foreign key to profiles)
  - `receiver_id` (uuid, foreign key to profiles)
  - `startup_id` (uuid, foreign key to startups)
  - `message` (text)
  - `read` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Admins have full access
  - Public can view active startups
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('investor', 'startup', 'admin')),
  phone text,
  location text,
  bio text,
  avatar_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('government_id', 'company_registration', 'pan', 'gst')),
  document_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_notes text,
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz
);

-- Create startups table
CREATE TABLE IF NOT EXISTS startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  tagline text,
  description text NOT NULL,
  industry text NOT NULL,
  stage text DEFAULT 'idea' CHECK (stage IN ('idea', 'mvp', 'early_revenue', 'growth', 'scale')),
  location text,
  founded_date date,
  website text,
  logo_url text,
  funding_goal decimal(15, 2) NOT NULL,
  current_funding decimal(15, 2) DEFAULT 0,
  valuation decimal(15, 2) NOT NULL,
  equity_offered decimal(5, 2),
  revenue decimal(15, 2) DEFAULT 0,
  monthly_growth decimal(5, 2) DEFAULT 0,
  team_size integer DEFAULT 1,
  business_model text,
  market_size text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'funded', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  startup_id uuid REFERENCES startups(id) ON DELETE CASCADE NOT NULL,
  amount decimal(15, 2) NOT NULL,
  equity_requested decimal(5, 2) NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  startup_id uuid REFERENCES startups(id) ON DELETE CASCADE NOT NULL,
  bid_id uuid REFERENCES bids(id) ON DELETE SET NULL,
  amount decimal(15, 2) NOT NULL,
  equity decimal(5, 2) NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_date timestamptz,
  agreement_signed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  startup_id uuid REFERENCES startups(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(investor_id, startup_id)
);

-- Create investor preferences table
CREATE TABLE IF NOT EXISTS investor_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  industries text[],
  min_investment decimal(15, 2),
  max_investment decimal(15, 2),
  risk_appetite text CHECK (risk_appetite IN ('low', 'medium', 'high')),
  preferred_stages text[],
  updated_at timestamptz DEFAULT now()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  startup_id uuid REFERENCES startups(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- KYC documents policies
CREATE POLICY "Users can view own KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own KYC documents"
  ON kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Startups policies
CREATE POLICY "Anyone can view active startups"
  ON startups FOR SELECT
  TO authenticated
  USING (status = 'active' OR founder_id = auth.uid());

CREATE POLICY "Founders can insert own startups"
  ON startups FOR INSERT
  TO authenticated
  WITH CHECK (founder_id = auth.uid());

CREATE POLICY "Founders can update own startups"
  ON startups FOR UPDATE
  TO authenticated
  USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

-- Bids policies
CREATE POLICY "Investors can view own bids"
  ON bids FOR SELECT
  TO authenticated
  USING (
    investor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM startups WHERE startups.id = bids.startup_id AND startups.founder_id = auth.uid())
  );

CREATE POLICY "Investors can insert bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (investor_id = auth.uid());

CREATE POLICY "Startup founders can update bids status"
  ON bids FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM startups WHERE startups.id = bids.startup_id AND startups.founder_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM startups WHERE startups.id = bids.startup_id AND startups.founder_id = auth.uid()));

-- Investments policies
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (
    investor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM startups WHERE startups.id = investments.startup_id AND startups.founder_id = auth.uid())
  );

CREATE POLICY "System can insert investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (investor_id = auth.uid());

-- Watchlist policies
CREATE POLICY "Investors can manage own watchlist"
  ON watchlist FOR ALL
  TO authenticated
  USING (investor_id = auth.uid())
  WITH CHECK (investor_id = auth.uid());

-- Investor preferences policies
CREATE POLICY "Investors can manage own preferences"
  ON investor_preferences FOR ALL
  TO authenticated
  USING (investor_id = auth.uid())
  WITH CHECK (investor_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_startups_status ON startups(status);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON startups(industry);
CREATE INDEX IF NOT EXISTS idx_bids_startup ON bids(startup_id);
CREATE INDEX IF NOT EXISTS idx_bids_investor ON bids(investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_startup ON investments(startup_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id, read);
