//Phonegap code to read the username and password from the sd card
function readPass(fileSystem) {

  fileSystem.root.getFile("passwords.txt", null, readPassFileEntry, failreadPass);
}
function readPassFileEntry(fileEntry) {

  fileEntry.file(readPassFile, failreadPass);
}
function readPassFile(file) {

  readPassAsText(file);
}
function readPassAsText(file) {

  var reader = new FileReader();
  reader.onload = function(evt) {

    var text = evt.target.result;
    var words = text.split(',');
    localStorage.usr = words[0];
    localStorage.psw = words[1];
    
  };
  reader.readAsText(file);
}
function failreadPass(evt) {

}//username and password read ends here


//Phonegap code to save the username and password to sd card
function savePasswords(fileSystem) {

  fileSystem.root.getFile("passwords.txt", {
    create : true,
    exclusive : false
  }, savePassFileEntry, failsavePass);
}
function savePassFileEntry(fileEntry) {

  fileEntry.createWriter(savePassFileWriter, failsavePass);
}
function savePassFileWriter(writer) {

  writer.onwriteend = function(evt) {

    localStorage.usr = $("#username").val();
    localStorage.psw = $("#pass").val();
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
 
