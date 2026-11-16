/**
 * Walnut Valley Unified School District (WVUSD)
 * Google Drive Service for Roster and Insurance Card uploads
 */

/**
 * Saves a base64-encoded file into the configured Drive folder
 * @param {string} fileName - Destination file name
 * @param {string} base64Data - Base64 data string (can include data:mime;base64, prefix)
 * @param {string} mimeType - Optional mime type
 * @returns {string} File View/Download URL
 */
function saveFileToDrive(fileName, base64Data, mimeType) {
  if (!base64Data) return "";

  // Strip prefix if present (e.g. "data:image/jpeg;base64,...")
  var cleanBase64 = base64Data;
  if (cleanBase64.indexOf("base64,") > -1) {
    cleanBase64 = cleanBase64.split("base64,")[1];
  }

  var decodedBytes = Utilities.base64Decode(cleanBase64);
  var blob = Utilities.newBlob(decodedBytes, mimeType || "application/octet-stream", fileName);

  var folder = getAttachmentsFolder();
  var file = folder.createFile(blob);
  
  // Save directly into the restricted district folder (no public link sharing)
  // File inherits parent folder permissions (restricted to district staff)
  return file.getUrl();
}

/**
 * Retrieve or create the target Drive folder
 */
function getAttachmentsFolder() {
  var folderId = getDistrictConfigValue("PERMISSION_SLIPS_FOLDER_ID");

  if (folderId && folderId !== "[ENTER_DRIVE_FOLDER_ID]" && folderId.trim() !== "") {
    try {
      return DriveApp.getFolderById(folderId.trim());
    } catch (e) {
      console.warn("Could not open configured folder ID '" + folderId + "': " + e.message + ". Falling back to default folder.");
    }
  }

  // Fallback: search or create "WVUSD Field Trips Attachments" in Drive
  var folderName = "WVUSD Field Trips Attachments";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var newFolder = DriveApp.createFolder(folderName);
    console.log("Created fallback Drive folder: " + newFolder.getId());
    return newFolder;
  }
}
