import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Wallet, Building2, Clock, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Startup, Investment } from '../lib/supabase';

export function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    if (profile.role === 'investor') {
      const { data: startupsData } = await supabase
        .from('startups')
        .select('*')
        .eq('status', 'active')
        .limit(3);

      const { data: investmentsData } = await supabase
        .from('investments')
        .select('*')
        .eq('investor_id', profile.id);

      if (startupsData) setStartups(startupsData);
      if (investmentsData) setInvestments(investmentsData);
    } else if (profile.role === 'startup') {
      const { data: startupsData } = await supabase
        .from('startups')
        .select('*')
        .eq('founder_id', profile.id);

      if (startupsData) setStartups(startupsData);
    }

    setLoading(false);
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

  if (profile?.verification_status !== 'verified') {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card className="p-8 text-center max-w-2xl mx-auto mt-20">
            <div className="w-16 h-16 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-yellow-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
            <p className="text-slate-400 mb-6">
              Please complete your KYC verification to access the platform
            </p>
            <Button onClick={() => navigate('/verification')}>
              Complete Verification
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (profile?.role === 'investor') {
    return <InvestorDashboard startups={startups} investments={investments} />;
  }

  if (profile?.role === 'startup') {
    return <StartupDashboard startups={startups} />;
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      </div>
    </DashboardLayout>
  );
}

function InvestorDashboard({ startups, investments }: { startups: Startup[]; investments: Investment[] }) {
  const navigate = useNavigate();

  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const activeInvestments = investments.filter((inv) => inv.payment_status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Investor Dashboard</h1>
          <p className="text-slate-400">Welcome back! Here's your investment overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Wallet className="text-blue-400" size={24} />}
            label="Total Invested"
            value={`$${totalInvested.toLocaleString()}`}
            bgColor="bg-blue-600/20"
          />
          <StatCard
            icon={<TrendingUp className="text-green-400" size={24} />}
            label="Active Investments"
            value={activeInvestments.toString()}
            bgColor="bg-green-600/20"
          />
          <StatCard
            icon={<Building2 className="text-purple-400" size={24} />}
            label="Startups Watched"
            value="0"
            bgColor="bg-purple-600/20"
          />
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recommended Startups</h2>
            <Button variant="outline" onClick={() => navigate('/discover')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {startups.length > 0 ? (
              startups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} onClick={() => navigate(`/startup/${startup.id}`)} />
              ))
            ) : (
              <Card className="p-8 text-center col-span-3">
                <p className="text-slate-400">No startups available yet</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StartupDashboard({ startups }: { startups: Startup[] }) {
  const navigate = useNavigate();
  const myStartup = startups[0];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Startup Dashboard</h1>
          <p className="text-slate-400">Manage your fundraising campaign</p>
        </div>

        {myStartup ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                icon={<TrendingUp className="text-green-400" size={24} />}
                label="Funding Goal"
                value={`$${Number(myStartup.funding_goal).toLocaleString()}`}
                bgColor="bg-green-600/20"
              />
              <StatCard
                icon={<Wallet className="text-blue-400" size={24} />}
                label="Current Funding"
                value={`$${Number(myStartup.current_funding).toLocaleString()}`}
                bgColor="bg-blue-600/20"
              />
              <StatCard
                icon={<Clock className="text-purple-400" size={24} />}
                label="Active Bids"
                value="0"
                bgColor="bg-purple-600/20"
              />
            </div>

            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Funding Progress</h3>
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((Number(myStartup.current_funding) / Number(myStartup.funding_goal)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {((Number(myStartup.current_funding) / Number(myStartup.funding_goal)) * 100).toFixed(1)}% funded
              </p>
            </Card>
          </>
        ) : (
          <Card className="p-8 text-center">
            <Building2 className="text-slate-600 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">Create Your Startup Profile</h3>
            <p className="text-slate-400 mb-6">Start raising funds by creating your startup profile</p>
            <Button onClick={() => navigate('/my-startup')}>Create Profile</Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: string; bgColor: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function StartupCard({ startup, onClick }: { startup: Startup; onClick: () => void }) {
  return (
    <Card hover onClick={onClick} className="p-6">
      <div className="mb-4">
        {startup.logo_url ? (
          <img src={startup.logo_url} alt={startup.company_name} className="w-12 h-12 rounded-lg" />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{startup.company_name}</h3>
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">{startup.tagline || startup.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Goal:</span>
        <span className="text-white font-semibold">${Number(startup.funding_goal).toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between text-sm mt-2">
        <span className="text-slate-400">Industry:</span>
        <span className="text-blue-400">{startup.industry}</span>
      </div>
    </Card>
  );
}
