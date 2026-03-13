import { createClient } from "@supabase/supabase-js";

// Load Supabase credentials from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================
// TYPES
// =============================

export type UserRole = "investor" | "startup" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";

// =============================
// PROFILE
// =============================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

// =============================
// STARTUP
// =============================

export interface Startup {
  id: string;
  founder_id: string;
  company_name: string;
  tagline?: string;
  description: string;
  industry: string;
  stage: "idea" | "mvp" | "early_revenue" | "growth" | "scale";
  location?: string;
  founded_date?: string;
  website?: string;
  logo_url?: string;
  funding_goal: number;
  current_funding: number;
  valuation: number;
  equity_offered?: number;
  revenue: number;
  monthly_growth: number;
  team_size: number;
  business_model?: string;
  market_size?: string;
  status: "draft" | "active" | "funded" | "closed";
  created_at: string;
  updated_at: string;
}

// =============================
// BID
// =============================

export interface Bid {
  id: string;
  investor_id: string;
  startup_id: string;
  amount: number;
  equity_requested: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "negotiating";
  created_at: string;
  updated_at: string;
}

// =============================
// INVESTMENT
// =============================

export interface Investment {
  id: string;
  investor_id: string;
  startup_id: string;
  bid_id?: string;
  amount: number;
  equity: number;
  payment_status: "pending" | "completed" | "failed";
  payment_date?: string;
  agreement_signed: boolean;
  created_at: string;
}
