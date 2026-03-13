import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, PieChart } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AcceptedBid {
  id: string;
  amount: number;
  equity_requested: number;
  created_at: string;
  startup: {
    id: string;
    company_name: string;
    logo_url: string;
    industry: string;
    funding_goal: number;
    current_funding: number;
  };
}

export function Portfolio() {
  const { profile } = useAuth();
  const [bids, setBids] = useState<AcceptedBid[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) loadAcceptedBids();
  }, [profile]);

  const loadAcceptedBids = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('bids')
      .select(`
        id,
        amount,
        equity_requested,
        created_at,
        startup:startups(id, company_name, logo_url, industry, funding_goal, current_funding)
      `)
      .eq('investor_id', profile.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBids(data as unknown as AcceptedBid[]);
    }
    setLoading(false);
  };

  const totalInvested = bids.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalBids = bids.length;
  const avgEquity =
    totalBids > 0
      ? bids.reduce((sum, b) => sum + Number(b.equity_requested), 0) / totalBids
      : 0;

  const industryData = bids.reduce(
    (acc, b) => {
      const industry = b.startup.industry;
      const existing = acc.find((item) => item.name === industry);
      if (existing) {
        existing.value += Number(b.amount);
      } else {
        acc.push({ name: industry, value: Number(b.amount) });
      }
      return acc;
    },
    [] as { name: string; value: number }[]
  );

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

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
          <h1 className="text-3xl font-bold text-white mb-2">Investment Portfolio</h1>
          <p className="text-slate-400">Track your investments and performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Wallet className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Invested</p>
                <p className="text-2xl font-bold text-white">${totalInvested.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">No. of Investments</p>
                <p className="text-2xl font-bold text-white">{totalBids}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <PieChart className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">Avg Equity</p>
                <p className="text-2xl font-bold text-white">{avgEquity.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>

        {bids.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={industryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {industryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Investment Summary</h3>
              <div className="space-y-3">
                {industryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-white font-semibold">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-white mb-4">All Investments</h2>

          {bids.length === 0 ? (
            <Card className="p-12 text-center">
              <Wallet className="text-slate-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">No Investments Yet</h3>
              <p className="text-slate-400">Start building your portfolio by investing in startups</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <Card key={bid.id} hover onClick={() => navigate(`/startup/${bid.startup.id}`)} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {bid.startup.logo_url ? (
                        <img src={bid.startup.logo_url} alt={bid.startup.company_name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{bid.startup.company_name}</h3>
                        <p className="text-sm text-slate-400">{bid.startup.industry}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Accepted on {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-slate-400">Amount Invested</p>
                      <p className="text-lg font-semibold text-white">${Number(bid.amount).toLocaleString()}</p>
                      <p className="text-sm text-blue-400">{bid.equity_requested}% equity</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}