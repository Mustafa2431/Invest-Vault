import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, RefreshCw } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { supabase, Startup } from "../lib/supabase";

export function Discover() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadStartups = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    // current_funding on the startups row is updated by Bids.tsx whenever
    // a bid is accepted — so every investor reads the exact same number.
    const { data, error } = await supabase
      .from("startups")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setStartups(data);
      setFilteredStartups(data);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadStartups();
  }, [loadStartups]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const interval = setInterval(() => loadStartups(), 30_000);
    return () => clearInterval(interval);
  }, [loadStartups]);

  // Real-time: re-fetch when any startup row changes (current_funding updated)
  useEffect(() => {
    const channel = supabase
      .channel("startups-funding-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "startups" },
        () => loadStartups(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStartups]);

  // Filter whenever search/filter state or startups list changes
  useEffect(() => {
    let filtered = [...startups];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.company_name.toLowerCase().includes(lower) ||
          s.description.toLowerCase().includes(lower) ||
          s.industry.toLowerCase().includes(lower),
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter((s) => s.industry === industryFilter);
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter((s) => s.stage === stageFilter);
    }

    setFilteredStartups(filtered);
  }, [searchTerm, industryFilter, stageFilter, startups]);

  const getFundingPercent = (startup: Startup) => {
    const goal = Number(startup.funding_goal);
    const raised = Number(startup.current_funding);
    if (!goal) return 0;
    return Math.min((raised / goal) * 100, 100);
  };

  const industries = [
    "all",
    "Technology",
    "Healthcare",
    "Finance",
    "E-commerce",
    "Education",
    "Other",
  ];
  const stages = ["all", "idea", "mvp", "early_revenue", "growth", "scale"];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Discover Startups
            </h1>
            <p className="text-slate-400">
              Find your next investment opportunity
            </p>
          </div>
          <button
            onClick={() => loadStartups(true)}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700
              text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm
              ${refreshing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <Input
              placeholder="Search startups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={industries.map((i) => ({
              value: i,
              label: i === "all" ? "All Industries" : i,
            }))}
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          />
          <Select
            options={stages.map((s) => ({
              value: s,
              label: s === "all" ? "All Stages" : s.replace("_", " "),
            }))}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          />
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="w-16 h-16 bg-slate-700 rounded-lg mb-4" />
                <div className="h-5 bg-slate-700 rounded mb-2 w-3/4" />
                <div className="h-3 bg-slate-700 rounded mb-4 w-1/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-700 rounded w-5/6" />
                </div>
                <div className="h-2 bg-slate-700 rounded-full mt-6" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredStartups.length > 0 && (
              <p className="text-sm text-slate-500 mb-4">
                Showing {filteredStartups.length} startup
                {filteredStartups.length !== 1 ? "s" : ""}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStartups.map((startup) => {
                const percent = getFundingPercent(startup);
                const raised = Number(startup.current_funding);
                const goal = Number(startup.funding_goal);

                const barColor =
                  percent >= 100
                    ? "from-green-400 to-emerald-500"
                    : percent >= 60
                      ? "from-blue-400 to-cyan-500"
                      : percent >= 30
                        ? "from-yellow-400 to-orange-400"
                        : "from-slate-500 to-slate-400";

                return (
                  <Card
                    key={startup.id}
                    hover
                    onClick={() => navigate(`/startup/${startup.id}`)}
                    className="p-6 flex flex-col"
                  >
                    {/* Logo */}
                    <div className="mb-4">
                      {startup.logo_url ? (
                        <img
                          src={startup.logo_url}
                          alt={startup.company_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                      )}
                    </div>

                    {/* Name + industry */}
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {startup.company_name}
                    </h3>
                    <p className="text-sm text-blue-400 mb-1">
                      {startup.industry}
                    </p>

                    {startup.tagline ? (
                      <p className="text-sm text-slate-400 mb-4 line-clamp-2 italic">
                        {startup.tagline}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                        {startup.description}
                      </p>
                    )}

                    {/* Metrics */}
                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Funding Goal:</span>
                        <span className="text-white font-semibold">
                          ${goal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Valuation:</span>
                        <span className="text-white font-semibold">
                          ${Number(startup.valuation).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Stage:</span>
                        <span className="text-purple-400 capitalize">
                          {startup.stage.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* ── Funding progress bar ── */}
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-slate-400">
                          Funding Progress
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            percent >= 100
                              ? "text-green-400"
                              : percent > 0
                                ? "text-blue-400"
                                : "text-slate-500"
                          }`}
                        >
                          {percent.toFixed(0)}%
                        </span>
                      </div>

                      {/* Bar track */}
                      <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                          style={{
                            width: `${Math.max(percent > 0 ? 2 : 0, percent)}%`,
                          }}
                        />
                      </div>

                      {/* Amount row */}
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-xs">
                          {raised > 0 ? (
                            <span className="text-green-400 font-medium">
                              ${raised.toLocaleString()} raised
                            </span>
                          ) : (
                            <span className="text-slate-600">$0 raised</span>
                          )}
                        </span>
                        <span className="text-xs text-slate-500">
                          of ${goal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredStartups.length === 0 && (
              <Card className="p-12 text-center">
                <Filter className="text-slate-600 mx-auto mb-4" size={48} />
                <p className="text-slate-400 text-lg mb-1">No startups found</p>
                <p className="text-slate-600 text-sm">
                  Try adjusting your search or filter criteria
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
