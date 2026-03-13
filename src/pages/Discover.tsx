import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { supabase, Startup } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function Discover() {
  const { user } = useAuth();

  const [startups, setStartups] = useState<Startup[]>([]);
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  const [bids, setBids] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    loadStartups();
    loadMyBids();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [searchTerm, industryFilter, stageFilter, startups]);

  /* -------- LOAD STARTUPS -------- */

  const loadStartups = async () => {
    const { data } = await supabase
      .from("startups")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (data) {
      setStartups(data);
      setFilteredStartups(data);
    }
  };

  /* -------- LOAD USER BIDS -------- */

  const loadMyBids = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bids")
      .select("startup_id")
      .eq("investor_id", user.id);

    if (data) {
      const ids = data.map((b: any) => b.startup_id);
      setBids(ids);
    }
  };

  /* -------- FILTER -------- */

  const filterStartups = () => {
    let filtered = [...startups];

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter((s) => s.industry === industryFilter);
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter((s) => s.stage === stageFilter);
    }

    setFilteredStartups(filtered);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Discover Startups
          </h1>
          <p className="text-slate-400">
            Find your next investment opportunity
          </p>
        </div>

        {/* FILTERS */}

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

        {/* STARTUPS */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup) => {
            const alreadyBid = bids.includes(startup.id);

            return (
              <Card key={startup.id} hover className="p-6">
                <div
                  onClick={() => navigate(`/startup/${startup.id}`)}
                  className="cursor-pointer"
                >
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

                  <h3 className="text-xl font-semibold text-white mb-2">
                    {startup.company_name}
                  </h3>

                  <p className="text-sm text-blue-400 mb-3">
                    {startup.industry}
                  </p>

                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                    {startup.description}
                  </p>
                </div>

                {/* BID BUTTON */}

                <div className="mt-4">
                  {alreadyBid ? (
                    <Button disabled className="w-full">
                      Bid Placed
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/startup/${startup.id}`)}
                    >
                      View Startup
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredStartups.length === 0 && (
          <Card className="p-12 text-center">
            <Filter className="text-slate-600 mx-auto mb-4" size={48} />

            <p className="text-slate-400">
              No startups found matching your criteria
            </p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
