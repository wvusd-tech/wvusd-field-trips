import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, Users, Utensils, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { api, GAS_API_URL } from '../api';

export default function RosterModal({ isOpen, onClose, trip }) {
  if (!isOpen || !trip) return null;

  const [rosterData, setRosterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState('');

  const reqId = trip.Request_ID;

  // Base URL for parent permission slips (prefer backend scriptUrl, fallback to GAS_API_URL)
  const studentSlipUrl = rosterData?.studentSlipUrl || `${GAS_API_URL}?view=slip&reqId=${encodeURIComponent(reqId)}`;
  const volunteerSlipUrl = rosterData?.volunteerSlipUrl || `${GAS_API_URL}?view=volunteer&reqId=${encodeURIComponent(reqId)}`;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getRoster(reqId)
      .then(res => {
        if (isMounted) {
          setRosterData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Error fetching roster:", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [reqId]);

  // Trigger Google Classroom share widget re-render
  useEffect(() => {
    if (window.gapi?.sharetoclassroom?.render) {
      try {
        window.gapi.sharetoclassroom.render('classroomShareBtn', {
          url: studentSlipUrl,
          size: 32
        });
      } catch (e) {
        console.warn("Classroom widget render:", e);
      }
    }
  }, [studentSlipUrl, rosterData]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(''), 2500);
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.exportCafeteriaCsv(reqId);
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reqId}_Cafeteria_Roster.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error exporting CSV: " + e.message);
    }
  };

  const students = rosterData?.students || [];
  const volunteers = rosterData?.volunteers || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-blue-200">Student Roster & Clearance</span>
            <h2 className="text-xl font-bold">{trip.Destination} ({trip.Request_ID})</h2>
            <p className="text-xs text-blue-200 mt-0.5">{trip.Site} • {trip.Group_Name} • {trip.Departure_Date}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action & Metric Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Counters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-900" />
              <span>Students: <strong className="text-slate-900 font-bold">{students.length}</strong></span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>Brunches: <strong className="text-slate-900 font-bold">{rosterData?.brunchCount || 0}</strong></span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-green-600" />
              <span>Lunches: <strong className="text-slate-900 font-bold">{rosterData?.lunchCount || 0}</strong></span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Volunteers: <strong className="text-slate-900 font-bold">{volunteers.length}</strong></span>
            </div>
          </div>

          {/* Right Action: CSV Export & Google Classroom Share */}
          <div className="flex items-center space-x-3">
            
            {/* Google Share to Classroom Button (Only when trip is approved) */}
            {(trip?.Status === 'Approved (Complete)' || trip?.Status === 'Approved') && (
              <div className="flex items-center" title="Share Permission Slip Link to Google Classroom">
                <div id="classroomShareBtn" className="hidden sm:block"></div>
                <a 
                  href={`https://classroom.google.com/share?url=${encodeURIComponent(studentSlipUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <img src="https://www.gstatic.com/classroom/logo_square_48.svg" alt="Google Classroom" className="w-4 h-4" />
                  <span>Share to Classroom</span>
                </a>
              </div>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Cafeteria CSV</span>
            </button>
          </div>

        </div>

        {/* Slip Copier Links Bar */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 truncate">
            <span className="font-bold text-slate-700">Student Slip Link:</span>
            <a 
              href={studentSlipUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[11px] font-mono text-blue-700 hover:text-blue-900 hover:underline truncate max-w-xs sm:max-w-md inline-flex items-center gap-1"
              title="Open Student Permission Slip in Apps Script"
            >
              <span className="truncate">{studentSlipUrl}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => copyToClipboard(studentSlipUrl, 'student')} 
              className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1"
            >
              {copiedLink === 'student' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink === 'student' ? 'Copied!' : 'Copy Student Link'}</span>
            </button>
            <button 
              onClick={() => copyToClipboard(volunteerSlipUrl, 'volunteer')} 
              className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1"
            >
              {copiedLink === 'volunteer' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink === 'volunteer' ? 'Copied!' : 'Copy Volunteer Link'}</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900 border-t-transparent mx-auto mb-2"></div>
              Loading live permission slip roster...
            </div>
          ) : (
            <>
              {/* Student Slips Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Student Permission Slips ({students.length})
                </h3>

                {students.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                    No student permission slips submitted yet. Share your slip link with parents or to Google Classroom.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px]">
                        <tr>
                          <th className="px-3 py-2.5">Student ID</th>
                          <th className="px-3 py-2.5">Student Name</th>
                          <th className="px-3 py-2.5">Teacher</th>
                          <th className="px-3 py-2.5">Meals</th>
                          <th className="px-3 py-2.5">Parent Contact</th>
                          <th className="px-3 py-2.5">Insurance Status</th>
                          <th className="px-3 py-2.5">Health Clearance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {students.map(s => (
                          <tr key={s.slipId} className="hover:bg-slate-50/80 transition">
                            <td className="px-3 py-2.5 font-mono font-bold text-blue-900">{s.studentId}</td>
                            <td className="px-3 py-2.5 font-bold text-slate-900">{s.studentName}</td>
                            <td className="px-3 py-2.5 text-slate-600">{s.assignedTeacher}</td>
                            <td className="px-3 py-2.5">
                              <span className="font-semibold text-[11px]">
                                Brunch: {s.needsBrunch} • Lunch: {s.needsLunch}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="text-xs font-medium">{s.parentPhone}</div>
                              <div className="text-[10px] text-slate-400">{s.parentEmail}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                s.insuranceBadge === 'Verified' ? 'bg-green-100 text-green-800' :
                                s.insuranceBadge === 'Pending Nurse Review' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {s.insuranceBadge}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                s.medicalBadge.includes('Alert') 
                                  ? 'bg-red-100 text-red-800 border border-red-300' 
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {s.medicalBadge}
                              </span>
                              {s.medicalDetails && (
                                <div className="text-[10px] text-red-700 font-semibold mt-0.5">{s.medicalDetails}</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Volunteer Slips Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Volunteer Chaperones ({volunteers.length})
                </h3>

                {volunteers.length === 0 ? (
                  <div className="p-4 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                    No volunteer slips submitted yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px]">
                        <tr>
                          <th className="px-3 py-2.5">Volunteer Name</th>
                          <th className="px-3 py-2.5">Child Name</th>
                          <th className="px-3 py-2.5">Emergency Contact</th>
                          <th className="px-3 py-2.5">Insurance Carrier</th>
                          <th className="px-3 py-2.5">Date Signed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {volunteers.map(v => (
                          <tr key={v.slipId} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2.5 font-bold text-slate-900">{v.volunteerName}</td>
                            <td className="px-3 py-2.5 text-slate-600">{v.childName}</td>
                            <td className="px-3 py-2.5 text-slate-600">{v.emergencyContact}</td>
                            <td className="px-3 py-2.5 text-slate-600">{v.insuranceCarrier}</td>
                            <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{v.signedDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition">
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
