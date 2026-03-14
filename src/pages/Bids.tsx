import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  MessageSquare,
  Mail,
  Loader,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

interface BidWithStartup {
  id: string;
  investor_id: string;
  amount: number;
  equity_requested: number;
  message: string;
  status: string;
  created_at: string;
  startup: {
    id: string;
    company_name: string;
    logo_url: string;
    current_funding: number;
  };
  investor?: {
    id: string;
    full_name: string;
    email: string;
  };
}

type EmailStatus = "idle" | "sending" | "sent" | "error";

export function Bids() {
  const { profile, user } = useAuth();
  const [bids, setBids] = useState<BidWithStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingBidId, setRejectingBidId] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<Record<string, EmailStatus>>(
    {},
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) loadBids();
  }, [profile]);

  const loadBids = async () => {
    if (!profile) return;
    setError(null);
    setLoading(true);

    try {
      if (profile.role === "investor") {
        // 1. Fetch all bids by this investor
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("*")
          .eq("investor_id", profile.id)
          .order("created_at", { ascending: false });

        if (bidsError) throw new Error(bidsError.message);
        if (!bidsData || bidsData.length === 0) {
          setBids([]);
          return;
        }

        // 2. Fetch all relevant startups in one query
        const startupIds = [...new Set(bidsData.map((b) => b.startup_id))];
        const { data: startupsData, error: startupsError } = await supabase
          .from("startups")
          .select("id, company_name, logo_url, current_funding")
          .in("id", startupIds);

        if (startupsError) throw new Error(startupsError.message);

        const startupMap = Object.fromEntries(
          (startupsData || []).map((s) => [s.id, s]),
        );

        // 3. Merge
        const merged: BidWithStartup[] = bidsData.map((bid) => ({
          ...bid,
          startup: startupMap[bid.startup_id] || {
            id: bid.startup_id,
            company_name: "Unknown Startup",
            logo_url: "",
            current_funding: 0,
          },
        }));

        setBids(merged);
      } else if (profile.role === "startup") {
        // 1. Get ALL startups by this founder (not just one)
        const { data: myStartups, error: startupsError } = await supabase
          .from("startups")
          .select("id, company_name, logo_url, current_funding")
          .eq("founder_id", profile.id);

        if (startupsError) throw new Error(startupsError.message);
        if (!myStartups || myStartups.length === 0) {
          setBids([]);
          return;
        }

        const myStartupIds = myStartups.map((s) => s.id);
        const startupMap = Object.fromEntries(myStartups.map((s) => [s.id, s]));

        // 2. Fetch all bids on ALL of this founder's startups
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("*")
          .in("startup_id", myStartupIds)
          .order("created_at", { ascending: false });

        if (bidsError) throw new Error(bidsError.message);
        if (!bidsData || bidsData.length === 0) {
          setBids([]);
          return;
        }

        // 3. Fetch all investor profiles in one query
        const investorIds = [...new Set(bidsData.map((b) => b.investor_id))];
        const { data: investorsData, error: investorsError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", investorIds);

        if (investorsError) throw new Error(investorsError.message);

        const investorMap = Object.fromEntries(
          (investorsData || []).map((inv) => [inv.id, inv]),
        );

        // 4. Merge everything
        const merged: BidWithStartup[] = bidsData.map((bid) => ({
          ...bid,
          startup: startupMap[bid.startup_id] || {
            id: bid.startup_id,
            company_name: "Unknown Startup",
            logo_url: "",
            current_funding: 0,
          },
          investor: investorMap[bid.investor_id] || undefined,
        }));

        setBids(merged);
      }
    } catch (err) {
      console.error("loadBids error:", err);
      setError(err instanceof Error ? err.message : "Failed to load bids");
    } finally {
      setLoading(false);
    }
  };

  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbz3iDKWYuBMUqtRYyqKdmeVauuQF8fxWJxZ3QCAxs-qoN-91fmSoL_GTLoSxPzJ71ea/exec";

  const sendEmail = async (
    type: "accepted" | "rejected",
    bid: BidWithStartup,
    rejectionReason?: string,
  ) => {
    if (!bid.investor) return;
    setEmailStatus((prev) => ({ ...prev, [bid.id]: "sending" }));

    const isAccepted = type === "accepted";
    const subject = isAccepted
      ? `🎉 Your bid on ${bid.startup.company_name} has been accepted!`
      : `Update on your bid for ${bid.startup.company_name}`;

    const body = isAccepted
      ? `Hi ${bid.investor.full_name},

Great news! Your bid on ${bid.startup.company_name} has been accepted.

Bid Details:
- Investment Amount: $${Number(bid.amount).toLocaleString()}
- Equity Stake: ${bid.equity_requested}%

The founder will contact you soon to finalize the agreement.

Visit the platform: ${window.location.origin}/bids

— Invest Vault Team`
      : `Hi ${bid.investor.full_name},

Thank you for your interest in ${bid.startup.company_name}.
The founder has decided not to move forward with your bid at this time.

Your Bid:
- Amount: $${Number(bid.amount).toLocaleString()}
- Equity: ${bid.equity_requested}%

${rejectionReason ? `Message from the founder:\n"${rejectionReason}"` : ""}

Explore more startups: ${window.location.origin}/discover

— Invest Vault Team`;

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ to_email: bid.investor.email, subject, body }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatus((prev) => ({ ...prev, [bid.id]: "sent" }));
      } else {
        throw new Error("Email send failed");
      }
    } catch (err) {
      console.error(err);
      setEmailStatus((prev) => ({ ...prev, [bid.id]: "error" }));
    } finally {
      setTimeout(() => {
        setEmailStatus((prev) => ({ ...prev, [bid.id]: "idle" }));
      }, 4000);
    }
  };

  const handleAcceptBid = async (bid: BidWithStartup) => {
    setActionLoading(bid.id);

    const { error: bidError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bid.id);

    if (!bidError) {
      // Recalculate current_funding from all accepted bids for this startup
      const { data: acceptedBids } = await supabase
        .from("bids")
        .select("amount")
        .eq("startup_id", bid.startup.id)
        .eq("status", "accepted");

      const newFunding = (acceptedBids || []).reduce(
        (sum, b) => sum + Number(b.amount),
        0,
      );

      await supabase
        .from("startups")
        .update({ current_funding: newFunding })
        .eq("id", bid.startup.id);

      await sendEmail("accepted", bid);
      loadBids();
    }

    setActionLoading(null);
  };

  const handleRejectBid = async (bid: BidWithStartup) => {
    if (!user) return;
    setActionLoading(bid.id);

    const { error: updateError } = await supabase
      .from("bids")
      .update({ status: "rejected" })
      .eq("id", bid.id);

    if (!updateError) {
      if (rejectMessage.trim()) {
        await supabase.from("chat_messages").insert({
          sender_id: user.id,
          receiver_id: bid.investor_id,
          message: `Regarding your bid on ${bid.startup.company_name}: ${rejectMessage}`,
          read: false,
        });
      }

      await sendEmail("rejected", bid, rejectMessage.trim() || undefined);
      setRejectingBidId(null);
      setRejectMessage("");
      loadBids();
    }

    setActionLoading(null);
  };

  const EmailBadge = ({ bidId }: { bidId: string }) => {
    const status = emailStatus[bidId];
    if (!status || status === "idle") return null;

    const cfg = {
      sending: {
        cls: "bg-blue-600/20 border-blue-500/30 text-blue-400",
        icon: <Loader size={12} className="animate-spin" />,
        label: "Sending email…",
      },
      sent: {
        cls: "bg-green-600/20 border-green-500/30 text-green-400",
        icon: <Mail size={12} />,
        label: "Email sent!",
      },
      error: {
        cls: "bg-red-600/20 border-red-500/30 text-red-400",
        icon: <XCircle size={12} />,
        label: "Email failed",
      },
    }[status];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mt-2 ${cfg.cls}`}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile?.role === "investor" ? "My Bids" : "Received Bids"}
          </h1>
          <p className="text-slate-400">
            {profile?.role === "investor"
              ? "Track your investment bids"
              : "Review bids from interested investors"}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Failed to load bids</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
            <button
              onClick={loadBids}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition"
            >
              Retry
            </button>
          </div>
        )}

        {!error && bids.length === 0 ? (
          <Card className="p-12 text-center">
            <TrendingUp className="text-slate-600 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Bids Yet
            </h3>
            <p className="text-slate-400 mb-6">
              {profile?.role === "investor"
                ? "Start investing by placing bids on startups"
                : "Share your startup to receive bids from investors"}
            </p>
            <Button onClick={() => navigate("/discover")}>
              {profile?.role === "investor"
                ? "Discover Startups"
                : "View My Startup"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => {
              const isBidLoading = actionLoading === bid.id;
              return (
                <Card key={bid.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        {bid.startup?.logo_url ? (
                          <img
                            src={bid.startup.logo_url}
                            alt={bid.startup.company_name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {bid.startup?.company_name ?? "Unknown Startup"}
                          </h3>
                          {bid.investor && (
                            <p className="text-sm text-slate-400">
                              From: {bid.investor.full_name}
                              <span className="mx-1.5 text-slate-600">·</span>
                              {bid.investor.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-slate-400">
                            Investment Amount
                          </p>
                          <p className="text-lg font-semibold text-white">
                            ${Number(bid.amount).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">
                            Equity Requested
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {bid.equity_requested}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Status</p>
                          <div className="flex items-center space-x-1 mt-0.5">
                            {bid.status === "accepted" && (
                              <CheckCircle
                                className="text-green-400"
                                size={16}
                              />
                            )}
                            {bid.status === "rejected" && (
                              <XCircle className="text-red-400" size={16} />
                            )}
                            {bid.status === "pending" && (
                              <Clock className="text-yellow-400" size={16} />
                            )}
                            <span
                              className={`text-sm font-medium capitalize
                                ${bid.status === "accepted" ? "text-green-400" : ""}
                                ${bid.status === "rejected" ? "text-red-400" : ""}
                                ${bid.status === "pending" ? "text-yellow-400" : ""}
                              `}
                            >
                              {bid.status}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Date</p>
                          <p className="text-sm text-white">
                            {new Date(bid.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {bid.message && (
                        <div className="p-4 bg-slate-800/50 rounded-lg mb-3">
                          <p className="text-sm text-slate-300">
                            {bid.message}
                          </p>
                        </div>
                      )}

                      <EmailBadge bidId={bid.id} />

                      {profile?.role === "investor" &&
                        (bid.status === "accepted" ||
                          bid.status === "rejected") && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mt-2
                              ${
                                bid.status === "accepted"
                                  ? "bg-green-600/10 border-green-600/20 text-green-400"
                                  : "bg-red-600/10 border-red-600/20 text-red-400"
                              }`}
                          >
                            <Mail size={12} />
                            {bid.status === "accepted"
                              ? "Acceptance email was sent to you"
                              : "Rejection email was sent to you"}
                          </span>
                        )}
                    </div>

                    {/* Founder action buttons */}
                    {profile?.role === "startup" &&
                      bid.status === "pending" && (
                        <div className="flex flex-col space-y-2 flex-shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptBid(bid)}
                            disabled={isBidLoading}
                            className="flex items-center justify-center gap-1.5 min-w-[110px]"
                          >
                            {isBidLoading ? (
                              <Loader size={14} className="animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            <span>
                              {isBidLoading ? "Accepting…" : "Accept"}
                            </span>
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRejectingBidId(bid.id)}
                            disabled={isBidLoading}
                            className="flex items-center justify-center gap-1.5 min-w-[110px]"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/messages")}
                            className="flex items-center justify-center gap-1.5 min-w-[110px]"
                          >
                            <MessageSquare size={14} />
                            <span>Message</span>
                          </Button>
                        </div>
                      )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingBidId &&
        (() => {
          const bid = bids.find((b) => b.id === rejectingBidId);
          if (!bid) return null;
          const isSending = actionLoading === rejectingBidId;

          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <XCircle className="text-red-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Reject Bid
                      </h3>
                      <p className="text-sm text-slate-400">
                        {bid.startup.company_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg mb-5">
                    <Mail
                      size={15}
                      className="text-blue-400 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-blue-300 leading-snug">
                      A rejection email will be sent to{" "}
                      <span className="font-semibold text-white">
                        {bid.investor?.email}
                      </span>{" "}
                      when you click the button below.
                    </p>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Reason for rejection{" "}
                      <span className="text-slate-500 font-normal">
                        (optional but recommended)
                      </span>
                    </label>
                    <textarea
                      value={rejectMessage}
                      onChange={(e) => setRejectMessage(e.target.value)}
                      maxLength={500}
                      placeholder="e.g. We're looking for a different investment structure…"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      {rejectMessage.length}/500
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectingBidId(null);
                        setRejectMessage("");
                      }}
                      className="flex-1"
                      disabled={isSending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleRejectBid(bid)}
                      disabled={isSending}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader size={15} className="animate-spin" />
                          <span>Sending…</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Reject &amp; Send Email</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}
    </DashboardLayout>
  );
}
