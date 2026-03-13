import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { TrendingUp, MessageSquare } from "lucide-react";
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
  };

  investor: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export function Bids() {
  const { profile } = useAuth();

  const [bids, setBids] = useState<BidWithStartup[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [actionType, setActionType] = useState<"accepted" | "rejected" | null>(
    null,
  );
  const [messageText, setMessageText] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (profile) loadBids();
  }, [profile]);

  const loadBids = async () => {
    if (!profile) return;

    let fetchedBids: any[] = [];

    /* INVESTOR VIEW */

    if (profile.role === "investor") {
      const { data } = await supabase
        .from("bids")
        .select(
          `
          *,
          startup:startups(id,company_name,logo_url),
          investor:profiles!bids_investor_id_fkey(id,full_name,email)
        `,
        )
        .eq("investor_id", profile.id)
        .order("created_at", { ascending: false });

      if (data) fetchedBids = data;
    }

    /* STARTUP VIEW */

    if (profile.role === "startup") {
      const { data: startups } = await supabase
        .from("startups")
        .select("id")
        .eq("founder_id", profile.id);

      if (startups && startups.length > 0) {
        const startupIds = startups.map((s: any) => s.id);

        const { data } = await supabase
          .from("bids")
          .select(
            `
            *,
            startup:startups(id,company_name,logo_url),
            investor:profiles!bids_investor_id_fkey(id,full_name,email)
          `,
          )
          .in("startup_id", startupIds)
          .order("created_at", { ascending: false });

        if (data) fetchedBids = data;
      }
    }

    setBids(fetchedBids);
    setLoading(false);
  };

  const openModal = (bid: any, type: "accepted" | "rejected") => {
    setSelectedBid(bid);
    setActionType(type);
    setMessageText("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedBid || !actionType || !messageText.trim()) return;

    /* update bid status */

    await supabase
      .from("bids")
      .update({ status: actionType })
      .eq("id", selectedBid.id);

    /* send message */

    await supabase.from("chat_messages").insert({
      sender_id: profile?.id,
      receiver_id: selectedBid.investor_id,
      message: messageText,
      read: false,
    });

    setModalOpen(false);
    setMessageText("");

    loadBids();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
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

        {bids.length === 0 ? (
          <Card className="p-12 text-center">
            <TrendingUp className="text-slate-600 mx-auto mb-4" size={48} />

            <h3 className="text-xl font-semibold text-white mb-4">
              No Bids Yet
            </h3>

            <Button onClick={() => navigate("/discover")}>
              Discover Startups
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Card key={bid.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white font-bold">
                        {bid.investor?.full_name?.charAt(0) || "I"}
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {bid.startup.company_name}
                        </h3>

                        <p className="text-sm text-slate-400">
                          Investor: {bid.investor?.full_name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-400">Amount</p>
                        <p className="text-lg font-semibold text-white">
                          ${Number(bid.amount).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400">Equity</p>
                        <p className="text-lg font-semibold text-white">
                          {bid.equity_requested}%
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400">Status</p>
                        <span className="text-white capitalize">
                          {bid.status}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm text-slate-400">Date</p>
                        <p className="text-sm text-white">
                          {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {bid.message && (
                      <div className="p-4 bg-slate-800 rounded-lg">
                        <p className="text-sm text-slate-300">{bid.message}</p>
                      </div>
                    )}
                  </div>

                  {profile?.role === "startup" && bid.status === "pending" && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => openModal(bid, "accepted")}
                      >
                        Accept
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openModal(bid, "rejected")}
                      >
                        Reject
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/messages")}
                      >
                        <MessageSquare size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MESSAGE MODAL */}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">
              {actionType === "accepted"
                ? "Accept Bid Message"
                : "Reject Bid Message"}
            </h2>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write message to investor..."
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4"
              rows={4}
            />

            <div className="flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>

              <Button disabled={!messageText.trim()} onClick={handleSubmit}>
                Send Message
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
