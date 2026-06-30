import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface Client {
  id: string;
  name: string;
  type: string;
  balance: number;
  phone: string;
  email: string;
}

const mockClients: Client[] = [];

export default function CRM() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'عميل' | 'مورد'>('all');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'clients'), (querySnapshot) => {
      const fetchedClients: Client[] = [];
      querySnapshot.forEach((doc) => {
        fetchedClients.push({ id: doc.id, ...doc.data() } as Client);
      });
      
      if (fetchedClients.length === 0) {
        setClients(mockClients);
      } else {
        setClients(fetchedClients);
      }
    }, (error) => {
      console.error('Error fetching clients:', error);
    });

    return () => unsubscribe();
  }, []);

  const normalize = (text?: string) => 
    text ? text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').toLowerCase() : '';

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      normalize(client.name).includes(normalize(searchTerm)) || 
      normalize(client.phone).includes(normalize(searchTerm)) || 
      normalize(client.id).includes(normalize(searchTerm));
    const matchesType = typeFilter === 'all' || (typeFilter === 'عميل' && client.type?.includes('عميل')) || (typeFilter === 'مورد' && client.type?.includes('مورد'));
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0">
        <h1 className="text-xl font-bold text-[#0f172a]">العملاء والموردين <span className="text-[#0ea5e9] font-normal">| الدليل والحسابات</span></h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsAddModalOpen(true)} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100 hover:shadow-none hover:-translate-y-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            إضافة عميل أو مورد
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-[#0f172a]">إضافة عميل أو مورد جديد</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الاسم</label>
                <input type="text" id="clientName" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">النوع</label>
                <select id="clientType" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]">
                  <option value="عميل">عميل</option>
                  <option value="مورد">مورد</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الهاتف</label>
                  <input type="text" id="clientPhone" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">البريد الإلكتروني</label>
                  <input type="email" id="clientEmail" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" dir="ltr" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors">إلغاء</button>
              <button onClick={async () => {
                const name = (document.getElementById('clientName') as HTMLInputElement).value;
                const type = (document.getElementById('clientType') as HTMLSelectElement).value;
                const phone = (document.getElementById('clientPhone') as HTMLInputElement).value;
                const email = (document.getElementById('clientEmail') as HTMLInputElement).value;
                
                if (!name || !type) {
                  toast.error('الرجاء إدخال اسم ونوع العميل أو المورد');
                  return;
                }
                
                const id = 'C-' + Math.floor(100 + Math.random() * 900);
                const balance = 0;
                
                const client = { id, name, type, phone, email, balance };
                try {
                  const { doc, setDoc } = await import('firebase/firestore');
                  await setDoc(doc(db, 'clients', id), client);
                  setClients([client, ...clients]);
                  toast.success('تم إنشاء العميل أو المورد بنجاح');
                  setIsAddModalOpen(false);
                } catch(e) {
                  toast.error('حدث خطأ أثناء الحفظ');
                }
              }} className="px-4 py-2 bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] font-bold text-sm shadow-md transition-all">حفظ</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        <div 
          onClick={() => setTypeFilter(typeFilter === 'عميل' ? 'all' : 'عميل')}
          className={`bg-white p-6 rounded-2xl border ${typeFilter === 'عميل' ? 'border-[#0ea5e9] shadow-md' : 'border-slate-200 shadow-sm'} flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-300 group`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${typeFilter === 'عميل' ? 'bg-[#0ea5e9] text-white' : 'bg-blue-50 text-blue-500'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>group</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">العملاء</div>
            <div className="text-2xl font-bold text-[#0f172a]">{clients.filter(c => c.type.includes('عميل')).length}</div>
          </div>
          <div className="mr-auto text-left">
            <div className="text-[10px] text-slate-400 font-bold">مديونيات العملاء</div>
            <div className="text-lg font-bold text-orange-500">
              {Math.abs(clients.filter(c => c.type.includes('عميل') && c.balance < 0).reduce((acc, c) => acc + c.balance, 0)).toLocaleString()} ج.م
            </div>
          </div>
        </div>
        <div 
          onClick={() => setTypeFilter(typeFilter === 'مورد' ? 'all' : 'مورد')}
          className={`bg-white p-6 rounded-2xl border ${typeFilter === 'مورد' ? 'border-[#0ea5e9] shadow-md' : 'border-slate-200 shadow-sm'} flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-300 group`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${typeFilter === 'مورد' ? 'bg-[#0ea5e9] text-white' : 'bg-indigo-50 text-indigo-500'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>domain</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">الموردين</div>
            <div className="text-2xl font-bold text-[#0f172a]">{clients.filter(c => c.type.includes('مورد')).length}</div>
          </div>
          <div className="mr-auto text-left">
            <div className="text-[10px] text-slate-400 font-bold">مستحقات الموردين</div>
            <div className="text-lg font-bold text-red-500">
              {Math.abs(clients.filter(c => c.type.includes('مورد') && c.balance > 0).reduce((acc, c) => acc + c.balance, 0)).toLocaleString()} ج.م
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 hover:shadow-md transition-shadow duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="relative w-full sm:w-[400px]">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '18px' }}>search</span>
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الهاتف، أو الرقم الضريبي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-slate-700 shadow-sm hover:shadow-md focus:shadow-md"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setTypeFilter(typeFilter === 'عميل' ? 'all' : 'عميل')}
              className={`${typeFilter === 'عميل' ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]' : 'bg-white text-slate-500 border-slate-200 hover:text-[#0ea5e9] hover:border-[#0ea5e9] hover:bg-blue-50'} px-4 py-2 border rounded-lg text-sm font-semibold transition-all`}
            >عملاء</button>
            <button 
              onClick={() => setTypeFilter(typeFilter === 'مورد' ? 'all' : 'مورد')}
              className={`${typeFilter === 'مورد' ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]' : 'bg-white text-slate-500 border-slate-200 hover:text-[#0ea5e9] hover:border-[#0ea5e9] hover:bg-blue-50'} px-4 py-2 border rounded-lg text-sm font-semibold transition-all`}
            >موردين</button>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-right text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-sm">
              <tr className="border-b border-slate-100">
                <th className="p-4 font-bold">الكود</th>
                <th className="p-4 font-bold">الاسم</th>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">التواصل</th>
                <th className="p-4 font-bold">الرصيد المالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="p-4 font-mono text-slate-400 font-bold group-hover:text-[#0ea5e9] transition-colors">{client.id}</td>
                  <td className="p-4 font-semibold text-[#0f172a] group-hover:text-[#0ea5e9] transition-colors">{client.name}</td>
                  <td className="p-4 text-xs">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold group-hover:bg-blue-50 group-hover:text-[#0ea5e9] transition-colors">{client.type}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1 group-hover:text-slate-700 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span>
                        <span dir="ltr">{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 group-hover:text-slate-700 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mail</span>
                        <span>{client.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`font-bold ${client.balance > 0 ? 'text-red-500' : client.balance < 0 ? 'text-orange-500' : 'text-slate-500'}`}>
                      {Math.abs(client.balance).toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        {client.balance > 0 ? '(دائن - مستحق له)' : client.balance < 0 ? '(مدين - عليه)' : 'متزن'}
                      </div>
                    </div>
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
