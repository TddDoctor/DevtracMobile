var vocabularies = {

    //Returns devtrac Oecd json list and saves the values to a database
    getOecdVocabularies: function(db) {
      var d = $.Deferred();
      $.ajax({
        url : localStorage.appurl+"/api/views/api_vocabularies.json?display_id=oecd",
        type : 'get',
        dataType : 'json',
        error : function(XMLHttpRequest, textStatus, errorThrown) { 
          //create bubble notification
          devtracnodes.notify("Oecds. "+errorThrown);
          d.reject(errorThrown);
        },
        success : function(data) {
          console.log("We have the oecds");

          if(data.length <= 0) {
            //create bubble notification
            devtracnodes.notify("Oecds Data Unavailable.");
          }else{
            //create bubble notification
            devtracnodes.notify("Oecds data downloaded.");
          }

          devtrac.indexedDB.addOecdData(db, data).then(function(){
            //devtracnodes.notify("Oecds data saved.");
            d.resolve();
          }).fail(function(err) {
            d.resolve();

          });
        }
      });

      return d;

    },

    //Returns devtrac placetype json list and saves the values to a database
    getPlacetypeVocabularies: function(db) {
      var d = $.Deferred();

      $.ajax({
        url : localStorage.appurl+"/api/views/api_vocabularies.json?display_id=placetypes",
        type : 'get',
        dataType : 'json',
        error : function(XMLHttpRequest, textStatus, errorThrown) {
          //create bubble notification
          devtracnodes.notify("Placetypes. "+errorThrown);
          d.reject(errorThrown);
        },
        success : function(data) {
        //create bubble notification
          if(data.length <= 0) {
            devtracnodes.notify("Placetypes Data Unavailable.");
          }else{
            
            devtrac.indexedDB.addPlacetypesData(db, data).then(function(){
              devtracnodes.notify("Placetypes Data Saved.");
              d.resolve();
            }).fail(function(){
              d.resolve();
            });
          }
          
        }
      });
      return d;

    }
};
