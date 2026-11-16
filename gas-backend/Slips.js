/**
 * Walnut Valley Unified School District (WVUSD)
 * Permission Slips Service (Student & Volunteer)
 */

/**
 * Publicly accessible: Fetches trip header details strictly for the requested trip ID.
 * Exposes NO confidential student rosters, medical notes, or logs.
 */
function getPublicTripHeader(requestId) {
  if (!requestId) {
    throw new Error("Missing Request ID parameter");
  }

  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
  if (!sheet) throw new Error("Requests sheet not found");

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var tripRow = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === requestId) {
      tripRow = data[i];
      break;
    }
  }

  if (!tripRow) {
    throw new Error("Field trip not found for ID: " + requestId);
  }

  var trip = mapRowToObject(headers, tripRow);

  // Compile list of teachers for the parent dropdown
  var teacherNames = [];
  if (trip.Teacher_In_Charge) {
    teacherNames.push(trip.Teacher_In_Charge);
  }

  // Extract co-teacher names if formatted, or provide placeholder
  if (trip.Co_Teachers_Emails) {
    var coEmails = parseEmailList(trip.Co_Teachers_Emails);
    for (var c = 0; c < coEmails.length; c++) {
      var namePart = coEmails[c].split('@')[0];
      // Format john.smith or jsmith into readable name
      var formatted = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      if (teacherNames.indexOf(formatted) === -1) {
        teacherNames.push(formatted);
      }
    }
  }

  // Return strictly read-only header fields
  return {
    Request_ID: trip.Request_ID,
    Site: trip.Site,
    Group_Name: trip.Group_Name,
    Destination: trip.Destination,
    Venue_Address: trip.Venue_Address,
    Departure_Date: trip.Departure_Date,
    Departure_Time: trip.Departure_Time,
    Return_Date: trip.Return_Date,
    Return_Time: trip.Return_Time,
    Teacher_In_Charge: trip.Teacher_In_Charge,
    Teachers_List: teacherNames,
    Trip_Type: trip.Trip_Type,
    Cost_Per_Student: trip.Cost_Per_Student,
    Activity_Description: trip.Activity_Description,
    Funding_Source: trip.Funding_Source
  };
}

/**
 * Publicly accessible: Submits a Student Permission Slip
 */
function submitStudentSlip(formData) {
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

  try {
    var requestId = formData.Request_ID;
    if (!requestId) {
      throw new Error("Field trip Request ID is missing.");
    }

    // Verify trip exists
    var publicHeader = getPublicTripHeader(requestId);

    var slipsSS = getSlipsSpreadsheet();
    var sheet = slipsSS.getSheetByName(CONFIG.TABS.STUDENT_SLIPS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var slipId = "SLIP-STU-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    var nowTimestamp = new Date().toISOString();

    // Handle Insurance Card Upload & OCR
    var cardUrl = "";
    var ocrSummary = "";
    if (formData.insuranceCardBase64) {
      cardUrl = saveFileToDrive(
        requestId + "_Card_" + formData.Student_ID + "_" + Date.now() + ".jpg",
        formData.insuranceCardBase64,
        "image/jpeg"
      );
      ocrSummary = analyzeInsuranceCard(formData.insuranceCardBase64);
    }

    // Check for Medical Needs / Medication and trigger Instant Nurse Alert
    var hasMedical = formData.Has_Medical_Needs === "Yes";
    var hasMedication = formData.Requires_Medication === "Yes";
    var nurseNotifiedTime = "";

    if (hasMedical || hasMedication) {
      var siteInfo = getSiteDirectoryInfo(publicHeader.Site);
      if (siteInfo && siteInfo.nurseEmail) {
        EmailService.sendInstantNurseAlert(siteInfo.nurseEmail, formData, publicHeader);
        nurseNotifiedTime = nowTimestamp;
      }
    }

    var slipRecord = {
      Slip_ID: slipId,
      Request_ID: requestId,
      Timestamp: nowTimestamp,
      Student_ID: formData.Student_ID || "",
      Student_First_Name: formData.Student_First_Name || "",
      Student_Last_Name: formData.Student_Last_Name || "",
      Assigned_Teacher: formData.Assigned_Teacher || "",
      Needs_Brunch: formData.Needs_Brunch || "No",
      Needs_Lunch: formData.Needs_Lunch || "No",
      Has_Insurance: formData.Has_Insurance || "No",
      Insurance_Carrier: formData.Insurance_Carrier || "",
      Policy_Number: formData.Policy_Number || "",
      Insurance_Card_URL: cardUrl,
      Vision_OCR_Summary: ocrSummary,
      Waiver_Risk_Consent: formData.Waiver_Risk_Consent ? "Agreed" : "No",
      Waiver_EdCode_35330: formData.Waiver_EdCode_35330 ? "Agreed" : "No",
      Waiver_Liability: formData.Waiver_Liability ? "Agreed" : "No",
      Has_Medical_Needs: formData.Has_Medical_Needs || "No",
      Medical_Details: formData.Medical_Details || "",
      Nurse_Notified_Timestamp: nurseNotifiedTime,
      Requires_Medication: formData.Requires_Medication || "No",
      Medication_Location: formData.Medication_Location || "",
      Waiver_No_Carpool: formData.Waiver_No_Carpool ? "Agreed" : "No",
      Waiver_Student_Reviewed: formData.Waiver_Student_Reviewed ? "Agreed" : "No",
      Parent_Signature: formData.Parent_Signature || "",
      Parent_Phone: formData.Parent_Phone || "",
      Parent_Email: formData.Parent_Email || "",
      Signed_Date: formData.Signed_Date || nowTimestamp.split('T')[0]
    };

    var newRow = mapObjectToRow(headers, slipRecord);
    sheet.appendRow(newRow);

    return {
      success: true,
      slipId: slipId,
      studentName: formData.Student_First_Name + " " + formData.Student_Last_Name,
      ocrSummary: ocrSummary
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Publicly accessible: Submits a Volunteer Permission Slip
 */
function submitVolunteerSlip(formData) {
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

  try {
    var requestId = formData.Request_ID;
    if (!requestId) {
      throw new Error("Field trip Request ID is missing.");
    }

    // Verify trip exists
    getPublicTripHeader(requestId);

    // Mandatory Insurance Gate
    if (formData.Has_Insurance !== "Yes") {
      throw new Error("Medical insurance is required for all adult volunteers.");
    }

    var slipsSS = getSlipsSpreadsheet();
    var sheet = slipsSS.getSheetByName(CONFIG.TABS.VOLUNTEER_SLIPS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var slipId = "SLIP-VOL-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    var nowTimestamp = new Date().toISOString();

    var cardUrl = "";
    if (formData.insuranceCardBase64) {
      cardUrl = saveFileToDrive(
        requestId + "_VolunteerCard_" + formData.Volunteer_Last_Name + "_" + Date.now() + ".jpg",
        formData.insuranceCardBase64,
        "image/jpeg"
      );
    }

    var volunteerRecord = {
      Slip_ID: slipId,
      Request_ID: requestId,
      Timestamp: nowTimestamp,
      Volunteer_First_Name: formData.Volunteer_First_Name || "",
      Volunteer_Last_Name: formData.Volunteer_Last_Name || "",
      Child_Name: formData.Child_Name || "",
      Has_Insurance: formData.Has_Insurance || "Yes",
      Insurance_Carrier: formData.Insurance_Carrier || "",
      Policy_Number: formData.Policy_Number || "",
      Insurance_Card_URL: cardUrl,
      Emergency_Contact_Name: formData.Emergency_Contact_Name || "",
      Emergency_Contact_Phone: formData.Emergency_Contact_Phone || "",
      Waiver_EdCode_35330: formData.Waiver_EdCode_35330 ? "Agreed" : "No",
      Waiver_Medical_Release: formData.Waiver_Medical_Release ? "Agreed" : "No",
      Volunteer_Signature: formData.Volunteer_Signature || "",
      Signed_Date: formData.Signed_Date || nowTimestamp.split('T')[0]
    };

    var newRow = mapObjectToRow(headers, volunteerRecord);
    sheet.appendRow(newRow);

    return {
      success: true,
      slipId: slipId,
      volunteerName: formData.Volunteer_First_Name + " " + formData.Volunteer_Last_Name
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Protected for Teachers & Approvers: Retrieves student & volunteer rosters for a trip
 */
function getTripRosterData(requestId, userEmailOverride) {
  var userEmail = userEmailOverride || requireWvusdUser();

  var tripDetails = getTripDetails(requestId, userEmail);
  var trip = tripDetails.trip;

  // Authorization check: User must be teacher, co-teacher, or an approver
  var isTeacher = (trip.Requester_Email && trip.Requester_Email.toLowerCase() === userEmail) ||
                  emailMatchesList(userEmail, trip.Co_Teachers_Emails);
  var roles = getUserRoles(userEmail);

  if (!isTeacher && !roles.isApprover) {
    throw new Error("Unauthorized to view trip roster for " + requestId);
  }

  var slipsSS = getSlipsSpreadsheet();
  
  // 1. Student Slips
  var stuSheet = slipsSS.getSheetByName(CONFIG.TABS.STUDENT_SLIPS);
  var stuData = stuSheet ? stuSheet.getDataRange().getValues() : [];
  var students = [];

  var brunchCount = 0;
  var lunchCount = 0;

  if (stuData.length > 1) {
    var stuHeaders = stuData[0];
    for (var i = 1; i < stuData.length; i++) {
      if (stuData[i][1] === requestId) {
        var s = mapRowToObject(stuHeaders, stuData[i]);
        
        if (s.Needs_Brunch === "Yes") brunchCount++;
        if (s.Needs_Lunch === "Yes") lunchCount++;

        // Insurance Badge calculation
        var insuranceBadge = "Verified";
        if (s.Has_Insurance !== "Yes") {
          insuranceBadge = "Uninsured - Blocked";
        } else if (!s.Policy_Number && !s.Insurance_Card_URL) {
          insuranceBadge = "Pending Nurse Review";
        }

        // Medical Status calculation (Never exposes raw sensitive medical details in roster)
        var medicalBadge = "Standard Clearance";
        if (s.Has_Medical_Needs === "Yes" || s.Requires_Medication === "Yes") {
          medicalBadge = "Medical Alert - Nurse Notified";
        }

        students.push({
          slipId: s.Slip_ID,
          studentId: s.Student_ID,
          studentName: s.Student_First_Name + " " + s.Student_Last_Name,
          assignedTeacher: s.Assigned_Teacher,
          needsBrunch: s.Needs_Brunch,
          needsLunch: s.Needs_Lunch,
          parentPhone: s.Parent_Phone,
          parentEmail: s.Parent_Email,
          insuranceBadge: insuranceBadge,
          medicalBadge: medicalBadge,
          insuranceCardUrl: s.Insurance_Card_URL,
          signedDate: s.Signed_Date
        });
      }
    }
  }

  // 2. Volunteer Slips
  var volSheet = slipsSS.getSheetByName(CONFIG.TABS.VOLUNTEER_SLIPS);
  var volData = volSheet ? volSheet.getDataRange().getValues() : [];
  var volunteers = [];

  if (volData.length > 1) {
    var volHeaders = volData[0];
    for (var v = 1; v < volData.length; v++) {
      if (volData[v][1] === requestId) {
        var vol = mapRowToObject(volHeaders, volData[v]);
        volunteers.push({
          slipId: vol.Slip_ID,
          volunteerName: vol.Volunteer_First_Name + " " + vol.Volunteer_Last_Name,
          childName: vol.Child_Name,
          emergencyContact: vol.Emergency_Contact_Name + " (" + vol.Emergency_Contact_Phone + ")",
          hasInsurance: vol.Has_Insurance,
          insuranceCarrier: vol.Insurance_Carrier,
          signedDate: vol.Signed_Date
        });
      }
    }
  }

  var scriptUrl = ScriptApp.getService().getUrl();

  return {
    requestId: requestId,
    tripHeader: trip,
    studentSlipsCount: students.length,
    volunteerSlipsCount: volunteers.length,
    brunchCount: brunchCount,
    lunchCount: lunchCount,
    studentSlipUrl: scriptUrl + "?view=slip&reqId=" + encodeURIComponent(requestId),
    volunteerSlipUrl: scriptUrl + "?view=volunteer&reqId=" + encodeURIComponent(requestId),
    students: students,
    volunteers: volunteers
  };
}

/**
 * Generate CSV for cafeteria brunch/lunch counts and trip attendance
 */
function exportCafeteriaCsv(requestId) {
  var data = getTripRosterData(requestId);
  var students = data.students;

  var rows = [
    ["WVUSD Field Trip Attendance & Meal Request Roster"],
    ["Trip ID:", data.requestId, "Destination:", data.tripHeader.Destination],
    ["School Site:", data.tripHeader.Site, "Departure Date:", data.tripHeader.Departure_Date],
    ["Teacher in Charge:", data.tripHeader.Teacher_In_Charge],
    [""],
    ["Total Students Submitted:", students.length],
    ["Total Brunch Requests:", data.brunchCount],
    ["Total Lunch Requests:", data.lunchCount],
    [""],
    ["Student ID", "Student Name", "Assigned Teacher", "Brunch Needed", "Lunch Needed", "Parent Phone", "Insurance Status", "Medical Clearance Status"]
  ];

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    rows.push([
      s.studentId,
      s.studentName,
      s.assignedTeacher,
      s.needsBrunch,
      s.needsLunch,
      s.parentPhone,
      s.insuranceBadge,
      s.medicalBadge
    ]);
  }

  var csvContent = rows.map(function(r) {
    return r.map(function(cell) {
      var str = String(cell !== undefined ? cell : "").replace(/"/g, '""');
      return '"' + str + '"';
    }).join(",");
  }).join("\r\n");

  return csvContent;
}
