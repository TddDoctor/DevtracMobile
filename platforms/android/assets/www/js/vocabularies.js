var vocabularies = {
  
    //Returns devtrac Oecd json list 
    getOecdVocabularies: function() {
      var d = $.Deferred();
          $.ajax({
            url : localStorage.appurl+"/api/views/api_vocabularies.json?display_id=oecd",
            type : 'get',
            dataType : 'json',
            error : function(XMLHttpRequest, textStatus, errorThrown) { 
              console.log("its an error with get oecd vocas "+errorThrown);
	      d.reject(errorThrown);
            },
            success : function(data) {
	      console.log("We have the oecds");
              d.resolve(data);
              
            }
          });

      return d;

    },
    
    //Returns devtrac placetype json list 
    getPlacetypeVocabularies: function() {
      var d = $.Deferred();

          $.ajax({
            url : localStorage.appurl+"/api/views/api_vocabularies.json?display_id=placetypes",
            type : 'get',
            dataType : 'json',
            error : function(XMLHttpRequest, textStatus, errorThrown) {
              console.log("its an error with get placetypes vocas");
              d.reject(errorThrown);
            },
            success : function(data) {
	      d.resolve(data);
            }
          });
      return d;

    },
    
    //download placetypes from devtrac
    loadPlacetypes: function(db) {
      var categories = [];
      var categoryValues = {}; 
      var category = "";
      var htid;

      vocabularies.getPlacetypeVocabularies().then(function(data) {
	devtrac.indexedDB.addPlacetypesData(db, data);
	
      }).fail(function(err) {
        console.log(err);
      });

    },
    
  //download oecds from devtrac
    loadOecds: function(db) {
      var categories = [];
      var categoryValues = {}; 
      var category = "";
      var htid;
      
      vocabularies.getOecdVocabularies().then(function(data) {
	devtrac.indexedDB.addOecdData(db, data);
	
      }).fail(function(err) {
        console.log(err);
      });
        
    }

};
