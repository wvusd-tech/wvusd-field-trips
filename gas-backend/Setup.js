/**
 * Walnut Valley Unified School District (WVUSD)
 * Setup & Initialization Script
 *
 * Run setupSheets() once to create and format all required sheets,
 * freeze top rows, and populate reference directories.
 */

function setupSheets() {
  var masterSS = getMasterSpreadsheet();
  var slipsSS = getSlipsSpreadsheet();

  console.log("Starting sheet setup for WVUSD Field Trips...");

  // 1. MASTER SHEET - Requests Tab
  initSheet(masterSS, CONFIG.TABS.REQUESTS, CONFIG.HEADERS.REQUESTS);

  // 2. MASTER SHEET - Approval_Logs Tab
  initSheet(masterSS, CONFIG.TABS.APPROVAL_LOGS, CONFIG.HEADERS.APPROVAL_LOGS);

  // 3. MASTER SHEET - Site_Directory Tab
  var siteSheet = initSheet(masterSS, CONFIG.TABS.SITE_DIRECTORY, CONFIG.HEADERS.SITE_DIRECTORY);
  populateSiteDirectory(siteSheet);

  // 4. MASTER SHEET - Deans Tab
  var deansSheet = initSheet(masterSS, CONFIG.TABS.DEANS, CONFIG.HEADERS.DEANS);
  populateDeans(deansSheet);

  // 5. MASTER SHEET - District_Config Tab
  var configSheet = initSheet(masterSS, CONFIG.TABS.DISTRICT_CONFIG, CONFIG.HEADERS.DISTRICT_CONFIG);
  populateDistrictConfig(configSheet);

  // 6. SLIPS SHEET - Student_Slips Tab
  initSheet(slipsSS, CONFIG.TABS.STUDENT_SLIPS, CONFIG.HEADERS.STUDENT_SLIPS);

  // 7. SLIPS SHEET - Volunteer_Slips Tab
  initSheet(slipsSS, CONFIG.TABS.VOLUNTEER_SLIPS, CONFIG.HEADERS.VOLUNTEER_SLIPS);

  // 8. SEED DEMO TRIPS & PERMISSION SLIPS
  seedDemoTrips("kwendland@wvusd.org");

  console.log("Sheet setup completed successfully!");
  return "All sheets, directories, and demo trips have been successfully initialized!";
}

/**
 * Initialize a sheet with headers, frozen row, and basic styling if empty
 */
function initSheet(ss, tabName, headers) {
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  }

  // Ensure 1 frozen row
  sheet.setFrozenRows(1);

  // Check if header row exists
  var lastCols = sheet.getLastColumn();
  if (lastCols === 0 || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    // If headers exist, ensure columns match
    var currentHeaders = sheet.getRange(1, 1, 1, lastCols).getValues()[0];
    if (currentHeaders.length < headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  // Header styling: Navy blue (#1E3A8A) with bold white text
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1e3a8a")
             .setFontColor("#ffffff")
             .setFontWeight("bold")
             .setFontSize(10)
             .setWrap(false);

  return sheet;
}

/**
 * Pre-populate the 18 Site Directory rows
 */
function populateSiteDirectory(sheet) {
  if (sheet.getLastRow() > 1) {
    // Already populated
    return;
  }

  var directoryData = [
    ["Castle Rock Elementary", "Elizabeth Chang", "echang@wvusd.org", "Vanessa Zendejas", "njohnson@wvusd.org", "Stephanie Gallegos", "sgallegos@wvusd.org"],
    ["CJ Morris Elementary", "Jennifer Veneracion", "jveneracion@wvusd.org", "Marilyn Carter", "mcarter@wvusd.org", "Nathalie Youssef", "nyoussef@wvusd.org"],
    ["Collegewood Elementary", "Rochelle Wolfe", "jcadena@wvusd.org", "Cecille Hernandez-Ortiz", "psiacunco@wvusd.org", "Carol Lee", "carollee@wvusd.org"],
    ["Evergreen Elementary", "Gabriel Cardenas", "gcardenas@wvusd.org", "Desiree Gomez", "desireegomez@wvusd.org", "Stephanie Gallegos", "sgallegos@wvusd.org"],
    ["Maple Hill Elementary", "Kim McNeil", "kmcneil@wvusd.org", "Kendra Wilson", "kperez@wvusd.org", "Kelly Kim", "kellykim@wvusd.org"],
    ["Quail Summit Elementary", "Nicole Hernandez", "nhernandez@wvusd.org", "Anna Amezcua", "aamezcua@wvusd.org", "Kelly Kim", "kellykim@wvusd.org"],
    ["Vejar Elementary", "Whitney Kosloski", "fweissenberger@wvusd.org", "Veronica Valenzuela", "vvalenzuela@wvusd.org", "Nathalie Youssef", "dhoac@wvusd.org"],
    ["Walnut Elementary", "Robert Chang", "jpak@wvusd.org", "Julie Charlton", "mdrain@wvusd.org", "Donna Lu", "dhoac@wvusd.org"],
    ["Westhoff Elementary", "Rosa Northcott", "rnorthcott@wvusd.org", "Brittany Dalrymple", "bDalrymple@wvusd.org", "Carol Lee", "carollee@wvusd.org"],
    ["Chaparral Middle School", "Robby Jung", "pcruz@wvusd.org", "Geraldine Munoz", "gmunoz@wvusd.org", "Kelly Kim", "kellykim@wvusd.org"],
    ["South Pointe Middle School", "Julie Galindo", "jgalindo@wvusd.org", "Mary Weir", "mweir@wvusd.org", "Stephanie Gallegos", "sgallegos@wvusd.org"],
    ["Suzanne Middle School", "Matt Spinogatti", "mspinogatti@wvusd.org", "Pia Munoz", "piamunoz@wvusd.org", "Nathalie Youssef", "nyoussef@wvusd.org"],
    ["Diamond Bar High School", "YY", "yliew@wvusd.org", "Cathy Norys", "[ENTER_DBHS_ADMIN_EMAIL]", "Theresa Guest", "tguest@wvusd.org"],
    ["Walnut High School", "Jamie Norell", "jnorell@wvusd.org", "Monique Estrada", "mestrada@wvusd.org", "Carol Lee", "carollee@wvusd.org"],
    ["Ron Hockwalt Academies", "Ryan Maine", "asmith@wvusd.org", "Lissette Chappel", "lchappel@wvusd.org", "Donna Lu", "dhoac@wvusd.org"],
    ["HARTT", "Amber Verdi", "averdi@wvusd.org", "Lissette Chappel", "lchappel@wvusd.org", "Donna Lu", "dhoac@wvusd.org"],
    ["Childcare", "Paula Gutierrez", "pgutierrez@wvusd.org", "Danielle Sarver", "dsarver@wvusd.org", "Carol Lee", "carollee@wvusd.org"],
    ["TOTS Preschool", "Erin Perez", "eperez@wvusd.org", "Janet Rida", "jrida@wvusd.org", "Carol Lee", "carollee@wvusd.org"]
  ];

  sheet.getRange(2, 1, directoryData.length, directoryData[0].length).setValues(directoryData);
}

/**
 * Pre-populate the 8 Deans rows
 */
function populateDeans(sheet) {
  if (sheet.getLastRow() > 1) {
    return;
  }

  var deansData = [
    ["Luz Lozano", "llozano@wvusd.org"],
    ["Trina Dreyer", "tdreyer@wvusd.org"],
    ["Ryan McDonnell", "rmcdonnell@wvusd.org"],
    ["Gabriel Aguilar", "gaguilar@wvusd.org"],
    ["Denise Loera", "dloera@wvusd.org"],
    ["Jennifer Burns", "jburns@wvusd.org"],
    ["Valerie Varela", "vvarela@wvusd.org"],
    ["Kurt Davies", "kdavies@wvusd.org"]
  ];

  sheet.getRange(2, 1, deansData.length, deansData[0].length).setValues(deansData);
}

/**
 * Pre-populate District_Config table
 */
function populateDistrictConfig(sheet) {
  if (sheet.getLastRow() > 1) {
    return;
  }

  var configData = [
    ["OPS_SECRETARY", "Operations Secretary", "[ENTER_OPS_SECRETARY_EMAIL]"],
    ["TRANSPORTATION", "Transportation", "[ENTER_TRANSPORTATION_EMAIL]"],
    ["HR_PERSONNEL", "HR Personnel", "[ENTER_HR_EMAIL]"],
    ["OPS_DIRECTOR", "Operations Director", "[ENTER_OPS_DIRECTOR_EMAIL]"],
    ["PERMISSION_SLIPS_FOLDER_ID", "Drive Folder ID for Uploaded Rosters & Insurance Cards", "[ENTER_DRIVE_FOLDER_ID]"]
  ];

  sheet.getRange(2, 1, configData.length, configData[0].length).setValues(configData);
}

/**
 * Seeds demo trips and permission slips:
 * 1. FT-2026-0042: Under Review / In Process (Griffith Observatory)
 * 2. FT-2026-0029: Approved (Complete) with Student and Volunteer permission slips (Mission San Juan Capistrano)
 */
function seedDemoTrips(teacherEmailOverride) {
  var teacherEmail = teacherEmailOverride || "kwendland@wvusd.org";
  var masterSS = getMasterSpreadsheet();
  var slipsSS = getSlipsSpreadsheet();

  var reqSheet = masterSS.getSheetByName(CONFIG.TABS.REQUESTS);
  var logSheet = masterSS.getSheetByName(CONFIG.TABS.APPROVAL_LOGS);
  var stuSheet = slipsSS.getSheetByName(CONFIG.TABS.STUDENT_SLIPS);
  var volSheet = slipsSS.getSheetByName(CONFIG.TABS.VOLUNTEER_SLIPS);

  if (!reqSheet || !logSheet || !stuSheet || !volSheet) {
    throw new Error("Required sheets not found. Please run setupSheets() first.");
  }

  // Check if FT-2026-0042 already exists
  var existingReqData = reqSheet.getDataRange().getValues();
  var hasDemo1 = false;
  var hasDemo2 = false;
  for (var r = 1; r < existingReqData.length; r++) {
    if (existingReqData[r][0] === "FT-2026-0042") hasDemo1 = true;
    if (existingReqData[r][0] === "FT-2026-0029") hasDemo2 = true;
  }

  var nowIso = new Date().toISOString();

  // 1. In-Process Demo Trip: FT-2026-0042
  if (!hasDemo1) {
    var req1 = [
      "FT-2026-0042", "Under Review", "Site Admin Assistant", nowIso, teacherEmail,
      "Diamond Bar High School", "Kurt Davies", "kdavies@wvusd.org", "Kevin Wendland", "mchen@wvusd.org",
      "Science & Astronomy Club", "2026-12-10", "08:00", "2026-12-10", "16:30",
      "", "No", "", "Griffith Observatory & Planetarium", "2800 E Observatory Rd, Los Angeles, CA 90027",
      "Educational - less than 50 miles", "9th, 10th, 11th, 12th", 45, 22, 23,
      "", "https://drive.google.com/open?id=demo_roster_1", 2, 4, 2,
      2, "Robert Miller, Sarah Lin", "No", "School Bus", JSON.stringify({ schoolBusTF: "TF-2026-881", wheelchairBus: false, boosterSeat: false, safetyVest: false }),
      "Planetarium dome show on celestial mechanics, telescope exploration, and interactive physics exhibits.",
      "Next Generation Science Standards (NGSS) HS-ESS1: Earth's Place in the Universe.",
      "Ramp accessibility verified throughout grounds; health office plan on file.", "Yes", "1:8 staff-to-student chaperone ratio with designated group leaders.",
      "Science Club ASB", 0, 650, "Fully funded by Science Club allocations; no fee to students.", "Yes",
      "Yes", nowIso, false
    ];
    reqSheet.appendRow(req1);

    // Initial Submission Log
    logSheet.appendRow([
      "LOG-4201", "FT-2026-0042", nowIso, teacherEmail, "Teacher",
      "Submitted", "Initial request submitted for Griffith Observatory educational trip.", "New", "Site Admin Assistant"
    ]);
  }

  // 2. Approved Demo Trip: FT-2026-0029
  if (!hasDemo2) {
    var req2 = [
      "FT-2026-0029", "Approved (Complete)", "Approved", "2026-10-20T10:00:00.000Z", teacherEmail,
      "Castle Rock Elementary", "Not Applicable", "", "Kevin Wendland", "vvalenzuela@wvusd.org",
      "4th Grade California History", "2026-11-20", "08:30", "2026-11-20", "14:30",
      "", "No", "", "Mission San Juan Capistrano", "26801 Old Mission Rd, San Juan Capistrano, CA 92675",
      "Educational - less than 50 miles", "4th", 65, 32, 33,
      "", "https://drive.google.com/open?id=demo_roster_3", 3, 8, 4,
      4, "Robert Miller, Sarah Lin, David Gomez, Amanda White", "No", "School Bus", JSON.stringify({ schoolBusTF: "TF-2026-302", boosterSeat: false, safetyVest: false, wheelchairBus: false }),
      "Guided docent tour of historic California mission, courtyard museum, and cultural adobe artifacts.",
      "California Social Studies Standards 4.2 (Spanish Exploration & Colonial Mission Period).",
      "Accessible walkways throughout mission grounds; first aid and student medication accompanied.", "Yes", "1:8 chaperone ratio with color-coded student wristbands.",
      "Castle Rock Community Club", 0, 1100, "Fully sponsored by Community Club educational fund.", "Yes",
      "Yes", "2026-11-04T16:00:00.000Z", true
    ];
    reqSheet.appendRow(req2);

    // Complete Sequential Approval Logs
    var logs2 = [
      ["LOG-301", "FT-2026-0029", "2026-10-20T10:00:00.000Z", teacherEmail, "Teacher", "Submitted", "Submitted 4th grade mission trip request.", "New", "Site Admin Assistant"],
      ["LOG-302", "FT-2026-0029", "2026-10-21T09:00:00.000Z", "njohnson@wvusd.org", "Site Admin Assistant", "Approved", "Verified calendar and student count.", "Site Admin Assistant", "Principal"],
      ["LOG-303", "FT-2026-0029", "2026-10-22T14:00:00.000Z", "echang@wvusd.org", "Principal", "Approved", "Educational alignment and supervision plan approved.", "Principal", "Operations Secretary"],
      ["LOG-304", "FT-2026-0029", "2026-10-25T11:00:00.000Z", "opssecretary@wvusd.org", "Operations Secretary", "Approved", "Verified district safety checklist.", "Operations Secretary", "Transportation"],
      ["LOG-305", "FT-2026-0029", "2026-10-28T15:30:00.000Z", "transportation@wvusd.org", "Transportation", "Approved", "District bus TF-2026-302 scheduled.", "Transportation", "HR Personnel"],
      ["LOG-306", "FT-2026-0029", "2026-11-01T10:15:00.000Z", "hr@wvusd.org", "HR Personnel", "Approved", "Chaperone background checks and Megan's Law clearance verified.", "HR Personnel", "Operations Director"],
      ["LOG-307", "FT-2026-0029", "2026-11-04T16:00:00.000Z", "opsdirector@wvusd.org", "Operations Director", "Approved", "Final approval granted. Have a safe trip!", "Operations Director", "Approved"]
    ];
    for (var l = 0; l < logs2.length; l++) {
      logSheet.appendRow(logs2[l]);
    }

    // Student Permission Slips for FT-2026-0029
    var students = [
      ["SLIP-STU-001", "FT-2026-0029", "2026-11-15T09:00:00.000Z", "10045812", "Ethan", "Miller", "Kevin Wendland", "Yes", "Yes", "Yes", "Blue Shield CA", "BSC-9482910", "", "", "Yes", "Yes", "Yes", "No", "", "", "No", "N/A", "Yes", "Yes", "Robert Miller", "(909) 555-0143", "rmiller@example.com", "2026-11-15"],
      ["SLIP-STU-002", "FT-2026-0029", "2026-11-15T10:15:00.000Z", "10045899", "Chloe", "Zhang", "Kevin Wendland", "No", "Yes", "Yes", "Kaiser Permanente", "KP-1029384", "", "", "Yes", "Yes", "Yes", "Yes", "Asthma - Inhaler needed for outdoor walk", "2026-11-15T10:16:00.000Z", "Yes", "With Student In Backpack", "Yes", "Yes", "Sarah Lin", "(909) 555-0199", "slin@example.com", "2026-11-15"],
      ["SLIP-STU-003", "FT-2026-0029", "2026-11-15T11:00:00.000Z", "10046124", "Sophia", "Rodriguez", "Kevin Wendland", "Yes", "Yes", "Yes", "Anthem Blue Cross", "ANT-7738291", "", "", "Yes", "Yes", "Yes", "No", "", "", "No", "N/A", "Yes", "Yes", "David Gomez", "(909) 555-0277", "dgomez@example.com", "2026-11-15"],
      ["SLIP-STU-004", "FT-2026-0029", "2026-11-15T11:30:00.000Z", "10046205", "Lucas", "Vance", "Kevin Wendland", "Yes", "No", "Yes", "Cigna Healthcare", "CG-882910", "", "", "Yes", "Yes", "Yes", "Yes", "Severe peanut allergy - carries EpiPen", "2026-11-15T11:31:00.000Z", "Yes", "With Teacher/Chaperone", "Yes", "Yes", "Amanda Vance", "(909) 555-0312", "avance@example.com", "2026-11-15"],
      ["SLIP-STU-005", "FT-2026-0029", "2026-11-15T12:00:00.000Z", "10046011", "Marcus", "Lee", "Kevin Wendland", "No", "No", "No", "Uninsured", "None", "", "", "Yes", "Yes", "Yes", "No", "", "", "No", "N/A", "Yes", "Yes", "Jennifer Lee", "(909) 555-0455", "jlee@example.com", "2026-11-15"],
      ["SLIP-STU-006", "FT-2026-0029", "2026-11-15T13:20:00.000Z", "10046310", "Emma", "Watson", "Kevin Wendland", "No", "Yes", "Yes", "UnitedHealthcare", "UHC-992013", "", "", "Yes", "Yes", "Yes", "No", "", "", "No", "N/A", "Yes", "Yes", "Mark Watson", "(909) 555-0589", "mwatson@example.com", "2026-11-15"],
      ["SLIP-STU-007", "FT-2026-0029", "2026-11-15T14:10:00.000Z", "10046422", "Aiden", "Patel", "Kevin Wendland", "Yes", "Yes", "Yes", "Aetna", "AET-449102", "", "", "Yes", "Yes", "Yes", "No", "", "", "No", "N/A", "Yes", "Yes", "Priya Patel", "(909) 555-0671", "ppatel@example.com", "2026-11-15"],
      ["SLIP-STU-008", "FT-2026-0029", "2026-11-15T15:00:00.000Z", "10046535", "Olivia", "Chen", "Kevin Wendland", "No", "Yes", "Yes", "Blue Shield CA", "BSC-3829104", "", "", "Yes", "Yes", "Yes", "No", "", "", "No", "N/A", "Yes", "Yes", "Wei Chen", "(909) 555-0782", "wchen@example.com", "2026-11-15"]
    ];
    for (var s = 0; s < students.length; s++) {
      stuSheet.appendRow(students[s]);
    }

    // Volunteer Permission Slips for FT-2026-0029
    var volunteers = [
      ["SLIP-VOL-01", "FT-2026-0029", "2026-11-15T09:15:00.000Z", "Robert", "Miller", "Ethan Miller", "Yes", "Blue Shield CA", "BSC-9482910", "", "Mary Miller", "(909) 555-0144", "Yes", "Yes", "Robert Miller", "2026-11-15"],
      ["SLIP-VOL-02", "FT-2026-0029", "2026-11-15T10:30:00.000Z", "Sarah", "Lin", "Chloe Zhang", "Yes", "Kaiser Permanente", "KP-1029384", "", "David Zhang", "(909) 555-0198", "Yes", "Yes", "Sarah Lin", "2026-11-15"],
      ["SLIP-VOL-03", "FT-2026-0029", "2026-11-15T11:45:00.000Z", "David", "Gomez", "Sophia Rodriguez", "Yes", "Anthem Blue Cross", "ANT-7738291", "", "Elena Gomez", "(909) 555-0278", "Yes", "Yes", "David Gomez", "2026-11-15"]
    ];
    for (var v = 0; v < volunteers.length; v++) {
      volSheet.appendRow(volunteers[v]);
    }
  }

  return {
    success: true,
    message: "Demo field trips and permission slips successfully seeded for " + teacherEmail
  };
}
