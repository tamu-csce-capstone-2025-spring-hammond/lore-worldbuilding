function trackOpenCount() {
  var props = PropertiesService.getDocumentProperties();
  var count = parseInt(props.getProperty("open_count") || "0", 10);
  count++;
  props.setProperty("open_count", count);
  Logger.log("Extension opened " + count + " times");
}

function getDocText() {
  var doc = DocumentApp.getActiveDocument(); // Get the active document
  var text = doc.getBody().getText(); // Get all text from the document body
  Logger.log(text.substring(0, 100)); // Log the text for debugging
  return text;
}

function getOpenCount() {
  var props = PropertiesService.getUserProperties();
  var count = parseInt(props.getProperty('open_count') || "0", 10);
  return count;
}

function getBoundDocumentURL() {
  var doc = DocumentApp.getActiveDocument();
  if (doc) {
      Logger.log("Bound Document URL: " + doc.getUrl());
  } else {
      Logger.log("No document is bound to this script.");
  }
}

function getActiveName() {
  var doc = DocumentApp.getActiveDocument();
  if (doc) {
      Logger.log("Document Name: " + doc.getName());
  } else {
      Logger.log("No document is bound to this script.");
  }
}

function getAccentColor() {
  var cache = CacheService.getUserCache();
  var cachedColor = cache.get("accentColor");
  console.log(cachedColor);

  if (cachedColor) return cachedColor;

  var userProperties = PropertiesService.getUserProperties();
  var color = userProperties.getProperty("accentColor") || "#0000FF";
  cache.put("accentColor", color, 21600);
  return color;
}

function changeAccentColor(color, hovercolor){
  var userProperties = PropertiesService.getUserProperties();
  var cache = CacheService.getUserCache();

  // store in PropertiesService (persistent storage)
  userProperties.setProperty("accentColor", color);
  userProperties.setProperty("accentColorHover", hovercolor);

  // Store in CacheService (fast access)
  cache.put("accentColor", color, 21600); 
  cache.put("accentColorHover", hovercolor, 21600);
}

function changeFontSize(size){
  var userProperties = PropertiesService.getUserProperties();
  var cache = CacheService.getUserCache();

  // store in PropertiesService (persistent storage)
  userProperties.setProperty("fontsize", size);
}

function addIgnoredEntity(entityName) {
  const userProperties = PropertiesService.getUserProperties();
  const ignored = userProperties.getProperty('ignoredEntities');
  
  let ignoredArray = [];
  if (ignored) {
    ignoredArray = JSON.parse(ignored);
  }

  if (!ignoredArray.includes(entityName)) {
    ignoredArray.push(entityName);
    userProperties.setProperty('ignoredEntities', JSON.stringify(ignoredArray));
  }

  // return the updated list to the client
  return ignoredArray;
}

function addExistingEntity(entityName) {
  const userProperties = PropertiesService.getUserProperties();
  const existing = userProperties.getProperty('existingEntities');
  
  let existingArray = [];
  if (existing) {
    existingArray = JSON.parse(existing);
  }

  if (!existingArray.includes(entityName)) {
    existingArray.push(entityName);
    userProperties.setProperty('existingEntities', JSON.stringify(existingArray));
  }

  // return the updated list to the client
  return existingArray;
}

function removeExistingEntity(entityName) {
  const userProperties = PropertiesService.getUserProperties();
  const existing = userProperties.getProperty('existingEntities');
  
  let existingArray = [];
  if (existing) {
    existingArray = JSON.parse(existing);
  }

  const updatedArray = existingArray.filter(e => e !== entityName);

  userProperties.setProperty('existingEntities', JSON.stringify(updatedArray));

  return updatedArray;
}

function clearEntityTracking() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('ignoredEntities');
  userProperties.deleteProperty('existingEntities');
  
  return {
    message: "Entity tracking reset.",
    ignoredCleared: true,
    existingCleared: true
  };
}





