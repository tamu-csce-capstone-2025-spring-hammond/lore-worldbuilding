function onOpen() {
  Logger.log("onOpen triggered"); // DEBUG
  var doc = DocumentApp.getActiveDocument(); // Get the active Google Docs file

  if (doc) {
    DocumentApp.getUi()
      .createAddonMenu()
      .addItem("Open Sidebar", "showSidebar")
      .addToUi();
      Logger.log(doc.getName())
  }

  // Increment and track the open count
    trackOpenCount();
    getDocText();
}

// Navigate pages START //
function showSidebar() {
  var template = HtmlService.createTemplateFromFile('intro_sidebar');
  var html = template.evaluate().setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

function showLandingPage() {
  var template = HtmlService.createTemplateFromFile('LandingPage');
  var html = template.evaluate().setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

//Show a page depending on chosen option
function showPage(page) {
  try {
    var htmlFile;
    
    if (page === "viewCatalogs") {
      htmlFile = "viewCatalogs"; // This should match viewCatalogs.html
    } else if (page === "viewTimeline") {
      htmlFile = "Timeline_Page"; // This should match Timeline_Page.html
    } else if(page == "LandingPage") {
      htmlFile = "LandingPage";
    } else if(page == "Proper"){
      htmlFile = "Proper"
    } else {
      throw new Error("Invalid page requested: " + page);
    }

    // Create the template
    var template = HtmlService.createTemplateFromFile(htmlFile);
    var html = template.evaluate().setTitle('LORE Worldbuilder');
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
  var properNounRegex = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;

  // Regular expression to match titled words
  var properNounRegexTitled = /\b(?:Mr|Ms|Mrs|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b|\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;
  
  // Regular expression to exclude capitalized words at the start of sentences/dialogue
  var sentenceStartRegex = /(?:[.!?]"?\s+|\n|^)([A-Z][a-z]+)/g;

  // Match proper nouns in the text
  var matches = text.match(properNounRegex) || [];

  // Find first words of sentences and dialogues
  var firstWords = [];
  var match;
  while ((match = sentenceStartRegex.exec(text)) !== null) {
    firstWords.push(match[1]); // Collect sentence-initial words
  }

  // List of words to exclude (honorifics, common words)
  var excludeWords = new Set([
    "I", "The", 
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]);

  // Find valid proper nouns: filter out sentence-start words, common words, and allow title-based names
  var properNouns = matches.filter(word =>
    !firstWords.includes(word) && !excludeWords.has(word)
  );

  // Remove duplicates
  properNouns = [...new Set(properNouns)];

  return properNouns.length ? properNouns : ["No proper nouns found."];

  // /(?<![.!?]"?\s)(?<!^)\b(?:Mr|Ms|Mrs|Dr|Prof)\.?\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g

}



function findProperNouns2() {
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
      var baseName = nameParts[nameParts.length - 1]; // Get the last word as the base name

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

  return uniqueProperNouns.size ? [...uniqueProperNouns] : ["No proper nouns found."];
}

// TODO: user prompt function
// check if noun already exists in DB (character name or as an alias)
// check that it's not already in the 'ignore' list
// if not prompt user for noun type 'character' 'location' etc. or 'ignore'
// if user chooses an object type, send to DB

// Function to pass data to the sidebar
function getProperNounsForSidebar() {
  var properNouns = findProperNouns2();
  return properNouns;
}
