import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { supabase, Startup } from '../lib/supabase';

export function Discover() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  const [fundingMap, setFundingMap] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [searchTerm, industryFilter, stageFilter, startups]);

  const loadStartups = async () => {
    // 1. Fetch all active startups
    const { data: startupsData } = await supabase
      .from('startups')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!startupsData) return;

    setStartups(startupsData);
    setFilteredStartups(startupsData);

    // 2. Fetch all accepted bids for these startups
    const startupIds = startupsData.map((s) => s.id);

    const { data: acceptedBids } = await supabase
      .from('bids')
      .select('startup_id, amount')
      .in('startup_id', startupIds)
      .eq('status', 'accepted');

    // 3. Sum accepted bid amounts per startup on the frontend
    const map: Record<string, number> = {};

    acceptedBids?.forEach((bid) => {
      map[bid.startup_id] = (map[bid.startup_id] || 0) + Number(bid.amount);
    });

    setFundingMap(map);
  };

  const filterStartups = () => {
    let filtered = [...startups];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (industryFilter !== 'all') {
      filtered = filtered.filter((s) => s.industry === industryFilter);
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter((s) => s.stage === stageFilter);
    }

    setFilteredStartups(filtered);
  };

  const getFundingPercent = (startup: Startup) => {
    const raised = fundingMap[startup.id] || 0;
    const goal = Number(startup.funding_goal);
    if (!goal) return 0;
    return Math.min((raised / goal) * 100, 100);
  };

  const industries = ['all', 'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Other'];
  const stages = ['all', 'idea', 'mvp', 'early_revenue', 'growth', 'scale'];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Discover Startups</h1>
          <p className="text-slate-400">Find your next investment opportunity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder="Search startups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={industries.map((i) => ({ value: i, label: i === 'all' ? 'All Industries' : i }))}
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          />
          <Select
            options={stages.map((s) => ({ value: s, label: s === 'all' ? 'All Stages' : s.replace('_', ' ') }))}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup) => {
            const raised = fundingMap[startup.id] || 0;
            const percent = getFundingPercent(startup);

            return (
              <Card key={startup.id} hover onClick={() => navigate(`/startup/${startup.id}`)} className="p-6">
                <div className="mb-4">
                  {startup.logo_url ? (
                    <img src={startup.logo_url} alt={startup.company_name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                  )}
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">{startup.company_name}</h3>
                <p className="text-sm text-blue-400 mb-3">{startup.industry}</p>
                <p className="text-sm text-slate-400 mb-4 line-clamp-3">{startup.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Funding Goal:</span>
                    <span className="text-white font-semibold">${Number(startup.funding_goal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Valuation:</span>
                    <span className="text-white font-semibold">${Number(startup.valuation).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Stage:</span>
                    <span className="text-purple-400 capitalize">{startup.stage.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {percent.toFixed(0)}% funded
                    {raised > 0 && (
                      <span className="ml-2 text-blue-400">
                        (${raised.toLocaleString()} raised)
                      </span>
                    )}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredStartups.length === 0 && (
          <Card className="p-12 text-center">
            <Filter className="text-slate-600 mx-auto mb-4" size={48} />
            <p className="text-slate-400">No startups found matching your criteria</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}