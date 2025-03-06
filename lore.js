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

function showSidebar() {
  var template;
  if(getOpenCount() < 10){
    template = HtmlService.createTemplateFromFile('intro_sidebar');
  }
  else{
    template = HtmlService.createTemplateFromFile('sidebar');
  }
  var html = template.evaluate().setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

function showRegularSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function installAddon() {
  onOpen();
}

//Important information for firebase API to connect with the database
const PROJECT_ID = "howdy-ed4fe";
const FIREBASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/`;

const SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@howdy-ed4fe.iam.gserviceaccount.com";
const PRIVATE_KEY = getFirestorePrivateKey().replace(/\\n/g, '\n');

function getFirestorePrivateKey() {
  var scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('FIREBASE_PRIVATE_KEY');
}

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

function findProperNouns() {
  // EDGE CASES:
  // Two words separated by space: \b[A-Z][a-z]* [A-Z][a-z]*\b (FILTER IN) look for this first before single words
  // First word in dialogue: (FILTER OUT)
  // Common Phrases: (FILTER OUT)
  // First word of a sentence: (FILTER OUT)
  // 

  var doc = DocumentApp.getActiveDocument();
  var text = doc.getBody().getText();
  
  // Regular expression to match proper nouns (capitalized words)
  var properNounRegex = /\b[A-Z][a-z]+\b/g;
  var matches = text.match(properNounRegex);

  // Remove the first word of each sentence
  var sentences = text.split(/[\.\?!]\s+/); // Split text into sentences
  var firstWords = sentences.map(sentence => {
    var match = sentence.match(/^\b[A-Z][a-z]+\b/); // Get the first capitalized word of each sentence
    return match ? match[0] : null;
  });

  // Remove the first word after a quotation mark
  var quotes = text.split(/["“”']/); // Split text by quotation marks
  var wordsAfterQuotes = quotes.map(quote => {
    var match = quote.trim().match(/^\b[A-Z][a-z]+\b/); // First word after the quote
    return match ? match[0] : null;
  });

  // List of words to exclude (honorifics, common words)
  var excludeWords = [
    "Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Sr", "Jr", "St", "The",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "Drive"
  ];
  // Convert to a Set for quick lookups
  var excludeSet = new Set(excludeWords);

  // Filter out first words of sentences and excluded words, then remove duplicates
  var uniqueProperNouns = [...new Set(matches.filter(word => !firstWords.includes(word) && !excludeSet.has(word)))];

  return uniqueProperNouns.length ? uniqueProperNouns : ["No proper nouns found."];
}

// Function to pass data to the sidebar
function getProperNounsForSidebar() {
  var properNouns = findProperNouns();
  return properNouns;
}
