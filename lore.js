function onOpen() {
  Logger.log("onOpen triggered"); // DEBUG
  var doc = DocumentApp.getActiveDocument(); // Get the active Google Docs file

  if (doc) {
    DocumentApp.getUi()
      .createAddonMenu()
      .addItem("Open Sidebar", "showLoginPage")
      .addToUi();
      Logger.log(doc.getName())
  }

  // Increment and track the open count
    trackOpenCount();
    getDocText();
}

// Navigate pages START //
function showLoginPage() {
  var template = HtmlService.createTemplateFromFile('login');
  var html = template.evaluate().setTitle('LORE Worldbuilder').setWidth(500);
  DocumentApp.getUi().showSidebar(html);
}

function showWorldPage() {
  var template = HtmlService.createTemplateFromFile('landingPage');
  var html = template.evaluate().setTitle('LORE Worldbuilder').setWidth(500);
  DocumentApp.getUi().showSidebar(html);
}

//Show a page depending on chosen option
function showPage(page) {
  try {
    var htmlFile;
    
    if (page == "viewCatalogs") {
      htmlFile = "viewCatalogs"; // This should match viewCatalogs.html
    } else if (page == "viewTimeline") {
      htmlFile = "viewTimeline"; // This should match viewTimeline.html
    } else if(page == "viewSettings") {
      htmlFile = "viewSettings"
    } else if(page == "landingPage") {
      htmlFile = "landingPage";
    } else if(page == "viewProperNouns"){
      htmlFile = "viewProperNouns"
    } else if(page == "viewWritingMode"){
      htmlFile = "viewWritingMode"
    } else if(page == "login"){
      htmlFile = "login"
      clearEntityTracking();
    } else {
      throw new Error("Invalid page requested: " + page);
    }

    // Create the template
    var template = HtmlService.createTemplateFromFile(htmlFile);
    var html = template.evaluate().setTitle('LORE Worldbuilder').setWidth(500);
    DocumentApp.getUi().showSidebar(html);

  } catch (error) {
    Logger.log("Error in showPage(): " + error.message);

    // Show a simple error message
    var errorMessage = HtmlService.createHtmlOutput(
      `<p style="color: red;"> Error: ${error.message}</p>`
    ).setTitle('Error');
    DocumentApp.getUi().showSidebar(errorMessage);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}
// Navigate pages END //

function installAddon() {
  onOpen();
}

function findProperNouns() {
  var doc = DocumentApp.getActiveDocument();
  var text = doc.getBody().getText();

  // Regular expression to match proper nouns while allowing multi-word names
  var properNounRegex = /(?<![.!?]\s|^|")\b(?:Mr|Ms|Mrs|Dr|Prof)\.\s[A-Z][a-z]+(?:[\s|-][A-Z][a-z]+)*\b|(?<![.!?]\s|^|")\b[A-Z][a-z]+(?:[\s|-][A-Z][a-z]+)*\b/gm;
  var titleNounRegex = /(?<![.!?]\s|^|")\b(?:Mr|Ms|Mrs|Dr|Prof)\.\s[A-Z][a-z]+(?:\s(?:of|the|van|von|de|du|del|la|le|da|di|der|den|ter|ten))\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b|(?<![.!?]\s|^|")\b[A-Z][a-z]+(?:\s(?:of|the|van|von|de|du|del|la|le|da|di|der|den|ter|ten))\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/gm;

  // Match proper nouns in the text
  console.log("Finding proper nouns...");
  var matches = text.match(properNounRegex) || [];

  console.log("Finding title proper nouns...")
  var titleMatches = text.match(titleNounRegex) || [];

  // List of words to exclude (honorifics, common words)
  var excludeWords = new Set([
    "I", "She", "He", "You", "The",
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]);

  var uniqueProperNouns = new Set();
  var baseNames = new Map();

  var allMatches = matches.concat(titleMatches);

  console.log("Eliminating duplicates...");
  allMatches.forEach(name => {
    if (!excludeWords.has(name)) {
      var nameParts = name.split(/\s|-/);
      var baseName = nameParts[nameParts.length - 1]; 
      // Get the last word as the base name

      if (baseNames.has(baseName)) {
        // If the base name already exists with a title, prefer the longer full name
        if (name.length > baseNames.get(baseName).length) {
          uniqueProperNouns.delete(baseNames.get(baseName)); // Remove the shorter one
          uniqueProperNouns.add(name);
          baseNames.set(baseName, name);
        }
      } else {
        // Add new entry
        uniqueProperNouns.add(name);
        baseNames.set(baseName, name);
      }
    }
  });

  return uniqueProperNouns.size ? [...uniqueProperNouns] : ["None"];
}

function getNewProperNouns(){
  var userProperties = PropertiesService.getUserProperties();
  var all = findProperNouns();

  // load existing entities
  var existingRaw = userProperties.getProperty('existingEntities');
  var existing = existingRaw ? JSON.parse(existingRaw) : [];
  console.log(existing);
  
  // load ignored words
  var ignoredRaw = userProperties.getProperty('ignoredEntities');
  var ignored = ignoredRaw ? JSON.parse(ignoredRaw) : [];

  var newProperNouns = all.filter(word => !existing.includes(word) && !ignored.includes(word));

  return newProperNouns;
}

