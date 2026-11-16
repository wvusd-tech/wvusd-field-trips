import React, { useState, useEffect } from 'react';
import { X, Utensils, CheckCircle, AlertCircle, Clock, Send, ShieldCheck, FileText, Check } from 'lucide-react';
import { api } from '../api';

export default function MealRequestModal({ isOpen, onClose, trip, rosterData, onSubmitted }) {
  if (!isOpen || !trip) return null;

  const currentMealRequest = rosterData?.mealRequest;
  const isAlreadySubmitted = !!currentMealRequest?.submitted;

  // Defaults
  const [pickupTime, setPickupTime] = useState(currentMealRequest?.pickupTime || '08:00 AM');
  const [breakfastCount, setBreakfastCount] = useState(
    currentMealRequest?.breakfastCount !== undefined ? currentMealRequest.breakfastCount : (rosterData?.brunchCount || 0)
  );
  const [lunchCount, setLunchCount] = useState(
    currentMealRequest?.lunchCount !== undefined ? currentMealRequest.lunchCount : (rosterData?.lunchCount || 0)
  );

  // Compliance Checkboxes
  const [universalAccess, setUniversalAccess] = useState(true);
  const [breakfastOffered, setBreakfastOffered] = useState(true);
  const [lunchOffered, setLunchOffered] = useState(true);
  const [teacherSignature, setTeacherSignature] = useState(currentMealRequest?.teacherSignature || trip.Teacher_In_Charge || '');
  
  // Acknowledgements (Question 13)
  const [ackNotice, setAckNotice] = useState(true);
  const [ackPostRoster, setAckPostRoster] = useState(true);
  const [ackColdStorage, setAckColdStorage] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Update default counts when rosterData changes
  useEffect(() => {
    if (!isAlreadySubmitted && rosterData) {
      if (rosterData.brunchCount !== undefined) setBreakfastCount(rosterData.brunchCount);
      if (rosterData.lunchCount !== undefined) setLunchCount(rosterData.lunchCount);
    }
  }, [rosterData, isAlreadySubmitted]);

  const teacherBreakdown = rosterData?.teacherBreakdown || {};
  const hasMultipleTeachers = Object.keys(teacherBreakdown).length > 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!universalAccess) {
      setErrorMsg('Universal Access Provision Confirmation is required per EC 49501.5.');
      return;
    }
    if (!breakfastOffered || !lunchOffered) {
      setErrorMsg('Both breakfast and lunch offering compliance checks must be confirmed.');
      return;
    }
    if (!ackNotice || !ackPostRoster || !ackColdStorage) {
      setErrorMsg('All three Acknowledgement of Requirements checkboxes must be confirmed.');
      return;
    }
    if (!teacherSignature.trim()) {
      setErrorMsg('Please enter the Name of the Teacher in Charge as the digital signature.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        requestId: trip.Request_ID,
        pickupTime,
        breakfastCount: Number(breakfastCount),
        lunchCount: Number(lunchCount),
        teacherSignature: teacherSignature.trim(),
        universalAccess,
        breakfastOffered,
        lunchOffered,
        ackNotice,
        ackPostRoster,
        ackColdStorage
      };

      await api.submitMealRequest(trip.Request_ID, payload);
      setSuccessMsg('Meal Request successfully submitted! Notification dispatched to the site cafeteria supervisor.');
      if (onSubmitted) onSubmitted();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit meal request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-800 flex items-center justify-center text-amber-300">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Field Trip Meals Request Form</h2>
              <p className="text-[11px] text-blue-200">Per CA Ed Code 49501.5 (Mandated Free Breakfast & Lunch Provision)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          
          {/* Submission status banner if already submitted */}
          {isAlreadySubmitted && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start space-x-2.5 text-emerald-900">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-xs">Meal Request Already Submitted</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Submitted on {currentMealRequest?.submittedAt ? new Date(currentMealRequest.submittedAt).toLocaleDateString() : 'file'} by {currentMealRequest?.submittedBy || 'Teacher'}.
                  You may update and re-send the request below if trip headcounts have changed.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-2 text-green-800 font-medium">
              <Check className="w-4 h-4 flex-shrink-0 text-green-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Trip Identification */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">School Site (Q2)</span>
              <strong className="text-slate-900 text-sm">{trip.Site}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Field Trip Date (Q5)</span>
              <strong className="text-slate-900 text-sm">{trip.Departure_Date}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Teacher / Group (Q3)</span>
              <span className="font-semibold text-slate-800">{trip.Teacher_In_Charge} • {trip.Group_Name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade(s) Involved (Q4)</span>
              <span className="font-semibold text-slate-800">{trip.Grades}</span>
            </div>
          </div>

          {/* Section 2: Meal Counts & Pickup Time */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3.5 bg-white shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-800" />
              <span>Meal Counts & Pickup Logistics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Meals Pick-up Time (Q6) *
                </label>
                <input
                  type="text"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  placeholder="e.g. 08:00 AM"
                  required
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Approx. 30 min before departure</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Number of Breakfasts (Q7) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={breakfastCount}
                  onChange={(e) => setBreakfastCount(e.target.value)}
                  required
                  className="w-full text-xs font-bold p-2 border border-amber-300 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
                <span className="text-[10px] text-amber-700">From slips: {rosterData?.brunchCount || 0}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                  Number of Lunches (Q8) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={lunchCount}
                  onChange={(e) => setLunchCount(e.target.value)}
                  required
                  className="w-full text-xs font-bold p-2 border border-emerald-300 bg-emerald-50/50 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <span className="text-[10px] text-emerald-700">From slips: {rosterData?.lunchCount || 0}</span>
              </div>
            </div>

            {/* Breakdown by teacher if multiple teachers on the trip */}
            {hasMultipleTeachers && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Classroom / Teacher Breakdown</span>
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Assigned Teacher</th>
                        <th className="p-2 text-center">Breakfasts</th>
                        <th className="p-2 text-center">Lunches</th>
                        <th className="p-2 text-center">Total Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Object.entries(teacherBreakdown).map(([teacher, counts]) => (
                        <tr key={teacher}>
                          <td className="p-2 font-medium text-slate-800">{teacher}</td>
                          <td className="p-2 text-center font-bold text-amber-900">{counts.breakfasts}</td>
                          <td className="p-2 text-center font-bold text-emerald-900">{counts.lunches}</td>
                          <td className="p-2 text-center text-slate-500">{counts.totalStudents}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Legal Compliance & Offerings (Questions 9-11) */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-800" />
              <span>CA Ed Code 49501.5 Compliance Checks</span>
            </h3>

            {/* Question 9 */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="flex items-start space-x-2 font-semibold text-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={universalAccess}
                  onChange={(e) => setUniversalAccess(e.target.checked)}
                  required
                  className="rounded text-blue-900 mt-0.5 h-4 w-4"
                />
                <span><strong>Q9. Universal Access Provision Confirmation:</strong> I understand that Universal Access is required for all field trip meal requests. *</span>
              </label>
            </div>

            {/* Question 10 */}
            <div className="space-y-1.5 pt-1">
              <span className="font-bold text-slate-800 block text-[11px]">
                Q10. Compliance Check: Meal Offerings (Required per EC 49501.5) *
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center space-x-2 font-medium cursor-pointer text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 flex-1">
                  <input
                    type="checkbox"
                    checked={breakfastOffered}
                    onChange={(e) => setBreakfastOffered(e.target.checked)}
                    required
                    className="rounded text-blue-900 h-4 w-4"
                  />
                  <span>Breakfast was offered to the students.</span>
                </label>
                <label className="flex items-center space-x-2 font-medium cursor-pointer text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 flex-1">
                  <input
                    type="checkbox"
                    checked={lunchOffered}
                    onChange={(e) => setLunchOffered(e.target.checked)}
                    required
                    className="rounded text-blue-900 h-4 w-4"
                  />
                  <span>Lunch was offered to the students.</span>
                </label>
              </div>
            </div>

            {/* Question 11 & 12 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Q11. Name of Teacher in charge (Digital Signature) *
                </label>
                <input
                  type="text"
                  value={teacherSignature}
                  onChange={(e) => setTeacherSignature(e.target.value)}
                  placeholder="Type Full Legal Name"
                  required
                  className="w-full text-xs font-serif italic p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-800 outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Signature indicates compliance with EC 49501.5</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Q12. Date of Submission *
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  readOnly
                  className="w-full text-xs font-mono p-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Acknowledgement of Requirements (Question 13) */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-amber-50/40 border-amber-200/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-amber-800" />
              <span>Q13. Acknowledgement of Requirements *</span>
            </h3>

            <div className="space-y-2 text-[11px] text-slate-700">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ackNotice}
                  onChange={(e) => setAckNotice(e.target.checked)}
                  required
                  className="rounded text-amber-800 mt-0.5 h-4 w-4"
                />
                <span>I acknowledge that I have provided 2 weeks' advance notice.</span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ackPostRoster}
                  onChange={(e) => setAckPostRoster(e.target.checked)}
                  required
                  className="rounded text-amber-800 mt-0.5 h-4 w-4"
                />
                <span>
                  I acknowledge that I must send the student participation roster to the kitchen supervisor <strong>*after*</strong> the field trip (Pre-counts are not allowable for state claiming).
                </span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ackColdStorage}
                  onChange={(e) => setAckColdStorage(e.target.checked)}
                  required
                  className="rounded text-amber-800 mt-0.5 h-4 w-4"
                />
                <span>
                  I understand that cold items must be stored at or below 40 degrees Fahrenheit and Nutrition Services must be notified of any changes.
                </span>
              </label>
            </div>
          </div>

          {/* Footer note about cafeteria destination */}
          <div className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-lg flex items-center justify-between">
            <span>Official recipient: <strong>Site Cafeteria Supervisor</strong> ({rosterData?.siteCafeteriaEmail || 'Configured Site Email'})</span>
            <span className="font-semibold text-slate-700">CC: Requesting Teacher</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting to Cafeteria...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAlreadySubmitted ? 'Update & Re-send Meal Request' : 'Submit Official Meal Request'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}