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






