function onOpen() {
  Logger.log("onOpen triggered"); // DEBUG
  var doc = DocumentApp.getActiveDocument(); // Get the active Google Docs file

  if (doc) {
    DocumentApp.getUi()
      .createAddonMenu()
      .addItem("Open Sidebar", "showSidebar")
      .addToUi();
      Logger.log(doc.getName())
  }

  // Increment and track the open count
    trackOpenCount();
    getDocText();
}

// Navigate pages START //
function showSidebar() {
  var template = HtmlService.createTemplateFromFile('intro_sidebar');
  var html = template.evaluate().setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

function showRegularSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

function showLandingPage() {
  var template = HtmlService.createTemplateFromFile('LandingPage');
  var html = template.evaluate().setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

//Show a page depending on chosen option
function showPage(page) {
  try {
    var htmlFile;
    
    if (page === "viewCatalogs") {
      htmlFile = "viewCatalogs"; // This should match viewCatalogs.html
    } else if (page === "viewTimeline") {
      htmlFile = "Timeline_Page"; // This should match Timeline_Page.html
    } else if(page == "LandingPage") {
      htmlFile = "LandingPage";
    } else if(page == "Proper"){
      htmlFile = "Proper"
    } else {
      throw new Error("Invalid page requested: " + page);
    }

    // Create the template
    var template = HtmlService.createTemplateFromFile(htmlFile);
    var html = template.evaluate().setTitle('LORE Worldbuilder');
    DocumentApp.getUi().showSidebar(html);

  } catch (error) {
    Logger.log("Error in showPage(): " + error.message);

    // Show a simple error message
    var errorMessage = HtmlService.createHtmlOutput(
      `<p style="color: red;"> Error: ${error.message}</p>`
    ).setTitle('Error');
    DocumentApp.getUi().showSidebar(errorMessage);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

// Navigate pages END //

function installAddon() {
  onOpen();
}


// Important information for firebase API to connect with the database START //
function getFirestorePrivateKey() {
  var scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('FIREBASE_PRIVATE_KEY');
}

const PROJECT_ID = "howdy-ed4fe";
const FIREBASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/`;

const SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@howdy-ed4fe.iam.gserviceaccount.com";
const PRIVATE_KEY = getFirestorePrivateKey().replace(/\\n/g, '\n');

//Get authentication token using Google Apps Script's OAuth service
function getAccessToken() {
  var jwt = {
    alg: "RS256",
    typ: "JWT"
  };

  var claimSet = {
    iss: SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };

  var header = Utilities.base64EncodeWebSafe(JSON.stringify(jwt));
  var claim = Utilities.base64EncodeWebSafe(JSON.stringify(claimSet));
  var signature = Utilities.computeRsaSha256Signature(header + "." + claim, PRIVATE_KEY);
  var signedJwt = header + "." + claim + "." + Utilities.base64EncodeWebSafe(signature);

  var options = {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt
    }
  };

  var response = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", options);
  var json = JSON.parse(response.getContentText());
  return json.access_token;
}

// Important information for firebase API to connect with the database END //


//Read Data from Firestore

//Read Firestore Data based on collection name ("Characters", "Events", "Locations") FOR NOW
function getFirestoreData(collection) {
  var url = FIREBASE_URL + collection;
  
  var options = {
    method: "get",
    headers: {
      Authorization: "Bearer " + getAccessToken()
    }
  };

  var response = UrlFetchApp.fetch(url, options);
  var jsonData = JSON.parse(response.getContentText());

  if (!jsonData.documents) {
    return []; // Return empty array if no documents found
  }

  // Extract relevant fields from Firestore response
  var result = jsonData.documents.map(doc => {
    var fields = doc.fields;
    return fields.Name.stringValue; // Adjust this based on Firestore structure
  });

  Logger.log(result);
  return result;
}

//Will change have to figure out how to get catalogs from Firestore
function getCatalogs() {
  return ["Characters", "Events", "Locations"];
}

function getCatalogData(catalog) {
  //Debugging: Store logs to return to JavaScript
  var logs = []; 

  logs.push("getCatalogData() called with catalog: " + catalog);

  if (!catalog) {
      logs.push("Error: catalog is undefined!");
      return logs;
  }

  logs.push("Fetching from Firestore Collection: " + catalog);

  var data = getFirestoreData(catalog);
  logs.push("Firestore returned: " + JSON.stringify(data));

  //Debugging: Return logs and data to JavaScript
  return { logs: logs, data: data }; 
}


function deleteCatalogEntity(catalog, entity){
  //catalog = "Characters";
  //entity - "Test"
  var url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entity);
  //var url = FIREBASE_URL + catalog + entity;
  //var url = FIREBASE_URL + "/" + encodeURIComponent(entity);

  var options = {
    method: "delete",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    }    
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();
  var responseBody = response.getContentText();

  Logger.log("DELETE Request URL: " + url);
  Logger.log("Response Code: " + statusCode);
  Logger.log("Response Body: " + responseBody);

  if (statusCode == 200 || statusCode == 204) {
    return { success: true, message: "Entity deleted successfully." };
  } else {
    return { success: false, message: "Failed to delete entity. Status: " + statusCode + " Response: " + responseBody };
  }
}


function addCatalogEntity(catalog, entityName) {
  var url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entityName);

  var payload = {
    fields: {
      Name: { stringValue: entityName } 
    }
  };

  var options = {
    method: "patch",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload)
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();
  return statusCode === 200 || statusCode === 201;
}


//Update Function
function updateCatalogEntity(collection, documentId, updateData) {
  var url = FIREBASE_URL + collection + "/" + encodeURIComponent(documentId);

  var payload = {
    fields: updateData  // Firestore expects fields in this format
  };

  var options = {
    method: "PATCH",  // Use PATCH to update only specific fields
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();
  var responseBody = response.getContentText();

  Logger.log("PATCH Request URL: " + url);
  Logger.log("Response Code: " + statusCode);
  Logger.log("Response Body: " + responseBody);

  return statusCode === 200 || statusCode === 201;
}


//get document fields
function getDocumentFields(collection, documentId) {
  //collection = "Characters";
  //documentId = "Test";
  var url = FIREBASE_URL + collection + "/" + encodeURIComponent(documentId);

  var options = {
    method: "get",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();
  var responseBody = response.getContentText();

  if (statusCode === 200) {
    var data = JSON.parse(responseBody);
    Logger.log(data)
    return data.fields; // ✅ Return document fields
  } else {
    return { error: "Failed to get document. Status: " + statusCode, response: responseBody };
  }
}


function findProperNouns() {
  var doc = DocumentApp.getActiveDocument();
  var text = doc.getBody().getText();

  // Regular expression to match proper nouns while allowing multi-word names
  var properNounRegex = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;

  // Regular expression to match titled words
  var properNounRegexTitled = /\b(?:Mr|Ms|Mrs|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b|\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;
  
  // Regular expression to exclude capitalized words at the start of sentences/dialogue
  var sentenceStartRegex = /(?:[.!?]"?\s+|\n|^)([A-Z][a-z]+)/g;

  // Match proper nouns in the text
  var matches = text.match(properNounRegex) || [];

  // Find first words of sentences and dialogues
  var firstWords = [];
  var match;
  while ((match = sentenceStartRegex.exec(text)) !== null) {
    firstWords.push(match[1]); // Collect sentence-initial words
  }

  // List of words to exclude (honorifics, common words)
  var excludeWords = new Set([
    "I", "The", 
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]);

  // Find valid proper nouns: filter out sentence-start words, common words, and allow title-based names
  var properNouns = matches.filter(word =>
    !firstWords.includes(word) && !excludeWords.has(word)
  );

  // Remove duplicates
  properNouns = [...new Set(properNouns)];

  return properNouns.length ? properNouns : ["No proper nouns found."];

  // /(?<![.!?]"?\s)(?<!^)\b(?:Mr|Ms|Mrs|Dr|Prof)\.?\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g

}



function findProperNouns2() {
  var doc = DocumentApp.getActiveDocument();
  var text = doc.getBody().getText();

  // Regular expression to match proper nouns while allowing multi-word names
  var properNounRegex = /(?<![.!?]\s|^|")\b(?:Mr|Ms|Mrs|Dr|Prof)\.\s[A-Z][a-z]+(?:[\s|-][A-Z][a-z]+)*\b|(?<![.!?]\s|^|")\b[A-Z][a-z]+(?:[\s|-][A-Z][a-z]+)*\b/gm;
  var titleNounRegex = /(?<![.!?]\s|^|")\b(?:Mr|Ms|Mrs|Dr|Prof)\.\s[A-Z][a-z]+(?:\s(?:of|the|van|von|de|du|del|la|le|da|di|der|den|ter|ten))\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b|(?<![.!?]\s|^|")\b[A-Z][a-z]+(?:\s(?:of|the|van|von|de|du|del|la|le|da|di|der|den|ter|ten))\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/gm;

  // Match proper nouns in the text
  console.log("Finding proper nouns...");
  var matches = text.match(properNounRegex) || [];

  console.log("Finding title proper nouns...")
  var titleMatches = text.match(titleNounRegex) || [];

  // List of words to exclude (honorifics, common words)
  var excludeWords = new Set([
    "I", "She", "He", "You", "The",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]);

  var uniqueProperNouns = new Set();
  var baseNames = new Map();

  var allMatches = matches.concat(titleMatches);

  console.log("Eliminating duplicates...");
  allMatches.forEach(name => {
    if (!excludeWords.has(name)) {
      var nameParts = name.split(/\s|-/);
      var baseName = nameParts[nameParts.length - 1]; // Get the last word as the base name

      if (baseNames.has(baseName)) {
        // If the base name already exists with a title, prefer the longer full name
        if (name.length > baseNames.get(baseName).length) {
          uniqueProperNouns.delete(baseNames.get(baseName)); // Remove the shorter one
          uniqueProperNouns.add(name);
          baseNames.set(baseName, name);
        }
      } else {
        // Add new entry
        uniqueProperNouns.add(name);
        baseNames.set(baseName, name);
      }
    }
  });

  return uniqueProperNouns.size ? [...uniqueProperNouns] : ["No proper nouns found."];
}


// Function to pass data to the sidebar
function getProperNounsForSidebar() {
  var properNouns = findProperNouns2();
  return properNouns;
}
