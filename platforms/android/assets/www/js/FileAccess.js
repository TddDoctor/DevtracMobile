//Phonegap code to read the site report types from the sd card
function readTypes(fileSystem) {

  fileSystem.root.getFile("reporttypes.txt", null, readTypesFileEntry, failreadTypes);
}
function readTypesFileEntry(fileEntry) {

  fileEntry.file(readTypesFile, failreadTypes);
}
function readTypesFile(file) {

  readTypesAsText(file);
}
function readTypesAsText(file) {

  var reader = new FileReader();
  reader.onload = function(evt) {
    var text = evt.target.result;
    var words = text.split(',');
    
    localStorage.humaninterest = words[0];
    localStorage.roadside = words[1];
    localStorage.sitevisit = words[2];
    
  };
  reader.readAsText(file);
}
function failreadPass(evt) {

}//username and password read ends here


//Phonegap code to save the site report types to sd card
function saveTypes(fileSystem) {

  fileSystem.root.getFile("reporttypes.txt", {
    create : true,
    exclusive : false
  }, saveTypesFileEntry, failsaveTypes);
}
function saveTypesFileEntry(fileEntry) {

  fileEntry.createWriter(saveTypesFileWriter, failsaveTypes);
}
function saveTypesFileWriter(writer) {

  writer.onwriteend = function(evt) {

    localStorage.humaninterest = data[0]['term id'];
    localStorage.roadside = data[1]['term id'];
    localStorage.sitevisit = data[2]['term id'];
    
  };
  var auth = $("#username").val() + "," + $("#pass").val();
  writer.write(auth);
}
function failsavePass(error) {
  $.unblockUI();
}//save username and passwords ends here

//Phonegap code to clear passwords saved in a file on the sd card
function clearPasswords(fileSystem) {

  fileSystem.root.getFile("passwords.txt", {
    create : true,
    exclusive : false
  }, clearPassFileEntry, failclearPass);
}
function clearPassFileEntry(fileEntry) {

  fileEntry.createWriter(clearPassFileWriter, failclearPass);
}
function clearPassFileWriter(writer) {

  writer.onwriteend = function(evt) {

  };
  var auth = 0 + "," + 0;
  writer.write(auth);
}
function failclearPass(error) {

}//clear passwords ends here
 
