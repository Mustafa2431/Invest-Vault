import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, PieChart } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InvestmentWithStartup {
  id: string;
  amount: number;
  equity: number;
  payment_status: string;
  created_at: string;
  startup: {
    id: string;
    company_name: string;
    logo_url: string;
    industry: string;
  };
}

export function Portfolio() {
  const { profile } = useAuth();
  const [investments, setInvestments] = useState<InvestmentWithStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      loadInvestments();
    }
  }, [profile]);

  const loadInvestments = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('investments')
      .select(`
        *,
        startup:startups(id, company_name, logo_url, industry)
      `)
      .eq('investor_id', profile.id)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false });

    if (data) {
      setInvestments(data as unknown as InvestmentWithStartup[]);
    }

    setLoading(false);
  };

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const avgEquity = investments.length > 0
    ? investments.reduce((sum, inv) => sum + Number(inv.equity), 0) / investments.length
    : 0;

  const industryData = investments.reduce((acc, inv) => {
    const industry = inv.startup.industry;
    const existing = acc.find((item) => item.name === industry);
    if (existing) {
      existing.value += Number(inv.amount);
    } else {
      acc.push({ name: industry, value: Number(inv.amount) });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

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
                <p className="text-sm text-slate-400">Active Investments</p>
                <p className="text-2xl font-bold text-white">{investments.length}</p>
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

        {investments.length > 0 && (
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
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {industryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Investment Summary</h3>
              <div className="space-y-3">
                {industryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
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
          {investments.length === 0 ? (
            <Card className="p-12 text-center">
              <Wallet className="text-slate-600 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">No Investments Yet</h3>
              <p className="text-slate-400">Start building your portfolio by investing in startups</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => (
                <Card
                  key={investment.id}
                  hover
                  onClick={() => navigate(`/startup/${investment.startup.id}`)}
                  className="p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {investment.startup.logo_url ? (
                        <img src={investment.startup.logo_url} alt={investment.startup.company_name} className="w-12 h-12 rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white">{investment.startup.company_name}</h3>
                        <p className="text-sm text-slate-400">{investment.startup.industry}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Investment</p>
                      <p className="text-lg font-semibold text-white">${Number(investment.amount).toLocaleString()}</p>
                      <p className="text-sm text-blue-400">{investment.equity}% equity</p>
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
