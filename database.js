// Important information for firebase API to connect with the database START //
function getFirestorePrivateKey() {
  var scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty('FIREBASE_PRIVATE_KEY');
}

const PROJECT_ID = "lore-worldbuilding";
const FIREBASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/`;

const SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@lore-worldbuilding.iam.gserviceaccount.com";
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
  const { uid, worldId } = getUserContext();
  const path = `Users/${uid}/Worlds/${worldId}/${collection}`;
  var url = FIREBASE_URL + path;
  
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
  const result = jsonData.documents
    .filter(doc => !doc.name.endsWith("/_init"))
    .map(doc => {
      const fields = doc.fields || {};
      return fields.Name?.stringValue || "(Unnamed)";
    });
  Logger.log(result);
  return result;
}

function extractFirestoreValue(field) {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.arrayValue !== undefined) {
    return (field.arrayValue.values || []).map(extractFirestoreValue);
  }
  if (field.mapValue !== undefined) {
    var result = {};
    for (var key in field.mapValue.fields) {
      result[key] = extractFirestoreValue(field.mapValue.fields[key]);
    }
    return result;
  }
  if (field.nullValue !== undefined) return null;
  return null;
}

