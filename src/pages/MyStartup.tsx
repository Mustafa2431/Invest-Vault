import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { supabase, Startup } from "../lib/supabase";

export function MyStartup() {
  const { profile } = useAuth();

  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
    tagline: "",
    description: "",
    industry: "Technology",
    stage: "idea",
    location: "",
    website: "",
    funding_goal: "",
    valuation: "",
    equity_offered: "",
    revenue: "",
    monthly_growth: "",
    team_size: "1",
    business_model: "",
    market_size: "",
  });

  useEffect(() => {
    if (profile) {
      loadStartups();
    }
  }, [profile]);

  const loadStartups = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("startups")
      .select("*")
      .eq("founder_id", profile.id);

    if (data) {
      setStartups(data);
    }

    setLoading(false);
  };

  const handleEdit = (startup: Startup) => {
    setEditingStartup(startup);

    setFormData({
      company_name: startup.company_name,
      tagline: startup.tagline || "",
      description: startup.description,
      industry: startup.industry,
      stage: startup.stage,
      location: startup.location || "",
      website: startup.website || "",
      funding_goal: startup.funding_goal.toString(),
      valuation: startup.valuation.toString(),
      equity_offered: startup.equity_offered?.toString() || "",
      revenue: startup.revenue?.toString() || "",
      monthly_growth: startup.monthly_growth?.toString() || "",
      team_size: startup.team_size?.toString() || "1",
      business_model: startup.business_model || "",
      market_size: startup.market_size || "",
    });
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

        equity_offered: formData.equity_offered
          ? parseFloat(formData.equity_offered)
          : null,

        revenue: parseFloat(formData.revenue || "0"),
        monthly_growth: parseFloat(formData.monthly_growth || "0"),

        team_size: parseInt(formData.team_size),

        status: "active",
      };

      if (editingStartup) {
        const { error } = await supabase
          .from("startups")
          .update(startupData)
          .eq("id", editingStartup.id);

        if (error) throw error;

        alert("Startup updated successfully!");
      } else {
        const { error } = await supabase.from("startups").insert(startupData);

        if (error) throw error;

        alert("Startup added successfully!");
      }

      setEditingStartup(null);

      setFormData({
        company_name: "",
        tagline: "",
        description: "",
        industry: "Technology",
        stage: "idea",
        location: "",
        website: "",
        funding_goal: "",
        valuation: "",
        equity_offered: "",
        revenue: "",
        monthly_growth: "",
        team_size: "1",
        business_model: "",
        market_size: "",
      });

      loadStartups();
    } catch (error) {
      console.error(error);
      alert("Failed to save startup");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-10">
        {/* STARTUPS LIST */}

        <div>
          <h1 className="text-3xl font-bold text-white mb-6">My Startups</h1>

          {startups.length === 0 && (
            <p className="text-slate-400">No startups created yet.</p>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {startups.map((s) => (
              <Card key={s.id} className="p-5">
                <h3 className="text-lg text-white font-semibold">
                  {s.company_name}
                </h3>

                <p className="text-slate-400">{s.tagline}</p>

                <div className="text-sm text-slate-500 mt-2">
                  Stage: {s.stage} • Industry: {s.industry}
                </div>

                <div className="text-sm text-slate-400 mt-3 space-y-1">
                  <p>Revenue: ${s.revenue}</p>
                  <p>Monthly Growth: {s.monthly_growth}%</p>
                  <p>Team Size: {s.team_size}</p>
                </div>

                <Button
                  onClick={() => handleEdit(s)}
                  className="mt-4"
                  size="sm"
                >
                  Edit
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* CREATE / EDIT FORM */}

        <Card className="p-8 space-y-6">
          <h2 className="text-2xl text-white font-bold">
            {editingStartup ? "Edit Startup" : "Add New Startup"}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Company Name"
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
            />

            <Input
              label="Tagline"
              value={formData.tagline}
              onChange={(e) =>
                setFormData({ ...formData, tagline: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Description</label>

            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Business Model"
              value={formData.business_model}
              onChange={(e) =>
                setFormData({ ...formData, business_model: e.target.value })
              }
            />

            <Input
              label="Market Size"
              value={formData.market_size}
              onChange={(e) =>
                setFormData({ ...formData, market_size: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Select
              label="Industry"
              value={formData.industry}
              options={[
                { value: "Technology", label: "Technology" },
                { value: "Healthcare", label: "Healthcare" },
                { value: "Finance", label: "Finance" },
                { value: "E-commerce", label: "E-commerce" },
              ]}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
            />

            <Select
              label="Stage"
              value={formData.stage}
              options={[
                { value: "idea", label: "Idea" },
                { value: "mvp", label: "MVP" },
                { value: "growth", label: "Growth" },
              ]}
              onChange={(e) =>
                setFormData({ ...formData, stage: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Input
              label="Funding Goal ($)"
              type="number"
              value={formData.funding_goal}
              onChange={(e) =>
                setFormData({ ...formData, funding_goal: e.target.value })
              }
            />

            <Input
              label="Valuation ($)"
              type="number"
              value={formData.valuation}
              onChange={(e) =>
                setFormData({ ...formData, valuation: e.target.value })
              }
            />

            <Input
              label="Equity Offered (%)"
              type="number"
              value={formData.equity_offered}
              onChange={(e) =>
                setFormData({ ...formData, equity_offered: e.target.value })
              }
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Input
              label="Team Size"
              type="number"
              value={formData.team_size}
              onChange={(e) =>
                setFormData({ ...formData, team_size: e.target.value })
              }
            />

            <Input
              label="Revenue ($)"
              type="number"
              value={formData.revenue}
              onChange={(e) =>
                setFormData({ ...formData, revenue: e.target.value })
              }
            />

            <Input
              label="Monthly Growth (%)"
              type="number"
              value={formData.monthly_growth}
              onChange={(e) =>
                setFormData({ ...formData, monthly_growth: e.target.value })
              }
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving
              ? "Saving..."
              : editingStartup
                ? "Update Startup"
                : "Create Startup"}
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
