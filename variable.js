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
  var cachedHover = cache.get("accentColorHover");

  console.log(cachedColor);  // Debugging output

  if (cachedColor && cachedHover) {
    return { color: cachedColor, hover: cachedHover };  // Return as an object
  }

  var userProperties = PropertiesService.getUserProperties();
  var color = userProperties.getProperty("accentColor") || "#9fafa1";  // Default color
  var hovercolor = userProperties.getProperty("accentColorHover") || "#839b91";  // Default hover color

  // Cache the values
  cache.put("accentColor", color, 21600);  // 6 hours in seconds
  cache.put("accentColorHover", hovercolor, 21600);  // 6 hours in seconds

  return { color: color, hover: hovercolor };  // Return as an object
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

function changeFontSize(fsize){
  var userProperties = PropertiesService.getUserProperties();
  var cache = CacheService.getUserCache();

  // store in PropertiesService (persistent storage)
  cache.put("fontsize", fsize + "px", 21600); 
  userProperties.setProperty("fontsize", fsize + "px");
}

function getFontSize(){
  var cache = CacheService.getUserCache();
  var fsize = cache.get("fontsize");

  console.log(fsize); 

  if (fsize) {
    return fsize; 
  }

  var userProperties = PropertiesService.getUserProperties();
  var fontsize = userProperties.getProperty("fontsize") || "16px";  // Default size

  // Cache the values
  cache.put("fontsize", fontsize, 21600);  // 6 hours in seconds

  return fontsize;
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





