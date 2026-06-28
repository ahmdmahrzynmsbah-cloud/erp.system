import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CompanySettings {
  nameAr: string;
  nameEn: string;
  vatNumber: string;
  crNumber: string;
  address: string;
}

interface InvoiceSettings {
  prefix: string;
  taxRate: string;
  notes: string;
}

const defaultCompany: CompanySettings = {
  nameAr: 'نظام الفارس للتوريدات',
  nameEn: 'Al-Fares Supplies',
  vatNumber: '300123456700003',
  crNumber: '1010123456',
  address: 'المملكة العربية السعودية - الرياض - حي الملز - شارع الستين'
};

const defaultInvoice: InvoiceSettings = {
  prefix: 'INV-',
  taxRate: '15',
  notes: 'البضاعة المباعة لا ترد ولا تستبدل بعد 14 يوم.'
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'company' | 'invoice' | 'users' | 'backup'>('company');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompany);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoice);

  useEffect(() => {
    const storedCompany = localStorage.getItem('erp_company_settings');
    if (storedCompany) setCompanySettings(JSON.parse(storedCompany));
    
    const storedInvoice = localStorage.getItem('erp_invoice_settings');
    if (storedInvoice) setInvoiceSettings(JSON.parse(storedInvoice));
  }, []);

  const handleSave = () => {
    if (activeTab === 'company') {
      localStorage.setItem('erp_company_settings', JSON.stringify(companySettings));
      toast.success('تم حفظ بيانات الشركة بنجاح');
    } else if (activeTab === 'invoice') {
      localStorage.setItem('erp_invoice_settings', JSON.stringify(invoiceSettings));
      toast.success('تم حفظ إعدادات الفواتير بنجاح');
    }
  };

  const tabs = [
    { id: 'company', label: 'بيانات الشركة والفروع', icon: 'storefront' },
    { id: 'invoice', label: 'إعدادات الفواتير والضرائب', icon: 'receipt_long' },
    { id: 'users', label: 'المستخدمين والصلاحيات', icon: 'group' },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: 'backup' }
  ] as const;

  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0">
        <h1 className="text-xl font-bold text-[#0f172a]">إعدادات النظام <span className="text-[#0ea5e9] font-normal">| التكوين الأساسي</span></h1>
        <button onClick={handleSave} className="bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
          حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${activeTab === tab.id ? 'bg-[#0ea5e9] text-white shadow-md shadow-blue-100 hover:-translate-y-0.5' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:-translate-y-0.5 hover:shadow-sm'} p-4 rounded-xl font-bold flex items-center gap-3 cursor-pointer transition-all`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span> {tab.label}
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-8 hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-bold text-[#0f172a] mb-6 border-b border-slate-100 pb-4">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          
          {activeTab === 'company' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">اسم الشركة (عربي)</label>
                  <input type="text" value={companySettings.nameAr} onChange={e => setCompanySettings({...companySettings, nameAr: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-bold hover:border-slate-300 focus:shadow-sm" />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">اسم الشركة (إنجليزي)</label>
                  <input type="text" value={companySettings.nameEn} onChange={e => setCompanySettings({...companySettings, nameEn: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-bold hover:border-slate-300 focus:shadow-sm" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">الرقم الضريبي (VAT)</label>
                  <input type="text" value={companySettings.vatNumber} onChange={e => setCompanySettings({...companySettings, vatNumber: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-mono font-bold hover:border-slate-300 focus:shadow-sm" />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">رقم السجل التجاري</label>
                  <input type="text" value={companySettings.crNumber} onChange={e => setCompanySettings({...companySettings, crNumber: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-mono font-bold hover:border-slate-300 focus:shadow-sm" />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">العنوان الوطني</label>
                <textarea rows={3} value={companySettings.address} onChange={e => setCompanySettings({...companySettings, address: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-bold resize-none hover:border-slate-300 focus:shadow-sm"></textarea>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">بادئة الفواتير (Prefix)</label>
                  <input type="text" value={invoiceSettings.prefix} onChange={e => setInvoiceSettings({...invoiceSettings, prefix: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-mono font-bold hover:border-slate-300 focus:shadow-sm" dir="ltr" />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">نسبة الضريبة (%)</label>
                  <input type="number" value={invoiceSettings.taxRate} onChange={e => setInvoiceSettings({...invoiceSettings, taxRate: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-bold hover:border-slate-300 focus:shadow-sm" />
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#0ea5e9] transition-colors">ملاحظات الفاتورة الافتراضية</label>
                <textarea rows={3} value={invoiceSettings.notes} onChange={e => setInvoiceSettings({...invoiceSettings, notes: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-[#0f172a] font-bold resize-none hover:border-slate-300 focus:shadow-sm"></textarea>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 animate-fade-in-up">
              <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">group_off</span>
              <p className="font-bold">إدارة المستخدمين غير مفعلة في النسخة التجريبية</p>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 animate-fade-in-up">
              <span className="material-symbols-outlined text-6xl mb-4 text-slate-300">cloud_off</span>
              <p className="font-bold">النسخ الاحتياطي السحابي يتطلب الترقية للباقة المتقدمة</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
