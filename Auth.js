/**
 * Walnut Valley Unified School District (WVUSD)
 * Authentication & Access Control
 */

/**
 * Validates that current session belongs to an authenticated @wvusd.org user.
 * Throws an exception if unauthorized.
 */
function requireWvusdUser() {
  var email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error("Authentication required: Please sign in with your @wvusd.org Google Workspace account.");
  }
  
  var domain = email.split('@')[1] ? email.split('@')[1].toLowerCase() : "";
  if (domain !== CONFIG.DISTRICT_DOMAIN) {
    throw new Error("Access Denied: Only Walnut Valley Unified School District (@wvusd.org) accounts are authorized. Current account: " + email);
  }

  return email.toLowerCase();
}

/**
 * Returns current authenticated user profile and roles
 */
function getCurrentUserProfile() {
  var email;
  try {
    email = requireWvusdUser();
  } catch (e) {
    return {
      authenticated: false,
      email: "",
      error: e.message
    };
  }

  return {
    authenticated: true,
    email: email,
    domain: CONFIG.DISTRICT_DOMAIN,
    roles: getUserRoles(email)
  };
}

/**
 * Determine roles for a given email across site directories, deans, and district config
 */
function getUserRoles(userEmail) {
  var roles = {
    isStaff: true,
    isApprover: false,
    approverTypes: []
  };

  try {
    var ss = getMasterSpreadsheet();
    
    // Check Site Directory (Principals, Admin Assistants, Nurses)
    var siteSheet = ss.getSheetByName(CONFIG.TABS.SITE_DIRECTORY);
    if (siteSheet) {
      var sites = siteSheet.getDataRange().getValues();
      for (var i = 1; i < sites.length; i++) {
        var row = sites[i];
        if (emailMatchesList(userEmail, row[2])) { // Principal Email
          roles.isApprover = true;
          roles.approverTypes.push("Principal (" + row[0] + ")");
        }
        if (emailMatchesList(userEmail, row[4])) { // Admin Assistant Email
          roles.isApprover = true;
          roles.approverTypes.push("Admin Assistant (" + row[0] + ")");
        }
        if (emailMatchesList(userEmail, row[6])) { // Nurse Email
          roles.approverTypes.push("Nurse (" + row[0] + ")");
        }
      }
    }

    // Check Deans
    var deansSheet = ss.getSheetByName(CONFIG.TABS.DEANS);
    if (deansSheet) {
      var deans = deansSheet.getDataRange().getValues();
      for (var j = 1; j < deans.length; j++) {
        if (emailMatchesList(userEmail, deans[j][1])) {
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
        if (emailMatchesList(userEmail, emails)) {
          roles.isApprover = true;
          roles.approverTypes.push(roleLabel);
        }
      }
    }

  } catch (err) {
    console.error("Error evaluating user roles: " + err);
  }

  return roles;
}
