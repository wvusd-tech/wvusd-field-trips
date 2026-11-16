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

  console.log("Sheet setup completed successfully!");
  return "All sheets and directories have been successfully initialized!";
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
