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
