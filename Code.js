/**
 * Walnut Valley Unified School District (WVUSD)
 * Field Trip Management System - Web App Controller
 */

function doGet(e) {
  var view = (e && e.parameter && e.parameter.view) ? e.parameter.view.toLowerCase() : "portal";
  var reqId = (e && e.parameter && e.parameter.reqId) ? e.parameter.reqId : "";

  var template;
  var pageTitle = "WVUSD Field Trips Portal";

  if (view === "slip") {
    template = HtmlService.createTemplateFromFile("StudentSlip");
    template.reqId = reqId;
    pageTitle = "WVUSD Student Permission Slip";
  } else if (view === "volunteer") {
    template = HtmlService.createTemplateFromFile("VolunteerSlip");
    template.reqId = reqId;
    pageTitle = "WVUSD Volunteer Field Trip Slip";
  } else {
    template = HtmlService.createTemplateFromFile("Index");
    template.reqId = reqId;
    pageTitle = "WVUSD Field Trip & Approval Portal";
  }

  return template.evaluate()
    .setTitle(pageTitle)
    .setFaviconUrl(CONFIG.LOGO_URL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper to include partial HTML files inside templates
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Initial bundle for the staff portal dashboard to minimize round trips
 */
function getInitialStaffData() {
  var userProfile = getCurrentUserProfile();
  var sites = getSiteDirectoryList();
  var deans = getDeansList();
  
  var myTrips = [];
  var pendingApprovals = [];

  if (userProfile.authenticated) {
    try {
      myTrips = getMyFieldTrips();
    } catch (e) {
      console.warn("Could not load my trips: " + e.message);
    }

    try {
      pendingApprovals = getPendingApprovalsForUser();
    } catch (e) {
      console.warn("Could not load pending approvals: " + e.message);
    }
  }

  return {
    user: userProfile,
    sites: sites,
    deans: deans,
    myTrips: myTrips,
    pendingApprovals: pendingApprovals,
    logoUrl: CONFIG.LOGO_URL,
    appName: "WVUSD Field Trip Portal"
  };
}

/**
 * Retrieve list of all school sites
 */
function getSiteDirectoryList() {
  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.SITE_DIRECTORY);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var sites = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      sites.push({
        name: data[i][0],
        principal: data[i][1],
        principalEmail: data[i][2],
        adminAssistant: data[i][3],
        adminAssistantEmail: data[i][4],
        nurse: data[i][5],
        nurseEmail: data[i][6]
      });
    }
  }
  return sites;
}

/**
 * Retrieve list of Deans
 */
function getDeansList() {
  var ss = getMasterSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.DEANS);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var deans = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      deans.push({
        name: data[i][0],
        email: data[i][1]
      });
    }
  }
  return deans;
}
