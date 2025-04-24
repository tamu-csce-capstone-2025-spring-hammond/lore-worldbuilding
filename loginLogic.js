//Function to set the userID and worldID for later use such as when creating paths
// - uid: a string representing the userID
// - worldID: a string representing the worldID
function setUserWorld(uid, worldId) {
  const props = PropertiesService.getUserProperties();
  props.setProperty("uid", uid);
  props.setProperty("worldId", worldId);
}


//Function to actually get backend functions 
//IGNORE FOR NOW I THINK THIS IS NO LONGER USED!!!!!!
function getUserContext() {
  const props = PropertiesService.getUserProperties();
  const uid = props.getProperty("uid");
  const worldId = props.getProperty("worldId");

  if (!uid || !worldId) {
    throw new Error("User context not fully initialized.");
  }

  return { uid, worldId };
}


//Function to create UID of each user by using SHA256 encryption
// - email: Email of current user
function normalizeEmailToUID(email) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email)
  );
}

//Function for initial setup of a user
function bootstrapUser() {
  const email = Session.getActiveUser().getEmail();
  const uid = normalizeEmailToUID(email);

  // Create or update the user document
  const url = FIREBASE_URL + `Users/${uid}`;
  const fields = {
    email: { stringValue: email },
    createdAt: { timestampValue: new Date().toISOString() }
  };

  const userPayload = JSON.stringify({ fields });
  const userOptions = {
    method: "PATCH",
    contentType: "application/json",
    payload: userPayload,
    headers: {
      Authorization: "Bearer " + getAccessToken()
    }
  };

  UrlFetchApp.fetch(url, userOptions);

  // Now get a list of worlds under this user
  const worldsUrl = FIREBASE_URL + `Users/${uid}/Worlds`;
  const worldsOptions = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + getAccessToken()
    }
  };

  const response = UrlFetchApp.fetch(worldsUrl, worldsOptions);
  const data = JSON.parse(response.getContentText());

  const worlds = (data.documents || []).map(doc => {
    const worldId = doc.name.split("/").pop();
    const fields = doc.fields || {};
    return {
      id: worldId,
      name: fields.name?.stringValue || worldId,
      description: fields.description?.stringValue || ""
    };
  });

  return {
    uid: uid,
    email: email,
    worlds: worlds
  };
}

//Function to create world
// - uid: a string representing the userID
// - worldID: a string representing the worldID
// - name: string of the world's name
// - description: string of the world's description
function createWorld(uid, worldId, name, description) {
  const basePath = `Users/${uid}/Worlds/${worldId}`;
  const baseUrl = FIREBASE_URL + basePath;

  // Step 1: Create the world document
  const fields = {
    name: { stringValue: name },
    description: { stringValue: description },
    createdAt: { timestampValue: new Date().toISOString() }
  };

  const worldPayload = JSON.stringify({ fields });
  const options = {
    method: "PATCH",
    contentType: "application/json",
    payload: worldPayload,
    headers: {
      Authorization: "Bearer " + getAccessToken()
    }
  };

  UrlFetchApp.fetch(baseUrl, options);

  // Step 2: Create _init documents in Characters, Events, and Locations
  const categories = ["Characters", "Events", "Locations"];
  const initFields = JSON.stringify({
  fields: {
    _init: { booleanValue: true }
  }
});


  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const path = `${baseUrl}/${cat}/_init`;
    const initOptions = {
      method: "PATCH",
      contentType: "application/json",
      payload: initFields,
      headers: {
        Authorization: "Bearer " + getAccessToken()
      }
    };
    UrlFetchApp.fetch(path, initOptions);
  }

  return { success: true, worldId: worldId };
}


//Function to creaete a new world
// name: string of world name
// description: string of that world's description
function createAndSetWorld(name, description) {
  const email = Session.getActiveUser().getEmail();
  const uid = normalizeEmailToUID(email);
  const worldId = name.trim().toLowerCase().replace(/\s+/g, '-');

  setUserWorld(uid, worldId);
  createWorld(uid, worldId, name, description);

  return { success: true }; 
}

//Function to update World Details (name/description)
// - uid: a string representing the userID
// - worldID: a string representing the worldID
// - newName: a string representing the new name
// - newDescription: a string representing the new description
function updateWorldDetails(uid, worldId, newName, newDescription) {
  const url = FIREBASE_URL + `Users/${uid}/Worlds/${worldId}`;
  const fields = {
    name: { stringValue: newName },
    description: { stringValue: newDescription }
  };

  const payload = JSON.stringify({ fields });
  const options = {
    method: "PATCH",
    contentType: "application/json",
    payload: payload,
    headers: {
      Authorization: "Bearer " + getAccessToken()
    }
  };

  UrlFetchApp.fetch(url, options);
}

//Function to delete a world
// - uid: a string representing the userID
// - worldID: a string representing the worldID
function deleteWorld(uid, worldId) {
  const collections = ["Characters", "Events", "Locations"];
  const token = getAccessToken();

  // Step 1: Delete each subcollection document
  collections.forEach(collection => {
    const basePath = `Users/${uid}/Worlds/${worldId}/${collection}`;
    const url = FIREBASE_URL + basePath;

    const res = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token
      },
      muteHttpExceptions: true
    });

    const data = JSON.parse(res.getContentText());
    const documents = data.documents || [];

    documents.forEach(doc => {
      const docUrl = "https://firestore.googleapis.com/v1/" + doc.name; 
      UrlFetchApp.fetch(docUrl, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token
        }
      });
    });
  });

  // Step 2: Delete the world document itself after deleting the subcollections (Events, Characters, Locations)
  const worldUrl = FIREBASE_URL + `Users/${uid}/Worlds/${worldId}`;
  UrlFetchApp.fetch(worldUrl, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token
    }
  });
}

function loadCatalogDataFromFirestore(worldId) {
  console.log(`Attempting to fetch from Firestore with worldId: ${worldId}`);
  const props = PropertiesService.getUserProperties();
  const uid = props.getProperty("uid");
  if (!uid || !worldId) {
    console.warn("Missing UID or worldId");
    return {};
  }

  const categories = ["Characters", "Locations", "Events"];
  const token = getAccessToken();
  const data = {
    catalogData: {},
    entityData: {},
    radarData: {},
    existingEntities: [],
    ignoredEntities: []
  };

  categories.forEach(category => {
    const path = `Users/${uid}/Worlds/${worldId}/${category}`;
    const url = FIREBASE_URL + path;

    try {
      const response = UrlFetchApp.fetch(url, {
        method: "GET",
        headers: { Authorization: "Bearer " + token }
      });

      const parsed = JSON.parse(response.getContentText());
      const docs = parsed.documents || [];

      console.log(`${category} → Found ${docs.length} document(s)`);

      data.catalogData[category] = [];
      docs.forEach(doc => {
        const entityId = doc.name.split("/").pop();
        if (entityId === "_init") return;
        data.catalogData[category].push(entityId);
        data.entityData[entityId] = doc.fields || {};
        data.existingEntities.push(entityId);
      });
    } catch (e) {
      console.error(`Failed to fetch ${category} for world ${worldId}`, e.message);
    }
  });

  return data;
}



//Function to HELP build paths to data:
// - uid: User ID of current user
// - worldId: Current world ID
// - catalogType: Type of entity (Location, Event, Events)
// - entityID: Name of entity
function buildFirestorePath(uid, worldId, catalogType, entityId = "") {
  let path = `Users/${uid}/Worlds/${worldId}/${catalogType}`;
  if (entityId) path += `/${entityId}`;
  return path;
}