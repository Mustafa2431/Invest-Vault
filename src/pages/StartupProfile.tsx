import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, Users, TrendingUp, DollarSign, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Startup, Bid } from '../lib/supabase';

export function StartupProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [equityRequested, setEquityRequested] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadStartup();
    }
  }, [id]);

  const loadStartup = async () => {
    const { data } = await supabase
      .from('startups')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setStartup(data);
    }
  };

  const handlePlaceBid = async () => {
    if (!profile || !startup) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('bids').insert({
        investor_id: profile.id,
        startup_id: startup.id,
        amount: parseFloat(bidAmount),
        equity_requested: parseFloat(equityRequested),
        message,
        status: 'pending',
      });

      if (error) throw error;

      setShowBidForm(false);
      setBidAmount('');
      setEquityRequested('');
      setMessage('');
      alert('Bid placed successfully!');
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  if (!startup) {
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
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <div className="flex items-start space-x-6 mb-6">
                {startup.logo_url ? (
                  <img src={startup.logo_url} alt={startup.company_name} className="w-24 h-24 rounded-xl object-cover" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl" />
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{startup.company_name}</h1>
                  <p className="text-lg text-slate-400 mb-4">{startup.tagline}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    {startup.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={16} />
                        <span>{startup.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Building2 size={16} />
                      <span className="capitalize">{startup.stage.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users size={16} />
                      <span>{startup.team_size} employees</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">About</h3>
                <p className="text-slate-300 leading-relaxed">{startup.description}</p>
              </div>

              {startup.business_model && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3">Business Model</h3>
                  <p className="text-slate-300 leading-relaxed">{startup.business_model}</p>
                </div>
              )}

              {startup.market_size && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Market Size</h3>
                  <p className="text-slate-300 leading-relaxed">{startup.market_size}</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <MetricItem label="Revenue" value={`$${Number(startup.revenue).toLocaleString()}`} />
                <MetricItem label="Monthly Growth" value={`${startup.monthly_growth}%`} />
                <MetricItem label="Team Size" value={startup.team_size.toString()} />
                <MetricItem label="Industry" value={startup.industry} />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Investment Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Funding Goal</p>
                  <p className="text-2xl font-bold text-white">${Number(startup.funding_goal).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Valuation</p>
                  <p className="text-2xl font-bold text-white">${Number(startup.valuation).toLocaleString()}</p>
                </div>
                {startup.equity_offered && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Equity Offered</p>
                    <p className="text-2xl font-bold text-white">{startup.equity_offered}%</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                    style={{
                      width: `${Math.min((Number(startup.current_funding) / Number(startup.funding_goal)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-slate-400">
                  ${Number(startup.current_funding).toLocaleString()} raised (
                  {((Number(startup.current_funding) / Number(startup.funding_goal)) * 100).toFixed(0)}%)
                </p>
              </div>

              {profile?.role === 'investor' && (
                <Button onClick={() => setShowBidForm(!showBidForm)} className="w-full mt-6">
                  {showBidForm ? 'Cancel Bid' : 'Place Bid'}
                </Button>
              )}
            </Card>

            {showBidForm && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Place Your Bid</h3>
                <div className="space-y-4">
                  <Input
                    label="Investment Amount ($)"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="50000"
                  />
                  <Input
                    label="Equity Requested (%)"
                    type="number"
                    value={equityRequested}
                    onChange={(e) => setEquityRequested(e.target.value)}
                    placeholder="10"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Message (Optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      placeholder="Introduce yourself and explain your interest..."
                    />
                  </div>
                  <Button onClick={handlePlaceBid} disabled={loading} className="w-full">
                    {loading ? 'Placing Bid...' : 'Submit Bid'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-800/50 rounded-lg">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
