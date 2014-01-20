var vocabularies = {
  
    //Returns devtrac Oecd json list 
    getOecdVocabularies: function() {
      var d = $.Deferred();

          $.ajax({
            url : "http://localhost/dt6/api/views/api_vocabularies.json?display_id=oecd",
            type : 'get',
            dataType : 'json',
            error : function(XMLHttpRequest, textStatus, errorThrown) {
	      d.reject(errorThrown);
            },
            success : function(data) {
	      d.resolve(data);
            }
          });

      return d;

    },
    
    //Returns devtrac placetype json list 
    getPlacetypeVocabularies: function() {
      var d = $.Deferred();

          $.ajax({
            url : "http://localhost/dt6/api/views/api_vocabularies.json?display_id=placetypes",
            type : 'get',
            dataType : 'json',
            error : function(XMLHttpRequest, textStatus, errorThrown) {
	      d.reject(errorThrown);
            },
            success : function(data) {
            var store = new WebSqlStore();
	    for(var key in data) {
	      store.addPlacetypesData(data[key]);
	    }
	      d.resolve(data);
            }
          });
      return d;

    }

};
