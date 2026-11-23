import React, { useState } from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Eye, Shield, Check, Filter, Search, RefreshCw } from 'lucide-react';
import TripDetailDrawer from './TripDetailDrawer';
import { getSchoolLogo, DISTRICT_SHIELD_LOGO } from '../constants/schoolLogos';
import { formatStageName } from '../api';

export default function ApproverDashboard({ trips = [], loading, onRefresh, onProcessApproval, currentUser }) {
  const [filterMode, setFilterMode] = useState('actionable'); // Default landing: 'actionable' | 'pending' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripData, setSelectedTripData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter trips
  const filteredTrips = trips.filter(item => {
    const t = item.trip;
    const matchesSearch = 
      t.Destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.Request_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.Site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.Teacher_In_Charge.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'actionable') {
      return item.canAct === true;
    }
    if (filterMode === 'pending') {
      return t.Status !== 'Approved (Complete)' && t.Status !== 'Declined';
    }
    return true; // 'all'
  });

  const handleOpenDrawer = (item) => {
    setSelectedTripData(item);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img 
            src={DISTRICT_SHIELD_LOGO} 
            alt="WVUSD Shield" 
            className="w-12 h-12 object-contain flex-shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-bold text-slate-900">Administrative Approvals Pipeline</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sequential 7-stage gate tracker. Only your active stage permissions allow approvals.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input 
              type="text" 
              placeholder="Search site, teacher, trip..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-48 sm:w-56 focus:border-blue-900"
            />
          </div>

          {/* Filter Pills */}
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 text-xs">
            <button
              onClick={() => setFilterMode('actionable')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                filterMode === 'actionable' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Action Required ({trips.filter(t => t.canAct).length})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                filterMode === 'pending' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Pipeline ({trips.filter(t => t.trip.Status !== 'Approved (Complete)' && t.trip.Status !== 'Declined').length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                filterMode === 'all' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({trips.length})
            </button>
          </div>

          <button 
            onClick={onRefresh}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
            title="Refresh Pipeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Multi-Stage Pipeline Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900 border-t-transparent mx-auto mb-2"></div>
            Loading pipeline trips...
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            {filterMode === 'actionable' ? (
              <div className="space-y-2 max-w-sm mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-800 text-sm">All caught up!</p>
                <p className="text-xs text-slate-500">You have no field trips awaiting your review right now.</p>
                <button
                  onClick={() => setFilterMode('pending')}
                  className="mt-2 px-3.5 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  View In Pipeline Trips
                </button>
              </div>
            ) : (
              <>
                <p className="font-semibold text-slate-700">No field trips match your current filter.</p>
                <p className="text-[11px] text-slate-400 mt-1">Check back later or adjust your search filter above.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Trip Details</th>
                  <th className="px-4 py-3.5">Departure</th>
                  <th className="px-4 py-3.5 min-w-[480px]">Multi-Stage Pipeline Tracker</th>
                  <th className="px-4 py-3.5 text-right">Sequential Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredTrips.map(item => {
                  const t = item.trip;
                  const canAct = item.canAct;
                  const pipeline = item.pipeline || [];

                  return (
                    <tr 
                      key={t.Request_ID}
                      className={`hover:bg-slate-50/80 transition ${canAct ? 'bg-amber-50/30' : ''}`}
                    >
                      {/* Trip Details Column with School Mascot Logo */}
                      <td className="px-4 py-4">
                        <div className="flex items-start space-x-3">
                          <img 
                            src={getSchoolLogo(t.Site)} 
                            alt={t.Site} 
                            className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 border border-slate-200 flex-shrink-0 shadow-xs"
                            title={t.Site}
                          />
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-mono font-bold text-[11px] bg-slate-100 text-blue-900 px-2 py-0.5 rounded border border-slate-200">
                                {t.Request_ID}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                t.Status === 'Approved (Complete)' ? 'bg-green-100 text-green-800 border border-green-200' :
                                t.Status === 'Declined' ? 'bg-red-100 text-red-800 border border-red-200' :
                                t.Status.includes('Action Required') ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {t.Status}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 text-sm">{t.Destination}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                              <strong className="text-slate-700">{t.Site}</strong> • {t.Group_Name} • {t.Teacher_In_Charge} • <span>{t.Student_Count} Students</span>
                              {(() => {
                                const s = parseInt(t.Student_Count, 10) || 0;
                                const c = (parseInt(t.Teacher_Count, 10) || 0) + (parseInt(t.Volunteer_Count, 10) || 0);
                                const req = s > 0 ? Math.ceil(s / 10) : 0;
                                const comp = s === 0 || (c > 0 && c >= req);
                                const r = c > 0 ? (s / c % 1 === 0 ? s / c : (s / c).toFixed(1)) : s;
                                return (
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                    comp ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                                  }`} title={`Chaperone Ratio 1:${r} (${comp ? 'Compliant' : 'Non-compliant: Needs ' + (req - c) + ' more'})`}>
                                    {comp ? '🟢' : '🔴'} 1:{r}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Dates Column */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{t.Departure_Date}</div>
                        <div className="text-[11px] text-slate-500">{t.Departure_Time} ({t.Transportation_Type})</div>
                      </td>

                      {/* 7-Stage Visual Pipeline Tracker Column (Modeled on HR Onboarding Portal) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1.5">
                          {pipeline.map((step, idx) => {
                            let pillStyle = "bg-slate-100 text-slate-400 border-slate-200";
                            let icon = null;

                            if (step.status === 'approved') {
                              pillStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
                              icon = <CheckCircle2 className="w-3 h-3 text-emerald-600 inline ml-1 flex-shrink-0" />;
                            } else if (step.status === 'active') {
                              pillStyle = "bg-blue-900 text-white border-blue-950 font-bold shadow-xs ring-2 ring-blue-300";
                              icon = <Clock className="w-3 h-3 text-blue-200 inline ml-1 animate-pulse flex-shrink-0" />;
                            } else if (step.status === 'changes_requested') {
                              pillStyle = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                              icon = <AlertCircle className="w-3 h-3 text-amber-700 inline ml-1 flex-shrink-0" />;
                            } else if (step.status === 'declined') {
                              pillStyle = "bg-red-100 text-red-800 border-red-300 font-bold";
                              icon = <XCircle className="w-3 h-3 text-red-600 inline ml-1 flex-shrink-0" />;
                            } else if (step.status === 'skipped') {
                              pillStyle = "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60";
                            }

                            return (
                              <div 
                                key={step.key} 
                                className={`px-2 py-1 rounded text-[10px] border flex items-center justify-between transition ${pillStyle}`}
                                title={
                                  step.status === 'approved' 
                                    ? `Approved by ${step.actorEmail || 'Staff'} on ${step.timestamp ? new Date(step.timestamp).toLocaleDateString() : 'earlier'}` 
                                    : step.status === 'active' 
                                    ? `Currently waiting at ${formatStageName(step.name)}` 
                                    : step.status === 'skipped'
                                    ? `Stage not required for this trip`
                                    : `Pending earlier stages`
                                }
                              >
                                <span className="truncate max-w-[58px]">{step.label}</span>
                                {icon}
                              </div>
                            );
                          })}
                        </div>

                        {/* Subtitle explaining current active stage */}
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
                          <span className="font-semibold text-slate-600">Current Step:</span>
                          <span className="font-bold text-blue-950">{formatStageName(t.Current_Stage)}</span>
                        </div>
                      </td>

                      {/* Sequential Action Button Column */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {canAct ? (
                          <button
                            onClick={() => handleOpenDrawer(item)}
                            className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center space-x-1.5 ml-auto"
                          >
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Review & Act</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenDrawer(item)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Slide-over Drawer for Full Inspection & Decision */}
      <TripDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tripData={selectedTripData}
        onActionSubmit={onProcessApproval}
      />

    </div>
  );
}
