'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Building2, Package, FileText, Settings, LogOut, Users } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Firms', href: '/firms', icon: Building2 },
    { name: 'Item Master', href: '/items', icon: Package },
    { name: 'Templates', href: '/templates', icon: Settings },
    { name: 'All Quotes', href: '/quotes', icon: FileText },
    { name: 'User Management', href: '/users', icon: Users },
    { name: 'Reports', href: '/reports', icon: LayoutDashboard },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-6 shadow-2xl z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg">Q</div>
          <h2 className="text-xl font-bold tracking-tight">QuoteForge</h2>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all text-slate-300 hover:text-white group"
            >
              <item.icon className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        {children}
      </main>
    </div>
  );
}
