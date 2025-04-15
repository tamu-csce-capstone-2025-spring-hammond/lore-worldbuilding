// gets the personality traits of a character
function getPersonalityTraitValues(characterName) {
  var entityData = getCatalogEntity("Characters", characterName);
  if (!entityData || !entityData.PersonalityTraits) {
    Logger.log("No personality traits found.");
    return null;
  }

  const traits = entityData.PersonalityTraits;
  const result = {};

  for (let trait in traits) {
    result[trait] = traits[trait];
  }

  return result;
}

function getRadarData(entityName) {
  console.log("Retrieving radar data for ");
  console.log(entityName);
  // Assuming you use getCatalogEntity to fetch the data and then extract traits:
  var entityData = getCatalogEntity("Characters", entityName);
  if (entityData && entityData.PersonalityTraits) {
    return entityData.PersonalityTraits;
  }
  return {};
}

//Delete Entities
function deleteEntity(catalog, entity, listItem) {
  let confirmDelete = confirm(`Are you sure you want to delete "${entity}" from ${catalog}?`);
  if (!confirmDelete) return;

  google.script.run.withSuccessHandler(() => {
    listItem.remove(); // Remove from UI
  }).deleteCatalogEntity(catalog, entity);
}

//Function to delete a certain entity
//Parameters:
// - catalog: "Characters", "Events", etc.
// - entity: current name (used as document ID)
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
//Parameters:
// - catalog: "Characters", "Events", etc.
// - entityName: Name of Entity
function addCatalogEntity(catalog, entityName) {
  var url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entityName);

  // Base fields that all collections share
  var fields = {
    Name: { stringValue: entityName },
    Description: { stringValue: "" },
    NarrativeMentions: {
      arrayValue: {
        values: []  
      }
    }
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

// Function to update an Entity's attribute
// Parameters:
// - collection: "Characters", "Events", etc.
// - documentId: current name (used as document ID)
// - updateData: object with updated Firestore field values
/*
  const updateData = {
    Name: { stringValue: "Bilbo Baggins" },
    Age: { integerValue: 52 }
  };
*/
function updateCatalogEntity(collection, documentId, updateData) {
  const headers = {
    Authorization: "Bearer " + getAccessToken(),
    "Content-Type": "application/json"
  };

  const originalUrl = FIREBASE_URL + collection + "/" + encodeURIComponent(documentId);

  //Check if name is being updated (implies renaming the document ID)
  const newName = updateData.Name?.stringValue;
  const isRename = newName && newName !== documentId;

  if (isRename) {
    Logger.log("Renaming entity from " + documentId + " to " + newName);

    const getOptions = {
      method: "GET",
      headers: headers,
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(originalUrl, getOptions);
    if (response.getResponseCode() !== 200) {
      Logger.log("Failed to get original document: " + documentId);
      return false;
    }

    const originalFields = JSON.parse(response.getContentText()).fields || {};

    // Merge new values
    for (const key in updateData) {
      originalFields[key] = updateData[key];
    }

    const newUrl = FIREBASE_URL + collection + "/" + encodeURIComponent(newName);
    const createOptions = {
      method: "PATCH",
      headers: headers,
      payload: JSON.stringify({ fields: originalFields })
    };

    const createResponse = UrlFetchApp.fetch(newUrl, createOptions);
    if (![200, 201].includes(createResponse.getResponseCode())) {
      Logger.log("Failed to create new document: " + newName);
      return false;
    }

    // Delete old doc
    const deleteOptions = {
      method: "DELETE",
      headers: headers
    };

    UrlFetchApp.fetch(originalUrl, deleteOptions);
    Logger.log("Deleted original document: " + documentId);

    return true;
  }

  // Standard update (no rename)
  const updateMask = Object.keys(updateData).join(",");
  const updateUrl = originalUrl + "?updateMask.fieldPaths=" + encodeURIComponent(updateMask);

  const patchOptions = {
    method: "PATCH",
    headers: headers,
    payload: JSON.stringify({ fields: updateData }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(updateUrl, patchOptions);
  const statusCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log("PATCH Request URL: " + updateUrl);
  Logger.log("Response Code: " + statusCode);
  Logger.log("Response Body: " + responseBody);

  return statusCode === 200 || statusCode === 201;
}


//Function to GET the different FIELDS of each entity (name, age, height)
//Parameters:
// - collection: "Characters", "Events", etc.
// - documentId: current name (used as document ID)
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

//Function to GET a specific entity's attributes (Bilbo, 4'1", 51, brown eyes)
//Parameters:
// - catalog: "Characters", "Events", etc.
// - entityName: current name (used as document ID)
function getCatalogEntity(catalog, entityName) {
  //catalog = 'Characters';
  //entityName = 'Bilbo'
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

//Function to ADD where characters appear
//Parameters:
// - catalog: "Characters", "Events", etc.
// - entityName: current name (used as document ID)
// - page: string of page entity appears
// - excerpt: string of excerpt from writing
function logNarrativeMention(catalog, entityName, page, excerpt) {
  //Example parameters:
  //catalog = "Characters";
  //entityName = "test2";
  //page = "1";
  //excerpt = "Testing narrative mention";
  const url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entityName);

  const getOptions = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };

  const getResponse = UrlFetchApp.fetch(url, getOptions);
  const doc = JSON.parse(getResponse.getContentText());
  const existing = doc.fields?.NarrativeMentions?.arrayValue?.values || [];

  const newMention = {
    mapValue: {
      fields: {
        page: { stringValue: page },
        excerpt: { stringValue: excerpt }
      }
    }
  };

  existing.push(newMention);


  const patchPayload = {
    fields: {
      NarrativeMentions: {
        arrayValue: { values: existing }
      }
    }
  };

  const patchOptions = {
    method: "PATCH",
    headers: getOptions.headers,
    payload: JSON.stringify(patchPayload),
    muteHttpExceptions: true
  };

  const patchUrl = url + "?updateMask.fieldPaths=NarrativeMentions";
  UrlFetchApp.fetch(patchUrl, patchOptions);
}


//Function to UPDATE a narrative mention
//Parameters:
// - catalog: "Characters", "Events", etc.
// - entityName: current name (used as document ID)
// - index: the index of the narrative mention (String!)
// - UpdatedExcerpt: new string of excerpt from writing
function updateNarrativeMention(catalog, entityName, index, updatedExcerpt) {
  //Example parameters:
  //catalog = "Characters";
  //entityName = "test2";
  //index = "0";
  //updatedExcerpt = "Testing update narrative mention";
  const url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entityName);

  const getResponse = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    }
  });

  const doc = JSON.parse(getResponse.getContentText());
  const mentions = doc.fields?.NarrativeMentions?.arrayValue?.values || [];

  if (index < 0 || index >= mentions.length) return;

  // Update the excerpt value
  mentions[index].mapValue.fields.excerpt = { stringValue: updatedExcerpt };

  const patchPayload = {
    fields: {
      NarrativeMentions: {
        arrayValue: { values: mentions }
      }
    }
  };

  UrlFetchApp.fetch(url + "?updateMask.fieldPaths=NarrativeMentions", {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(patchPayload)
  });
}

//Function to REMOVE a narrative mention
//Parameters:
// - catalog: "Characters", "Events", etc.
// - entityName: current name (used as document ID)
// - index: the index of the narrative mention (String!)
function deleteNarrativeMention(catalog, entityName, indexToRemove) {
  //Example parameters:
  //catalog = "Characters";
  //entityName = "test2";
  //indexToRemove = "0";
  const url = FIREBASE_URL + catalog + "/" + encodeURIComponent(entityName);

  const getResponse = UrlFetchApp.fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    }
  });

  const doc = JSON.parse(getResponse.getContentText());
  const mentions = doc.fields?.NarrativeMentions?.arrayValue?.values || [];

  if (indexToRemove < 0 || indexToRemove >= mentions.length) return;

  mentions.splice(indexToRemove, 1); // remove mention at index

  const patchPayload = {
    fields: {
      NarrativeMentions: {
        arrayValue: { values: mentions }
      }
    }
  };

  UrlFetchApp.fetch(url + "?updateMask.fieldPaths=NarrativeMentions", {
    method: "PATCH",
    headers: {
      Authorization: "Bearer " + getAccessToken(),
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(patchPayload)
  });
}