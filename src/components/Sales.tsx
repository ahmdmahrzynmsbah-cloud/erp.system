import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

interface Sale {
  id: string;
  date: string;
  client: string;
  total: number;
  status: string;
  method: string;
}

const mockSales = [
  { id: 'INV-10023', date: '2026-05-24', client: 'مؤسسة إعمار الخليج', total: 15400, status: 'مدفوع', method: 'نقدي' },
  { id: 'INV-10024', date: '2026-05-24', client: 'شركة البناء الحديث', total: 3200, status: 'آجل', method: 'آجل (30 يوم)' },
];

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const exportToCSV = () => {
    if (sales.length === 0) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = ['رقم الفاتورة', 'التاريخ', 'العميل', 'الإجمالي', 'طريقة الدفع', 'الحالة'];
    
    // Add BOM for UTF-8 encoding so Excel reads Arabic correctly
    const BOM = '\uFEFF';
    
    const csvContent = 
      BOM +
      headers.join(',') + '\n' +
      sales.map(s => {
        return [
          s.id,
          s.date,
          `"${s.client}"`,
          s.total,
          s.method,
          s.status
        ].join(',');
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('تم تصدير سجل المبيعات بنجاح');
  };

  useEffect(() => {
    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedSales: Sale[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSales.push({ id: doc.id, ...doc.data() } as Sale);
      });
      
      if (fetchedSales.length === 0) {
        setSales(mockSales);
      } else {
        setSales(fetchedSales);
      }
    }, (error) => {
      console.error('Error fetching sales:', error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0">
        <h1 className="text-xl font-bold text-[#0f172a]">المبيعات والفواتير <span className="text-[#0ea5e9] font-normal">| سجل العمليات</span></h1>
        <div className="flex items-center gap-3">
          <button onClick={exportToCSV} className="bg-white border border-slate-200 text-[#0f172a] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            تصدير
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100 hover:shadow-none hover:-translate-y-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            فاتورة جديدة
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-[#0f172a]">إضافة فاتورة جديدة</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">اسم العميل</label>
                <input type="text" id="invClient" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الإجمالي</label>
                <input type="number" id="invTotal" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الحالة</label>
                  <select id="invStatus" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]">
                    <option value="مدفوع">مدفوع</option>
                    <option value="آجل">آجل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">طريقة الدفع</label>
                  <select id="invMethod" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]">
                    <option value="نقدي">نقدي</option>
                    <option value="آجل">آجل</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors">إلغاء</button>
              <button onClick={async () => {
                const client = (document.getElementById('invClient') as HTMLInputElement).value;
                const total = Number((document.getElementById('invTotal') as HTMLInputElement).value);
                const status = (document.getElementById('invStatus') as HTMLSelectElement).value;
                const method = (document.getElementById('invMethod') as HTMLSelectElement).value;
                
                if (!client || !total) {
                  toast.error('الرجاء إدخال اسم العميل والإجمالي');
                  return;
                }
                
                const date = new Date().toISOString().split('T')[0];
                const id = 'INV-' + Math.floor(10000 + Math.random() * 90000);
                
                const inv = { id, client, total, status, method, date };
                try {
                  const { doc, setDoc } = await import('firebase/firestore');
                  await setDoc(doc(db, 'sales', id), inv);
                  setSales([inv, ...sales]);
                  toast.success('تم إنشاء الفاتورة بنجاح');
                  setIsAddModalOpen(false);
                } catch(e) {
                  toast.error('حدث خطأ أثناء الحفظ');
                }
              }} className="px-4 py-2 bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] font-bold text-sm shadow-md transition-all">حفظ الفاتورة</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="text-xs text-slate-500 font-bold mb-1">مبيعات اليوم</div>
          <div className="text-2xl font-bold text-[#0f172a]">18,600 <span className="text-xs font-normal text-slate-400">ج.م</span></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="text-xs text-slate-500 font-bold mb-1">مبيعات الشهر</div>
          <div className="text-2xl font-bold text-[#0f172a]">452,000 <span className="text-xs font-normal text-slate-400">ج.م</span></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="text-xs text-slate-500 font-bold mb-1">مستحقات آجلة</div>
          <div className="text-2xl font-bold text-orange-500">124,500 <span className="text-xs font-normal text-slate-400">ج.م</span></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="text-xs text-slate-500 font-bold mb-1">فواتير اليوم</div>
          <div className="text-2xl font-bold text-[#0ea5e9]">24 <span className="text-xs font-normal text-slate-400">فاتورة</span></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 hover:shadow-md transition-shadow duration-300">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shrink-0">
          <div className="relative w-full sm:w-[400px]">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '18px' }}>search</span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الفاتورة أو اسم العميل..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-slate-700 shadow-sm hover:shadow-md focus:shadow-md"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-slate-500 w-full sm:w-auto hover:text-[#0f172a] px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center gap-2 text-sm font-semibold transition-all hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">جميع الحالات</option>
            <option value="مدفوع">مدفوع</option>
            <option value="آجل">آجل</option>
            <option value="ملغي">ملغي</option>
          </select>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-right text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-sm">
              <tr className="border-b border-slate-100">
                <th className="p-4 font-bold">رقم الفاتورة</th>
                <th className="p-4 font-bold">التاريخ</th>
                <th className="p-4 font-bold">العميل</th>
                <th className="p-4 font-bold">الإجمالي</th>
                <th className="p-4 font-bold">طريقة الدفع</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.filter(invoice => {
                const matchesSearch = invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
                return matchesSearch && matchesStatus;
              }).map((invoice, i) => (
                <tr key={invoice.id || i} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="p-4 font-mono text-[#0ea5e9] font-bold group-hover:text-blue-600 transition-colors">{invoice.id.length > 10 ? `INV-${invoice.id.substring(0, 6).toUpperCase()}` : invoice.id}</td>
                  <td className="p-4 text-slate-500">{new Date(invoice.date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-4 font-semibold text-[#0f172a] group-hover:text-[#0ea5e9] transition-colors">{invoice.client}</td>
                  <td className="p-4 font-bold text-[#0f172a]">{Number(invoice.total).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span></td>
                  <td className="p-4 text-slate-600 text-xs">{invoice.method}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                      invoice.status === 'مدفوع' ? 'bg-green-50 text-green-600 border-green-100' : 
                      invoice.status === 'آجل' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success(`جاري عرض الفاتورة ${invoice.id}...`);
                        // In a real app, this would open a modal with invoice details
                        setTimeout(() => window.print(), 1000);
                      }}
                      className="text-slate-400 hover:text-[#0ea5e9] transition-colors hover:scale-110"
                      title="عرض وطباعة"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>description</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
