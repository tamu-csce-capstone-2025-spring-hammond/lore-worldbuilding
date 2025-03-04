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
