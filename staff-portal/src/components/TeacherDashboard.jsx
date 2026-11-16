import React, { useState } from 'react';
import { Plus, Users, Copy, Check, Edit3, Eye, Calendar, MapPin, Bus, AlertCircle, CheckCircle2, Clock, Sparkles, ExternalLink, Utensils } from 'lucide-react';
import RosterModal from './RosterModal';
import NewTripModal from './NewTripModal';
import TripDetailDrawer from './TripDetailDrawer';
import { api, GAS_API_URL } from '../api';
import { getSchoolLogo, DISTRICT_SHIELD_LOGO } from '../constants/schoolLogos';

export default function TeacherDashboard({ trips = [], loading, onRefresh, onCreateTrip, onUpdateTrip, currentUser }) {
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [rosterModalTrip, setRosterModalTrip] = useState(null);
  const [inspectTripData, setInspectTripData] = useState(null);
  const [copiedLink, setCopiedLink] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleSeedDemo = async () => {
    setLoadingDemo(true);
    try {
      await api.seedDemoData();
      await onRefresh();
    } catch (e) {
      console.warn("Seed demo trips:", e);
      await onRefresh();
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleCopyLink = (reqId, type) => {
    const link = `${GAS_API_URL}?view=${type}&reqId=${encodeURIComponent(reqId)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(`${reqId}_${type}`);
    setTimeout(() => setCopiedLink(''), 2500);
  };

  const startEdit = (trip) => {
    setEditingTrip(trip);
    setNewModalOpen(true);
  };

  const handleModalClose = () => {
    setNewModalOpen(false);
    setEditingTrip(null);
  };

  const handleFormSubmit = async (formData) => {
    if (editingTrip) {
      await onUpdateTrip(editingTrip.Request_ID, formData);
    } else {
      await onCreateTrip(formData);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & New Request CTA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img 
            src={DISTRICT_SHIELD_LOGO} 
            alt="WVUSD Shield" 
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Teacher Field Trip Management</h2>
            <p className="text-xs text-slate-500 mt-1">
              Create field trip submissions, track administrative approvals, copy permission slip links, and review live student rosters.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleSeedDemo}
            disabled={loadingDemo}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            title="Load demo trips (In-Process trip + Approved trip with Slips)"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${loadingDemo ? 'animate-spin' : ''}`} />
            <span>{loadingDemo ? 'Loading...' : 'Load Demo Trips'}</span>
          </button>

          <button
            onClick={() => { setEditingTrip(null); setNewModalOpen(true); }}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center space-x-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Field Trip Request</span>
          </button>
        </div>
      </div>

      {/* Trip Cards List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900 border-t-transparent mx-auto mb-2"></div>
          Loading your field trips...
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Field Trips Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You currently have no submitted trips. Click the button above to start your first field trip request.
          </p>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={handleSeedDemo}
              disabled={loadingDemo}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{loadingDemo ? 'Loading...' : 'Load Demo Field Trips'}</span>
            </button>
            <button
              onClick={() => { setEditingTrip(null); setNewModalOpen(true); }}
              className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800"
            >
              + Create First Request
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {trips.map(item => {
            const t = item.trip;
            const pipeline = item.pipeline || [];
            const canEdit = item.canEdit;
            const isApproved = t.Status === 'Approved (Complete)' || t.Status === 'Approved';

            const studentUrl = `${GAS_API_URL}?view=slip&reqId=${encodeURIComponent(t.Request_ID)}`;
            const volunteerUrl = `${GAS_API_URL}?view=volunteer&reqId=${encodeURIComponent(t.Request_ID)}`;

            return (
              <div 
                key={t.Request_ID} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start space-x-3.5">
                    <img 
                      src={getSchoolLogo(t.Site)} 
                      alt={t.Site} 
                      className="w-12 h-12 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 flex-shrink-0 shadow-xs"
                      title={t.Site}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {t.Request_ID}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          t.Status === 'Approved (Complete)' ? 'bg-green-100 text-green-800 border border-green-200' :
                          t.Status === 'Declined' ? 'bg-red-100 text-red-800 border border-red-200' :
                          t.Status.includes('Action Required') ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {t.Status}
                        </span>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                          Stage: <strong className="text-slate-800">{t.Current_Stage}</strong>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{t.Destination}</h3>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span className="font-bold text-slate-700">{t.Site}</span>
                        <span>•</span>
                        <span>{t.Group_Name}</span>
                        <span>•</span>
                        <span>Depart: {t.Departure_Date} ({t.Departure_Time})</span>
                        <span>•</span>
                        <span>{t.Student_Count} Students ({t.Grades})</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Live Roster */}
                    <button
                      onClick={() => setRosterModalTrip(t)}
                      className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
                    >
                      <Users className="w-4 h-4" />
                      <span>Roster & Slips</span>
                    </button>

                    {/* Revise Button if Action Required */}
                    {canEdit && (
                      <button
                        onClick={() => startEdit(t)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Revise & Resubmit</span>
                      </button>
                    )}

                    {/* Inspect details & logs */}
                    <button
                      onClick={() => setInspectTripData(item)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>
                  </div>
                </div>

                {/* 7-Stage Visual Horizontal Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Approval Progress</span>
                    <span>Current: {t.Current_Stage}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {pipeline.map(step => (
                      <div 
                        key={step.key}
                        className={`p-1.5 rounded-lg text-center border text-[10px] flex flex-col justify-between min-h-[46px] ${
                          step.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' :
                          step.status === 'active' ? 'bg-blue-900 text-white border-blue-950 font-bold ring-2 ring-blue-300' :
                          step.status === 'changes_requested' ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' :
                          step.status === 'declined' ? 'bg-red-100 text-red-800 border-red-300' :
                          step.status === 'skipped' ? 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-50' :
                          'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                        title={step.name}
                      >
                        <span className="truncate">{step.label}</span>
                        <div className="flex justify-center mt-0.5">
                          {step.status === 'approved' ? <Check className="w-3 h-3 text-emerald-600" /> :
                           step.status === 'active' ? <Clock className="w-3 h-3 text-blue-200 animate-pulse" /> :
                           step.status === 'changes_requested' ? <AlertCircle className="w-3 h-3 text-amber-700" /> :
                           <span className="text-[9px] text-slate-400">-</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slip Sharing Bar - ONLY created & visible once trip is Approved completely */}
                {isApproved && (
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-950 flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Student Slip:</span>
                      </span>
                      <a 
                        href={studentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-50 rounded text-emerald-900 font-semibold flex items-center space-x-1 shadow-2xs"
                        title="Open Student Permission Slip in Apps Script"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Open</span>
                      </a>
                      <button 
                        onClick={() => handleCopyLink(t.Request_ID, 'slip')}
                        className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-50 rounded text-emerald-900 font-semibold flex items-center space-x-1 shadow-2xs"
                      >
                        {copiedLink === `${t.Request_ID}_slip` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                        <span>{copiedLink === `${t.Request_ID}_slip` ? 'Copied!' : 'Copy Student Link'}</span>
                      </button>

                      <a 
                        href={`https://classroom.google.com/share?url=${encodeURIComponent(studentUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold flex items-center space-x-1 shadow-2xs"
                        title="Share directly to Google Classroom"
                      >
                        <img src="https://www.gstatic.com/classroom/logo_square_48.svg" alt="Classroom" className="w-3.5 h-3.5" />
                        <span>Classroom</span>
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-emerald-950">Volunteer Slip:</span>
                      <a 
                        href={volunteerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-50 rounded text-emerald-900 font-semibold flex items-center space-x-1 shadow-2xs"
                        title="Open Volunteer Permission Slip in Apps Script"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Open</span>
                      </a>
                      <button 
                        onClick={() => handleCopyLink(t.Request_ID, 'volunteer')}
                        className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-50 rounded text-emerald-900 font-semibold flex items-center space-x-1 shadow-2xs"
                      >
                        {copiedLink === `${t.Request_ID}_volunteer` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                        <span>{copiedLink === `${t.Request_ID}_volunteer` ? 'Copied!' : 'Copy Volunteer Link'}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setRosterModalTrip(t)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold flex items-center space-x-1 shadow-2xs"
                        title="Submit Official Field Trip Meals Request to Cafeteria"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Meal Request</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Trip Form Modal */}
      <NewTripModal
        isOpen={newModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        editTrip={editingTrip}
        currentUser={currentUser}
      />

      {/* Roster & Clearance Modal */}
      <RosterModal
        isOpen={!!rosterModalTrip}
        onClose={() => setRosterModalTrip(null)}
        trip={rosterModalTrip}
      />

      {/* History & Logs Drawer */}
      <TripDetailDrawer
        isOpen={!!inspectTripData}
        onClose={() => setInspectTripData(null)}
        tripData={inspectTripData}
        onActionSubmit={() => {}}
      />

    </div>
  );
}
