//Google Docs to HTML
function _exportAsHTML(docID){
  var url = "https://docs.google.com/feeds/download/documents/export/Export?id="+docID+"&exportFormat=html";
  var param = {
    method: "get",
    headers: {"Authorization": "Bearer " + ScriptApp.getOAuthToken()},
    muteHttpExceptions:true,
  };
  var html = UrlFetchApp.fetch(url,param).getContentText();
  return html; 
}