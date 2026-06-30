import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { toast } from 'sonner';

export default function Dashboard({ role, setActiveTab }: { role: UserRole, setActiveTab?: (tab: string) => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kpis = [
    { title: 'إجمالي المبيعات (اليوم)', value: '0', unit: 'ج.م', icon: 'trending_up', color: 'text-green-600', trend: 'لا توجد بيانات', showFor: ['Admin', 'Manager', 'Accountant'] },
    { title: 'إجمالي المخزون', value: '0', unit: 'قطعة', icon: 'package_2', color: 'text-blue-600', trend: 'مستقر', showFor: ['Admin', 'Manager', 'Storekeeper'] },
    { title: 'نواقص المخزون', value: '0', unit: 'صنف', icon: 'warning', color: 'text-red-400', trend: 'لا توجد نواقص', showFor: ['Admin', 'Manager', 'Storekeeper'] },
    { title: 'عملاء جدد', value: '0', unit: 'عملاء', icon: 'group', color: 'text-[#0ea5e9]', trend: 'لا توجد بيانات', showFor: ['Admin', 'Manager'] },
  ];

  const visibleKpis = kpis.filter(kpi => kpi.showFor.includes(role));

  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h1 className="text-xl font-bold text-[#0f172a]">نظرة عامة على العمليات <span className="text-[#0ea5e9] font-normal">| لوحة التحكم</span></h1>
        <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-500 shadow-sm" dir="ltr">
          {currentTime.toLocaleDateString('en-CA')} {currentTime.toLocaleTimeString('en-US', {hour12: true, hour: '2-digit', minute:'2-digit', second: '2-digit'})}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {visibleKpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
            <span className={`material-symbols-outlined absolute left-6 top-6 opacity-10 text-6xl group-hover:scale-110 transition-transform duration-500 ${kpi.color}`}>
              {kpi.icon}
            </span>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 relative z-10">{kpi.title}</div>
            <div className="text-3xl font-light text-[#0f172a] relative z-10">
              {kpi.value} <span className="text-sm font-normal text-slate-400">{kpi.unit}</span>
            </div>
            <div className={`mt-3 text-xs font-bold ${kpi.color} relative z-10 flex items-center gap-1`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{kpi.icon}</span>
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-2 flex-1">
        {['Admin', 'Manager'].includes(role) && (
          <div className="flex-[2] bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0ea5e9]">bar_chart</span>
                أداء المبيعات (آخر 7 أيام)
              </h2>
              <button onClick={() => toast.info('جاري إعداد تقرير المبيعات...')} className="text-[#0ea5e9] text-sm font-semibold hover:translate-x-1 transition-transform">عرض التقرير ←</button>
            </div>
            <div className="flex-1 p-6 flex items-end gap-4 border-b border-slate-100 pb-4 min-h-[250px]">
              {[0, 0, 0, 0, 0, 0, 0].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div 
                    className="w-full bg-slate-100 rounded-t-md relative group-hover:bg-[#0ea5e9] transition-all duration-300"
                    style={{ height: `${height || 2}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-all duration-300 transform group-hover:-translate-y-1 z-10 pointer-events-none">
                      {height * 100} ج.م
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">0{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm shrink-0 hover:shadow-md transition-shadow duration-300">
            <h3 className="font-bold mb-4 flex items-center justify-between text-[#0f172a]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">bolt</span>
                إجراءات سريعة 
              </div>
              <span className="w-2 h-2 bg-[#0ea5e9] rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
            </h3>
            <div className="space-y-3">
              <button onClick={() => {if(setActiveTab) setActiveTab('sales')}} className="w-full py-3 bg-[#0ea5e9] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                شاشة المبيعات
              </button>
              <button onClick={() => {if(setActiveTab) setActiveTab('inventory')}} className="w-full py-3 bg-white border border-slate-200 text-[#0f172a] rounded-xl font-bold text-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>receipt_long</span>
                إدارة المخزون
              </button>
              <button onClick={() => {if(setActiveTab) setActiveTab('pos')}} className="w-full py-3 bg-white border border-slate-200 text-[#0f172a] rounded-xl font-bold text-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>point_of_sale</span>
                نقطة البيع (POS)
              </button>
            </div>
          </div>

          {['Admin', 'Manager', 'Accountant'].includes(role) && (
            <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-xl overflow-hidden relative group cursor-pointer hover:bg-slate-800 transition-colors duration-300">
              <div className="relative z-10">
                <h3 className="font-bold text-[#0ea5e9] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">campaign</span>
                  تذكير الإدارة
                </h3>
                <p className="text-xs leading-relaxed opacity-70">
                  لا توجد فواتير متأخرة حالياً. جميع الحسابات مستقرة.
                </p>
                <div className="mt-4 text-xs font-bold text-white bg-white/10 px-3 py-2 rounded-lg inline-block backdrop-blur-sm">
                  إجمالي المتأخرات: 0 ج.م
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#0ea5e9] opacity-20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
