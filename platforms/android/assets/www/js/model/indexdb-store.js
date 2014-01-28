var devtrac = {};
devtrac.indexedDB = {};

//open database
devtrac.indexedDB.db = null;

devtrac.indexedDB.open = function(callback) {
	      var version = 12;
	      var request = indexedDB.open("devtracterms", version);
	      request.onsuccess = function(e) {
		devtrac.indexedDB.db = e.target.result;
		callback(devtrac.indexedDB.db);
		// Do some more stuff in a minute
	      };
	      request.onerror = devtrac.indexedDB.onerror;
	    };

//creating an object store
devtrac.indexedDB.open = function(callback) {
  var version = 12;
  var request = indexedDB.open("devtracterms", version);

  // We can only create Object stores in a versionchange transaction.
  request.onupgradeneeded = function(e) {
    var db = e.target.result;
    // A versionchange transaction is started automatically.
    e.target.transaction.onerror = devtrac.indexedDB.onerror;

    if(db.objectStoreNames.contains("oecdobj") || db.objectStoreNames.contains("placetypesobj")) {
      db.deleteObjectStore("oecdobj");
      db.deleteObjectStore("placetypesobj");
    }

    var store = db.createObjectStore("oecdobj", {autoIncrement: true});
    var placetypesstore = db.createObjectStore("placetypesobj", {autoIncrement: true});

  };

  request.onsuccess = function(e) {
    devtrac.indexedDB.db = e.target.result;
    callback(devtrac.indexedDB.db);
  };

  request.onerror = devtrac.indexedDB.onerror;
};

//adding oecd data to object store
devtrac.indexedDB.addOecdData = function(db, oecdObj) {  
  //var db = devtrac.indexedDB.db;
  var trans = db.transaction("oecdobj", "readwrite");
  var store = trans.objectStore("oecdobj");
  var request;

  for (var i in oecdObj) {
    request = store.add({
      "hname": oecdObj[i]['taxonomy_term_data_taxonomy_term_hierarchy_name'],
      "hvid" : oecdObj[i]['taxonomy_term_data_taxonomy_term_hierarchy_vid'],
      "htid": oecdObj[i]['taxonomy_term_data_taxonomy_term_hierarchy_tid'],
      "htaxonomyvocabulary": oecdObj[i]['taxonomy_term_data_taxonomy_term_hierarchy__taxonomy_vocabul'], 
      "dname": oecdObj[i]['taxonomy_term_data_name'], 
      "dvid": oecdObj[i]['taxonomy_term_data_vid'], 
      "vocabularymachinename": oecdObj[i]['taxonomy_vocabulary_machine_name'], 
      "tid": oecdObj[i]['tid']
    });
  }

  request.onsuccess = function(e) {
    console.log('we have added all the data');
  };

  request.onerror = function(e) {
    console.log(e.value);
  };

};

//adding placetypes data to object store
devtrac.indexedDB.addPlacetypesData = function(db, pObj) {
  var trans = db.transaction("placetypesobj", "readwrite");
  var store = trans.objectStore("placetypesobj");
  var request;

  for (var i in pObj) {
    request = store.add({
      "hname": pObj[i]['taxonomy_term_data_taxonomy_term_hierarchy_name'],
      "hvid" : pObj[i]['taxonomy_term_data_taxonomy_term_hierarchy_vid'],
      "htid": pObj[i]['taxonomy_term_data_taxonomy_term_hierarchy_tid'],
      "htaxonomyvocabulary": pObj[i]['taxonomy_term_data_taxonomy_term_hierarchy__taxonomy_vocabul'], 
      "dname": pObj[i]['taxonomy_term_data_name'], 
      "dvid": pObj[i]['taxonomy_term_data_vid'], 
      "vocabularymachinename": pObj[i]['taxonomy_vocabulary_machine_name'], 
      "tid": pObj[i]['tid']
    });
  }

  request.onsuccess = function(e) {
    console.log('we have added all the placetypes data');
  };

  request.onerror = function(e) {
    console.log(e.value);
  };

};

//query oecd data from datastore
devtrac.indexedDB.getAllOecdItems = function(db, callback) {
  var trans = db.transaction(["oecdobj"], "readwrite");
  var store = trans.objectStore("oecdobj");
  
  var categories = [];
  var categoryValues = {}; 
  var category = "";
  var htid;
  var flag = false;
  
  var i = 0;

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false) {
      callback(categoryValues, categories);
      return;
    }
    i = i + 1;

    if(category != result.value["hname"]) {
      category = result.value["hname"];
      categories[result.value["htid"]] = result.value["hname"];
      htid = result.value["htid"];
      if(!categoryValues[htid]) {
        categoryValues[htid] = [];
      }
    }
    for(var key in categoryValues[htid]) {
      if(categoryValues[htid][key] == result.value["dname"]) {
	flag = true;
	break;
      }else {
	continue;
      }
    }
    
    if(!flag) {
      categoryValues[htid][i] = result.value["dname"];
    }else {
      flag = false;
    }
    result.continue();
  };

  cursorRequest.onerror = devtrac.indexedDB.onerror;
};


//query placetypes data from datastore
devtrac.indexedDB.getAllPlacetypesItems = function(db, callback) {
  var trans = db.transaction(["placetypesobj"], "readwrite");
  var store = trans.objectStore("placetypesobj");
  
  var categories = [];
  var categoryValues = {}; 
  var category = "";
  var htid;
  var flag = false;
  
  var i = 0;

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false) {
      callback(categoryValues, categories);
      return;
    }
    i = i + 1;

    if(category != result.value["hname"]) {
      category = result.value["hname"];
      categories[result.value["htid"]] = result.value["hname"];
      htid = result.value["htid"];
      if(!categoryValues[htid]) {
        categoryValues[htid] = [];
      }
    }
    for(var key in categoryValues[htid]) {
      if(categoryValues[htid][key] == result.value["dname"]) {
	flag = true;
	break;
      }else {
	continue;
      }
    }
    
    if(!flag) {
      categoryValues[htid][i] = result.value["dname"];
    }else {
      flag = false;
    }
    result.continue();
  };

  cursorRequest.onerror = devtrac.indexedDB.onerror;
};