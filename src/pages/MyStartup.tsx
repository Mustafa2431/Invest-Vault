import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Startup } from '../lib/supabase';

export function MyStartup() {
  const { profile } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    tagline: '',
    description: '',
    industry: 'Technology',
    stage: 'idea',
    location: '',
    website: '',
    funding_goal: '',
    valuation: '',
    equity_offered: '',
    revenue: '',
    monthly_growth: '',
    team_size: '1',
    business_model: '',
    market_size: '',
  });

  useEffect(() => {
    if (profile) {
      loadStartup();
    }
  }, [profile]);

  const loadStartup = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('startups')
      .select('*')
      .eq('founder_id', profile.id)
      .maybeSingle();

    if (data) {
      setStartup(data);
      setFormData({
        company_name: data.company_name,
        tagline: data.tagline || '',
        description: data.description,
        industry: data.industry,
        stage: data.stage,
        location: data.location || '',
        website: data.website || '',
        funding_goal: data.funding_goal.toString(),
        valuation: data.valuation.toString(),
        equity_offered: data.equity_offered?.toString() || '',
        revenue: data.revenue.toString(),
        monthly_growth: data.monthly_growth.toString(),
        team_size: data.team_size.toString(),
        business_model: data.business_model || '',
        market_size: data.market_size || '',
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      const startupData = {
        ...formData,
        founder_id: profile.id,
        funding_goal: parseFloat(formData.funding_goal),
        valuation: parseFloat(formData.valuation),
        equity_offered: formData.equity_offered ? parseFloat(formData.equity_offered) : null,
        revenue: parseFloat(formData.revenue || '0'),
        monthly_growth: parseFloat(formData.monthly_growth || '0'),
        team_size: parseInt(formData.team_size),
        status: 'active',
      };

      if (startup) {
        const { error } = await supabase
          .from('startups')
          .update(startupData)
          .eq('id', startup.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('startups').insert(startupData);

        if (error) throw error;
      }

      alert('Startup profile saved successfully!');
      loadStartup();
    } catch (error) {
      console.error('Error saving startup:', error);
      alert('Failed to save startup profile');
    } finally {
      setSaving(false);
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {startup ? 'Edit Your Startup' : 'Create Your Startup Profile'}
            </h1>
            <p className="text-slate-400">Provide detailed information to attract investors</p>
          </div>

          <Card className="p-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
                <Input
                  label="Tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="One-line pitch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Industry"
                  options={[
                    { value: 'Technology', label: 'Technology' },
                    { value: 'Healthcare', label: 'Healthcare' },
                    { value: 'Finance', label: 'Finance' },
                    { value: 'E-commerce', label: 'E-commerce' },
                    { value: 'Education', label: 'Education' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
                <Select
                  label="Stage"
                  options={[
                    { value: 'idea', label: 'Idea' },
                    { value: 'mvp', label: 'MVP' },
                    { value: 'early_revenue', label: 'Early Revenue' },
                    { value: 'growth', label: 'Growth' },
                    { value: 'scale', label: 'Scale' },
                  ]}
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <Input
                  label="Website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Funding Goal ($)"
                  type="number"
                  value={formData.funding_goal}
                  onChange={(e) => setFormData({ ...formData, funding_goal: e.target.value })}
                  required
                />
                <Input
                  label="Valuation ($)"
                  type="number"
                  value={formData.valuation}
                  onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                  required
                />
                <Input
                  label="Equity Offered (%)"
                  type="number"
                  value={formData.equity_offered}
                  onChange={(e) => setFormData({ ...formData, equity_offered: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Annual Revenue ($)"
                  type="number"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                />
                <Input
                  label="Monthly Growth (%)"
                  type="number"
                  value={formData.monthly_growth}
                  onChange={(e) => setFormData({ ...formData, monthly_growth: e.target.value })}
                />
                <Input
                  label="Team Size"
                  type="number"
                  value={formData.team_size}
                  onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Business Model</label>
                <textarea
                  value={formData.business_model}
                  onChange={(e) => setFormData({ ...formData, business_model: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Describe how your business makes money..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Market Size</label>
                <textarea
                  value={formData.market_size}
                  onChange={(e) => setFormData({ ...formData, market_size: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Describe your target market and potential..."
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : startup ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
