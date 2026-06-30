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

interface RoleSettings {
  name: string;
  description: string;
  permissions: Record<string, boolean>;
}

const defaultCompany: CompanySettings = {
  nameAr: 'سيستم POS',
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

const defaultRole: RoleSettings = {
  name: '',
  description: '',
  permissions: {}
};

const permissionModules = [
  {
    id: 'dashboard',
    title: 'لوحة التحكم',
    icon: 'dashboard',
    permissions: [
      { id: 'dashboard_view', label: 'عرض لوحة التحكم' },
    ]
  },
  {
    id: 'inventory',
    title: 'المخزون',
    icon: 'inventory_2',
    permissions: [
      { id: 'inventory_view', label: 'عرض المخزون' },
      { id: 'inventory_add_edit', label: 'إضافة/تعديل المنتجات' },
      { id: 'inventory_delete', label: 'حذف المنتجات' },
      { id: 'inventory_categories', label: 'إدارة التصنيفات' },
    ]
  },
  {
    id: 'pos',
    title: 'نقطة البيع (POS)',
    icon: 'storefront',
    permissions: [
      { id: 'pos_access', label: 'الدخول لنقطة البيع' },
      { id: 'pos_place_orders', label: 'إنشاء طلبات' },
      { id: 'pos_custom_discounts', label: 'تطبيق خصومات مخصصة' },
      { id: 'pos_refunds', label: 'إصدار مرتجعات' },
    ]
  },
  {
    id: 'sales',
    title: 'المبيعات',
    icon: 'shopping_cart',
    permissions: [
      { id: 'sales_view', label: 'عرض قائمة المبيعات' },
      { id: 'sales_process', label: 'تحديث حالة المبيعات' },
      { id: 'sales_delete', label: 'حذف المبيعات' },
    ]
  },
  {
    id: 'crm',
    title: 'العملاء والموردين',
    icon: 'group',
    permissions: [
      { id: 'crm_view', label: 'عرض العملاء والموردين' },
      { id: 'crm_add_edit', label: 'إضافة/تعديل عملاء وموردين' },
      { id: 'crm_delete', label: 'حذف عملاء وموردين' },
    ]
  },
  {
    id: 'reports',
    title: 'التقارير',
    icon: 'description',
    permissions: [
      { id: 'reports_view', label: 'عرض التقارير' },
      { id: 'reports_export', label: 'تصدير التقارير' },
    ]
  },
  {
    id: 'ai',
    title: 'المساعد الذكي (AI)',
    icon: 'smart_toy',
    permissions: [
      { id: 'ai_access', label: 'استخدام المساعد الذكي' },
    ]
  },
  {
    id: 'settings',
    title: 'الإعدادات',
    icon: 'settings',
    permissions: [
      { id: 'settings_view', label: 'عرض الإعدادات العامة' },
      { id: 'settings_roles', label: 'إدارة الصلاحيات والأدوار' },
    ]
  }
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'company' | 'invoice' | 'users' | 'backup' | 'roles'>('company');
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompany);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoice);
  const [roleSettings, setRoleSettings] = useState<RoleSettings>(defaultRole);
  const [expandedModule, setExpandedModule] = useState<string | null>(permissionModules[0].id);

  useEffect(() => {
    const storedCompany = localStorage.getItem('erp_company_settings');
    if (storedCompany) setCompanySettings(JSON.parse(storedCompany));
    
    const storedInvoice = localStorage.getItem('erp_invoice_settings');
    if (storedInvoice) setInvoiceSettings(JSON.parse(storedInvoice));
    
    const storedRole = localStorage.getItem('erp_role_settings');
    if (storedRole) setRoleSettings(JSON.parse(storedRole));
  }, []);

  const handleSave = () => {
    if (activeTab === 'company') {
      localStorage.setItem('erp_company_settings', JSON.stringify(companySettings));
      toast.success('تم حفظ بيانات الشركة بنجاح');
    } else if (activeTab === 'invoice') {
      localStorage.setItem('erp_invoice_settings', JSON.stringify(invoiceSettings));
      toast.success('تم حفظ إعدادات الفواتير بنجاح');
    } else if (activeTab === 'roles') {
      localStorage.setItem('erp_role_settings', JSON.stringify(roleSettings));
      toast.success('تم حفظ الصلاحية بنجاح');
    }
  };

  const togglePermission = (id: string) => {
    setRoleSettings(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [id]: !prev.permissions[id]
      }
    }));
  };

  const toggleModulePermissions = (moduleId: string) => {
    const modulePerms = permissionModules.find(m => m.id === moduleId)?.permissions || [];
    const allEnabled = modulePerms.every(p => roleSettings.permissions[p.id]);
    
    const newPermissions = { ...roleSettings.permissions };
    modulePerms.forEach(p => {
      newPermissions[p.id] = !allEnabled;
    });
    
    setRoleSettings(prev => ({ ...prev, permissions: newPermissions }));
  };

  const checkAllPermissions = () => {
    const newPermissions: Record<string, boolean> = {};
    permissionModules.forEach(m => {
      m.permissions.forEach(p => {
        newPermissions[p.id] = true;
      });
    });
    setRoleSettings(prev => ({ ...prev, permissions: newPermissions }));
  };

  const uncheckAllPermissions = () => {
    setRoleSettings(prev => ({ ...prev, permissions: {} }));
  };

  const tabs = [
    { id: 'company', label: 'بيانات الشركة والفروع', icon: 'storefront' },
    { id: 'invoice', label: 'إعدادات الفواتير والضرائب', icon: 'receipt_long' },
    { id: 'users', label: 'المستخدمين والصلاحيات', icon: 'group' },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: 'backup' },
    { id: 'roles', label: 'تفاصيل الصلاحية (Role Details)', icon: 'admin_panel_settings' }
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

          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in-up">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-[#0f172a] flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-[#0ea5e9]">admin_panel_settings</span>
                    تفاصيل الصلاحية
                  </h3>
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">اسم الصلاحية</label>
                      <input type="text" value={roleSettings.name} onChange={e => setRoleSettings({...roleSettings, name: e.target.value})} placeholder="مثال: مدير" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] transition-all text-[#0f172a] font-bold" />
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">الوصف / الغرض</label>
                      <textarea rows={4} value={roleSettings.description} onChange={e => setRoleSettings({...roleSettings, description: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] transition-all text-[#0f172a] font-bold resize-none"></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f172a]">مصفوفة الصلاحيات</h3>
                    <p className="text-sm text-slate-500 mt-1">قم بتفعيل المفاتيح لمنح الصلاحيات للإجراءات في كل قسم.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={checkAllPermissions} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-all shadow-sm">تحديد الكل</button>
                    <button type="button" onClick={uncheckAllPermissions} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#0f172a] hover:bg-slate-50 transition-all shadow-sm">إلغاء تحديد الكل</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {permissionModules.map(module => {
                    const isExpanded = expandedModule === module.id;
                    return (
                      <div key={module.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-slate-300 transition-colors shadow-sm">
                        <div 
                          className="px-5 py-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-[#0ea5e9] text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200'}`}>
                              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{module.icon}</span>
                            </div>
                            <span className={`font-bold transition-colors ${isExpanded ? 'text-[#0ea5e9]' : 'text-[#0f172a]'}`}>{module.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleModulePermissions(module.id); }} 
                              className="text-xs font-bold text-slate-500 hover:text-[#0ea5e9] transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                            >
                              تحديد القسم
                            </button>
                            <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                          </div>
                        </div>
                        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                          <div className="p-5 space-y-4 bg-white border-t border-slate-100">
                            {module.permissions.map(perm => (
                              <div key={perm.id} className="flex items-center justify-between group">
                                <span className="text-sm font-semibold text-slate-600 group-hover:text-[#0f172a] transition-colors cursor-pointer" onClick={() => togglePermission(perm.id)}>{perm.label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={!!roleSettings.permissions[perm.id]}
                                    onChange={() => togglePermission(perm.id)}
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ea5e9]"></div>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
