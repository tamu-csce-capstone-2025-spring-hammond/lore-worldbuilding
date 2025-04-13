//Delete Entities
function deleteEntity(catalog, entity, listItem) {
  let confirmDelete = confirm(`Are you sure you want to delete "${entity}" from ${catalog}?`);
  if (!confirmDelete) return;

  google.script.run.withSuccessHandler(() => {
    listItem.remove(); // Remove from UI
  }).deleteCatalogEntity(catalog, entity);
}

//Function to delete a certain entity
//Parameters:Entity Type(Characters, Events, Locations) and Name (Bilbo) 
function deleteCatalogEntity(catalog, entity){
  //catalog = "Characters";
  //entity - "Test"
  var url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entity);

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

//Function to add an entity
//Parameters: Entity Type (Characters, Events, etc) and the name (Bilbo)
function addCatalogEntity(catalog, entityName) {
  var url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entityName);

  // Base fields
  var fields = {
    Name: { stringValue: entityName }
  };

  // Add catalog-specific fields
  if (catalog === "Characters") {
  Object.assign(fields, {
    Aliases: { arrayValue: { values: [] } },
    Age: { integerValue: 0 },
    Nationality: { stringValue: "" },
    Gender: { stringValue: "" },
    HairColor: { stringValue: "" },
    EyeColor: { stringValue: "" },
    Height: { stringValue: "" },
    Weight: { stringValue: "" },
    SkinColor: { stringValue: "" },
    Build: { stringValue: "" },
    DistinctFeatures: { arrayValue: { values: [] } },
    Accessories: { arrayValue: { values: [] } },

    //New field: PersonalityTraits (all start at neutral 50)
    PersonalityTraits: {
      mapValue: {
        fields: {
          Honesty:         { integerValue: 50 },
          Creativity:      { integerValue: 50 },
          Dominance:       { integerValue: 50 },
          Optimism:        { integerValue: 50 },
          Extroversion:    { integerValue: 50 },
          Logic:           { integerValue: 50 },
          Selfishness:     { integerValue: 50 },
          Forgiveness:     { integerValue: 50 },
          Humility:        { integerValue: 50 },
          Discipline:      { integerValue: 50 }
        }
      }
    },
    
    //Associated Entities
    AssociatedEvents: {
      arrayValue: { values: [] }
    },
    AssociatedLocations: {
      arrayValue: { values: [] }
    }
  });
  } else if (catalog === "Events") {
    Object.assign(fields, {
      Date: { stringValue: "" }, // You can change to timestampValue later
      Location: { stringValue: "" },
      AssociatedCharacters: { arrayValue: { values: [] } },
      Description: { stringValue: "" }
    });
  } else if (catalog === "Locations") {
    Object.assign(fields, {
      Terrain: { stringValue: "" },
      Description: { stringValue: "" },
      AssociatedCharacters: { arrayValue: { values: [] } },
      AssociatedEvents: { arrayValue: { values: [] } }
    });
  }

  var payload = { fields: fields };

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

  Logger.log("Created entity in: " + catalog + " with name: " + entityName);
  Logger.log("Response: " + statusCode);

  return statusCode === 200 || statusCode === 201;
}

//Function to update the attributes of a entity so (name, age, etc)
//Parameters: Entitiy type (Character, Location), Name (Bilbo), and new data to replace old
//NOTE: Will NOT be able to update values that are not lists/hashes so ints/strings
function updateCatalogEntity(collection, documentId, updateData) {
  var url = FIREBASE_URL + collection + "/" + encodeURIComponent(documentId);
  // Build update mask string (comma-separated field names)
  var updateMask = Object.keys(updateData).join(",");

  // Add updateMask to URL as query param
  url += "?updateMask.fieldPaths=" + encodeURIComponent(updateMask);

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

//Function to get the different FIELDS of each entity (name, age, height)
//Parameters: Entity Type (Locations, Events) and Name (Bilbo)
//NOTE: Needs to be parsed for keys to get fields because everything is key:value
function getDocumentFields(collection, documentId) {
  //collection = "Characters";
  //documentId = "Bilbo";
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
    return data.fields; //Return document fields
  } else {
    return { error: "Failed to get document. Status: " + statusCode, response: responseBody };
  }
}

//Function to get a specific entity's attributes (Bilbo, 4'1", 51, brown eyes)
//Parameters: Type of entity (Characters/Evenets) and Name (Bilbo)
function getCatalogEntity(catalog, entityName) {
  catalog = 'Characters';
  entityName = 'Bilbo'
  var url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entityName);

  var options = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    Logger.log("Failed to get entity: " + entityName);
    Logger.log("Response Code: " + statusCode);
    Logger.log("Response Body: " + response.getContentText());
    return null;
  }

  var document = JSON.parse(response.getContentText());
  var fields = document.fields || {};

  // Convert Firestore format into plain JavaScript values
  var entityData = {};
  for (var key in fields) {
    entityData[key] = extractFirestoreValue(fields[key]);
  }

  Logger.log("Entity Data for " + entityName + ":");
  Logger.log(JSON.stringify(entityData, null, 2));

  return entityData;
}

//Function to add where characters appear
//Parameters: Name of character, Chapter they appear, Summary of what they did
function logNarrativeAppearance(characterName, chapter, summary) {
  const url = FIREBASE_URL + "Characters/" + encodeURIComponent(characterName);

  // Step 1: Fetch current appearances
  const getOptions = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };

  const getResponse = UrlFetchApp.fetch(url, getOptions);
  const status = getResponse.getResponseCode();

  let existing = [];
  if (status === 200) {
    const doc = JSON.parse(getResponse.getContentText());
    const fields = doc.fields || {};
    const appearances = fields.StoryAppearances;
    
    if (appearances && appearances.arrayValue && appearances.arrayValue.values) {
      existing = appearances.arrayValue.values;
    }
  }

  // Step 2: Create new appearance
  const newAppearance = {
    mapValue: {
      fields: {
        chapter: { stringValue: chapter },
        summary: { stringValue: summary }
      }
    }
  };

  existing.push(newAppearance);

  // Step 3: Update document with merged array
  const updatePayload = {
    fields: {
      StoryAppearances: {
        arrayValue: {
          values: existing
        }
      }
    }
  };

  const patchOptions = {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(updatePayload),
    muteHttpExceptions: true
  };

  const patchUrl = url + "?updateMask.fieldPaths=StoryAppearances";
  const patchResponse = UrlFetchApp.fetch(patchUrl, patchOptions);
  const responseCode = patchResponse.getResponseCode();
  const responseBody = patchResponse.getContentText();

  Logger.log("PATCH Status Code: " + responseCode);
  Logger.log("PATCH Response Body: " + responseBody);
  Logger.log(`Added story appearance for ${characterName} in ${chapter}`);
}