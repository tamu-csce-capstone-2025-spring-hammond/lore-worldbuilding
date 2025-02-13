function onOpen() {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem("Open Sidebar", "showSidebar")
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('LORE Worldbuilder');
  DocumentApp.getUi().showSidebar(html);
}

