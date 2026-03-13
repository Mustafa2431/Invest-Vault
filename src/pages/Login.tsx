import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Gem, BarChart3, ArrowRight, User, Users } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleInvestorClick = () => navigate("/signup?role=investor");
  const handleFounderClick = () => navigate("/signup?role=founder");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Generate particles
  const particles = [];
  for (let i = 0; i < 12; i++) {
    particles.push(
      <motion.div
        key={i}
        className="particle"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 6 + 2}px`,
          height: `${Math.random() * 6 + 2}px`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${Math.random() * 4 + 4}s`,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />,
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative">
      {particles}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl w-full relative z-10">
        {/* Left Hero */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="hidden lg:flex flex-col justify-start space-y-12 "
        >
          <div>
            <h1 className="text-[2rem] lg:text-[4rem] font-black bg-gradient-to-r from-green-glow via-teal-light to-greenGlow bg-clip-text text-white mb-6 drop-shadow-2xl">
              Invest Vault
            </h1>
            <p className="text-2xl text-white leading-relaxed max-w-md">
              The premium platform where visionary investors meet exceptional
              startups
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 glass-card rounded-2xl">
              <div className="w-14 h-14 bg-greenGlow/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Rocket
                  className="w-7 h-7 text-green-glow-light"
                  strokeWidth={2}
                />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  Access exclusive deals
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 glass-card rounded-2xl">
              <div className="w-14 h-14 bg-teal/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gem className="w-7 h-7 text-teal-light" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">Premium dealflow</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 glass-card rounded-2xl">
              <div className="w-14 h-14 bg-greenGlow/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BarChart3
                  className="w-7 h-7 text-green-glow-light"
                  strokeWidth={2}
                />
              </div>
              <div>
                <p className="text-xl font-bold text-white">
                  Real-time analytics
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Glass Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex flex-col items-center justify-center"
        >
          <div className=" rounded-3xl p-10 shadow-2xl w-full max-w-lg border-greenGlow/20 animate-glow">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black bg-gradient-to-r from-greenGlow via-teal to-green-glow-light bg-clip-text text-transparent mb-4">
                Join Invest Vault
              </h2>
            </div>

            {/* Role Cards 
            <div className="space-y-4 mb-10">
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 500 }}
                onClick={handleInvestorClick}
                className="glass-card p-6 rounded-2xl cursor-pointer border-teal/30 hover:border-teal/50 hover:bg-teal/10 transition-colors transition-transform duration-100 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-greenGlow to-green-glow-light rounded-2xl flex items-center justify-center shadow-lg animate-glow">
                      <User
                        className="w-7 h-7 text-slate-900"
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        I'm an Investor
                      </h3>
                      <p className="text-slate-400">
                        Discover promising startups
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-greenGlow group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 500 }}
                onClick={handleFounderClick}
                className="glass-card p-6 rounded-2xl cursor-pointer border-teal/30 hover:border-teal/50 hover:bg-teal/10 transition-colors transition-transform duration-100 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal to-teal-light rounded-2xl flex items-center justify-center shadow-lg animate-glow">
                      <Users
                        className="w-7 h-7 text-slate-900"
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        I'm a Founder
                      </h3>
                      <p className="text-slate-400">
                        Raise capital for your startup
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-teal group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            </div>
                */}
            {/* Existing Login Form */}
            <div className="pt-8 border-t border-slate-700/50">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Sign in</h3>
                <p className="text-slate-400">Welcome back to Invest Vault</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm animate-pulse">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-slate-800/30 border-slate-600/50 focus:ring-greenGlow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-800/30 border-slate-600/50 focus:ring-greenGlow"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-greenGlow via-teal-light to-green-glow-light hover:from-green-glow-light hover:to-greenGlow shadow-lg shadow-greenGlow/25 hover:shadow-greenGlow/40 text-slate-900 font-bold py-4 rounded-2xl transition-all duration-300 animate-glow"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-700/30 text-center">
                <p className="text-slate-400 text-sm">
                  Already have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-teal-light hover:text-teal font-bold underline"
                  >
                    Create new
                  </Link>
                </p>
              </div>
            </div>
            {/**/}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
