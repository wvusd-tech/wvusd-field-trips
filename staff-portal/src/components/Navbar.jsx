import React, { useState } from 'react';
import { LogOut, Settings, Shield, User, ExternalLink, CheckCircle } from 'lucide-react';
import { GAS_API_URL, setCustomGasUrl } from '../api';

export default function Navbar({ user, activeTab, setActiveTab, onSignOut, approverTripCount = 0 }) {
  const [showSettings, setShowSettings] = useState(false);
  const [gasUrlInput, setGasUrlInput] = useState(GAS_API_URL);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveGasUrl = (e) => {
    e.preventDefault();
    setCustomGasUrl(gasUrlInput);
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      setShowSettings(false);
    }, 1500);
  };

  const isApprover = user?.roles?.isApprover;

  return (
    <header className="bg-blue-900 text-white shadow-md sticky top-0 z-40 border-b border-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & District Branding */}
          <div className="flex items-center space-x-3">
            <img 
              src="https://res.cloudinary.com/djv9u4054/image/upload/v1783959106/UPdated_Black_and_White_Logo-removebg-preview_zubeqp.png" 
              alt="WVUSD Logo" 
              className="h-10 w-auto bg-white p-1 rounded-full shadow-sm"
            />
            <div>
              <div className="font-extrabold text-lg tracking-tight leading-tight flex items-center space-x-2">
                <span>WVUSD Field Trips</span>
                <span className="hidden sm:inline-block bg-blue-800 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded text-blue-200">Staff Portal</span>
              </div>
              <p className="text-[11px] text-blue-200 hidden sm:block">Walnut Valley Unified School District</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'teacher' 
                  ? 'bg-blue-800 text-white shadow-inner' 
                  : 'text-blue-100 hover:bg-blue-800/60'
              }`}
            >
              Teacher Portal
            </button>

            {isApprover && (
              <button
                onClick={() => setActiveTab('approver')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center space-x-1.5 ${
                  activeTab === 'approver' 
                    ? 'bg-blue-800 text-white shadow-inner' 
                    : 'text-blue-100 hover:bg-blue-800/60'
                }`}
              >
                <span>Approvals Pipeline</span>
                {approverTripCount > 0 && (
                  <span className="bg-amber-400 text-slate-900 font-bold text-[11px] px-1.5 py-0.2 rounded-full">
                    {approverTripCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Right User & Settings */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold truncate max-w-[170px]">{user?.name || user?.email}</div>
              <div className="text-[10px] text-blue-200 flex items-center justify-end space-x-1">
                {isApprover && <Shield className="w-2.5 h-2.5 text-amber-300" />}
                <span>{isApprover ? user.roles.approverTypes[0] || 'Approver' : 'Teacher / Staff'}</span>
              </div>
            </div>

            {user?.picture ? (
              <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-blue-700 shadow-sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-xs font-bold border border-blue-700">
                <User className="w-4 h-4 text-blue-200" />
              </div>
            )}

            {/* Settings button for backend URL */}
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              title="API Backend Settings"
              className="p-1.5 rounded-lg hover:bg-blue-800 text-blue-200 hover:text-white transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Sign Out */}
            <button 
              onClick={onSignOut} 
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-red-800 text-red-200 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Backend Settings Dropdown Modal */}
      {showSettings && (
        <div className="bg-slate-900 text-slate-200 border-b border-slate-700 px-4 py-3 text-xs shadow-xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <span className="font-bold text-white block">Google Apps Script Backend Endpoint</span>
              <span className="text-[11px] text-slate-400">Published Web App URL executing as User Deploying with Anyone access:</span>
              <input 
                type="text" 
                value={gasUrlInput} 
                onChange={(e) => setGasUrlInput(e.target.value)} 
                className="mt-1 w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-100 text-xs font-mono"
                placeholder="https://script.google.com/macros/s/.../exec"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2 sm:pt-4">
              <button 
                onClick={handleSaveGasUrl}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition flex items-center space-x-1"
              >
                {savedMsg ? <CheckCircle className="w-3.5 h-3.5 text-green-300" /> : null}
                <span>{savedMsg ? 'Saved!' : 'Save URL'}</span>
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
