import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export function Navigation() {
  return (
    <motion.nav
      className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-white"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <Zap className="w-7 h-7 text-blue-400" />

          <span className="text-xl font-bold bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent">
            Invest Vault
          </span>
        </Link>

        <div className="hidden md:flex gap-8">
          <Link
            to="/discover"
            className="text-muted-foreground hover:text-foreground transition"
          >
            How it Works
          </Link>
          <Link
            to="/how-it-works"
            className="text-muted-foreground hover:text-foreground transition"
          >
            About
          </Link>
          <Link
            to="/ai-assistant"
            className="text-muted-foreground hover:text-foreground transition"
          >
            AI Assistant
          </Link>
        </div>

        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-5 py-2 text-foreground border border-white/20 rounded-lg hover:border-primary/50 transition"
          >
            Sign In
          </Link>

          <Link
            to="/signup"
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition glow-effect"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
