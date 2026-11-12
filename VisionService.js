/**
 * Walnut Valley Unified School District (WVUSD)
 * Google Cloud Vision API Service
 * 
 * Performs TEXT_DETECTION on insurance card uploads to extract policy text
 * and verify valid card documents.
 */

function analyzeInsuranceCard(base64Data) {
  if (!base64Data) {
    return "";
  }

  var scriptProperties = PropertiesService.getScriptProperties();
  var apiKey = scriptProperties.getProperty("VISION_API_KEY");

  if (!apiKey) {
    console.log("VISION_API_KEY not configured in Script Properties. Skipping OCR.");
    return "OCR skipped: VISION_API_KEY not configured";
  }

  try {
    var cleanBase64 = base64Data;
    if (cleanBase64.indexOf("base64,") > -1) {
      cleanBase64 = cleanBase64.split("base64,")[1];
    }

    var url = "https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(apiKey.trim());

    var payload = {
      requests: [
        {
          image: {
            content: cleanBase64
          },
          features: [
            {
              type: "TEXT_DETECTION",
              maxResults: 1
            }
          ]
        }
      ]
    };

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (statusCode !== 200) {
      console.warn("Vision API error (" + statusCode + "): " + responseText);
      return "OCR error: HTTP " + statusCode;
    }

    var json = JSON.parse(responseText);
    var annotations = json.responses && json.responses[0] && json.responses[0].textAnnotations;
    if (annotations && annotations.length > 0) {
      var fullText = annotations[0].description.replace(/\r?\n|\r/g, " ");
      // Return a clean snippet of the detected text
      var cleanSnippet = fullText.substring(0, 300).trim();
      return cleanSnippet.length > 0 ? cleanSnippet : "Text detected but empty";
    }

    return "No text detected on image";

  } catch (err) {
    console.error("Exception during Vision OCR: " + err);
    return "OCR exception: " + err.message;
  }
}
