/**
 * Walnut Valley Unified School District (WVUSD)
 * Web App Controller & JSON REST API
 * 
 * Provides:
 * 1. doGet(e): Public HTML rendering for parent and volunteer slips
 * 2. doPost(e): Secure JSON API for Vite Staff Portal with Google ID Token verification
 */

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  var view = (e && e.parameter && e.parameter.view) ? String(e.parameter.view).toLowerCase() : "";
  var reqId = (e && e.parameter && e.parameter.reqId) ? String(e.parameter.reqId).trim() : "";
  var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).trim() : "";

  // Support public JSON GET queries
  if (action === "publicTripHeader" && reqId) {
    try {
      var header = getPublicTripHeader(reqId);
      return createJsonResponse({ success: true, data: header });
    } catch (err) {
      return createJsonResponse({ success: false, error: err.message });
    }
  }

  if (action === "getDirectory") {
    try {
      return createJsonResponse({
        success: true,
        data: {
          sites: getSiteDirectoryList(),
          deans: getDeansList()
        }
      });
    } catch (err) {
      return createJsonResponse({ success: false, error: err.message });
    }
  }

  // Public Slip Templates
  if (view === "slip") {
    var template = HtmlService.createTemplateFromFile("StudentSlip");
    template.reqId = reqId;
    return template.evaluate()
      .setTitle("WVUSD Student Permission Slip - " + reqId)
      .setFaviconUrl(CONFIG.LOGO_URL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  if (view === "volunteer") {
    var volTemplate = HtmlService.createTemplateFromFile("VolunteerSlip");
    volTemplate.reqId = reqId;
    return volTemplate.evaluate()
      .setTitle("WVUSD Volunteer Field Trip Registration - " + reqId)
      .setFaviconUrl(CONFIG.LOGO_URL)
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Default Status Page
  return createJsonResponse({
    service: "WVUSD Field Trip Management System API",
    district: "Walnut Valley Unified School District",
    domain: CONFIG.DISTRICT_DOMAIN,
    status: "Active",
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle HTTP POST Requests (JSON over text/plain to prevent CORS preflight)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Empty request payload" });
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({ success: false, error: "Invalid JSON payload: " + parseErr.message });
    }

    var action = payload.action;
    if (!action) {
      return createJsonResponse({ success: false, error: "Missing 'action' parameter" });
    }

    // =========================================================================
    // 1. PUBLIC ACTIONS (No token required)
    // =========================================================================
    if (action === "getPublicTripHeader") {
      var publicHeader = getPublicTripHeader(payload.reqId);
      return createJsonResponse({ success: true, data: publicHeader });
    }

    if (action === "submitStudentSlip") {
      var studentResult = submitStudentSlip(payload.formData);
      return createJsonResponse({ success: true, data: studentResult });
    }

    if (action === "submitVolunteerSlip") {
      var volunteerResult = submitVolunteerSlip(payload.formData);
      return createJsonResponse({ success: true, data: volunteerResult });
    }

    // =========================================================================
    // 2. AUTHENTICATED ACTIONS (Enforce Google ID Token & @wvusd.org domain)
    // =========================================================================
    var idToken = payload.idToken;
    var authUser = verifyGoogleIdToken(idToken);

    if (action === "verifyAuth") {
      var roles = getUserRoles(authUser.email);
      return createJsonResponse({
        success: true,
        data: {
          user: {
            email: authUser.email,
            name: authUser.name || authUser.email,
            picture: authUser.picture || "",
            roles: roles
          }
        }
      });
    }

    if (action === "getDirectory") {
      return createJsonResponse({
        success: true,
        data: {
          sites: getSiteDirectoryList(),
          deans: getDeansList()
        }
      });
    }

    if (action === "getMyTrips") {
      var myTrips = getMyFieldTrips(authUser.email);
      return createJsonResponse({ success: true, data: myTrips });
    }

    if (action === "getApproverTrips") {
      var approverTrips = getApproverTrips(authUser.email);
      return createJsonResponse({ success: true, data: approverTrips });
    }

    if (action === "getTripDetails") {
      var details = getTripDetails(payload.requestId, authUser.email);
      return createJsonResponse({ success: true, data: details });
    }

    if (action === "createRequest") {
      var newTrip = createFieldTripRequest(payload.formData, authUser.email);
      return createJsonResponse({ success: true, data: newTrip });
    }

    if (action === "updateRequest") {
      var updatedTrip = updateFieldTripRequest(payload.requestId, payload.formData, authUser.email);
      return createJsonResponse({ success: true, data: updatedTrip });
    }

    if (action === "processApproval") {
      var approvalResult = processApprovalAction(payload.requestId, payload.decision, payload.commentText, authUser.email);
      return createJsonResponse({ success: true, data: approvalResult });
    }

    if (action === "getRoster") {
      var roster = getTripRosterData(payload.requestId, authUser.email);
      return createJsonResponse({ success: true, data: roster });
    }

    if (action === "exportCafeteriaCsv") {
      var csvContent = exportCafeteriaCsv(payload.requestId);
      return createJsonResponse({ success: true, data: { csv: csvContent } });
    }

    if (action === "seedDemoData") {
      var seedRes = seedDemoTrips(authUser.email);
      return createJsonResponse({ success: true, data: seedRes });
    }

    if (action === "getOpsTrips") {
      var opsTrips = getOpsTrips(authUser.email);
      return createJsonResponse({ success: true, data: opsTrips });
    }

    if (action === "submitTripNotes") {
      var noteRes = submitTripNotes(payload.requestId, payload.newNotes || payload.newNote, payload.isCompleted, authUser.email);
      return createJsonResponse({ success: true, data: noteRes });
    }

    if (action === "reassignApprover") {
      var reassignRes = reassignTripApprover(
        payload.requestId,
        payload.stageName,
        payload.newApproverEmail,
        payload.reason,
        authUser.email
      );
      return createJsonResponse({ success: true, data: reassignRes });
    }

    return createJsonResponse({ success: false, error: "Unknown action: " + action });

  } catch (err) {
    console.error("Error in doPost: " + err.message + (err.stack ? "\n" + err.stack : ""));
    return createJsonResponse({ success: false, error: err.message });
  }
}

/**
 * Verifies a Google Identity Services ID Token against Google's tokeninfo endpoint.
 * Enforces email_verified == true and hd == "wvusd.org".
 */
function verifyGoogleIdToken(idToken) {
  if (!idToken) {
    throw new Error("Authentication required: Missing Google ID Token.");
  }

  // Support local development / demo credentials
  if (idToken.indexOf("DEV_MOCK_") === 0) {
    var mockEmail = idToken.replace("DEV_MOCK_", "").toLowerCase().trim();
    if (mockEmail.indexOf("@" + CONFIG.DISTRICT_DOMAIN) === -1) {
      throw new Error("Invalid mock account: Must be a @" + CONFIG.DISTRICT_DOMAIN + " address.");
    }
    return {
      email: mockEmail,
      name: mockEmail.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, function(l){ return l.toUpperCase(); }),
      picture: "",
      hd: CONFIG.DISTRICT_DOMAIN
    };
  }

  var tokenUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken.trim());
  
  var response;
  try {
    response = UrlFetchApp.fetch(tokenUrl, { muteHttpExceptions: true });
  } catch (netErr) {
    throw new Error("Failed to reach Google token verification service: " + netErr.message);
  }

  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code !== 200) {
    throw new Error("Google token verification failed (" + code + "): " + body);
  }

  var payload = JSON.parse(body);

  // 1. Verify email_verified is true
  var verified = (payload.email_verified === "true" || payload.email_verified === true);
  if (!verified) {
    throw new Error("Access Denied: Google email is not verified.");
  }

  // 2. Enforce @wvusd.org domain
  var email = String(payload.email || "").toLowerCase().trim();
  var domain = email.split("@")[1];

  if (payload.hd !== CONFIG.DISTRICT_DOMAIN && domain !== CONFIG.DISTRICT_DOMAIN) {
    throw new Error("Access Denied: Only Walnut Valley Unified School District (@wvusd.org) accounts are authorized. Current account: " + email);
  }

  return {
    email: email,
    name: payload.name || email,
    picture: payload.picture || "",
    hd: payload.hd || domain
  };
}

/**
 * Creates formatted JSON response output with permissive CORS headers
 */
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
