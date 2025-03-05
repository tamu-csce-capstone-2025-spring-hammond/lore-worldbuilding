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
  var template = HtmlService.createTemplateFromFile('intro_sidebar');
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