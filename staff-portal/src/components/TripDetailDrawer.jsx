import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Clock, Send, FileText, ChevronRight, MessageSquare, Shield } from 'lucide-react';
import { formatStageName } from '../api';

export default function TripDetailDrawer({ isOpen, onClose, tripData, onActionSubmit }) {
  if (!isOpen || !tripData) return null;

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { trip, logs = [], pipeline = [], canAct = false } = tripData;

  const handleAction = async (decision) => {
    if (decision === 'Request Changes' && !commentText.trim()) {
      alert("Please provide comments explaining what changes the teacher needs to make.");
      return;
    }
    setSubmitting(true);
    try {
      await onActionSubmit(trip.Request_ID, decision, commentText);
      setCommentText('');
      onClose();
    } catch (e) {
      alert("Error submitting action: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col border-l border-slate-200">
        
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs bg-slate-800 text-blue-300 font-bold px-2 py-0.5 rounded border border-slate-700">
                {trip.Request_ID}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                trip.Status === 'Approved (Complete)' ? 'bg-green-500/20 text-green-300 border border-green-500/40' :
                trip.Status === 'Declined' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                trip.Status.includes('Action Required') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {trip.Status}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-2">{trip.Destination}</h2>
            <p className="text-xs text-slate-300">{trip.Site} • {trip.Group_Name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">

          {/* 7-Stage Visual Pipeline Bar inside Drawer */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">Sequential Approval State</span>
            <div className="flex flex-wrap gap-1.5">
              {pipeline.map(st => (
                <div 
                  key={st.key}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border flex items-center space-x-1 ${
                    st.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                    st.status === 'active' ? 'bg-blue-900 text-white border-blue-950 font-bold shadow-xs' :
                    st.status === 'changes_requested' ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' :
                    st.status === 'declined' ? 'bg-red-100 text-red-800 border-red-300' :
                    st.status === 'skipped' ? 'bg-slate-100 text-slate-400 border-slate-200 line-through' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title={st.actorEmail ? `Signed by ${st.actorEmail}` : st.name}
                >
                  <span>{st.label}</span>
                  {st.status === 'approved' && <CheckCircle className="w-3 h-3 text-green-700" />}
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Departure</span>
              <strong className="text-slate-900">{trip.Departure_Date}</strong>
              <div className="text-[11px] text-slate-500">{trip.Departure_Time}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Return</span>
              <strong className="text-slate-900">{trip.Return_Date}</strong>
              <div className="text-[11px] text-slate-500">{trip.Return_Time}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Students</span>
              <strong className="text-slate-900">{trip.Student_Count} Students</strong>
              <div className="text-[11px] text-slate-500">{trip.Grades}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Transportation</span>
              <strong className="text-slate-900">{trip.Transportation_Type}</strong>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3">
            <div>
              <span className="font-bold text-slate-800 uppercase block mb-1">Teacher in Charge</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <strong>{trip.Teacher_In_Charge}</strong> ({trip.Requester_Email})
                {trip.Co_Teachers_Emails && (
                  <span className="text-slate-500 block text-[11px]">Co-Teachers: {trip.Co_Teachers_Emails}</span>
                )}
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase block mb-1">Venue Address</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">{trip.Venue_Address}</div>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase block mb-1">Activity Description</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap">{trip.Activity_Description}</div>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase block mb-1">Instructional Program Alignment</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap">{trip.Instructional_Alignment}</div>
            </div>

            <div>
              <span className="font-bold text-slate-800 uppercase block mb-1">Supervision & Chaperone Plan</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap">{trip.Supervision_Plan}</div>
            </div>

            {trip.Special_Needs_Explanation && (
              <div>
                <span className="font-bold text-slate-800 uppercase block mb-1">Special Needs & Accommodations</span>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap">{trip.Special_Needs_Explanation}</div>
              </div>
            )}

            {trip.Roster_File_URL && (
              <div>
                <span className="font-bold text-slate-800 uppercase block mb-1">Student Roster Attachment</span>
                <a 
                  href={trip.Roster_File_URL} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold hover:bg-blue-100 transition"
                >
                  <FileText className="w-4 h-4 text-blue-900" />
                  <span>Download Initial Roster</span>
                </a>
              </div>
            )}
          </div>

          {/* Chronological Approval Logs & Comment Thread */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-blue-900" />
              <span>Audit Trail & Comments History</span>
            </h4>

            {logs.length === 0 ? (
              <p className="text-slate-400 italic">No approval comments recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {logs.map(log => (
                  <div key={log.logId} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span><strong className="text-slate-800">{formatStageName(log.actorRole)}</strong> ({log.actorEmail})</span>
                      <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        log.action === 'Approved' ? 'bg-green-100 text-green-800' :
                        log.action === 'Declined' ? 'bg-red-100 text-red-800' :
                        log.action === 'Request Changes' ? 'bg-amber-100 text-amber-800' :
                        log.action === 'Reassigned Approver' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-slate-700">{log.commentText || 'No comments left.'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Stage Action Bar (Enforced by canAct) */}
        {canAct ? (
          <div className="p-4 bg-slate-50 border-t-2 border-blue-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 uppercase flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-blue-900" />
                <span>Action Required: {formatStageName(trip.Current_Stage)}</span>
              </span>
              <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                You are authorized to act
              </span>
            </div>

            <textarea
              rows="2"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter optional comments, or revision requirements for teacher..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-blue-900"
            />

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleAction('Request Changes')}
                disabled={submitting}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs"
              >
                Request Changes / Comment
              </button>

              <button
                type="button"
                onClick={() => handleAction('Decline')}
                disabled={submitting}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Decline Trip
              </button>

              <button
                type="button"
                onClick={() => handleAction('Approve')}
                disabled={submitting}
                className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center space-x-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                <span>Approve Step</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              {trip.Locked_Boolean ? 'This request is finalized and locked.' : `Awaiting action at stage: ${formatStageName(trip.Current_Stage)}.`}
            </span>
            <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-semibold">
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
