/**
 * Walnut Valley Unified School District (WVUSD)
 * Operations Secretary & Board Reporting Service
 */

/**
 * Returns all trips with merged administrative notes, board approval flags,
 * and distance calculation for the Operations Secretary dashboard.
 */
function getOpsTrips(userEmailOverride) {
  var masterSS = getMasterSpreadsheet();
  var reqSheet = masterSS.getSheetByName(CONFIG.TABS.REQUESTS);
  if (!reqSheet) return [];

  var reqData = reqSheet.getDataRange().getValues();
  if (reqData.length <= 1) return [];

  var headers = reqData[0];

  // Fetch Ops_Notes (or fallback legacy Data tab if present)
  var notesMap = {};
  var notesSheet = masterSS.getSheetByName(CONFIG.TABS.OPS_NOTES);
  if (!notesSheet) {
    notesSheet = masterSS.getSheetByName("Data");
  }

  if (notesSheet) {
    var nData = notesSheet.getDataRange().getValues();
    if (nData.length > 1) {
      for (var n = 1; n < nData.length; n++) {
        var rId = String(nData[n][0]).trim();
        if (rId) {
          notesMap[rId] = {
            isCompleted: (nData[n][5] === "Yes" || nData[n][5] === true || nData[n][15] === "Yes" || nData[n][15] === true),
            latestNote: nData[n][6] || nData[n][14] || "",
            historicalNotes: nData[n][7] || nData[n][16] || ""
          };
        }
      }
    }
  }

  var trips = [];
  for (var i = 1; i < reqData.length; i++) {
    var row = reqData[i];
    if (!row[0]) continue;

    var trip = mapRowToObject(headers, row);
    var reqId = String(trip.Request_ID).trim();
    var noteInfo = notesMap[reqId] || { isCompleted: false, latestNote: "", historicalNotes: "" };

    var tripType = (trip.Trip_Type || "").toLowerCase();
    var isOvernight = tripType.indexOf("overnight") > -1 || 
                      (trip.Departure_Date && trip.Return_Date && trip.Departure_Date !== trip.Return_Date);
    var isMoreThan50 = tripType.indexOf("greater than 50") > -1 || 
                       tripType.indexOf("more than 50") > -1;

    // Out-of-State field trips require Board Approval (Red Badge)
    var isOutOfState = tripType.indexOf("out of state") > -1 || 
                       tripType.indexOf("out of country") > -1;

    var requiresBoardApproval = isOutOfState;

    // Overnight in California or any field trip over 50 miles require Board Notification (Blue Badge)
    var requiresBoardNotification = (!isOutOfState) && (isOvernight || isMoreThan50 || trip.Board_Approval_Ack === "Yes");

    // Check mileage via Maps if site & address are present
    var mileage = "";
    if (isMoreThan50) {
      mileage = "50+ Miles";
    }

    // Category bucket for Ops filter: Pending / Complete / Declined / Cancelled
    var bucket = "Pending";
    if (trip.Status === CONFIG.STATUS.APPROVED || noteInfo.isCompleted) {
      bucket = "Complete";
    } else if (trip.Status === CONFIG.STATUS.DECLINED) {
      bucket = "Declined";
    } else if (trip.Status === "Cancelled") {
      bucket = "Cancelled";
    }

    trips.push({
      requestNum: reqId,
      site: trip.Site,
      status: trip.Status,
      bucket: bucket,
      currentApprover: trip.Current_Stage || "",
      teacherInCharge: trip.Teacher_In_Charge || "",
      group: trip.Group_Name || "",
      typeOfTrip: trip.Trip_Type || "",
      destination: trip.Destination || "",
      address: trip.Venue_Address || "",
      depDate: trip.Departure_Date || "",
      depTime: trip.Departure_Time || "",
      retDate: trip.Return_Date || "",
      retTime: trip.Return_Time || "",
      submissionDate: trip.Submitted_Timestamp ? trip.Submitted_Timestamp.substring(0, 10) : "",
      description: trip.Activity_Description || "",
      mileage: mileage,
      isOvernight: isOvernight,
      isMoreThan50Miles: isMoreThan50,
      requiresBoardApproval: requiresBoardApproval,
      requiresBoardNotification: requiresBoardNotification,
      boardAck: trip.Board_Approval_Ack || "No",
      isCompleted: noteInfo.isCompleted,
      latestNote: noteInfo.latestNote,
      historicalNotes: noteInfo.historicalNotes
    });
  }

  // Newest first
  trips.reverse();
  return trips;
}

/**
 * Saves administrative notes and completion status for a trip
 */
function submitTripNotes(requestId, newNote, isCompleted, userEmailOverride) {
  var userEmail = userEmailOverride || requireWvusdUser();
  var masterSS = getMasterSpreadsheet();
  var notesSheet = masterSS.getSheetByName(CONFIG.TABS.OPS_NOTES);
  if (!notesSheet) {
    notesSheet = initSheet(masterSS, CONFIG.TABS.OPS_NOTES, CONFIG.HEADERS.OPS_NOTES);
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(CONFIG.LOCK_TIMEOUT_MS);

  try {
    var data = notesSheet.getDataRange().getValues();
    var existingRowIndex = -1;
    var existingHistorical = "";
    var existingSite = "";
    var existingDest = "";

    var standardizedReq = String(requestId).trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === standardizedReq) {
        existingRowIndex = i + 1;
        existingSite = data[i][1] || "";
        existingDest = data[i][2] || "";
        existingHistorical = data[i][7] || "";
        break;
      }
    }

    // Lookup site and destination from Requests if not in notes row
    if (!existingSite || !existingDest) {
      var reqSheet = masterSS.getSheetByName(CONFIG.TABS.REQUESTS);
      if (reqSheet) {
        var rData = reqSheet.getDataRange().getValues();
        for (var r = 1; r < rData.length; r++) {
          if (String(rData[r][0]).trim() === standardizedReq) {
            existingSite = rData[r][5] || "";
            existingDest = rData[r][18] || "";
            break;
          }
        }
      }
    }

    var todayStr = Utilities.formatDate(new Date(), masterSS.getSpreadsheetTimeZone() || "America/Los_Angeles", "MM/dd/yyyy");
    var updatedHistorical = existingHistorical;

    if (newNote && newNote.trim() !== "") {
      var entry = todayStr + " (" + userEmail + "): " + newNote.trim();
      updatedHistorical = existingHistorical ? (entry + "\n" + existingHistorical) : entry;
    }

    var nowIso = new Date().toISOString();
    var completedVal = (isCompleted === true || isCompleted === "Yes" || isCompleted === "on") ? "Yes" : "No";

    if (existingRowIndex > 0) {
      // Update existing row
      notesSheet.getRange(existingRowIndex, 4).setValue(nowIso);
      notesSheet.getRange(existingRowIndex, 5).setValue(userEmail);
      notesSheet.getRange(existingRowIndex, 6).setValue(completedVal);
      notesSheet.getRange(existingRowIndex, 7).setValue(newNote || "");
      notesSheet.getRange(existingRowIndex, 8).setValue(updatedHistorical);
    } else {
      // Append new row
      notesSheet.appendRow([
        standardizedReq,
        existingSite,
        existingDest,
        nowIso,
        userEmail,
        completedVal,
        newNote || "",
        updatedHistorical
      ]);
    }

    return {
      success: true,
      requestId: standardizedReq,
      isCompleted: (completedVal === "Yes"),
      historicalNotes: updatedHistorical
    };

  } finally {
    lock.releaseLock();
  }
}
