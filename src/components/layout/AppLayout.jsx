import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MessageSquare, BookOpen, 
  Lightbulb, Brain, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/interactions', label: 'Interactions', icon: MessageSquare },
  { path: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { path: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { path: '/analysis', label: 'AI Analysis', icon: Brain },
];

export default function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        flex flex-col bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`flex items-center h-16 border-b border-gray-100 px-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 tracking-tight">NBA Platform</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-violet-50 text-violet-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-violet-600' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-3 flex-shrink-0">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}