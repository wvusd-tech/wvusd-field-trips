import React, { useState, useMemo } from 'react';
import { 
  Search, Shield, Check, Filter, AlertCircle, ArrowLeft, 
  Save, Calendar, Clock, MapPin, Building, FileText, CheckCircle2,
  ExternalLink, Sparkles, UserCheck, Mail, Users, ArrowRightLeft, X, RefreshCw
} from 'lucide-react';
import { DISTRICT_SHIELD_LOGO, getSchoolLogo, SCHOOL_LOGOS, SITE_ADDRESSES } from '../constants/schoolLogos';
import { api } from '../api';

export default function OpsDashboard({ trips = [], onRefresh, currentUser, onSwitchView }) {
  // Navigation: 'list' | 'detail'
  const [viewMode, setViewMode] = useState('list');
  const [selectedReqId, setSelectedReqId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('Pending'); // 'Pending' | 'Complete' | 'Declined' | 'Cancelled' | 'All'
  const [filter50Miles, setFilter50Miles] = useState(false);
  const [filterOvernight, setFilterOvernight] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Search by Request # modal / input
  const [lookupInput, setLookupInput] = useState('');
  const [showLookupBox, setShowLookupBox] = useState(false);

  // Detail view notes form state
  const [newNoteText, setNewNoteText] = useState('');
  const [isCompletedChecked, setIsCompletedChecked] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaveMsg, setNotesSaveMsg] = useState('');

  // Reassign / Delegate Approver Modal state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignStage, setReassignStage] = useState('Principal');
  const [newApproverEmail, setNewApproverEmail] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [reassignMsg, setReassignMsg] = useState(null);

  // Selected trip for detail view
  const currentTrip = useMemo(() => {
    if (!selectedReqId) return trips[0] || null;
    return trips.find(t => String(t.requestNum).trim().toLowerCase() === String(selectedReqId).trim().toLowerCase()) || trips[0] || null;
  }, [selectedReqId, trips]);

  // Synchronize detail view form when trip changes
  const handleOpenDetail = (reqNum) => {
    setSelectedReqId(reqNum);
    setViewMode('detail');
    setNewNoteText('');
    setNotesSaveMsg('');
    const target = trips.find(t => String(t.requestNum).trim() === String(reqNum).trim());
    if (target) {
      setIsCompletedChecked(target.isCompleted || target.status === 'Approved (Complete)');
    }
  };

  // Filtered trips list
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      // 1. Status segmented filter
      if (statusFilter === 'Pending') {
        const isComplete = t.isCompleted || t.status === 'Approved (Complete)' || t.bucket === 'Complete';
        const isDeclined = t.status === 'Declined' || t.bucket === 'Declined';
        const isCancelled = t.status === 'Cancelled' || t.bucket === 'Cancelled';
        if (isComplete || isDeclined || isCancelled) return false;
      } else if (statusFilter === 'Complete') {
        const isComplete = t.isCompleted || t.status === 'Approved (Complete)' || t.bucket === 'Complete';
        if (!isComplete) return false;
      } else if (statusFilter === 'Declined') {
        if (t.status !== 'Declined' && t.bucket !== 'Declined') return false;
      } else if (statusFilter === 'Cancelled') {
        if (t.status !== 'Cancelled' && t.bucket !== 'Cancelled') return false;
      }
      // 'All' shows all

      // 2. More than 50 Miles
      if (filter50Miles) {
        const isOver50 = t.isMoreThan50Miles || (t.typeOfTrip || '').toLowerCase().includes('50 miles');
        if (!isOver50) return false;
      }

      // 3. Overnight Trips
      if (filterOvernight) {
        const isNight = t.isOvernight || (t.typeOfTrip || '').toLowerCase().includes('overnight');
        if (!isNight) return false;
      }

      // 4. School dropdown
      if (schoolFilter !== 'All') {
        if (t.site !== schoolFilter) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (t.requestNum || '').toLowerCase().includes(q) ||
          (t.destination || '').toLowerCase().includes(q) ||
          (t.site || '').toLowerCase().includes(q) ||
          (t.teacherInCharge || '').toLowerCase().includes(q) ||
          (t.group || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [trips, statusFilter, filter50Miles, filterOvernight, schoolFilter, searchQuery]);

  // Handle Save Notes
  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!currentTrip) return;
    setSavingNotes(true);
    setNotesSaveMsg('');

    try {
      await api.submitTripNotes(currentTrip.requestNum, newNoteText, isCompletedChecked);
      setNotesSaveMsg('Notes saved successfully!');
      setNewNoteText('');
      await onRefresh();
      setTimeout(() => setNotesSaveMsg(''), 3000);
    } catch (err) {
      alert("Error saving notes: " + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  // Reassign / Delegate modal open handler
  const handleOpenReassign = (trip) => {
    const target = trip || currentTrip;
    if (!target) return;
    setReassignStage(target.currentStageName || 'Principal');
    setNewApproverEmail('');
    setReassignReason('');
    setReassignMsg(null);
    setShowReassignModal(true);
  };

  // Reassign / Delegate submit handler
  const handleReassignSubmit = async (e) => {
    e?.preventDefault();
    if (!newApproverEmail || !newApproverEmail.includes('@')) {
      setReassignMsg({ type: 'error', text: 'Please enter a valid WVUSD email address.' });
      return;
    }
    setReassigning(true);
    setReassignMsg(null);
    try {
      await api.reassignApprover(
        currentTrip.requestNum,
        reassignStage || currentTrip.currentStageName || 'Principal',
        newApproverEmail.trim().toLowerCase(),
        reassignReason.trim()
      );
      setReassignMsg({ type: 'success', text: `Approver successfully reassigned to ${newApproverEmail}. Notification email dispatched.` });
      
      // Update local state for immediate feedback
      currentTrip.currentApprover = newApproverEmail.trim().toLowerCase();
      currentTrip.currentApproverEmail = newApproverEmail.trim().toLowerCase();
      currentTrip.isApproverDelegated = true;
      currentTrip.delegatedReason = reassignReason.trim();

      if (onRefresh) {
        await onRefresh();
      }
      setTimeout(() => {
        setShowReassignModal(false);
      }, 1500);
    } catch (err) {
      setReassignMsg({ type: 'error', text: err.message || 'Failed to reassign approver' });
    } finally {
      setReassigning(false);
    }
  };

  // Quick lookup submit
  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (!lookupInput.trim()) return;
    const clean = lookupInput.trim().toLowerCase();
    const found = trips.find(t => 
      t.requestNum.toLowerCase().includes(clean) || 
      t.requestNum.toLowerCase().endsWith(clean)
    );
    if (found) {
      handleOpenDetail(found.requestNum);
      setShowLookupBox(false);
      setLookupInput('');
    } else {
      alert(`Trip #${lookupInput} not found. Please verify the request number.`);
    }
  };

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* 1. MAIN LIST VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Top Header Bar matching Screenshot */}
          <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Title & Shield Logo */}
            <div className="flex items-center space-x-3.5">
              <img 
                src={DISTRICT_SHIELD_LOGO} 
                alt="WVUSD Shield" 
                className="w-12 h-12 object-contain flex-shrink-0" 
              />
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-wider uppercase font-mono">
                  FIELD TRIPS
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Operations & Board Oversight Dashboard • Walnut Valley Unified School District
                </p>
              </div>
            </div>

            {/* Filter and Action Controls */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2.5">
              
              {/* Lookup Specific Request # button */}
              <div className="relative">
                <button
                  onClick={() => setShowLookupBox(!showLookupBox)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lookup Specific Request #</span>
                </button>

                {showLookupBox && (
                  <form 
                    onSubmit={handleLookupSubmit}
                    className="absolute right-0 top-10 z-30 bg-white p-3 rounded-xl shadow-xl border border-slate-200 w-64 space-y-2"
                  >
                    <label className="text-[11px] font-bold text-slate-700 block">Enter Request # (e.g. 807 or FT-2026-0042):</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 0042 or 807"
                      value={lookupInput}
                      onChange={(e) => setLookupInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-1.5">
                      <button 
                        type="button" 
                        onClick={() => setShowLookupBox(false)} 
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1 bg-blue-900 text-white rounded text-xs font-bold hover:bg-blue-800"
                      >
                        Search
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Status Segmented Filters: Pending | Complete | Declined | Cancelled | All */}
              <div className="bg-slate-100 p-1 rounded-lg flex space-x-0.5 text-xs font-bold">
                {['Pending', 'Complete', 'Declined', 'Cancelled', 'All'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-md transition ${
                      statusFilter === s 
                        ? 'bg-slate-700 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Secondary Filter Buttons: More than 50 Miles & Overnight */}
              <div className="flex space-x-1.5 text-xs">
                <button
                  onClick={() => setFilter50Miles(!filter50Miles)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                    filter50Miles 
                      ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-xs' 
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  More than 50 Miles
                </button>

                <button
                  onClick={() => setFilterOvernight(!filterOvernight)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                    filterOvernight 
                      ? 'bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs' 
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Overnight Trips
                </button>
              </div>

              {/* School Dropdown Filter */}
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-semibold focus:ring-1 focus:ring-blue-900"
              >
                <option value="All">All Schools (18 Sites)</option>
                {Object.keys(SITE_ADDRESSES).map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>

            </div>
          </div>

          {/* Quick Search & Count Bar */}
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">
                Showing <strong>{filteredTrips.length}</strong> of <strong>{trips.length}</strong> total field trips
              </span>
              {schoolFilter !== 'All' && (
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold text-[10px]">
                  Site: {schoolFilter}
                </span>
              )}
            </div>

            {/* Keyword Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder="Search destination, teacher, req #..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Table matching Screenshot columns */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">Req #</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Site</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center min-w-[130px]">Overall Status</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Current Approver</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-center">Board Flag</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Destination</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Dep. Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Submission Date</th>
                  <th className="px-4 py-3.5 max-w-[200px]">Notes</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-slate-400 text-xs">
                      No field trips match your selected filters. Try adjusting the status or school filter.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map(t => {
                    const logo = getSchoolLogo(t.site);
                    const rawType = (t.typeOfTrip || '').toLowerCase();
                    const cleanType = rawType.replace(/-/g, ' ');
                    const isOutOfState = cleanType.includes('out of state') || cleanType.includes('out of country') || rawType.includes('out-of-state');
                    const isApproval = Boolean(t.requiresBoardApproval || isOutOfState);
                    const isNotification = (!isApproval) && Boolean(t.requiresBoardNotification || t.isOvernight || t.isMoreThan50Miles || cleanType.includes('overnight') || cleanType.includes('50 miles'));

                    return (
                      <tr key={t.requestNum} className="hover:bg-slate-50/80 transition">
                        {/* Req # */}
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-xs">
                          {t.requestNum}
                        </td>

                        {/* Site with School Logo */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <img 
                              src={logo} 
                              alt={t.site} 
                              className="w-7 h-7 object-contain rounded p-0.5 bg-slate-50 border border-slate-200 flex-shrink-0"
                            />
                            <span className="font-semibold text-slate-800 text-xs">{t.site}</span>
                          </div>
                        </td>

                        {/* Overall Status Badge */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          {(() => {
                            const s = t.status || 'In progress';
                            let badgeStyle = 'bg-blue-100 text-blue-900 border-blue-200';
                            let label = 'Under Review';

                            if (s === 'Approved (Complete)' || s === 'Approved' || t.bucket === 'Complete') {
                              badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                              label = 'Complete';
                            } else if (s.includes('Action Required')) {
                              badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
                              label = 'Action Required';
                            } else if (s === 'Declined') {
                              badgeStyle = 'bg-red-100 text-red-900 border-red-300';
                              label = 'Declined';
                            } else if (s === 'Cancelled') {
                              badgeStyle = 'bg-slate-200 text-slate-700 border-slate-300';
                              label = 'Cancelled';
                            } else if (s.toLowerCase().includes('in progress')) {
                              badgeStyle = 'bg-slate-600 text-white border-slate-700';
                              label = 'In progress';
                            } else {
                              badgeStyle = 'bg-blue-100 text-blue-900 border-blue-300';
                              label = 'Under Review';
                            }

                            return (
                              <span 
                                title={t.status}
                                className={`inline-block px-3 py-1 rounded-full font-bold text-[11px] whitespace-nowrap border shadow-2xs ${badgeStyle}`}
                              >
                                {label}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Current Approver */}
                        <td className="px-4 py-3.5 font-medium text-slate-600 text-xs">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs">{t.currentApprover || 'Approved'}</span>
                            {t.isApproverDelegated && (
                              <span 
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                title={`Delegated Approver: ${t.delegatedReason || 'Reassigned coverage'}`}
                              >
                                Delegated
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Board Approval / Notification Flag */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isApproval ? (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-red-600 text-white font-extrabold text-[10px] leading-tight text-center shadow-xs">
                              <div>Board</div>
                              <div>Approval</div>
                            </span>
                          ) : isNotification ? (
                            <span className="inline-block px-2.5 py-1 rounded-md bg-blue-600 text-white font-extrabold text-[10px] leading-tight text-center shadow-xs">
                              <div>Board</div>
                              <div>Notification</div>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>

                        {/* Destination */}
                        <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">
                          {t.destination}
                        </td>

                        {/* Dep. Date */}
                        <td className="px-4 py-3.5 font-medium text-slate-600 text-xs">
                          {t.depDate || '-'}
                        </td>

                        {/* Submission Date */}
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          {t.submissionDate || '-'}
                        </td>

                        {/* Notes Snippet */}
                        <td className="px-4 py-3.5 max-w-[200px]">
                          {t.latestNote ? (
                            <div className="text-[11px] text-slate-700 truncate font-medium" title={t.latestNote}>
                              {t.latestNote}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No notes</span>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenDetail(t.requestNum)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TRIP DETAILS VIEW matching Screenshot 2 */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && currentTrip && (
        <div className="bg-[#fcfbf9] rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header Bar matching Screenshot */}
          <div className="p-4 sm:p-6 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to List</span>
              </button>

              <div className="flex items-center space-x-3">
                <img 
                  src={DISTRICT_SHIELD_LOGO} 
                  alt="District Shield" 
                  className="w-10 h-10 object-contain" 
                />
                <h1 className="text-xl font-extrabold text-slate-800 tracking-wider font-mono">
                  TRIP DETAILS
                </h1>
              </div>
            </div>

            {/* Right Office Portal Button */}
            {onSwitchView && (
              <button
                onClick={onSwitchView}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Office Portal
              </button>
            )}
          </div>

          {/* 3-Column Layout matching Screenshot */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ------------------------------------------------------------- */}
            {/* COLUMN 1: TRIP FOUNDATION */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="bg-[#1f2937] text-white px-4 py-2 rounded-lg font-bold text-xs tracking-wider text-center uppercase">
                TRIP FOUNDATION
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
                {/* Request # Quick Search */}
                <div>
                  <label className="text-red-700 font-bold block mb-1">
                    Request # (Type to search):
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={selectedReqId || currentTrip.requestNum}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedReqId(val);
                      }}
                      className="w-full px-3 py-2 border-2 border-red-300 rounded-lg font-mono font-bold text-slate-900 bg-white"
                    />
                    <div className="text-emerald-700 font-bold text-[11px] mt-1 flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Trip Located</span>
                    </div>
                  </div>
                </div>

                {/* Overall Status & Current Approver */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-0.5">Overall Status:</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentTrip.status || 'In progress'} 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-slate-500 font-semibold block">Current Approver:</label>
                      {currentTrip.status !== 'Approved (Complete)' && currentTrip.status !== 'Declined' && (
                        <button
                          type="button"
                          onClick={() => handleOpenReassign(currentTrip)}
                          className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center space-x-1 cursor-pointer transition"
                          title="Reassign / Delegate stage approver"
                        >
                          <UserCheck className="w-3 h-3 text-blue-600 inline" />
                          <span>Reassign</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        readOnly 
                        value={currentTrip.currentApprover || 'Approved'} 
                        className={`w-full px-2.5 py-1.5 bg-slate-50 border rounded text-slate-800 truncate font-mono text-xs ${
                          currentTrip.isApproverDelegated ? 'border-amber-400 bg-amber-50/60 font-bold text-amber-950' : 'border-slate-200'
                        }`}
                      />
                      {currentTrip.isApproverDelegated && (
                        <span 
                          className="absolute right-2 top-2 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300 uppercase tracking-wider"
                          title={`Delegated: ${currentTrip.delegatedReason || 'Reassigned approver'}`}
                        >
                          Delegated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Site with Logo */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Site:</label>
                  <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
                    <img 
                      src={getSchoolLogo(currentTrip.site)} 
                      alt={currentTrip.site} 
                      className="w-8 h-8 object-contain rounded bg-white p-0.5 border border-slate-200"
                    />
                    <span className="font-bold text-slate-800 text-xs">{currentTrip.site}</span>
                  </div>
                </div>

                {/* Teacher In Charge */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Teacher In Charge:</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={currentTrip.teacherInCharge || '-'} 
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium"
                  />
                </div>

                {/* Group / Organization */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Group / Organization:</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={currentTrip.group || '-'} 
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium"
                  />
                </div>

                {/* Submission Date */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Submission Date:</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={currentTrip.submissionDate || '-'} 
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono"
                  />
                </div>

              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* COLUMN 2: LOGISTICS & MAPS */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="bg-[#1f2937] text-white px-4 py-2 rounded-lg font-bold text-xs tracking-wider text-center uppercase">
                LOGISTICS & MAPS
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5 text-xs">
                {/* Type of Trip */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Type of Trip:</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={currentTrip.typeOfTrip || 'Educational - less than 50 miles'} 
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-semibold"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Destination:</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={currentTrip.destination} 
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-900 font-bold"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Address:</label>
                  <textarea 
                    readOnly 
                    rows="2"
                    value={currentTrip.address || 'Address on file'} 
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 resize-none font-medium"
                  />
                </div>

                {/* Distance From Site (matching legacy web dashboard) */}
                <div className="bg-[#f0ede6] p-3 rounded-lg border border-[#ded8cc] flex items-center justify-between">
                  <span className="text-[#1a73e8] font-bold text-xs sm:text-sm">Distance From Site:</span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={currentTrip.mileage ? String(currentTrip.mileage).replace(/ miles/i, '') : (currentTrip.isMoreThan50Miles ? '58.4' : '7.0')} 
                      className="w-20 px-2 py-1 text-center font-bold text-xs sm:text-sm bg-white border border-slate-300 rounded text-slate-800 shadow-2xs font-mono"
                    />
                    <span className="text-slate-600 font-semibold text-xs sm:text-sm">Miles</span>
                  </div>
                </div>

                {/* Board Criteria Alert Banners (if required) */}
                {(() => {
                  const rawType = (currentTrip.typeOfTrip || '').toLowerCase();
                  const cleanType = rawType.replace(/-/g, ' ');
                  const isOutOfState = cleanType.includes('out of state') || cleanType.includes('out of country') || rawType.includes('out-of-state');
                  const isApproval = Boolean(currentTrip.requiresBoardApproval || isOutOfState);
                  const isNotification = (!isApproval) && Boolean(currentTrip.requiresBoardNotification || currentTrip.isOvernight || currentTrip.isMoreThan50Miles || cleanType.includes('overnight') || cleanType.includes('50 miles'));

                  if (isApproval) {
                    return (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-300 rounded-lg text-red-900 text-xs flex items-start space-x-2">
                        <span className="text-base">🚨</span>
                        <div>
                          <strong className="block font-bold">Board Approval Required (Out-of-State):</strong>
                          This is an out-of-state field trip. Requires formal placement as an Action Item on the Board of Trustees Agenda.
                        </div>
                      </div>
                    );
                  }
                  if (isNotification) {
                    return (
                      <div className="mt-2 p-2.5 bg-blue-50 border border-blue-300 rounded-lg text-blue-900 text-xs flex items-start space-x-2">
                        <span className="text-base">📋</span>
                        <div>
                          <strong className="block font-bold">Board Notification (Overnight in CA / Over 50 Miles):</strong>
                          This trip involves an overnight stay in California or exceeds 50 miles. Requires placement on the Board Consent Calendar / Information Agenda.
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Departure & Return Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-0.5">Departure Date:</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentTrip.depDate} 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold block mb-0.5">Departure Time:</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentTrip.depTime || '08:00 AM'} 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 font-semibold block mb-0.5">Return Date:</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentTrip.retDate || currentTrip.depDate} 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 font-semibold block mb-0.5">Return Time:</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={currentTrip.retTime || '03:00 PM'} 
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-slate-500 font-semibold block mb-0.5">Description of Trip:</label>
                  <textarea 
                    readOnly 
                    rows="3"
                    value={currentTrip.description || 'No description provided.'} 
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 resize-none"
                  />
                </div>

              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* COLUMN 3: TRACKING & EXECUTION */}
            {/* ------------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="bg-[#1f2937] text-white px-4 py-2 rounded-lg font-bold text-xs tracking-wider text-center uppercase">
                TRACKING & EXECUTION
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
                
                {/* New Administrative Notes Input */}
                <form onSubmit={handleSaveNotes} className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      New Administrative Notes:
                    </label>
                    <textarea 
                      rows="4"
                      placeholder="Log calls, delays, board agenda notes, or updates here..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-900 resize-none bg-slate-50/50"
                    />
                  </div>

                  {/* Mark Completed Checkbox */}
                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isCompletedChecked}
                      onChange={(e) => setIsCompletedChecked(e.target.checked)}
                      className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900"
                    />
                    <span className="font-bold text-slate-800 text-xs">
                      Mark Trip Completed / Finalized
                    </span>
                  </label>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={savingNotes}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-sm flex items-center space-x-1.5 transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingNotes ? 'Saving Notes...' : 'Save Administrative Notes'}</span>
                    </button>

                    {notesSaveMsg && (
                      <span className="text-emerald-700 font-bold text-xs animate-fade-in">
                        {notesSaveMsg}
                      </span>
                    )}
                  </div>
                </form>

                <hr className="border-slate-200" />

                {/* Historical Total Notes Display */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Historical Total Notes:
                  </label>
                  <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 max-h-56 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                    {currentTrip.historicalNotes || (
                      <span className="text-slate-400 italic">No previous notes logged for this trip.</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REASSIGN / DELEGATE APPROVER MODAL */}
      {/* ========================================================================= */}
      {showReassignModal && currentTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30">
                  <UserCheck className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delegate / Reassign Stage Approver</h3>
                  <p className="text-xs text-blue-200 font-mono">Trip #{currentTrip.requestNum} • {currentTrip.site}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleReassignSubmit} className="p-6 space-y-4">
              {/* Trip Context Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Destination</span>
                  <strong className="text-slate-900 text-sm">{currentTrip.destination}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] font-bold uppercase block">Teacher in Charge</span>
                  <span className="font-semibold text-slate-800">{currentTrip.teacherInCharge}</span>
                </div>
              </div>

              {/* Stage Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Workflow Stage to Reassign:
                </label>
                <select
                  value={reassignStage}
                  onChange={(e) => setReassignStage(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Site Admin Assistant">Site Admin Assistant ({currentTrip.site})</option>
                  <option value="Dean">Dean</option>
                  <option value="Principal">Site Principal ({currentTrip.site})</option>
                  <option value="Operations Secretary">Operations Secretary</option>
                  <option value="Transportation">Transportation Department</option>
                  <option value="HR Personnel">HR Personnel</option>
                  <option value="Operations Director">Operations Director</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Active Review Stage: <strong className="text-slate-800">{currentTrip.currentStageName || 'Under Review'}</strong>
                </span>
              </div>

              {/* Current Assigned Approver */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Currently Assigned Email:</span>
                  <span className="font-mono text-slate-800 font-semibold">{currentTrip.currentApprover || 'Site Default'}</span>
                </div>
                {currentTrip.isApproverDelegated && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Already Delegated
                  </span>
                )}
              </div>

              {/* New Approver Email Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  New Approver Email Address (<span className="text-blue-600 font-mono">@wvusd.org</span>):
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="e.g. acting_principal@wvusd.org"
                    value={newApproverEmail}
                    onChange={(e) => setNewApproverEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Reason / Coverage Note */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Reassignment (Audit Trail & Notes):
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Acting Principal covering while Dr. Liew is at conference; out on medical leave through Friday; site coverage..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
                />
              </div>

              {/* Automated Email Notification Callout */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Automated Email Notification:</strong>
                  <span>Upon saving, the substitute approver will immediately receive an email notification containing trip details and a direct link to review and approve.</span>
                </div>
              </div>

              {/* Feedback Alert */}
              {reassignMsg && (
                <div className={`p-3 rounded-lg text-xs font-medium border flex items-center space-x-2 ${
                  reassignMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {reassignMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  <span>{reassignMsg.text}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  disabled={reassigning}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassigning}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {reassigning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Reassigning...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Confirm & Notify Approver</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
