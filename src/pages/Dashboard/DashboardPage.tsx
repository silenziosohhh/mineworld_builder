import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useWorldStore } from '../../store/worldStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Box, User, Shield, Clock, Globe, Settings, LogOut, Menu, X, ChevronRight, Heart, MessageSquare, ChevronDown, Bell } from 'lucide-react';
import { CreateProjectModal } from './components/CreateProjectModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { blocks } = useWorldStore();
  const blocksCount = Object.keys(blocks).length;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'overworld' | 'my-worlds' | 'settings'>('overworld');

  // Dati mock per i mondi pubblici (Overworld)
  const publicWorlds = [
    { id: 1, name: "Medieval Kingdom", author: "BuilderSteve", blocks: 4520, likes: 128, color: "bg-amber-500" },
    { id: 2, name: "Cyberpunk City", author: "NeonArtist", blocks: 8900, likes: 342, color: "bg-purple-500" },
    { id: 3, name: "Floating Islands", author: "SkyWalker", blocks: 2100, likes: 89, color: "bg-sky-500" },
    { id: 4, name: "Pixel Art Gallery", author: "ArtVoxel", blocks: 1200, likes: 56, color: "bg-pink-500" },
    { id: 5, name: "Survival Base", author: "CrafterPro", blocks: 3400, likes: 210, color: "bg-emerald-500" },
    { id: 6, name: "Redstone Lab", author: "TechMaster", blocks: 5600, likes: 175, color: "bg-red-500" },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overworld':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Overworld</h1>
              <p className="text-gray-500 mt-1">Explore public worlds created by the community</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicWorlds.map((world) => (
                <Card key={world.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 group overflow-hidden">
                  <div className={`h-32 ${world.color} relative`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{world.name}</h3>
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {world.blocks} blocks
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">by <span className="font-semibold text-gray-700">{world.author}</span></p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex space-x-4 text-gray-400">
                        <div className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                          <Heart className="h-4 w-4" />
                          <span className="text-xs font-medium">{world.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-medium">12</span>
                        </div>
                      </div>
                      <Button variant="secondary" className="h-8 text-xs">Visit</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'my-worlds':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Worlds</h1>
                <p className="text-gray-500 mt-1">Manage your personal creations</p>
              </div>
              <Button onClick={() => setCreateModalOpen(true)} className="shadow-lg shadow-blue-500/20">
                <Plus className="h-4 w-4 mr-2" />
                New World
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="p-6 flex items-center space-x-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Box className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Blocks</p>
                  <h3 className="text-2xl font-bold text-gray-900">{blocksCount}</h3>
                </div>
              </Card>
              
              <Card className="p-6 flex items-center space-x-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Active</p>
                  <h3 className="text-2xl font-bold text-gray-900">Just now</h3>
                </div>
              </Card>

              <Card className="p-6 flex items-center space-x-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-green-50 rounded-xl">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <h3 className="text-2xl font-bold text-gray-900">Active</h3>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Current Active World Card */}
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 group h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-600 transition-colors duration-300">
                      <Box className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">My Creative World</h3>
                  <p className="text-gray-500 text-sm mb-6 flex-grow">
                    {blocksCount} blocks placed • Last edited just now
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <Link to="/builder" className="block w-full">
                      <div className="flex items-center justify-between text-blue-600 font-medium hover:text-blue-700 transition-colors">
                        <span>Continue Building</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Create New World Card */}
              <button onClick={() => setCreateModalOpen(true)} className="block w-full h-full text-left group">
                <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer bg-gray-50/30 min-h-[250px]">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 group-hover:shadow-md transition-all">
                    <Plus className="h-8 w-8" />
                  </div>
                  <span className="font-bold text-lg">Create New World</span>
                  <p className="text-sm text-gray-400 mt-2">Start fresh with an empty map</p>
                </div>
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
            <Card className="p-8 text-center text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Global settings will be available here.</p>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Bar (Horizontal) */}
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shadow-md z-50 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Box className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">MineWorld</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
            </button>
          </div>

          {/* User Profile in Top Bar */}
          <div className="hidden md:flex items-center pl-4 border-l border-slate-800">
            <button className="flex items-center gap-3 group">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 p-[2px] shadow-lg shadow-violet-500/20">
                  <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-white group-hover:text-violet-400 transition-colors">{user?.username || 'Guest'}</span>
                <span className="text-[10px] text-slate-400 font-medium">Master Builder</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors ml-1" />
            </button>
          </div>

          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-400 hover:text-white">
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          absolute inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col border-t border-slate-800
        `}>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Menu</div>
            
            <button 
              onClick={() => { setActiveView('overworld'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'overworld' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Globe className="h-5 w-5" />
              <span className="font-medium">Overworld</span>
            </button>

            <button 
              onClick={() => { setActiveView('my-worlds'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'my-worlds' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Box className="h-5 w-5" />
              <span className="font-medium">My Worlds</span>
            </button>

            <button 
              onClick={() => { setActiveView('settings'); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${activeView === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <Button variant="secondary" className="w-full justify-start text-xs h-8 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white">
              <LogOut className="h-3 w-3 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          {renderContent()}
          
          {/* Footer inside the section */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-400 text-sm pb-4">
            <p>&copy; 2024 MineWorld Builder. All rights reserved.</p>
          </div>
        </main>
      </div>

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};
