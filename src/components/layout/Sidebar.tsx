import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  Wallet,
  Users,
  FileCheck,
  Brain
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

export function Sidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={20} />,
      roles: ['investor', 'startup', 'admin'],
    },
    {
      label: 'Discover Startups',
      path: '/discover',
      icon: <Building2 size={20} />,
      roles: ['investor'],
    },
    {
      label: 'Portfolio',
      path: '/portfolio',
      icon: <Wallet size={20} />,
      roles: ['investor'],
    },
    {
      label: 'My Startup',
      path: '/my-startup',
      icon: <Building2 size={20} />,
      roles: ['startup'],
    },
    {
      label: 'Bids',
      path: '/bids',
      icon: <TrendingUp size={20} />,
      roles: ['investor', 'startup'],
    },
    {
      label: 'AI Assistant',
      path: '/ai-assistant',
      icon: <Brain size={20} />,
      roles: ['investor', 'startup'],
    },
    {
      label: 'Messages',
      path: '/messages',
      icon: <MessageSquare size={20} />,
      roles: ['investor', 'startup'],
    },
    {
      label: 'Verification',
      path: '/verification',
      icon: <FileCheck size={20} />,
      roles: ['investor', 'startup'],
    },
    {
      label: 'Admin Panel',
      path: '/admin',
      icon: <Users size={20} />,
      roles: ['admin'],
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <Settings size={20} />,
      roles: ['investor', 'startup', 'admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    profile ? item.roles.includes(profile.role) : false
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
          <span className="text-xl font-bold text-white">Invest Vault</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={signOut}
          className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
