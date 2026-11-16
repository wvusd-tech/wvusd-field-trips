/**
 * Walnut Valley Unified School District (WVUSD) Field Trip System
 * Configuration & Constants
 */

var CONFIG = {
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
    // Slips Sheet Tabs
    STUDENT_SLIPS: "Student_Slips",
    VOLUNTEER_SLIPS: "Volunteer_Slips"
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
      "Restart_Ack", "Last_Updated", "Locked_Boolean"
    ],
    APPROVAL_LOGS: [
      "Log_ID", "Request_ID", "Timestamp", "Actor_Email", "Actor_Role",
      "Action", "Comment_Text", "Stage_From", "Stage_To"
    ],
    SITE_DIRECTORY: [
      "Site", "Principal", "Principal Email", "Admin Assistant", "Admin Assistant Email",
      "Nurse", "Nurse Email"
    ],
    DEANS: [
      "Dean", "Dean Email"
    ],
    DISTRICT_CONFIG: [
      "Role_Key", "Display_Label", "Email_List"
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
    ]
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
