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
