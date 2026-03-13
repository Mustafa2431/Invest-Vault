import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dummy.supabase.co";
const supabaseAnonKey = "dummy-key";

console.warn("Supabase disabled for demo - using dummy client");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = "investor" | "startup" | "admin";
export type VerificationStatus = "pending" | "verified" | "rejected";

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
