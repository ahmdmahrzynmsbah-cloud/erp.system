import React from 'react';
import { toast } from 'sonner';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

export default function Sidebar({ activeTab, setActiveTab, role }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: 'dashboard', roles: ['Admin', 'Manager', 'Accountant'] },
    { id: 'inventory', label: 'المخزون', icon: 'inventory_2', roles: ['Admin', 'Manager', 'Storekeeper'] },
    { id: 'pos', label: 'نقطة البيع (POS)', icon: 'storefront', roles: ['Admin', 'Manager', 'Cashier'] },
    { id: 'sales', label: 'المبيعات', icon: 'shopping_cart', roles: ['Admin', 'Manager', 'Accountant', 'Cashier'] },
    { id: 'crm', label: 'العملاء والموردين', icon: 'group', roles: ['Admin', 'Manager', 'Accountant'] },
    { id: 'reports', label: 'التقارير', icon: 'description', roles: ['Admin', 'Manager', 'Accountant'] },
    { id: 'ai', label: 'المساعد الذكي (AI)', icon: 'smart_toy', roles: ['Admin', 'Manager', 'Accountant', 'Cashier', 'Storekeeper'] },
    { id: 'settings', label: 'الإعدادات', icon: 'settings', roles: ['Admin'] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-72 bg-[#0f172a] text-white flex flex-col border-l border-slate-800 fixed right-0 top-0 h-screen transition-all duration-300">
      <div className="p-8">
        <div className="text-2xl font-bold tracking-tighter text-[#0ea5e9]">سيستم POS</div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        {visibleItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'bg-[#0ea5e9] text-white font-medium translate-x-2' 
                  : 'hover:bg-slate-800 opacity-70 text-white hover:translate-x-1'
              }`}
            >
              <span className="material-symbols-outlined ml-3 opacity-80" style={{ fontSize: '20px' }}>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </div>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-slate-800 mt-auto" dir="ltr">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center relative overflow-hidden group hover:shadow-lg hover:shadow-black/20 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0ea5e9]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 relative z-10 font-sans">
            All Rights Reserved &copy; {new Date().getFullYear()}
          </div>
          <div className="text-xs text-slate-200 font-medium relative z-10 flex items-center justify-center gap-1.5 font-sans">
            Developed by <a href="https://www.facebook.com/share/1HSRJmLCAn/" target="_blank" rel="noopener noreferrer" className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-[#0ea5e9] tracking-wider text-[13px] hover:scale-105 transition-transform">Fox Tech</a>
          </div>
        </div>
      </div>
    </aside>
  );
}
