/**
 * Walnut Valley Unified School District (WVUSD) Field Trip System
 * Configuration & Constants
 */

var WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzsHH8CucfdhpVnJw_DCHrQJ2IyHw5DkjxxDrH73fWGkehbGNLIQQDZioafYe8c7JAW/exec";

var CONFIG = {
  // Google Apps Script Web App Deployment URL
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbzsHH8CucfdhpVnJw_DCHrQJ2IyHw5DkjxxDrH73fWGkehbGNLIQQDZioafYe8c7JAW/exec",

  // Google Sheet IDs
  MASTER_SHEET_ID: "1pgMvIwsmB2I9-gN3OOqC2MavmRQ745gTeGOLXwQiJRY",
  SLIPS_SHEET_ID: "1ShpLkohU2iCpgkVRp_t3cDR0uWiCil0o_6ewcWLR64M",

  // District Branding
  DISTRICT_NAME: "Walnut Valley Unified School District",
  DISTRICT_DOMAIN: "wvusd.org",
  LOGO_URL: "https://res.cloudinary.com/djv9u4054/image/upload/v1783959106/UPdated_Black_and_White_Logo-removebg-preview_zubeqp.png",

  // Master Sheet Tabs
  TABS: {
    REQUESTS: "Requests",
    APPROVAL_LOGS: "Approval_Logs",
    SITE_DIRECTORY: "Site_Directory",
    DEANS: "Deans",
    DISTRICT_CONFIG: "District_Config",
    TEACHERS: "Teachers",
    // Slips Sheet Tabs
    STUDENT_SLIPS: "Student_Slips",
    VOLUNTEER_SLIPS: "Volunteer_Slips",
    // Operations Secretary & Notes Tab
    OPS_NOTES: "Ops_Notes"
  },

  // Statuses
  STATUS: {
    UNDER_REVIEW: "Under Review",
    ACTION_REQUIRED: "Action Required (Teacher Edit)",
    APPROVED: "Approved (Complete)",
    DECLINED: "Declined"
  },

  // Approval Stages
  STAGES: {
    ADMIN_ASSISTANT: "Site Admin Assistant",
    DEAN: "Dean",
    PRINCIPAL: "Principal",
    OPS_SECRETARY: "Operations Secretary",
    TRANSPORTATION: "Transportation",
    HR_PERSONNEL: "HR Personnel",
    OPS_DIRECTOR: "Operations Director"
  },

  // Lock Timeout in milliseconds
  LOCK_TIMEOUT_MS: 30000,

  // Table Headers
  HEADERS: {
    REQUESTS: [
      "Request_ID", "Status", "Current_Stage", "Submitted_Timestamp", "Requester_Email",
      "Site", "Dean_Name", "Dean_Email", "Teacher_In_Charge", "Co_Teachers_Emails",
      "Group_Name", "Departure_Date", "Departure_Time", "Return_Date", "Return_Time",
      "Competition_Dates", "Is_Recurring", "Recurring_Dates", "Destination", "Venue_Address",
      "Trip_Type", "Grades", "Student_Count", "Female_Students", "Male_Students",
      "Housing_Provisions", "Roster_File_URL", "Teacher_Count", "Volunteer_Count", "Female_Volunteers",
      "Male_Volunteers", "Cleared_Volunteers", "Board_Approval_Ack", "Transportation_Type", "Transport_Details_JSON",
      "Activity_Description", "Instructional_Alignment", "Special_Needs_Explanation", "All_Students_Included", "Supervision_Plan",
      "Funding_Source", "Cost_Per_Student", "Total_Cost", "Fundraising_Plan", "Emergency_Insurance_Prep",
      "Restart_Ack", "Last_Updated", "Locked_Boolean", "Stage_Overrides_JSON"
    ],
    APPROVAL_LOGS: [
      "Log_ID", "Request_ID", "Timestamp", "Actor_Email", "Actor_Role",
      "Action", "Comment_Text", "Stage_From", "Stage_To"
    ],
    SITE_DIRECTORY: [
      "Site", "Principal", "Principal Email", "Admin Assistant", "Admin Assistant Email",
      "Nurse", "Nurse Email", "Cafeteria Email"
    ],
    DEANS: [
      "Dean", "Dean Email"
    ],
    DISTRICT_CONFIG: [
      "Role_Key", "Display_Label", "Email_List", "Super_Admin_Emails"
    ],
    STUDENT_SLIPS: [
      "Slip_ID", "Request_ID", "Timestamp", "Student_ID", "Student_First_Name",
      "Student_Last_Name", "Assigned_Teacher", "Needs_Brunch", "Needs_Lunch", "Has_Insurance",
      "Insurance_Carrier", "Policy_Number", "Insurance_Card_URL", "Vision_OCR_Summary", "Waiver_Risk_Consent",
      "Waiver_EdCode_35330", "Waiver_Liability", "Has_Medical_Needs", "Medical_Details", "Nurse_Notified_Timestamp",
      "Requires_Medication", "Medication_Location", "Waiver_No_Carpool", "Waiver_Student_Reviewed", "Parent_Signature",
      "Parent_Phone", "Parent_Email", "Signed_Date"
    ],
    VOLUNTEER_SLIPS: [
      "Slip_ID", "Request_ID", "Timestamp", "Volunteer_First_Name", "Volunteer_Last_Name",
      "Child_Name", "Has_Insurance", "Insurance_Carrier", "Policy_Number", "Insurance_Card_URL",
      "Emergency_Contact_Name", "Emergency_Contact_Phone", "Waiver_EdCode_35330", "Waiver_Medical_Release", "Volunteer_Signature",
      "Signed_Date"
    ],
    OPS_NOTES: [
      "Request_ID", "Site", "Destination", "Last_Updated", "Updated_By",
      "Is_Completed", "Latest_Note", "Historical_Notes"
    ]
  },

  // Official Site Addresses for Distance & Maps Lookup
  SITE_ADDRESSES: {
    "Castle Rock Elementary": "2975 Castle Rock Rd, Diamond Bar, CA 91765",
    "Collegewood Elementary": "20725 Collegewood Dr., Walnut, CA 91789",
    "CJ Morris Elementary": "19875 Calle Baja, Walnut, CA 91789",
    "Evergreen Elementary": "2450 Evergreen Springs Drive, Diamond Bar, CA 91765",
    "Maple Hill Elementary": "1350 Maple Hill Rd, Diamond Bar, CA 91765",
    "Quail Summit Elementary": "23330 Quail Summit Drive, Diamond Bar, CA 91765",
    "Vejar Elementary": "20222 Vejar Road, Walnut, CA 91789",
    "Walnut Elementary": "841 S. Glenwick, Walnut, CA 91789",
    "Westhoff Elementary": "20151 Amar Road, Walnut, CA 91789",
    "Chaparral Middle School": "1405 S. Spruce Tree Dr., Diamond Bar, CA 91765",
    "South Pointe Middle School": "20671 Larkstone Dr., Diamond Bar, CA 91789",
    "Suzanne Middle School": "525 Suzanne Road, Walnut, CA 91789",
    "Diamond Bar High School": "21400 Pathfinder Road, Diamond Bar, CA 91765",
    "Walnut High School": "400 N. Pierre Road, Walnut, CA 91789",
    "Ron Hockwalt Academies": "476 Lemon Ave, Walnut, CA 91789",
    "HARTT": "476 Lemon Ave, Walnut, CA 91789"
  }
};

/**
 * Returns spreadsheet instance for master sheet
 */
function getMasterSpreadsheet() {
  try {
    if (CONFIG.MASTER_SHEET_ID && CONFIG.MASTER_SHEET_ID.trim() !== "") {
      return SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID.trim());
    }
  } catch (e) {
    console.warn("openById failed for master sheet: " + e.message + ". Falling back to getActiveSpreadsheet().");
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Returns spreadsheet instance for permission slips sheet
 */
function getSlipsSpreadsheet() {
  try {
    if (CONFIG.SLIPS_SHEET_ID && CONFIG.SLIPS_SHEET_ID.trim() !== "") {
      return SpreadsheetApp.openById(CONFIG.SLIPS_SHEET_ID.trim());
    }
  } catch (e) {
    console.error("Error opening SLIPS_SHEET_ID (" + CONFIG.SLIPS_SHEET_ID + "): " + e.message);
    throw new Error("Could not open SLIPS_SHEET_ID: " + e.message + ". Please verify that your account has edit access to Sheet ID: " + CONFIG.SLIPS_SHEET_ID);
  }
}

/**
 * Split comma-separated emails, trim whitespace, filter non-empty
 */
function parseEmailList(rawEmails) {
  if (!rawEmails) return [];
  return String(rawEmails)
    .split(',')
    .map(function(e) { return e.trim(); })
    .filter(function(e) { return e.length > 0 && e.indexOf('@') > -1; });
}

/**
 * Check if a given user email exists in comma-separated list
 */
function emailMatchesList(userEmail, rawEmails) {
  if (!userEmail || !rawEmails) return false;
  var target = String(userEmail).trim().toLowerCase();
  var emails = parseEmailList(rawEmails);
  for (var i = 0; i < emails.length; i++) {
    if (emails[i].toLowerCase() === target) {
      return true;
    }
  }
  return false;
}

/**
 * Fetch dynamic district config value by key (e.g., OPS_SECRETARY, TRANSPORTATION)
 */
function getDistrictConfigValue(key) {
  try {
    var ss = getMasterSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.TABS.DISTRICT_CONFIG);
    if (!sheet) return "";
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][2] || "";
      }
    }
  } catch (err) {
    console.error("Error reading District_Config for key " + key + ": " + err);
  }
  return "";
}

/**
 * Fetch dynamic district config display label by key
 */
function getDistrictConfigLabel(key, defaultLabel) {
  try {
    var ss = getMasterSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.TABS.DISTRICT_CONFIG);
    if (!sheet) return defaultLabel || key;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1] || defaultLabel || key;
      }
    }
  } catch (err) {
    console.error("Error reading District_Config label for key " + key + ": " + err);
  }
  return defaultLabel || key;
}

/**
 * Fetches Super Admin email addresses from District_Config tab Column D (rows 2 down)
 */
function getDistrictSuperAdminEmails() {
  try {
    var ss = getMasterSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.TABS.DISTRICT_CONFIG);
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    // Read Column D (index 4) from row 2
    var values = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
    var admins = [];
    for (var i = 0; i < values.length; i++) {
      var raw = (values[i][0] || "").toString().trim().toLowerCase();
      if (raw) {
        var parts = raw.split(/[,;\s\n\r]+/);
        for (var j = 0; j < parts.length; j++) {
          var em = parts[j].trim();
          if (em && em.indexOf("@") > -1) {
            if (admins.indexOf(em) === -1) {
              admins.push(em);
            }
          }
        }
      }
    }
    return admins;
  } catch (err) {
    console.error("Error reading Super Admin emails from District_Config Col D: " + err);
    return [];
  }
}

/**
 * Checks if a given email is a Super Admin
 */
function isDistrictSuperAdmin(email) {
  if (!email) return false;
  var user = String(email).toLowerCase().trim();
  var admins = getDistrictSuperAdminEmails();
  return admins.indexOf(user) > -1;
}

/**
 * Determine roles for a given email across super admins, site directories, deans, and district config
 */
function getUserRoles(userEmail) {
  var cleanEmail = (userEmail || "").toLowerCase().trim();
  var roles = {
    isStaff: true,
    isApprover: false,
    isOpsSecretary: false,
    isSuperAdmin: false,
    approverTypes: []
  };

  try {
    // 1. Check Super Admin from District_Config Col D (Full access to any part)
    if (isDistrictSuperAdmin(cleanEmail)) {
      roles.isSuperAdmin = true;
      roles.isApprover = true;
      roles.isOpsSecretary = true;
      roles.approverTypes.push("Super Admin");
    }

    var ss = getMasterSpreadsheet();
    
    // Check Site Directory (Principals, Admin Assistants, Nurses)
    var siteSheet = ss.getSheetByName(CONFIG.TABS.SITE_DIRECTORY);
    if (siteSheet) {
      var sites = siteSheet.getDataRange().getValues();
      for (var i = 1; i < sites.length; i++) {
        var row = sites[i];
        if (emailMatchesList(cleanEmail, row[2])) { // Principal Email
          roles.isApprover = true;
          roles.approverTypes.push("Principal (" + row[0] + ")");
        }
        if (emailMatchesList(cleanEmail, row[4])) { // Admin Assistant Email
          roles.isApprover = true;
          roles.approverTypes.push("Admin Assistant (" + row[0] + ")");
        }
        if (emailMatchesList(cleanEmail, row[6])) { // Nurse Email
          roles.approverTypes.push("Nurse (" + row[0] + ")");
        }
      }
    }

    // Check Deans
    var deansSheet = ss.getSheetByName(CONFIG.TABS.DEANS);
    if (deansSheet) {
      var deans = deansSheet.getDataRange().getValues();
      for (var j = 1; j < deans.length; j++) {
        if (emailMatchesList(cleanEmail, deans[j][1])) {
          roles.isApprover = true;
          roles.approverTypes.push("Dean (" + deans[j][0] + ")");
        }
      }
    }

    // Check District Config Roles
    var configSheet = ss.getSheetByName(CONFIG.TABS.DISTRICT_CONFIG);
    if (configSheet) {
      var configs = configSheet.getDataRange().getValues();
      for (var k = 1; k < configs.length; k++) {
        var roleKey = configs[k][0];
        var roleLabel = configs[k][1];
        var emails = configs[k][2];
        if (emailMatchesList(cleanEmail, emails)) {
          roles.isApprover = true;
          if (roleKey === "OPS_SECRETARY" || roleKey === "OPS_DIRECTOR") {
            roles.isOpsSecretary = true;
          }
          if (roles.approverTypes.indexOf(roleLabel) === -1) {
            roles.approverTypes.push(roleLabel);
          }
        }
      }
    }

  } catch (err) {
    console.error("Error evaluating user roles: " + err);
  }

  return roles;
}
