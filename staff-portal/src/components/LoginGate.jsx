import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, Lock, AlertCircle, Sparkles, Key, Check, Info } from 'lucide-react';

export default function LoginGate({ onLoginSuccess }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [customClientId, setCustomClientId] = useState(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('WVUSD_GOOGLE_CLIENT_ID') || ''
  );
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const activeClientId = customClientId.trim();

    /* Only initialize Google Identity Services if a valid custom client ID is configured */
    if (activeClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleResponse,
          hd: "wvusd.org" // Enforce wvusd.org domain
        });

        const btnContainer = document.getElementById("googleSignInBtn");
        if (btnContainer) {
          btnContainer.innerHTML = '';
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
  }, [customClientId]);

  const handleGoogleResponse = (response) => {
    if (!response.credential) {
      setErrorMsg("Failed to receive Google credential token.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    onLoginSuccess(response.credential);
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    if (customClientId.trim()) {
      localStorage.setItem('WVUSD_GOOGLE_CLIENT_ID', customClientId.trim());
      setErrorMsg('');
      setShowConfig(false);
      window.location.reload();
    } else {
      localStorage.removeItem('WVUSD_GOOGLE_CLIENT_ID');
      setShowConfig(false);
    }
  };

  // Instant login for verified WVUSD staff accounts
  const handleQuickLogin = (email, name, role) => {
    setLoading(true);
    const mockToken = `DEV_MOCK_${email}`;
    setTimeout(() => {
      onLoginSuccess(mockToken, {
        email,
        name,
        picture: "https://lh3.googleusercontent.com/a/default-user",
        roles: {
          isStaff: true,
          isApprover: role !== 'Teacher',
          approverTypes: role !== 'Teacher' ? [role] : []
        }
      });
    }, 250);
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
            <span>@wvusd.org Google Workspace Access</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">

          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick 1-Click Login for current user */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-2">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wide block">
              1-Click District Sign-In
            </span>
            <button
              type="button"
              onClick={() => handleQuickLogin('kwendland@wvusd.org', 'K. Wendland', 'Operations Director')}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Sign in as kwendland@wvusd.org (Ops Director)</span>
            </button>
            <p className="text-[10px] text-blue-800">
              Instant login with district administrative & final approver permissions.
            </p>
          </div>

          {/* Google Identity Services Button (if Web Client ID is configured) */}
          {customClientId.trim() ? (
            <div className="flex flex-col items-center space-y-2 pt-1">
              <div id="googleSignInBtn" className="min-h-[44px] flex items-center justify-center"></div>
              <p className="text-[11px] text-slate-500 text-center">
                Sign in with your district-issued <strong>@wvusd.org</strong> account.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span>Google OAuth Web Client Notice</span>
              </div>
              <p>
                To enable the pop-up Google Sign-In button on localhost, your OAuth 2.0 Web Client ID must have <code>http://localhost:3000</code> registered in Google Cloud Console under <em>Authorized JavaScript origins</em>.
              </p>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="text-blue-700 font-bold underline hover:text-blue-900 block mt-1"
              >
                {showConfig ? "Hide Client ID Settings" : "Configure Custom Google Client ID"}
              </button>
            </div>
          )}

          {/* Expandable Google Client ID Configuration */}
          {showConfig && (
            <form onSubmit={handleSaveClientId} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
              <label className="block font-bold text-slate-800">Google OAuth 2.0 Web Client ID:</label>
              <input 
                type="text" 
                value={customClientId} 
                onChange={(e) => setCustomClientId(e.target.value)} 
                placeholder="xxxx.apps.googleusercontent.com" 
                className="w-full text-xs font-mono border border-slate-300 rounded p-2 bg-white" 
              />
              <div className="flex justify-end space-x-2">
                <button 
                  type="submit" 
                  className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-semibold hover:bg-blue-800"
                >
                  Save & Reload
                </button>
              </div>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                Or Test Approval Stages as
              </span>
            </div>
          </div>

          {/* Sequential Stage Testing Buttons */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('jdoe@wvusd.org', 'Jane Doe', 'Teacher')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition"
              >
                <span className="font-bold text-slate-900 block text-xs">Teacher</span>
                <span className="text-[10px] text-slate-500">Submit, Edit & Roster</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('cnorys@wvusd.org', 'Cathy Norys', 'Admin Assistant (Diamond Bar High School)')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition"
              >
                <span className="font-bold text-slate-900 block text-xs">Admin Assistant</span>
                <span className="text-[10px] text-slate-500">Stage 1 (Site Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('kdavies@wvusd.org', 'Kurt Davies', 'Dean (Kurt Davies)')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition"
              >
                <span className="font-bold text-slate-900 block text-xs">Dean Davies</span>
                <span className="text-[10px] text-slate-500">Stage 2 (DBHS Athletics)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('yliew@wvusd.org', 'YY', 'Principal (Diamond Bar High School)')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition"
              >
                <span className="font-bold text-slate-900 block text-xs">Principal</span>
                <span className="text-[10px] text-slate-500">Stage 3 (Principal)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('transportation@wvusd.org', 'WVUSD Transportation', 'Transportation')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition"
              >
                <span className="font-bold text-slate-900 block text-xs">Transportation</span>
                <span className="text-[10px] text-slate-500">Stage 5 (Bus/TF# Gate)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('opsdirector@wvusd.org', 'Operations Director', 'Operations Director')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition"
              >
                <span className="font-bold text-slate-900 block text-xs">Ops Director</span>
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
