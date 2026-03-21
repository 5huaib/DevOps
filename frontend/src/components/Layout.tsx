import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, History, Search, Settings, 
  LogOut, Hexagon, ChevronDown, MonitorPlay
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 h-14 flex items-center px-6 justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
             {/* Jenkins styled Logo, but matching ForgeCI */}
            <div className="bg-blue-600 p-1.5 rounded flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <Hexagon className="h-5 w-5 text-white fill-white/20" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-100 transition-colors">ForgeCI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="relative hidden md:flex items-center bg-slate-950 border border-slate-700 rounded-md px-3 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all w-72">
            <Search className="h-4 w-4 text-slate-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search workspaces" 
              className="bg-transparent border-none focus:outline-none text-sm text-slate-200 placeholder-slate-500 w-full"
            />
          </div>
          <button className="text-slate-400 hover:text-white transition-colors" title="Settings">
              <Settings className="h-5 w-5" />
          </button>
          <div className="w-px h-5 bg-slate-700" />
          <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2 text-sm font-medium" title="Logout">
              <LogOut className="h-4 w-4" />
              <span>log out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Jenkins Left Sidebar */}
        <aside className="w-[280px] border-r border-slate-800 bg-slate-900/50 overflow-y-auto flex-shrink-0 flex flex-col p-4 gap-8">
          
          <nav className="flex flex-col gap-1.5 pt-2">
            <NavLink to="/new" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/80 transition-colors shadow-sm ${isActive ? 'bg-slate-800 text-blue-400 font-semibold ring-1 ring-blue-500/30' : 'text-slate-300'}`}>
              <Plus className="h-4 w-4" /> New Item
            </NavLink>
            <NavLink to="/history" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/80 transition-colors shadow-sm ${isActive ? 'bg-slate-800 text-blue-400 font-semibold ring-1 ring-blue-500/30' : 'text-slate-300'}`}>
              <History className="h-4 w-4" /> Build History
            </NavLink>
            <NavLink to="/nodes" className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/80 transition-colors shadow-sm ${isActive ? 'bg-slate-800 text-blue-400 font-semibold ring-1 ring-blue-500/30' : 'text-slate-300'}`}>
              <MonitorPlay className="h-4 w-4" /> Manage Nodes
            </NavLink>
          </nav>

          <div className="flex flex-col gap-5 px-1">
            {/* Build Queue */}
            <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950 shadow-sm">
                <div className="bg-slate-800/60 px-3 py-2 text-[13px] font-semibold flex justify-between items-center text-slate-200 border-b border-slate-800">
                    Build Queue <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="p-4 text-[13px] text-slate-500 flex items-center justify-center">
                    No builds in the queue.
                </div>
            </div>

            {/* Build Executor */}
            <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950 shadow-sm">
                <div className="bg-slate-800/60 px-3 py-2 text-[13px] font-semibold flex justify-between items-center text-slate-200 border-b border-slate-800">
                    Build Executor Status <span className="text-xs font-normal text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">0/2</span>
                </div>
                <div className="flex flex-col text-[13px]">
                    <div className="px-3 py-2.5 border-b border-slate-800/50 flex items-center justify-between hover:bg-slate-800/30 cursor-pointer transition-colors group">
                        <span className="font-mono text-slate-500 group-hover:text-blue-400">1</span>
                        <span className="text-slate-500 group-hover:text-slate-300">Idle</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center justify-between hover:bg-slate-800/30 cursor-pointer transition-colors group">
                        <span className="font-mono text-slate-500 group-hover:text-blue-400">2</span>
                        <span className="text-slate-500 group-hover:text-slate-300">Idle</span>
                    </div>
                </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0f18] p-6 relative">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              {children}
            </div>
        </main>
      </div>
    </div>
  );
}
