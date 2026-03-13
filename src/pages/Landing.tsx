import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Zap, Brain } from "lucide-react";
import { motion } from "framer-motion";

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-purple-950/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PC9zdmc+')] opacity-10" />

      <nav className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
            <span className="text-2xl font-bold text-white">Invest Vault</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Connect Startups with
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {" "}
                Smart Investors
              </span>
            </h1>
            <p className="text-xl text-slate-400 mb-12 leading-relaxed">
              AI-powered fintech platform for transparent bidding, intelligent
              recommendations, and beginner-friendly financial guidance.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                to="/signup"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center space-x-2 group"
              >
                <span>Start Investing</span>
                <ArrowRight
                  className="group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </Link>
              <Link
                to="/signup"
                className="px-8 py-4 border-2 border-slate-600 hover:border-blue-500 text-slate-300 hover:text-blue-400 font-semibold rounded-lg transition-all"
              >
                Raise Funds
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 grid md:grid-cols-4 gap-6"
          >
            <FeatureCard
              icon={<TrendingUp />}
              title="Transparent Bidding"
              description="Open marketplace where investors compete with fair bids"
            />
            <FeatureCard
              icon={<Brain />}
              title="AI Recommendations"
              description="Smart matching between startups and the right investors"
            />
            <FeatureCard
              icon={<Shield />}
              title="Secure & Verified"
              description="KYC verification and secure payment processing"
            />
            <FeatureCard
              icon={<Zap />}
              title="Fast & Simple"
              description="Streamlined process from discovery to investment"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:border-blue-500/50 transition-all duration-300">
      <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
