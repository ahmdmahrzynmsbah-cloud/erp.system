import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { UserRole } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import AIChat from './components/AIChat';
import POS from './components/POS';
import Sales from './components/Sales';
import CRM from './components/CRM';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';

export default function App() {
  const [role, setRole] = useState<UserRole>('Admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check local storage for mock auth session
    const storedAuth = localStorage.getItem('erp_auth_session');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.role) {
          setRole(parsed.role as UserRole);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Error parsing auth session", e);
      }
    }
    setAuthLoading(false);
  }, []);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    localStorage.setItem('erp_auth_session', JSON.stringify({ role: selectedRole }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('erp_auth_session');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[#0ea5e9]" style={{ fontSize: '48px' }}>sync</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-center" richColors dir="rtl" />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex text-[#1e293b] bg-[#f8fafc]" dir="rtl">
      <Toaster position="top-center" richColors dir="rtl" />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} />
      
      <div className="flex-1 mr-72 flex flex-col min-h-screen">
        <Header role={role} setRole={setRole} onLogout={handleLogout} />
        
        <main className="flex-1 p-8 flex flex-col relative">
          <div 
            key={activeTab}
            className="flex-1 flex flex-col animate-fade-in-up"
          >
            {activeTab === 'dashboard' && <Dashboard role={role} setActiveTab={setActiveTab} />}
            {activeTab === 'inventory' && <Inventory />}
            {activeTab === 'pos' && <POS />}
            {activeTab === 'sales' && <Sales />}
            {activeTab === 'crm' && <CRM />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'ai' && <AIChat role={role} />}
          </div>
        </main>
      </div>
    </div>
  );
}
