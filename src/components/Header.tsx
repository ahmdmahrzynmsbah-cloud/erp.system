import React, { useState } from 'react';
import { toast } from 'sonner';
import { UserRole } from '../types';

interface HeaderProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  onLogout?: () => void;
}

export default function Header({ role, setRole, onLogout }: HeaderProps) {
  const [hasNotifications, setHasNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      if (onLogout) onLogout();
      toast.success('تم تسجيل الخروج بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const handleNotifications = () => {
    if (hasNotifications) {
      toast.info('لديك إشعارات جديدة (قيد التطوير)');
      setHasNotifications(false);
    } else {
      toast.info('لا توجد إشعارات جديدة');
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
      <div className="flex items-center w-[400px] bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-500 focus-within:bg-white focus-within:border-[#0ea5e9] focus-within:ring-1 focus-within:ring-[#0ea5e9] transition-all duration-300 shadow-sm hover:shadow-md">
        <span className="material-symbols-outlined me-3 opacity-50" style={{ fontSize: '18px' }}>search</span>
        <input 
          type="text" 
          placeholder="بحث سريع عن منتج، فاتورة، أو عميل..." 
          className="bg-transparent border-none outline-none w-full text-sm placeholder-slate-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
            {role.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">{role}</span>
            <span className="text-[10px] text-slate-400 font-semibold">متصل الآن</span>
          </div>
        </div>

        <button onClick={handleNotifications} className="relative flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 text-slate-600 rounded-full hover:bg-slate-100 hover:text-teal-600 transition-all duration-300 hover:scale-105 shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
          {hasNotifications && (
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>

        <button 
          onClick={handleLogout} 
          className="relative flex items-center justify-center w-10 h-10 bg-slate-50 border border-slate-200 text-slate-600 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300 hover:scale-105 shadow-sm"
          title="تسجيل الخروج"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
        </button>
      </div>
    </header>
  );
}
