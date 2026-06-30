import React, { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../types";

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let roleName = "مستخدم مخصص";
    let userRole: UserRole = "Admin";

    if (email === "admin@store.com") {
      roleName = "المدير العام";
      userRole = "Admin";
    } else if (email === "manager@store.com") {
      roleName = "مدير النظام";
      userRole = "Manager";
    } else if (email === "accountant@store.com") {
      roleName = "المحاسب المالي";
      userRole = "Accountant";
    } else if (email === "cashier@store.com") {
      roleName = "كاشير";
      userRole = "Cashier";
    } else if (email === "storekeeper@store.com") {
      roleName = "أمين المخزن";
      userRole = "Storekeeper";
    }

    handleAuth(email, password, roleName, userRole);
  };

  const handleAuth = async (
    emailToUse: string,
    passwordToUse: string,
    roleName: string,
    userRole: UserRole
  ) => {
    setLoading(true);
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Basic validation for demo
      if (emailToUse && passwordToUse) {
        toast.success(`تم تسجيل الدخول بصلاحية: ${roleName}`);
        onLogin(userRole);
      } else {
        toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      }
    } catch (error: any) {
      toast.error("حدث خطأ أثناء المصادقة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-4xl mx-auto my-4 px-2 sm:px-4 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-12 rounded-[24px] overflow-hidden bg-white shadow-2xl border border-slate-100 min-h-[500px]">
          {/* Right Column (Hero) */}
          <div className="col-span-12 md:col-span-5 bg-gradient-to-br from-cyan-600 via-[#0ea5e9] to-slate-900 p-8 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_50%)]"></div>
            <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-cyan-500/10 blur-2xl"></div>

            <div className="relative z-10 flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-2xl text-cyan-300">
                  inventory_2
                </span>
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">سيستم POS</h2>
                <p className="text-[10px] text-cyan-200/80 uppercase tracking-widest font-medium">
                  ERP System
                </p>
              </div>
            </div>

            <div className="relative z-10 mb-8">
              <h1 className="text-3xl font-black mb-3 leading-snug text-cyan-50">
                حلول متكاملة
                <br />
                لإدارة المبيعات والمخزون
              </h1>
              <p className="text-sm text-cyan-100/70 font-medium leading-relaxed">
                أنجز أعمالك بكفاءة عالية، تتبع أرصدتك بدقة، وأدر مبيعاتك
                وحساباتك من مكان واحد.
              </p>
            </div>

            <div className="relative z-10 text-xs font-medium text-cyan-200/60 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                verified
              </span>
              <span>الإصدار 2.0.4 | مرخص وموثق</span>
            </div>
          </div>

          {/* Left Column (Login Form) */}
          <div className="col-span-12 md:col-span-7 bg-white p-8 sm:p-10 flex flex-col justify-center relative">
            <div className="md:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-12 h-12 bg-[#0ea5e9] rounded-xl flex items-center justify-center shadow-lg shadow-sky-600/20">
                <span className="material-symbols-outlined text-3xl text-white">
                  inventory_2
                </span>
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-800">
                  سيستم POS
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  لإدارة التوريدات
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-800 mb-1.5">
                مرحباً بك مجدداً 👋
              </h2>
              <p className="text-sm text-slate-500 font-bold">
                يرجى تسجيل الدخول للمتابعة إلى لوحة التحكم
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-lg">
                      mail
                    </span>
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10 transition-all text-sm font-medium"
                    placeholder="name@example.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-lg">
                      lock
                    </span>
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10 transition-all text-sm font-medium"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#0ea5e9] focus:ring-sky-500/10 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-500">
                    تذكرني
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0ea5e9] hover:bg-sky-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 active:scale-[0.985] shadow-md shadow-sky-600/20 hover:shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <span
                    className="material-symbols-outlined animate-spin"
                    style={{ fontSize: "20px" }}
                  >
                    sync
                  </span>
                ) : (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px" }}
                  >
                    login
                  </span>
                )}
                دخول النظام
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}
