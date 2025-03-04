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

function showSidebar() {
  var template = HtmlService.createTemplateFromFile('intro_sidebar');
  var html = template.evaluate().setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

function showRegularSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function installAddon() {
  onOpen();
}


