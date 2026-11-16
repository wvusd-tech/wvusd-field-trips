/**
 * Walnut Valley Unified School District (WVUSD)
 * Approval Workflow Engine & Logs
 */

/**
 * Calculates the sequential list of active approval stages for a specific trip
 */
function getActiveStagesForTrip(tripData) {
  var stages = [];

  // 1. Site Admin Assistant
  var siteInfo = getSiteDirectoryInfo(tripData.Site);
  if (siteInfo && siteInfo.adminAssistantEmail) {
    stages.push({
      name: CONFIG.STAGES.ADMIN_ASSISTANT,
      emails: siteInfo.adminAssistantEmail,
      label: "Site Admin Assistant (" + tripData.Site + ")"
    });
  }

  // 2. Dean (Skip if "Not Applicable" or blank)
  if (tripData.Dean_Email && tripData.Dean_Name && tripData.Dean_Name !== "Not Applicable") {
    stages.push({
      name: CONFIG.STAGES.DEAN,
      emails: tripData.Dean_Email,
      label: "Dean (" + tripData.Dean_Name + ")"
    });
  }

  // 3. Principal
  if (siteInfo && siteInfo.principalEmail) {
    stages.push({
      name: CONFIG.STAGES.PRINCIPAL,
      emails: siteInfo.principalEmail,
      label: "Principal (" + siteInfo.principalName + ")"
    });
  }

  // 4. Operations Secretary
  var opsSecEmail = getDistrictConfigValue("OPS_SECRETARY");
  if (opsSecEmail && opsSecEmail !== "[ENTER_OPS_SECRETARY_EMAIL]") {
    stages.push({
      name: CONFIG.STAGES.OPS_SECRETARY,
      emails: opsSecEmail,
      label: "Operations Secretary"
    });
  }

  // 5. Transportation (Triggered when bus/rental is requested)
  var transEmail = getDistrictConfigValue("TRANSPORTATION");
  var type = (tripData.Transportation_Type || "").toLowerCase();
  var details = (tripData.Transport_Details_JSON || "").toLowerCase();
  var needsTransportation = (
    type.indexOf("school bus") > -1 ||
    type.indexOf("charter bus") > -1 ||
    type.indexOf("rental") > -1 ||
    details.indexOf("tf#") > -1 ||
    details.indexOf("charter") > -1 ||
    details.indexOf("bus") > -1
  );

  if (needsTransportation && transEmail && transEmail !== "[ENTER_TRANSPORTATION_EMAIL]") {
    stages.push({
      name: CONFIG.STAGES.TRANSPORTATION,
      emails: transEmail,
      label: "Transportation Department"
    });
  }

  // 6. HR Personnel (Triggered when volunteers are present)
  var hrEmail = getDistrictConfigValue("HR_PERSONNEL");
  var volCount = parseInt(tripData.Volunteer_Count, 10) || 0;
  var hasVolunteers = volCount > 0 || (tripData.Cleared_Volunteers && tripData.Cleared_Volunteers.trim().length > 0);

  if (hasVolunteers && hrEmail && hrEmail !== "[ENTER_HR_EMAIL]") {
    stages.push({
      name: CONFIG.STAGES.HR_PERSONNEL,
      emails: hrEmail,
      label: "HR Personnel"
    });
  }

  // 7. Operations Director (Final Approver)
  var opsDirEmail = getDistrictConfigValue("OPS_DIRECTOR");
  if (opsDirEmail && opsDirEmail !== "[ENTER_OPS_DIRECTOR_EMAIL]") {
    stages.push({
      name: CONFIG.STAGES.OPS_DIRECTOR,
      emails: opsDirEmail,
      label: "Operations Director"
    });
  }

  return stages;
}

/**
 * Fetch directory info for a specific site
 */
function getSiteDirectoryInfo(siteName) {
  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.SITE_DIRECTORY);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === siteName) {
      return {
        site: data[i][0],
        principalName: data[i][1],
        principalEmail: data[i][2],
        adminAssistantName: data[i][3],
        adminAssistantEmail: data[i][4],
        nurseName: data[i][5],
        nurseEmail: data[i][6]
      };
    }
  }
  return null;
}

/**
 * Verifies if user has permission to approve/act at the current stage
 */
function userCanActOnRequest(userEmail, tripData) {
  if (!userEmail) return false;
  var user = userEmail.toLowerCase();

  // If status is locked or completed, no actions permitted
  if (tripData.Locked_Boolean === true || tripData.Locked_Boolean === "TRUE" || tripData.Status === CONFIG.STATUS.APPROVED || tripData.Status === CONFIG.STATUS.DECLINED) {
    return false;
  }

  // Operations Director always has administrative override authority
  var opsDirEmail = getDistrictConfigValue("OPS_DIRECTOR");
  if (emailMatchesList(user, opsDirEmail)) {
    return true;
  }

  var stages = getActiveStagesForTrip(tripData);
  for (var i = 0; i < stages.length; i++) {
    if (stages[i].name === tripData.Current_Stage) {
      return emailMatchesList(user, stages[i].emails);
    }
  }

  return false;
}

/**
 * Process approval decision (Approve, Decline, Request Changes)
 */
function processApprovalAction(requestId, action, commentText, actorEmailOverride) {
  var actorEmail = actorEmailOverride || requireWvusdUser();
  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

  try {
    var ss = getMasterSpreadsheet();
    var reqSheet = ss.getSheetByName(CONFIG.TABS.REQUESTS);
    var data = reqSheet.getDataRange().getValues();
    var headers = data[0];

    var reqRowIdx = -1;
    var rowData = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === requestId) {
        reqRowIdx = i + 1; // 1-based index
        rowData = data[i];
        break;
      }
    }

    if (reqRowIdx === -1) {
      throw new Error("Request ID not found: " + requestId);
    }

    var trip = mapRowToObject(headers, rowData);

    // Enforce Hard Locking
    if (trip.Locked_Boolean === true || trip.Locked_Boolean === "TRUE" || trip.Status === CONFIG.STATUS.APPROVED || trip.Status === CONFIG.STATUS.DECLINED) {
      throw new Error("This request is locked and cannot be modified.");
    }

    // Verify actor authority
    if (!userCanActOnRequest(actorEmail, trip)) {
      throw new Error("You are not authorized to take action on this request at stage: " + trip.Current_Stage);
    }

    var stages = getActiveStagesForTrip(trip);
    var currentStageIdx = -1;
    for (var s = 0; s < stages.length; s++) {
      if (stages[s].name === trip.Current_Stage) {
        currentStageIdx = s;
        break;
      }
    }

    var stageFrom = trip.Current_Stage;
    var stageTo = stageFrom;
    var newStatus = trip.Status;
    var newLocked = false;
    var nowTimestamp = new Date().toISOString();
    var appUrl = ScriptApp.getService().getUrl();

    var teacherRecipients = trip.Requester_Email;
    if (trip.Co_Teachers_Emails) {
      teacherRecipients += "," + trip.Co_Teachers_Emails;
    }

    if (action === "Approve") {
      if (currentStageIdx === -1 || currentStageIdx === stages.length - 1) {
        // Final Approval reached!
        newStatus = CONFIG.STATUS.APPROVED;
        stageTo = "Approved";
        newLocked = true;

        // Notify teachers, school admin, ops
        var allRecipients = teacherRecipients;
        var siteInfo = getSiteDirectoryInfo(trip.Site);
        if (siteInfo) {
          allRecipients += "," + siteInfo.principalEmail + "," + siteInfo.adminAssistantEmail;
        }
        EmailService.notifyFinalApproval(allRecipients, trip, appUrl);
      } else {
        // Advance to next stage
        var nextStage = stages[currentStageIdx + 1];
        stageTo = nextStage.name;
        newStatus = CONFIG.STATUS.UNDER_REVIEW;
        newLocked = false;

        // Notify next stage approvers
        EmailService.notifyApproversForStage(nextStage.emails, trip, nextStage.name, appUrl);
      }
    } else if (action === "Decline") {
      newStatus = CONFIG.STATUS.DECLINED;
      stageTo = "Declined";
      newLocked = true;

      // Notify teachers
      EmailService.notifyDeclined(teacherRecipients, trip, actorEmail, commentText, appUrl);
    } else if (action === "Request Changes") {
      newStatus = CONFIG.STATUS.ACTION_REQUIRED;
      stageTo = trip.Current_Stage; // Pauses at the requesting approver's stage
      newLocked = false; // teacher can edit

      // Notify teachers
      EmailService.notifyTeacherActionRequired(teacherRecipients, trip, actorEmail, commentText, appUrl);
    } else {
      throw new Error("Unknown action: " + action);
    }

    // Update row in Requests sheet
    var statusCol = headers.indexOf("Status") + 1;
    var stageCol = headers.indexOf("Current_Stage") + 1;
    var lockedCol = headers.indexOf("Locked_Boolean") + 1;
    var lastUpdatedCol = headers.indexOf("Last_Updated") + 1;

    reqSheet.getRange(reqRowIdx, statusCol).setValue(newStatus);
    reqSheet.getRange(reqRowIdx, stageCol).setValue(stageTo);
    reqSheet.getRange(reqRowIdx, lockedCol).setValue(newLocked);
    reqSheet.getRange(reqRowIdx, lastUpdatedCol).setValue(nowTimestamp);

    // Append to Approval_Logs
    var logId = "LOG-" + Utilities.getUuid().substring(0, 8).toUpperCase();
    var actorRole = getActorRoleTitle(actorEmail, stageFrom);

    var logSheet = ss.getSheetByName(CONFIG.TABS.APPROVAL_LOGS);
    logSheet.appendRow([
      logId,
      requestId,
      nowTimestamp,
      actorEmail,
      actorRole,
      action,
      commentText || "",
      stageFrom,
      stageTo
    ]);

    return {
      success: true,
      requestId: requestId,
      status: newStatus,
      currentStage: stageTo,
      locked: newLocked
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Determine display role title for log
 */
function getActorRoleTitle(email, stageName) {
  return stageName || "Approver";
}

/**
 * Fetch all log entries for a request
 */
function getApprovalLogs(requestId) {
  var ss = getMasterSpreadsheet();
  var logSheet = ss.getSheetByName(CONFIG.TABS.APPROVAL_LOGS);
  if (!logSheet) return [];

  var data = logSheet.getDataRange().getValues();
  var logs = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === requestId) {
      logs.push({
        logId: data[i][0],
        requestId: data[i][1],
        timestamp: data[i][2],
        actorEmail: data[i][3],
        actorRole: data[i][4],
        action: data[i][5],
        commentText: data[i][6],
        stageFrom: data[i][7],
        stageTo: data[i][8]
      });
    }
  }

  // Sort chronologically
  logs.sort(function(a, b) {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  return logs;
}

/**
 * Computes the 7-step visual pipeline status for a trip
 */
function computeTripPipeline(trip, logs) {
  var allStandardStages = [
    { key: "admin_assistant", name: CONFIG.STAGES.ADMIN_ASSISTANT, label: "Admin Asst" },
    { key: "dean", name: CONFIG.STAGES.DEAN, label: "Dean" },
    { key: "principal", name: CONFIG.STAGES.PRINCIPAL, label: "Principal" },
    { key: "ops_secretary", name: CONFIG.STAGES.OPS_SECRETARY, label: "Ops Sec" },
    { key: "transportation", name: CONFIG.STAGES.TRANSPORTATION, label: "Transp." },
    { key: "hr", name: CONFIG.STAGES.HR_PERSONNEL, label: "HR" },
    { key: "ops_director", name: CONFIG.STAGES.OPS_DIRECTOR, label: "Ops Dir" }
  ];

  var activeStages = getActiveStagesForTrip(trip);
  var activeNames = activeStages.map(function(s) { return s.name; });

  // Map of approved stage logs
  var approvedLogMap = {};
  if (logs && logs.length > 0) {
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].action === "Approved") {
        approvedLogMap[logs[i].stageFrom] = logs[i];
      }
    }
  }

  var currentStageIndex = activeNames.indexOf(trip.Current_Stage);
  var isTripFullyApproved = (trip.Status === CONFIG.STATUS.APPROVED);
  var isTripDeclined = (trip.Status === CONFIG.STATUS.DECLINED);
  var isChangesRequested = (trip.Status === CONFIG.STATUS.ACTION_REQUIRED);

  var pipeline = [];

  for (var j = 0; j < allStandardStages.length; j++) {
    var stage = allStandardStages[j];
    var isActive = activeNames.indexOf(stage.name) > -1;

    if (!isActive) {
      pipeline.push({
        key: stage.key,
        name: stage.name,
        label: stage.label,
        status: "skipped", // N/A
        actorEmail: null,
        timestamp: null,
        comment: null
      });
      continue;
    }

    var stageIndex = activeNames.indexOf(stage.name);

    if (isTripFullyApproved) {
      var logEntry = approvedLogMap[stage.name];
      pipeline.push({
        key: stage.key,
        name: stage.name,
        label: stage.label,
        status: "approved",
        actorEmail: logEntry ? logEntry.actorEmail : null,
        timestamp: logEntry ? logEntry.timestamp : null,
        comment: logEntry ? logEntry.commentText : null
      });
    } else if (stage.name === trip.Current_Stage) {
      if (isChangesRequested) {
        pipeline.push({
          key: stage.key,
          name: stage.name,
          label: stage.label,
          status: "changes_requested",
          actorEmail: null,
          timestamp: null,
          comment: "Teacher revision in progress"
        });
      } else if (isTripDeclined) {
        pipeline.push({
          key: stage.key,
          name: stage.name,
          label: stage.label,
          status: "declined",
          actorEmail: null,
          timestamp: null,
          comment: "Trip declined"
        });
      } else {
        pipeline.push({
          key: stage.key,
          name: stage.name,
          label: stage.label,
          status: "active", // Currently waiting for this approver
          actorEmail: null,
          timestamp: null,
          comment: null
        });
      }
    } else if (currentStageIndex > -1 && stageIndex < currentStageIndex) {
      var prevLog = approvedLogMap[stage.name];
      pipeline.push({
        key: stage.key,
        name: stage.name,
        label: stage.label,
        status: "approved",
        actorEmail: prevLog ? prevLog.actorEmail : null,
        timestamp: prevLog ? prevLog.timestamp : null,
        comment: prevLog ? prevLog.commentText : null
      });
    } else {
      pipeline.push({
        key: stage.key,
        name: stage.name,
        label: stage.label,
        status: "waiting", // Future stage
        actorEmail: null,
        timestamp: null,
        comment: null
      });
    }
  }

  return pipeline;
}
