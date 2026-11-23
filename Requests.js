/**
 * Walnut Valley Unified School District (WVUSD)
 * Field Trip Requests Service
 */

/**
 * Generate unique Request ID formatted as FT-YYYY-XXXX
 */
function generateRequestId() {
  var year = new Date().getFullYear();
  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
  var lastRow = sheet.getLastRow();
  
  // Format sequential number with 4 digits
  var seq = (lastRow).toString();
  while (seq.length < 4) {
    seq = "0" + seq;
  }
  return "FT-" + year + "-" + seq;
}

/**
 * Map a row array to an object using header names
 */
function mapRowToObject(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = row[i];
  }
  return obj;
}

/**
 * Map an object to an array matching header columns
 */
function mapObjectToRow(headers, obj) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var val = obj[headers[i]];
    row.push(val !== undefined ? val : "");
  }
  return row;
}

/**
 * Create a new Field Trip Request
 */
function createFieldTripRequest(formData, requesterEmailOverride) {
  var requesterEmail = requesterEmailOverride || requireWvusdUser();
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

  try {
    var ss = getMasterSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var requestId = generateRequestId();
    var nowTimestamp = new Date().toISOString();

    // Handle student roster file upload if provided
    var rosterUrl = formData.Roster_File_URL || "";
    if (formData.rosterFileBase64 && formData.rosterFileName) {
      rosterUrl = saveFileToDrive(requestId + "_Roster_" + formData.rosterFileName, formData.rosterFileBase64, formData.rosterFileMime);
    }

    // Determine initial stage
    var tripData = {
      Request_ID: requestId,
      Status: CONFIG.STATUS.UNDER_REVIEW,
      Current_Stage: "",
      Submitted_Timestamp: nowTimestamp,
      Requester_Email: requesterEmail,
      Site: formData.Site || "",
      Dean_Name: formData.Dean_Name || "",
      Dean_Email: formData.Dean_Email || "",
      Teacher_In_Charge: formData.Teacher_In_Charge || "",
      Co_Teachers_Emails: formData.Co_Teachers_Emails || "",
      Group_Name: formData.Group_Name || "",
      Departure_Date: formData.Departure_Date || "",
      Departure_Time: formData.Departure_Time || "",
      Return_Date: formData.Return_Date || "",
      Return_Time: formData.Return_Time || "",
      Competition_Dates: formData.Competition_Dates || "",
      Is_Recurring: formData.Is_Recurring || "No",
      Recurring_Dates: formData.Recurring_Dates || "",
      Destination: formData.Destination || "",
      Venue_Address: formData.Venue_Address || "",
      Trip_Type: formData.Trip_Type || "",
      Grades: formData.Grades || "",
      Student_Count: formData.Student_Count || 0,
      Female_Students: formData.Female_Students || 0,
      Male_Students: formData.Male_Students || 0,
      Housing_Provisions: formData.Housing_Provisions || "",
      Roster_File_URL: rosterUrl,
      Teacher_Count: formData.Teacher_Count || 1,
      Volunteer_Count: formData.Volunteer_Count || 0,
      Female_Volunteers: formData.Female_Volunteers || 0,
      Male_Volunteers: formData.Male_Volunteers || 0,
      Cleared_Volunteers: formData.Cleared_Volunteers || "",
      Board_Approval_Ack: formData.Board_Approval_Ack ? "Yes" : "No",
      Transportation_Type: formData.Transportation_Type || "",
      Transport_Details_JSON: typeof formData.Transport_Details_JSON === 'object' ? JSON.stringify(formData.Transport_Details_JSON) : (formData.Transport_Details_JSON || ""),
      Activity_Description: formData.Activity_Description || "",
      Instructional_Alignment: formData.Instructional_Alignment || "",
      Special_Needs_Explanation: formData.Special_Needs_Explanation || "",
      All_Students_Included: formData.All_Students_Included || "Yes",
      Supervision_Plan: formData.Supervision_Plan || "",
      Funding_Source: formData.Funding_Source || "",
      Cost_Per_Student: formData.Cost_Per_Student || 0,
      Total_Cost: formData.Total_Cost || 0,
      Fundraising_Plan: formData.Fundraising_Plan || "",
      Emergency_Insurance_Prep: formData.Emergency_Insurance_Prep || "Yes",
      Restart_Ack: formData.Restart_Ack ? "Yes" : "No",
      Last_Updated: nowTimestamp,
      Locked_Boolean: false
    };

    // Calculate active stages
    var activeStages = getActiveStagesForTrip(tripData);
    if (activeStages.length === 0) {
      throw new Error("No approval stages could be resolved for Site: " + tripData.Site);
    }
    tripData.Current_Stage = activeStages[0].name;

    var newRow = mapObjectToRow(headers, tripData);
    sheet.appendRow(newRow);

    // Initial log entry
    var logSheet = ss.getSheetByName(CONFIG.TABS.APPROVAL_LOGS);
    var logId = "LOG-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    logSheet.appendRow([
      logId,
      requestId,
      nowTimestamp,
      requesterEmail,
      "Teacher",
      "Submitted",
      "Initial field trip request submitted.",
      "New",
      tripData.Current_Stage
    ]);

    // Dispatch notification to Stage 1 Approvers
    var appUrl = ScriptApp.getService().getUrl();
    EmailService.notifyApproversForStage(activeStages[0].emails, tripData, activeStages[0].name, appUrl);

    return {
      success: true,
      requestId: requestId,
      status: tripData.Status,
      currentStage: tripData.Current_Stage,
      rosterUrl: rosterUrl
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Teacher updates an existing request during revision mode
 */
function updateFieldTripRequest(requestId, formData, userEmailOverride) {
  var userEmail = userEmailOverride || requireWvusdUser();
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

  try {
    var ss = getMasterSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var rowIndex = -1;
    var existingRow = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        rowIndex = i + 1;
        existingRow = data[i];
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error("Request ID not found: " + requestId);
    }

    var existingTrip = mapRowToObject(headers, existingRow);

    // Check Hard Locking
    if (existingTrip.Locked_Boolean === true || existingTrip.Locked_Boolean === "TRUE" || existingTrip.Status === CONFIG.STATUS.APPROVED || existingTrip.Status === CONFIG.STATUS.DECLINED) {
      throw new Error("This request is locked and can no longer be edited.");
    }

    // Verify user is Requester or Co-Teacher
    var isTeacher = (existingTrip.Requester_Email && existingTrip.Requester_Email.toLowerCase() === userEmail) ||
                    emailMatchesList(userEmail, existingTrip.Co_Teachers_Emails);
    if (!isTeacher) {
      throw new Error("Only the teacher in charge or listed co-teachers can edit this request.");
    }

    // Process new roster upload if provided
    var rosterUrl = existingTrip.Roster_File_URL;
    if (formData.rosterFileBase64 && formData.rosterFileName) {
      rosterUrl = saveFileToDrive(requestId + "_Roster_" + formData.rosterFileName, formData.rosterFileBase64, formData.rosterFileMime);
    }

    var nowTimestamp = new Date().toISOString();

    // Preserve existing stage or return to current stage
    var updatedTrip = {
      Request_ID: requestId,
      Status: CONFIG.STATUS.UNDER_REVIEW,
      Current_Stage: existingTrip.Current_Stage,
      Submitted_Timestamp: existingTrip.Submitted_Timestamp,
      Requester_Email: existingTrip.Requester_Email,
      Site: formData.Site !== undefined ? formData.Site : existingTrip.Site,
      Dean_Name: formData.Dean_Name !== undefined ? formData.Dean_Name : existingTrip.Dean_Name,
      Dean_Email: formData.Dean_Email !== undefined ? formData.Dean_Email : existingTrip.Dean_Email,
      Teacher_In_Charge: formData.Teacher_In_Charge !== undefined ? formData.Teacher_In_Charge : existingTrip.Teacher_In_Charge,
      Co_Teachers_Emails: formData.Co_Teachers_Emails !== undefined ? formData.Co_Teachers_Emails : existingTrip.Co_Teachers_Emails,
      Group_Name: formData.Group_Name !== undefined ? formData.Group_Name : existingTrip.Group_Name,
      Departure_Date: formData.Departure_Date !== undefined ? formData.Departure_Date : existingTrip.Departure_Date,
      Departure_Time: formData.Departure_Time !== undefined ? formData.Departure_Time : existingTrip.Departure_Time,
      Return_Date: formData.Return_Date !== undefined ? formData.Return_Date : existingTrip.Return_Date,
      Return_Time: formData.Return_Time !== undefined ? formData.Return_Time : existingTrip.Return_Time,
      Competition_Dates: formData.Competition_Dates !== undefined ? formData.Competition_Dates : existingTrip.Competition_Dates,
      Is_Recurring: formData.Is_Recurring !== undefined ? formData.Is_Recurring : existingTrip.Is_Recurring,
      Recurring_Dates: formData.Recurring_Dates !== undefined ? formData.Recurring_Dates : existingTrip.Recurring_Dates,
      Destination: formData.Destination !== undefined ? formData.Destination : existingTrip.Destination,
      Venue_Address: formData.Venue_Address !== undefined ? formData.Venue_Address : existingTrip.Venue_Address,
      Trip_Type: formData.Trip_Type !== undefined ? formData.Trip_Type : existingTrip.Trip_Type,
      Grades: formData.Grades !== undefined ? formData.Grades : existingTrip.Grades,
      Student_Count: formData.Student_Count !== undefined ? formData.Student_Count : existingTrip.Student_Count,
      Female_Students: formData.Female_Students !== undefined ? formData.Female_Students : existingTrip.Female_Students,
      Male_Students: formData.Male_Students !== undefined ? formData.Male_Students : existingTrip.Male_Students,
      Housing_Provisions: formData.Housing_Provisions !== undefined ? formData.Housing_Provisions : existingTrip.Housing_Provisions,
      Roster_File_URL: rosterUrl,
      Teacher_Count: formData.Teacher_Count !== undefined ? formData.Teacher_Count : existingTrip.Teacher_Count,
      Volunteer_Count: formData.Volunteer_Count !== undefined ? formData.Volunteer_Count : existingTrip.Volunteer_Count,
      Female_Volunteers: formData.Female_Volunteers !== undefined ? formData.Female_Volunteers : existingTrip.Female_Volunteers,
      Male_Volunteers: formData.Male_Volunteers !== undefined ? formData.Male_Volunteers : existingTrip.Male_Volunteers,
      Cleared_Volunteers: formData.Cleared_Volunteers !== undefined ? formData.Cleared_Volunteers : existingTrip.Cleared_Volunteers,
      Board_Approval_Ack: formData.Board_Approval_Ack ? "Yes" : (existingTrip.Board_Approval_Ack || "No"),
      Transportation_Type: formData.Transportation_Type !== undefined ? formData.Transportation_Type : existingTrip.Transportation_Type,
      Transport_Details_JSON: formData.Transport_Details_JSON ? (typeof formData.Transport_Details_JSON === 'object' ? JSON.stringify(formData.Transport_Details_JSON) : formData.Transport_Details_JSON) : existingTrip.Transport_Details_JSON,
      Activity_Description: formData.Activity_Description !== undefined ? formData.Activity_Description : existingTrip.Activity_Description,
      Instructional_Alignment: formData.Instructional_Alignment !== undefined ? formData.Instructional_Alignment : existingTrip.Instructional_Alignment,
      Special_Needs_Explanation: formData.Special_Needs_Explanation !== undefined ? formData.Special_Needs_Explanation : existingTrip.Special_Needs_Explanation,
      All_Students_Included: formData.All_Students_Included !== undefined ? formData.All_Students_Included : existingTrip.All_Students_Included,
      Supervision_Plan: formData.Supervision_Plan !== undefined ? formData.Supervision_Plan : existingTrip.Supervision_Plan,
      Funding_Source: formData.Funding_Source !== undefined ? formData.Funding_Source : existingTrip.Funding_Source,
      Cost_Per_Student: formData.Cost_Per_Student !== undefined ? formData.Cost_Per_Student : existingTrip.Cost_Per_Student,
      Total_Cost: formData.Total_Cost !== undefined ? formData.Total_Cost : existingTrip.Total_Cost,
      Fundraising_Plan: formData.Fundraising_Plan !== undefined ? formData.Fundraising_Plan : existingTrip.Fundraising_Plan,
      Emergency_Insurance_Prep: formData.Emergency_Insurance_Prep !== undefined ? formData.Emergency_Insurance_Prep : existingTrip.Emergency_Insurance_Prep,
      Restart_Ack: formData.Restart_Ack ? "Yes" : existingTrip.Restart_Ack,
      Last_Updated: nowTimestamp,
      Locked_Boolean: false
    };

    var updatedRow = mapObjectToRow(headers, updatedTrip);
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);

    // Log revision
    var logSheet = ss.getSheetByName(CONFIG.TABS.APPROVAL_LOGS);
    var logId = "LOG-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    logSheet.appendRow([
      logId,
      requestId,
      nowTimestamp,
      userEmail,
      "Teacher",
      "Resubmitted",
      formData.revisionComment || "Teacher made requested changes and resubmitted.",
      "Teacher Revision",
      updatedTrip.Current_Stage
    ]);

    // Notify current stage approver
    var stages = getActiveStagesForTrip(updatedTrip);
    for (var s = 0; s < stages.length; s++) {
      if (stages[s].name === updatedTrip.Current_Stage) {
        var appUrl = ScriptApp.getService().getUrl();
        EmailService.notifyResubmission(stages[s].emails, updatedTrip, appUrl);
        break;
      }
    }

    return {
      success: true,
      requestId: requestId,
      status: updatedTrip.Status,
      currentStage: updatedTrip.Current_Stage
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Get trips created by or co-taught by current authenticated user
 */
function getMyFieldTrips(userEmailOverride) {
  var userEmail = userEmailOverride || requireWvusdUser();
  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var trips = [];

  for (var i = 1; i < data.length; i++) {
    var trip = mapRowToObject(headers, data[i]);
    var isRequester = trip.Requester_Email && trip.Requester_Email.toLowerCase() === userEmail.toLowerCase();
    var isCoTeacher = emailMatchesList(userEmail, trip.Co_Teachers_Emails);

    if (isRequester || isCoTeacher) {
      var logs = getApprovalLogs(trip.Request_ID);
      var pipeline = computeTripPipeline(trip, logs);
      trips.push({
        trip: trip,
        logs: logs,
        pipeline: pipeline,
        canEdit: (trip.Status === CONFIG.STATUS.ACTION_REQUIRED && !trip.Locked_Boolean)
      });
    }
  }

  // Sort newest first
  trips.reverse();
  return trips;
}

/**
 * Get all trips for an approver based on site/department role
 * Includes pipeline status and whether the approver can act at Current_Stage
 */
function getApproverTrips(userEmailOverride) {
  var userEmail = userEmailOverride || requireWvusdUser();
  var roles = getUserRoles(userEmail);

  if (!roles.isApprover) {
    return [];
  }

  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var approverTrips = [];

  var opsDirectorEmail = getDistrictConfigValue("OPS_DIRECTOR");
  var opsSecEmail = getDistrictConfigValue("OPS_SECRETARY");
  var transEmail = getDistrictConfigValue("TRANSPORTATION");
  var hrEmail = getDistrictConfigValue("HR_PERSONNEL");

  var isDistrictAdmin = emailMatchesList(userEmail, opsDirectorEmail) || emailMatchesList(userEmail, opsSecEmail);
  var isTrans = emailMatchesList(userEmail, transEmail);
  var isHR = emailMatchesList(userEmail, hrEmail);
  var isSuper = roles.isSuperAdmin || isDistrictSuperAdmin(userEmail);

  for (var i = 1; i < data.length; i++) {
    var trip = mapRowToObject(headers, data[i]);
    var hasAccess = false;

    if (isSuper || isDistrictAdmin) {
      hasAccess = true;
    } else if (isTrans) {
      var tType = (trip.Transportation_Type || "").toLowerCase();
      var details = (trip.Transport_Details_JSON || "").toLowerCase();
      if (tType.indexOf("bus") > -1 || tType.indexOf("rental") > -1 || details.indexOf("tf#") > -1) {
        hasAccess = true;
      }
    } else if (isHR) {
      var vCount = parseInt(trip.Volunteer_Count, 10) || 0;
      if (vCount > 0 || (trip.Cleared_Volunteers && trip.Cleared_Volunteers.trim().length > 0)) {
        hasAccess = true;
      }
    } else {
      // Check Site Directory or Dean matching
      var siteInfo = getSiteDirectoryInfo(trip.Site);
      if (siteInfo) {
        if (emailMatchesList(userEmail, siteInfo.principalEmail) ||
            emailMatchesList(userEmail, siteInfo.adminAssistantEmail) ||
            emailMatchesList(userEmail, siteInfo.nurseEmail)) {
          hasAccess = true;
        }
      }
      if (emailMatchesList(userEmail, trip.Dean_Email)) {
        hasAccess = true;
      }
    }

    if (hasAccess) {
      var logs = getApprovalLogs(trip.Request_ID);
      var pipeline = computeTripPipeline(trip, logs);
      var canAct = userCanActOnRequest(userEmail, trip);

      approverTrips.push({
        trip: trip,
        logs: logs,
        pipeline: pipeline,
        canAct: canAct
      });
    }
  }

  approverTrips.reverse();
  return approverTrips;
}

/**
 * Get trips pending approval by the current user
 */
function getPendingApprovalsForUser(userEmailOverride) {
  var userEmail = userEmailOverride || requireWvusdUser();
  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var pending = [];

  for (var i = 1; i < data.length; i++) {
    var trip = mapRowToObject(headers, data[i]);
    if (userCanActOnRequest(userEmail, trip)) {
      var logs = getApprovalLogs(trip.Request_ID);
      var pipeline = computeTripPipeline(trip, logs);
      pending.push({
        trip: trip,
        logs: logs,
        pipeline: pipeline,
        canAct: true
      });
    }
  }

  pending.reverse();
  return pending;
}

/**
 * Retrieve full trip details and its approval logs by Request_ID
 */
function getTripDetails(requestId, userEmailOverride) {
  var userEmail = userEmailOverride || requireWvusdUser();
  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
  if (!sheet) throw new Error("Requests sheet not found");

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var trip = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === requestId) {
      trip = mapRowToObject(headers, data[i]);
      break;
    }
  }

  if (!trip) {
    throw new Error("Field trip request not found: " + requestId);
  }

  var logs = getApprovalLogs(requestId);
  var canAct = userCanActOnRequest(userEmail, trip);
  var activeStages = getActiveStagesForTrip(trip);
  var pipeline = computeTripPipeline(trip, logs);

  return {
    trip: trip,
    logs: logs,
    pipeline: pipeline,
    canAct: canAct,
    activeStages: activeStages,
    userEmail: userEmail
  };
}
