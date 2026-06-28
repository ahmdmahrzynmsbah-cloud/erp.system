import React from 'react';
import { toast } from 'sonner';

export default function Reports() {
  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0">
        <h1 className="text-xl font-bold text-[#0f172a]">التقارير المالية والتحليلية <span className="text-[#0ea5e9] font-normal">| أداء النظام</span></h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-slate-400 ml-2" style={{ fontSize: '16px' }}>calendar_month</span>
            <select className="bg-transparent border-none outline-none font-bold text-[#0f172a] cursor-pointer">
              <option>هذا الشهر (مايو 2026)</option>
              <option>الشهر الماضي</option>
              <option>الربع الأول 2026</option>
              <option>السنة الحالية</option>
            </select>
          </div>
          <button onClick={() => {
            toast.success('جاري تجهيز التقرير للطباعة...');
            setTimeout(() => window.print(), 1000);
          }} className="bg-[#0f172a] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            تصدير PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 text-slate-500 mb-4 font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-green-500" style={{ fontSize: '16px' }}>trending_up</span> إجمالي الإيرادات
          </div>
          <div className="text-4xl font-light text-[#0f172a] mb-2">1,245,000 <span className="text-base font-normal text-slate-400">ج.م</span></div>
          <div className="text-sm font-bold text-green-500 bg-green-50 self-start px-2 py-1 rounded border border-green-100">+15.4% عن الشهر السابق</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-2 text-slate-500 mb-4 font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-red-500" style={{ fontSize: '16px', transform: 'scaleY(-1)' }}>trending_down</span> إجمالي المصروفات والمشتريات
          </div>
          <div className="text-4xl font-light text-[#0f172a] mb-2">840,000 <span className="text-base font-normal text-slate-400">ج.م</span></div>
          <div className="text-sm font-bold text-red-500 bg-red-50 self-start px-2 py-1 rounded border border-red-100">+5.2% عن الشهر السابق</div>
        </div>
        <div className="bg-[#0ea5e9] p-6 rounded-2xl shadow-lg shadow-blue-100 flex flex-col text-white relative overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 font-bold text-xs uppercase tracking-wider opacity-90">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bar_chart</span> صافي الربح التقديري
            </div>
            <div className="text-4xl font-bold mb-2">405,000 <span className="text-base font-normal opacity-80">ج.م</span></div>
            <div className="text-sm font-bold opacity-90">هامش الربح: 32.5%</div>
          </div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <h3 className="font-bold text-[#0f172a] mb-6">قائمة التقارير المتاحة</h3>
          <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-2">
            {[
              { name: 'تقرير المبيعات التفصيلي', desc: 'مبيعات يومية، أسبوعية، شهرية مع الأصناف' },
              { name: 'تقرير حركة المخزون', desc: 'وارد، صادر، تالف، جرد ورصيد' },
              { name: 'كشف حساب عميل/مورد', desc: 'الحركات المالية والتسويات' },
              { name: 'تقرير الضرائب (ضريبة القيمة المضافة)', desc: 'لتقديم الإقرارات الضريبية' },
              { name: 'تقرير الأرباح والخسائر', desc: 'قائمة الدخل المبسطة' },
              { name: 'تقرير نواقص المخزون', desc: 'الأصناف التي وصلت لحد الطلب' },
            ].map((report, idx) => (
              <div key={idx} className="p-4 border border-slate-100 rounded-xl hover:border-[#0ea5e9] hover:bg-slate-50 transition-all cursor-pointer group flex justify-between items-center">
                <div>
                  <div className="font-bold text-[#0f172a] text-sm group-hover:text-[#0ea5e9] transition-colors">{report.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{report.desc}</div>
                </div>
                <button className="text-slate-400 group-hover:text-[#0ea5e9] transition-colors group-hover:scale-110">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <h3 className="font-bold text-[#0f172a] mb-6 flex items-center justify-between">
            المبيعات حسب الفئة (أعلى 5)
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>pie_chart</span>
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-6">
            {[
              { name: 'حديد التسليح والصلب', percentage: 45, color: 'bg-[#0f172a]' },
              { name: 'الأسمنت ومواد البناء', percentage: 25, color: 'bg-[#0ea5e9]' },
              { name: 'الأدوات الكهربائية', percentage: 15, color: 'bg-indigo-500' },
              { name: 'أدوات السباكة', percentage: 10, color: 'bg-teal-500' },
              { name: 'الدهانات والمواد الكيميائية', percentage: 5, color: 'bg-orange-500' },
            ].map((cat, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-slate-700 group-hover:text-[#0ea5e9] transition-colors">{cat.name}</span>
                  <span className="font-bold text-slate-500">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`${cat.color} h-2 rounded-full transition-all duration-1000 ease-out group-hover:opacity-80`} style={{ width: `${cat.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
