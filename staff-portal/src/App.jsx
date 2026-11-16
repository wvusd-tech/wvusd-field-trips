import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginGate from './components/LoginGate';
import TeacherDashboard from './components/TeacherDashboard';
import ApproverDashboard from './components/ApproverDashboard';
import { api } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' | 'approver'
  
  const [myTrips, setMyTrips] = useState([]);
  const [approverTrips, setApproverTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Check stored session login
  useEffect(() => {
    const savedToken = localStorage.getItem('wvusd_id_token');
    const savedUser = localStorage.getItem('wvusd_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIdToken(savedToken);
        if (parsed.roles?.isApprover) {
          setActiveTab('approver');
        }
      } catch (e) {
        localStorage.removeItem('wvusd_user');
      }
    }
  }, []);

  // Fetch trips when logged in
  useEffect(() => {
    if (user && idToken) {
      loadData();
    }
  }, [user, idToken]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [teacherRes, approverRes] = await Promise.allSettled([
        api.getMyTrips(),
        user?.roles?.isApprover ? api.getApproverTrips() : Promise.resolve([])
      ]);

      if (teacherRes.status === 'fulfilled') {
        setMyTrips(teacherRes.value || []);
      }
      if (approverRes.status === 'fulfilled') {
        setApproverTrips(approverRes.value || []);
      }
    } catch (e) {
      console.warn("Error loading trips:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (token, directUser = null) => {
    localStorage.setItem('wvusd_id_token', token);
    setIdToken(token);

    if (directUser) {
      setUser(directUser);
      localStorage.setItem('wvusd_user', JSON.stringify(directUser));
      if (directUser.roles?.isApprover) setActiveTab('approver');
      showToast(`Welcome back, ${directUser.name}!`);
      return;
    }

    try {
      const authRes = await api.verifyToken(token);
      const authenticatedUser = authRes.user;
      setUser(authenticatedUser);
      localStorage.setItem('wvusd_user', JSON.stringify(authenticatedUser));
      if (authenticatedUser.roles?.isApprover) setActiveTab('approver');
      showToast(`Signed in as ${authenticatedUser.email}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('wvusd_id_token');
    localStorage.removeItem('wvusd_user');
    setUser(null);
    setIdToken(null);
    setMyTrips([]);
    setApproverTrips([]);
    showToast("Signed out successfully.");
  };

  const handleCreateTrip = async (formData) => {
    const res = await api.createRequest(formData);
    showToast(`Trip ${res.requestId} created and submitted!`);
    await loadData();
  };

  const handleUpdateTrip = async (requestId, formData) => {
    await api.updateRequest(requestId, formData);
    showToast(`Trip ${requestId} revised and resubmitted!`);
    await loadData();
  };

  const handleProcessApproval = async (requestId, decision, commentText) => {
    await api.processApproval(requestId, decision, commentText);
    showToast(`Decision recorded: ${decision}`);
    await loadData();
  };

  const actionableApprovalsCount = approverTrips.filter(t => t.canAct).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 text-white transition transform ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900 border border-slate-700'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {user ? (
        <>
          <Navbar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onSignOut={handleSignOut}
            approverTripCount={actionableApprovalsCount}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            {activeTab === 'teacher' && (
              <TeacherDashboard
                trips={myTrips}
                loading={loading}
                onRefresh={loadData}
                onCreateTrip={handleCreateTrip}
                onUpdateTrip={handleUpdateTrip}
                currentUser={user}
              />
            )}

            {activeTab === 'approver' && user?.roles?.isApprover && (
              <ApproverDashboard
                trips={approverTrips}
                loading={loading}
                onRefresh={loadData}
                onProcessApproval={handleProcessApproval}
                currentUser={user}
              />
            )}
          </main>

          {/* District Footer */}
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-slate-600">Walnut Valley Unified School District • Field Trip Management Portal</p>
              <p className="mt-1 text-[11px]">880 S. Lemon Ave., Walnut, CA 91789 • Connecting Google Apps Script, Sheets & Drive</p>
            </div>
          </footer>
        </>
      ) : (
        <LoginGate onLoginSuccess={handleLoginSuccess} />
      )}

    </div>
  );
}
