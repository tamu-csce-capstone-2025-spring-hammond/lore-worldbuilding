//Delete Entities
function deleteEntity(catalog, entity, listItem) {
  let confirmDelete = confirm(`Are you sure you want to delete "${entity}" from ${catalog}?`);
  if (!confirmDelete) return;

  google.script.run.withSuccessHandler(() => {
    listItem.remove(); // Remove from UI
  }).deleteCatalogEntity(catalog, entity);
}

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
      Accessories: { arrayValue: { values: [] } }
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

//Update Function
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
    return data.fields; 
  } else {
    return { error: "Failed to get document. Status: " + statusCode, response: responseBody };
  }
}

function getCatalogEntity(catalog, entityName) {
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
