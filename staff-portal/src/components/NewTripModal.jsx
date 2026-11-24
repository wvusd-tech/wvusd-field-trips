import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Upload, Check, FileText, Bus, Plane, Train, Car, Info } from 'lucide-react';
import { WVUSD_SITES, WVUSD_DEANS } from '../api';

const ALL_GRADES = [
  'Preschool', 'Transitional Kindergarten', 'Kindergarten', 
  '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', 
  '9th', '10th', '11th', '12th', 'HARTT / ATP'
];

export default function NewTripModal({ isOpen, onClose, onSubmit, editTrip = null, currentUser }) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    Site: '',
    Trip_Type: 'Educational - less than 50 miles',
    Dean_Name: 'Not Applicable',
    Dean_Email: '',
    Teacher_In_Charge: currentUser?.name || '',
    Co_Teachers_Emails: '',
    Group_Name: '',
    Destination: '',
    Venue_Address: '',
    Departure_Date: '',
    Departure_Time: '',
    Return_Date: '',
    Return_Time: '',
    Competition_Dates: '',
    Is_Recurring: 'No',
    Recurring_Dates: '',
    Grades: '',
    Student_Count: 1,
    Female_Students: 0,
    Male_Students: 0,
    Housing_Provisions: '',
    Roster_File_URL: '',
    Teacher_Count: 1,
    Volunteer_Count: 0,
    Female_Volunteers: 0,
    Male_Volunteers: 0,
    Cleared_Volunteers: '',
    Board_Approval_Ack: false,
    Transportation_Type: 'School Bus',
    Activity_Description: '',
    Instructional_Alignment: '',
    Special_Needs_Explanation: '',
    All_Students_Included: 'Yes',
    Supervision_Plan: '',
    Funding_Source: '',
    Cost_Per_Student: 0,
    Total_Cost: 0,
    Fundraising_Plan: '',
    Emergency_Insurance_Prep: 'Yes',
    Restart_Ack: false,
    revisionComment: ''
  });

  const [transportDetails, setTransportDetails] = useState({
    schoolBusTF: '',
    boosterSeat: false,
    safetyVest: false,
    wheelchairBus: false,
    charterContacted: 'No',
    charterTF: '',
    rentalTF: '',
    rentalDrivers: '',
    flightDetails: '',
    flightBusTF: '',
    flightGroundTransport: '',
    noCarpoolAirportAck: false,
    trainInfo: '',
    trainBusTF: '',
    walking: false,
    publicTransit: false,
    staffCarpool: false,
    parentDriveOwnOnly: false,
    staffDriversList: ''
  });

  const [selectedGrades, setSelectedGrades] = useState([]);
  const [rosterFileName, setRosterFileName] = useState('');
  const [rosterFileBase64, setRosterFileBase64] = useState('');
  const [isAthleticAutoAssigned, setIsAthleticAutoAssigned] = useState(false);
  const [ratioAcknowledged, setRatioAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize or pre-fill on edit
  useEffect(() => {
    if (editTrip) {
      setForm({
        ...editTrip,
        Board_Approval_Ack: editTrip.Board_Approval_Ack === 'Yes',
        Restart_Ack: editTrip.Restart_Ack === 'Yes',
        revisionComment: ''
      });
      if (editTrip.Grades) {
        setSelectedGrades(editTrip.Grades.split(',').map(s => s.trim()));
      }
      if (editTrip.Transport_Details_JSON) {
        try {
          setTransportDetails(JSON.parse(editTrip.Transport_Details_JSON));
        } catch (e) {}
      }
      if (editTrip.Roster_File_URL) {
        setRosterFileName("Attached Roster File");
      }
      setRatioAcknowledged(editTrip.Ratio_Acknowledged === 'Yes');
    } else {
      setRatioAcknowledged(false);
      setForm(prev => ({
        ...prev,
        Teacher_In_Charge: currentUser?.name || '',
        Requester_Email: currentUser?.email || ''
      }));
    }
  }, [editTrip, currentUser]);

  const isOvernight = form.Trip_Type.includes('Overnight');

  // Athletic auto-routing
  const handleSiteOrTripTypeChange = (newSite, newTripType) => {
    const s = newSite !== undefined ? newSite : form.Site;
    const t = newTripType !== undefined ? newTripType : form.Trip_Type;

    if (t === 'Athletic Event - less than 50 miles') {
      if (s === 'Diamond Bar High School') {
        setForm(prev => ({ ...prev, Site: s, Trip_Type: t, Dean_Name: 'Kurt Davies', Dean_Email: 'kdavies@wvusd.org' }));
        setIsAthleticAutoAssigned(true);
        return;
      } else if (s === 'Walnut High School') {
        setForm(prev => ({ ...prev, Site: s, Trip_Type: t, Dean_Name: 'Valerie Varela', Dean_Email: 'vvarela@wvusd.org' }));
        setIsAthleticAutoAssigned(true);
        return;
      }
    }
    setIsAthleticAutoAssigned(false);
    setForm(prev => ({ ...prev, Site: s, Trip_Type: t }));
  };

  const handleDeanChange = (deanName) => {
    if (deanName === 'Not Applicable') {
      setForm(prev => ({ ...prev, Dean_Name: 'Not Applicable', Dean_Email: '' }));
    } else {
      const d = WVUSD_DEANS.find(dean => dean.name === deanName);
      setForm(prev => ({ ...prev, Dean_Name: deanName, Dean_Email: d ? d.email : '' }));
    }
  };

  const toggleGrade = (grade) => {
    if (selectedGrades.includes(grade)) {
      setSelectedGrades(selectedGrades.filter(g => g !== grade));
    } else {
      setSelectedGrades([...selectedGrades, grade]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRosterFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setRosterFileBase64(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const studentNum = parseInt(form.Student_Count, 10) || 0;
  const teacherNum = parseInt(form.Teacher_Count, 10) || 0;
  const volunteerNum = parseInt(form.Volunteer_Count, 10) || 0;
  const totalAdults = teacherNum + volunteerNum;
  const minChaperonesRequired = studentNum > 0 ? Math.ceil(studentNum / 10) : 0;
  const isRatioCompliant = studentNum === 0 || (totalAdults > 0 && totalAdults >= minChaperonesRequired);
  const ratioPerAdult = totalAdults > 0 
    ? (studentNum / totalAdults % 1 === 0 ? (studentNum / totalAdults) : (studentNum / totalAdults).toFixed(1)) 
    : studentNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editTrip && !rosterFileBase64 && !form.Roster_File_URL) {
      alert("A Student Roster file upload is required for all field trips.");
      return;
    }

    if (!isRatioCompliant && !ratioAcknowledged) {
      alert(`Policy Acknowledgment Required:\n\nYour current ratio of 1:${ratioPerAdult} exceeds the district policy of 1:10.\n\nPlease check the box: "I understand my current ratio (1:${ratioPerAdult}) does not meet district policy." before submitting.`);
      return;
    }

    setSubmitting(true);
    const completeFormData = {
      ...form,
      Grades: selectedGrades.join(', '),
      Transport_Details_JSON: JSON.stringify(transportDetails),
      rosterFileName,
      rosterFileBase64,
      Chaperone_Ratio: `1:${ratioPerAdult}`,
      Ratio_Compliant: isRatioCompliant ? 'Yes' : 'No',
      Ratio_Acknowledged: !isRatioCompliant ? (ratioAcknowledged ? 'Yes' : 'No') : 'Compliant',
      Board_Approval_Ack: form.Board_Approval_Ack ? 'Yes' : 'No',
      Restart_Ack: form.Restart_Ack ? 'Yes' : 'No'
    };

    try {
      await onSubmit(completeFormData);
      onClose();
    } catch (err) {
      alert("Error submitting form: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-blue-200">
              {editTrip ? 'Field Trip Revision Mode' : 'New Field Trip Submission'}
            </span>
            <h2 className="text-xl font-bold">
              {editTrip ? `Edit Request: ${editTrip.Request_ID}` : 'WVUSD Field Trip Request Form'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 8-Week Submission Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">WVUSD 8-Week Advance Submission Policy:</strong> All field trips must be submitted at least 8 weeks prior to departure for site review, transportation, board approval, and health office clearance.
          </div>
        </div>

        {/* Revision Notice Banner */}
        {editTrip && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 text-xs text-blue-950">
            <strong>Revision Instructions:</strong> Approver requested changes. Update the form fields below and submit to return the request to the review queue.
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-8 flex-1">

          {/* Section 1: Trip Identity & Routing */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Site Logistics & Staff Routing</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">School / Site *</label>
                <select 
                  value={form.Site} 
                  onChange={(e) => handleSiteOrTripTypeChange(e.target.value, form.Trip_Type)} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-blue-900 bg-white"
                >
                  <option value="">Select Site...</option>
                  {WVUSD_SITES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Trip Type *</label>
                <select 
                  value={form.Trip_Type} 
                  onChange={(e) => handleSiteOrTripTypeChange(form.Site, e.target.value)} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-blue-900 bg-white"
                >
                  <optgroup label="Day Trips">
                    <option value="Educational - less than 50 miles">Educational - less than 50 miles</option>
                    <option value="Recreational - less than 50 miles">Recreational - less than 50 miles</option>
                    <option value="Athletic Event - less than 50 miles">Athletic Event - less than 50 miles</option>
                    <option value="Extended Same Day - more than 50 miles">Extended Same Day - more than 50 miles</option>
                  </optgroup>
                  <optgroup label="Overnight Trips">
                    <option value="Overnight (in California)">Overnight (in California)</option>
                    <option value="Overnight (out of state)">Overnight (out of state)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Dean / Athletic Dean *
                  {isAthleticAutoAssigned && <span className="text-[10px] text-green-700 font-semibold lowercase ml-1">(Auto-Assigned)</span>}
                </label>
                <select 
                  value={form.Dean_Name} 
                  onChange={(e) => handleDeanChange(e.target.value)} 
                  required 
                  className={`w-full text-xs border rounded-lg p-2.5 focus:border-blue-900 ${isAthleticAutoAssigned ? 'bg-green-50 border-green-300 font-bold' : 'bg-white border-slate-300'}`}
                >
                  <option value="Not Applicable">Not Applicable</option>
                  {WVUSD_DEANS.map(d => <option key={d.name} value={d.name}>{d.name} ({d.email})</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Teacher in Charge *</label>
                <input 
                  type="text" 
                  value={form.Teacher_In_Charge} 
                  onChange={(e) => setForm({ ...form, Teacher_In_Charge: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Requester Email (Read-Only)</label>
                <input 
                  type="email" 
                  value={currentUser?.email || ''} 
                  disabled 
                  className="w-full text-xs bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-slate-600" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Optional Co-Teachers (@wvusd.org)</label>
                <input 
                  type="text" 
                  value={form.Co_Teachers_Emails} 
                  onChange={(e) => setForm({ ...form, Co_Teachers_Emails: e.target.value })} 
                  placeholder="teacher2@wvusd.org, teacher3@wvusd.org" 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Student Group / Class Name *</label>
                <input 
                  type="text" 
                  value={form.Group_Name} 
                  onChange={(e) => setForm({ ...form, Group_Name: e.target.value })} 
                  placeholder="e.g. 5th Grade Science, Varsity Tennis" 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Destination Name *</label>
                <input 
                  type="text" 
                  value={form.Destination} 
                  onChange={(e) => setForm({ ...form, Destination: e.target.value })} 
                  placeholder="e.g. California Science Center" 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Venue Full Address *</label>
                <input 
                  type="text" 
                  value={form.Venue_Address} 
                  onChange={(e) => setForm({ ...form, Venue_Address: e.target.value })} 
                  placeholder="Street, City, State, Zip" 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
            </div>

            {/* Dates & Schedule */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Departure Date *</label>
                <input 
                  type="date" 
                  value={form.Departure_Date} 
                  onChange={(e) => setForm({ ...form, Departure_Date: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Departure Time *</label>
                <input 
                  type="time" 
                  value={form.Departure_Time} 
                  onChange={(e) => setForm({ ...form, Departure_Time: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Return Date *</label>
                <input 
                  type="date" 
                  value={form.Return_Date} 
                  onChange={(e) => setForm({ ...form, Return_Date: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Return Time *</label>
                <input 
                  type="time" 
                  value={form.Return_Time} 
                  onChange={(e) => setForm({ ...form, Return_Time: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
            </div>

            {/* Competition & Recurring */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Competition / Tournament Dates (If applicable)</label>
                <input 
                  type="text" 
                  value={form.Competition_Dates} 
                  onChange={(e) => setForm({ ...form, Competition_Dates: e.target.value })} 
                  placeholder="e.g. Rounds on Dec 10-11" 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Recurring Event? *</label>
                <select 
                  value={form.Is_Recurring} 
                  onChange={(e) => setForm({ ...form, Is_Recurring: e.target.value })} 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="No">No (Single event)</option>
                  <option value="Yes">Yes (Recurring schedule)</option>
                </select>
                {form.Is_Recurring === 'Yes' && (
                  <input 
                    type="text" 
                    value={form.Recurring_Dates} 
                    onChange={(e) => setForm({ ...form, Recurring_Dates: e.target.value })} 
                    placeholder="List all dates (e.g. Every second Wednesday)" 
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 mt-2" 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Participants, Overnight Branching & Roster Upload */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">2</span>
              <span>Participants, Supervision & Mandatory Roster Upload</span>
            </h3>

            {/* Grades Selection */}
            <div>
              <label className="block font-bold text-slate-700 uppercase text-xs mb-2">Grade Level(s) Participating *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_GRADES.map(g => (
                  <label key={g} className="inline-flex items-center text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input 
                      type="checkbox" 
                      checked={selectedGrades.includes(g)} 
                      onChange={() => toggleGrade(g)} 
                      className="rounded text-blue-900 mr-1.5" 
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Total Students *</label>
                <input 
                  type="number" 
                  min="1" 
                  value={form.Student_Count} 
                  onChange={(e) => setForm({ ...form, Student_Count: parseInt(e.target.value) || 0 })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>

              {isOvernight && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Female Students</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.Female_Students} 
                      onChange={(e) => setForm({ ...form, Female_Students: parseInt(e.target.value) || 0 })} 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Male Students</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.Male_Students} 
                      onChange={(e) => setForm({ ...form, Male_Students: parseInt(e.target.value) || 0 })} 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Certificated Staff *</label>
                <input 
                  type="number" 
                  min="1" 
                  value={form.Teacher_Count} 
                  onChange={(e) => setForm({ ...form, Teacher_Count: parseInt(e.target.value) || 1 })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Adult Volunteers</label>
                <input 
                  type="number" 
                  min="0" 
                  value={form.Volunteer_Count} 
                  onChange={(e) => setForm({ ...form, Volunteer_Count: parseInt(e.target.value) || 0 })} 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>

              {isOvernight && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Female Volunteers</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.Female_Volunteers} 
                      onChange={(e) => setForm({ ...form, Female_Volunteers: parseInt(e.target.value) || 0 })} 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Male Volunteers</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={form.Male_Volunteers} 
                      onChange={(e) => setForm({ ...form, Male_Volunteers: parseInt(e.target.value) || 0 })} 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                </>
              )}
            </div>

            {/* Chaperone Ratio Policy Indicator & Live Acknowledgment */}
            {studentNum > 0 && (
              <div className="text-xs">
                {isRatioCompliant ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 space-y-1.5">
                    <div className="font-bold flex items-center space-x-2">
                      <span className="text-base">🟢</span>
                      <span>Chaperone Ratio: 1:{ratioPerAdult} (Compliant — meets district 1:10 policy)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium pl-6 leading-relaxed">
                      <strong>NOTE:</strong> Chaperone Ratio of 1:6 is required if the event involves swimming or any other activities where the potential exists for participants to be submerged in water.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl space-y-2.5">
                    <div className="font-bold text-red-950 flex items-start space-x-2">
                      <span className="text-base mt-0.5">🔴</span>
                      <span>
                        Chaperone Ratio: 1:{ratioPerAdult} (Policy Warning: For {studentNum} students, a minimum of {minChaperonesRequired} chaperones is required. You currently have {totalAdults}).
                      </span>
                    </div>

                    <p className="text-[11px] text-red-900 font-medium bg-red-100/60 p-2 rounded-lg border border-red-200 leading-relaxed">
                      <strong>NOTE:</strong> Chaperone Ratio of 1:6 is required if the event involves swimming or any other activities where the potential exists for participants to be submerged in water.
                    </p>

                    <label className="flex items-center space-x-2.5 cursor-pointer bg-white p-2.5 rounded-lg border border-red-200 shadow-2xs hover:bg-red-50/50 transition">
                      <input 
                        type="checkbox" 
                        checked={ratioAcknowledged} 
                        onChange={(e) => setRatioAcknowledged(e.target.checked)} 
                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer" 
                      />
                      <span className="font-semibold text-slate-800">
                        I understand my current ratio (1:{ratioPerAdult}) does not meet district policy.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Overnight Housing Plan */}
            {isOvernight && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                <label className="block font-bold text-blue-950 uppercase">Overnight Housing Provisions & Rooming Plan *</label>
                <textarea 
                  rows="2" 
                  value={form.Housing_Provisions} 
                  onChange={(e) => setForm({ ...form, Housing_Provisions: e.target.value })} 
                  required={isOvernight} 
                  placeholder="Detail hotel/camp name, gender-separated room allocation, and night chaperone coverage..." 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
            )}

            {/* Cleared Volunteers */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 uppercase mb-1">Cleared Volunteer Names (Fingerprinted with WVUSD Risk Management)</label>
              <input 
                type="text" 
                value={form.Cleared_Volunteers} 
                onChange={(e) => setForm({ ...form, Cleared_Volunteers: e.target.value })} 
                placeholder="e.g. John Smith, Mary Jane (Risk Management Megan's Law clearance required)" 
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
              />
            </div>

            {/* Required Roster Upload for Day & Overnight */}
            <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <Upload className="w-4 h-4 text-blue-900" />
                <span>Mandatory Student Roster File Upload (Required on All Trips) *</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload your initial trip roster (PDF, Excel, or CSV) with student names and ID numbers. Files are archived in the restricted district Drive folder.
              </p>
              <div className="flex items-center space-x-3">
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  accept=".pdf,.csv,.xls,.xlsx" 
                  className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white" 
                />
                {rosterFileName && (
                  <span className="text-xs text-green-700 font-semibold flex items-center">
                    <Check className="w-3.5 h-3.5 mr-1" /> {rosterFileName}
                  </span>
                )}
              </div>
            </div>

            {/* Board Approval Ack for Overnight */}
            {isOvernight && (
              <label className="inline-flex items-start text-xs text-slate-800 font-semibold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.Board_Approval_Ack} 
                  onChange={(e) => setForm({ ...form, Board_Approval_Ack: e.target.checked })} 
                  required={isOvernight} 
                  className="rounded text-blue-900 mr-2 mt-0.5" 
                />
                <span>I acknowledge that all Overnight and Out-of-State field trips require Walnut Valley USD Board of Trustees approval prior to departure. *</span>
              </label>
            )}
          </div>

          {/* Section 3: Transportation Branching */}
          <div className="space-y-4 pt-4 border-t border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">3</span>
              <span>Transportation Arrangements</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Primary Transportation Type *</label>
                <select 
                  value={form.Transportation_Type} 
                  onChange={(e) => setForm({ ...form, Transportation_Type: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                >
                  <option value="School Bus">District School Bus</option>
                  <option value="Charter Bus">Charter Bus</option>
                  <option value="Rental Vehicle">Rental Vehicle</option>
                  <option value="Flight">Commercial Flight</option>
                  <option value="Train">Passenger Train</option>
                  <option value="Other">Other (Walking, Public Transit, Carpooling)</option>
                </select>
              </div>
            </div>

            {/* School Bus Branch */}
            {form.Transportation_Type === 'School Bus' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="bg-red-50 text-red-800 p-2.5 rounded text-xs font-semibold border-l-4 border-red-500">
                  Warning: A valid Transportation Form Number (TF#) is required. Missing TF# cancels request.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">School Bus TF Number(s) *</label>
                    <input 
                      type="text" 
                      value={transportDetails.schoolBusTF} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, schoolBusTF: e.target.value })} 
                      placeholder="e.g. TF-2026-104" 
                      required 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Special Equipment</label>
                    <div className="space-y-1 pt-1">
                      <label className="inline-flex items-center mr-3"><input type="checkbox" checked={transportDetails.boosterSeat} onChange={(e) => setTransportDetails({ ...transportDetails, boosterSeat: e.target.checked })} className="rounded mr-1" /> Booster Seat</label>
                      <label className="inline-flex items-center mr-3"><input type="checkbox" checked={transportDetails.safetyVest} onChange={(e) => setTransportDetails({ ...transportDetails, safetyVest: e.target.checked })} className="rounded mr-1" /> Safety Vest/Harness</label>
                      <label className="inline-flex items-center"><input type="checkbox" checked={transportDetails.wheelchairBus} onChange={(e) => setTransportDetails({ ...transportDetails, wheelchairBus: e.target.checked })} className="rounded mr-1" /> Wheelchair Lift</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Charter Bus Branch */}
            {form.Transportation_Type === 'Charter Bus' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Contacted WVUSD Transportation? *</label>
                    <select 
                      value={transportDetails.charterContacted} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, charterContacted: e.target.value })} 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                    >
                      <option value="Yes">Yes, reservation initiated</option>
                      <option value="No">No, pending quote</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Charter Bus TF Number(s) *</label>
                    <input 
                      type="text" 
                      value={transportDetails.charterTF} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, charterTF: e.target.value })} 
                      placeholder="TF Number" 
                      required 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rental Vehicle Branch */}
            {form.Transportation_Type === 'Rental Vehicle' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Rental TF Number *</label>
                    <input 
                      type="text" 
                      value={transportDetails.rentalTF} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, rentalTF: e.target.value })} 
                      required 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">District-Approved Staff Driver Names *</label>
                    <input 
                      type="text" 
                      value={transportDetails.rentalDrivers} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, rentalDrivers: e.target.value })} 
                      required 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Flight Branch */}
            {form.Transportation_Type === 'Flight' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Flight Number & Airline *</label>
                    <input 
                      type="text" 
                      value={transportDetails.flightDetails} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, flightDetails: e.target.value })} 
                      required 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Airport Shuttle Bus TF#</label>
                    <input 
                      type="text" 
                      value={transportDetails.flightBusTF} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, flightBusTF: e.target.value })} 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Airport & Destination Ground Transport Plan *</label>
                  <textarea 
                    rows="2" 
                    value={transportDetails.flightGroundTransport} 
                    onChange={(e) => setTransportDetails({ ...transportDetails, flightGroundTransport: e.target.value })} 
                    required 
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                  />
                </div>
                <label className="inline-flex items-center font-semibold text-slate-800">
                  <input 
                    type="checkbox" 
                    checked={transportDetails.noCarpoolAirportAck} 
                    onChange={(e) => setTransportDetails({ ...transportDetails, noCarpoolAirportAck: e.target.checked })} 
                    required 
                    className="rounded mr-2" 
                  />
                  <span>I certify that students will NOT carpool in private vehicles to/from the airport. *</span>
                </label>
              </div>
            )}

            {/* Other Branch */}
            {form.Transportation_Type === 'Other' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="inline-flex items-center"><input type="checkbox" checked={transportDetails.walking} onChange={(e) => setTransportDetails({ ...transportDetails, walking: e.target.checked })} className="rounded mr-2" /> Walking trip</label>
                  <label className="inline-flex items-center"><input type="checkbox" checked={transportDetails.publicTransit} onChange={(e) => setTransportDetails({ ...transportDetails, publicTransit: e.target.checked })} className="rounded mr-2" /> Public Transit / Shuttle</label>
                  <label className="inline-flex items-center"><input type="checkbox" checked={transportDetails.staffCarpool} onChange={(e) => setTransportDetails({ ...transportDetails, staffCarpool: e.target.checked })} className="rounded mr-2" /> Private Vehicle - Staff Driver</label>
                  <label className="inline-flex items-center"><input type="checkbox" checked={transportDetails.parentDriveOwnOnly} onChange={(e) => setTransportDetails({ ...transportDetails, parentDriveOwnOnly: e.target.checked })} className="rounded mr-2" /> Parent Driving Own Student Only</label>
                </div>
                {transportDetails.staffCarpool && (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">List of District-Approved Staff Drivers *</label>
                    <input 
                      type="text" 
                      value={transportDetails.staffDriversList} 
                      onChange={(e) => setTransportDetails({ ...transportDetails, staffDriversList: e.target.value })} 
                      placeholder="Staff names with DMV pull notice on file" 
                      required 
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: General Compliance & Educational Purpose */}
          <div className="space-y-4 pt-4 border-t border-slate-200 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center font-bold">4</span>
              <span>Instructional Alignment, Supervision & Compliance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Activity Description *</label>
                <textarea 
                  rows="3" 
                  value={form.Activity_Description} 
                  onChange={(e) => setForm({ ...form, Activity_Description: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Instructional Program Alignment *</label>
                <textarea 
                  rows="3" 
                  value={form.Instructional_Alignment} 
                  onChange={(e) => setForm({ ...form, Instructional_Alignment: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Special Needs / IEP / 504 Accommodations *</label>
                <textarea 
                  rows="2" 
                  value={form.Special_Needs_Explanation} 
                  onChange={(e) => setForm({ ...form, Special_Needs_Explanation: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Supervision Plan (Target 1:10 Ratio) *</label>
                <textarea 
                  rows="2" 
                  value={form.Supervision_Plan} 
                  onChange={(e) => setForm({ ...form, Supervision_Plan: e.target.value })} 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
            </div>

            {/* Financials */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Funding Source *</label>
                <input 
                  type="text" 
                  value={form.Funding_Source} 
                  onChange={(e) => setForm({ ...form, Funding_Source: e.target.value })} 
                  placeholder="e.g. ASB, Booster, Grant" 
                  required 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Cost Per Student ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={form.Cost_Per_Student} 
                  onChange={(e) => setForm({ ...form, Cost_Per_Student: parseFloat(e.target.value) || 0 })} 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Total Estimated Cost ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={form.Total_Cost} 
                  onChange={(e) => setForm({ ...form, Total_Cost: parseFloat(e.target.value) || 0 })} 
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Fundraising Plan & No-Student-Denied Compliance</label>
              <textarea 
                rows="2" 
                value={form.Fundraising_Plan} 
                onChange={(e) => setForm({ ...form, Fundraising_Plan: e.target.value })} 
                placeholder="Per CA Ed Code, no student may be denied participation due to lack of funds..." 
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5" 
              />
            </div>

            {/* Compliance Checkboxes */}
            <div className="space-y-2 pt-2">
              <label className="inline-flex items-start text-xs font-semibold text-slate-800">
                <input 
                  type="checkbox" 
                  checked={form.Emergency_Insurance_Prep === 'Yes'} 
                  onChange={(e) => setForm({ ...form, Emergency_Insurance_Prep: e.target.checked ? 'Yes' : 'No' })} 
                  required 
                  className="rounded mr-2 mt-0.5" 
                />
                <span>Emergency Readiness: I confirm that emergency contact cards, first aid kits, parent permission slips, and chaperone orientations will be completed. *</span>
              </label>

              <label className="inline-flex items-start text-xs font-semibold text-slate-800">
                <input 
                  type="checkbox" 
                  checked={form.Restart_Ack} 
                  onChange={(e) => setForm({ ...form, Restart_Ack: e.target.checked })} 
                  required 
                  className="rounded mr-2 mt-0.5" 
                />
                <span>Change Policy: Substantive changes in itinerary or transportation will require approval workflow re-routing. *</span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-6 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800 shadow transition disabled:opacity-50 flex items-center space-x-2"
            >
              {submitting ? 'Saving...' : (editTrip ? 'Resubmit Updated Request' : 'Submit Field Trip Request')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
