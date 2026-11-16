import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, Lock, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginGate({ onLoginSuccess }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /* Initialize Google Identity Services if available */
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1072944905499-vm2v2i5dvn0a0d2o4ca36i1vge8cvbn0.apps.googleusercontent.com",
          callback: handleGoogleResponse,
          hd: "wvusd.org" // Restrict to wvusd.org domain
        });

        const btnContainer = document.getElementById("googleSignInBtn");
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "outline",
            size: "large",
            width: "320",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left"
          });
        }
      } catch (e) {
        console.warn("Google Identity Services initialization:", e);
      }
    }
  }, []);

  const handleGoogleResponse = (response) => {
    if (!response.credential) {
      setErrorMsg("Failed to receive Google credential token.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    onLoginSuccess(response.credential);
  };

  // Demo user fast login for role testing
  const handleDemoLogin = (email, name, role) => {
    setLoading(true);
    // Prefix with DEV_MOCK_ which is recognized by Api.js and client fallback
    const mockToken = `DEV_MOCK_${email}`;
    setTimeout(() => {
      onLoginSuccess(mockToken, {
        email,
        name,
        picture: "",
        roles: {
          isStaff: true,
          isApprover: role !== 'Teacher',
          approverTypes: role !== 'Teacher' ? [role] : []
        }
      });
    }, 400);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-b from-blue-900 to-blue-950 p-8 text-center text-white relative">
          <div className="w-20 h-20 bg-white rounded-full p-2 mx-auto shadow-md mb-4 flex items-center justify-center">
            <img 
              src="https://res.cloudinary.com/djv9u4054/image/upload/v1783959106/UPdated_Black_and_White_Logo-removebg-preview_zubeqp.png" 
              alt="WVUSD Logo" 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Walnut Valley Unified</h1>
          <p className="text-blue-200 text-xs mt-1">Field Trip Request & Approval Management</p>
          <div className="inline-flex items-center space-x-1 mt-3 bg-blue-800/80 px-2.5 py-1 rounded-full text-[11px] font-semibold text-blue-100 border border-blue-700">
            <Lock className="w-3 h-3 text-amber-300" />
            <span>@wvusd.org Google Workspace Single Sign-On</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Official Google Sign-In Button */}
          <div className="flex flex-col items-center space-y-3">
            <div id="googleSignInBtn" className="min-h-[44px] flex items-center justify-center"></div>
            <p className="text-[11px] text-slate-500 text-center">
              Please sign in using your district-issued <strong>@wvusd.org</strong> Google Workspace account.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                Or Instant Role Switcher (Preview)
              </span>
            </div>
          </div>

          {/* Role Preview Buttons for Testing Pipeline Gates */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1 text-slate-700 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Role Simulator</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('jdoe@wvusd.org', 'Jane Doe', 'Teacher')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-bold text-slate-900 block">Teacher</span>
                <span className="text-[10px] text-slate-500">Submit & Roster</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('cnorys@wvusd.org', 'Cathy Norys', 'Admin Assistant (Diamond Bar High School)')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-bold text-slate-900 block">Admin Assistant</span>
                <span className="text-[10px] text-slate-500">Stage 1 (DBHS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('kdavies@wvusd.org', 'Kurt Davies', 'Dean (Kurt Davies)')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-bold text-slate-900 block">Dean</span>
                <span className="text-[10px] text-slate-500">Stage 2 (Athletics)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('yliew@wvusd.org', 'YY', 'Principal (Diamond Bar High School)')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-bold text-slate-900 block">Principal</span>
                <span className="text-[10px] text-slate-500">Stage 3 (DBHS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('transportation@wvusd.org', 'WVUSD Transportation', 'Transportation')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-bold text-slate-900 block">Transportation</span>
                <span className="text-[10px] text-slate-500">Stage 5 (Bus/TF#)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('opsdirector@wvusd.org', 'Operations Director', 'Operations Director')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition flex flex-col justify-between"
              >
                <span className="font-bold text-slate-900 block">Ops Director</span>
                <span className="text-[10px] text-slate-500">Stage 7 (Final Sign-off)</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
              Walnut Valley USD • 880 S. Lemon Ave., Walnut, CA 91789
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
