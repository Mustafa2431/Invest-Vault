import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TrendingUp, CheckCircle, XCircle, Clock, Send, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

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
  investor?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export function Bids() {
  const { profile, user } = useAuth();
  const [bids, setBids] = useState<BidWithStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingBidId, setRejectingBidId] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      loadBids();
    }
  }, [profile]);

  const loadBids = async () => {
    if (!profile) return;

    if (profile.role === 'investor') {
      const { data } = await supabase
        .from('bids')
        .select(`
          *,
          startup:startups(id, company_name, logo_url)
        `)
        .eq('investor_id', profile.id)
        .order('created_at', { ascending: false });

      if (data) {
        setBids(data as unknown as BidWithStartup[]);
      }
    } else if (profile.role === 'startup') {
      const { data: startupData } = await supabase
        .from('startups')
        .select('id')
        .eq('founder_id', profile.id)
        .maybeSingle();

      if (startupData) {
        const { data } = await supabase
          .from('bids')
          .select(`
            *,
            startup:startups(id, company_name, logo_url),
            investor:profiles(full_name, email)
          `)
          .eq('startup_id', startupData.id)
          .order('created_at', { ascending: false });

        if (data) {
          setBids(data as unknown as BidWithStartup[]);
        }
      }
    }

    setLoading(false);
  };

  const updateBidStatus = async (bidId: string, status: string) => {
    const { error } = await supabase
      .from('bids')
      .update({ status })
      .eq('id', bidId);

    if (!error) {
      loadBids();
    }
  };

  const handleRejectBid = async (bid: BidWithStartup) => {
    if (!user) return;

    const { error: updateError } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('id', bid.id);

    if (!updateError && rejectMessage.trim()) {
      await supabase.from('chat_messages').insert({
        sender_id: user.id,
        receiver_id: bid.investor_id,
        message: `Regarding your bid on ${bid.startup.company_name}: ${rejectMessage}`,
        read: false,
      });
    }

    if (!updateError) {
      setRejectingBidId(null);
      setRejectMessage('');
      loadBids();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile?.role === 'investor' ? 'My Bids' : 'Received Bids'}
          </h1>
          <p className="text-slate-400">
            {profile?.role === 'investor'
              ? 'Track your investment bids'
              : 'Review bids from interested investors'}
          </p>
        </div>

        {bids.length === 0 ? (
          <Card className="p-12 text-center">
            <TrendingUp className="text-slate-600 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No Bids Yet</h3>
            <p className="text-slate-400 mb-6">
              {profile?.role === 'investor'
                ? "Start investing by placing bids on startups"
                : "Share your startup to receive bids from investors"}
            </p>
            <Button onClick={() => navigate('/discover')}>
              {profile?.role === 'investor' ? 'Discover Startups' : 'View My Startup'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Card key={bid.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      {bid.startup.logo_url ? (
                        <img src={bid.startup.logo_url} alt={bid.startup.company_name} className="w-12 h-12 rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{bid.startup.company_name}</h3>
                        {bid.investor && (
                          <p className="text-sm text-slate-400">From: {bid.investor.full_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-400">Investment Amount</p>
                        <p className="text-lg font-semibold text-white">${Number(bid.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Equity Requested</p>
                        <p className="text-lg font-semibold text-white">{bid.equity_requested}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Status</p>
                        <div className="flex items-center space-x-1">
                          {bid.status === 'accepted' && <CheckCircle className="text-green-400" size={16} />}
                          {bid.status === 'rejected' && <XCircle className="text-red-400" size={16} />}
                          {bid.status === 'pending' && <Clock className="text-yellow-400" size={16} />}
                          <span className={`text-sm font-medium capitalize
                            ${bid.status === 'accepted' ? 'text-green-400' : ''}
                            ${bid.status === 'rejected' ? 'text-red-400' : ''}
                            ${bid.status === 'pending' ? 'text-yellow-400' : ''}
                          `}>
                            {bid.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Date</p>
                        <p className="text-sm text-white">{new Date(bid.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {bid.message && (
                      <div className="p-4 bg-slate-800/50 rounded-lg mb-4">
                        <p className="text-sm text-slate-300">{bid.message}</p>
                      </div>
                    )}
                  </div>

                  {profile?.role === 'startup' && bid.status === 'pending' && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button variant="primary" size="sm" onClick={() => updateBidStatus(bid.id, 'accepted')}>
                        Accept
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setRejectingBidId(bid.id)}>
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/messages')}
                        className="flex items-center justify-center space-x-1"
                      >
                        <MessageSquare size={16} />
                        <span>Message</span>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {rejectingBidId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Reject Bid with Message</h3>
              <p className="text-slate-400 text-sm mb-4">
                Optionally provide feedback to the investor about your decision.
              </p>

              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder="Thank you for your interest, but we're looking for a different investment structure..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                rows={4}
              />

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectingBidId(null);
                    setRejectMessage('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    const bid = bids.find((b) => b.id === rejectingBidId);
                    if (bid) handleRejectBid(bid);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  <Send size={16} />
                  <span>Reject & Send</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
