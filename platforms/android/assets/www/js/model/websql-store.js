var WebSqlStore = function(successCallback, errorCallback) {

    this.initializeDatabase = function(successCallback, errorCallback) {
        var self = this;
        this.odb = window.openDatabase("myDB", "1.0", "My Demo DB", 200000);
	
        this.odb.transaction(
                function(tx) {
                    self.createOecdTable(tx);
		    self.createPlacetypesTable(tx);
                },
                function(error) {
                    console.log('Transaction error: ' + error);
                    if (errorCallback) errorCallback();
                },
                function() {
                    console.log('Transaction success');
                    if (successCallback) successCallback();
                }
        );
    }

    this.createOecdTable = function(tx) {
        var sql = "CREATE TABLE IF NOT EXISTS oecds ( " +
            "hname VARCHAR(50), " +
            "hvid INTEGER, " +
            "htid INTEGER, " +
            "htaxonomyvocabulary VARCHAR(50), " +
            "dname VARCHAR(50), " +
            "dvid INTEGER, " +
            "vocabularymachinename VARCHAR(50), " +
            "tid INTEGER, " +
            "PRIMARY KEY (htid, tid))";
	    
        tx.executeSql(sql, null,
                function() {
                    console.log('Create table success');
                },
                function(tx, error) {
                    alert('Create table error: ' + error.message);
                });
    }
    
    this.createPlacetypesTable = function(tx) {
        var sql = "CREATE TABLE IF NOT EXISTS placetypes ( " +
            "hname VARCHAR(50), " +
            "hvid INTEGER, " +
            "htid INTEGER, " +
            "htaxonomyvocabulary VARCHAR(50), " +
            "dname VARCHAR(50), " +
            "dvid INTEGER, " +
            "vocabularymachinename VARCHAR(50), " +
            "tid INTEGER, " +
            "PRIMARY KEY (htid, tid))";
	    
        tx.executeSql(sql, null,
                function() {
                    console.log('Create table success');
                },
                function(tx, error) {
                    alert('Create table error: ' + error.message);
                });
    }


    this.addOecdData = function(oecdObj) {

        var sql = "INSERT OR REPLACE INTO oecds " +
            "(hname, hvid, htid, htaxonomyvocabulary, dname, dvid, vocabularymachinename, tid) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

	    this.odb.transaction(function (tx) {

		tx.executeSql(sql, [
		  oecdObj['taxonomy_term_data_taxonomy_term_hierarchy_name'],
		  oecdObj['taxonomy_term_data_taxonomy_term_hierarchy_vid'],
		  oecdObj['taxonomy_term_data_taxonomy_term_hierarchy_tid'],	 oecdObj['taxonomy_term_data_taxonomy_term_hierarchy__taxonomy_vocabul'],
		  oecdObj['taxonomy_term_data_name'],
		  oecdObj['taxonomy_term_data_vid'],		  
		  oecdObj['taxonomy_vocabulary_machine_name'],
		  oecdObj['tid']
		],
                    function() {
                        console.log('INSERT success');
                    },
                    function(tx, error) {
                        alert('INSERT error: ' + error.message);
                    });

	    });
    }
    
        this.addPlacetypesData = function(oecdObj) {

        var sql = "INSERT OR REPLACE INTO placetypes " +
            "(hname, hvid, htid, htaxonomyvocabulary, dname, dvid, vocabularymachinename, tid) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

	    this.odb.transaction(function (tx) {

		tx.executeSql(sql, [
		  oecdObj['taxonomy_term_data_taxonomy_term_hierarchy_name'],
		  oecdObj['taxonomy_term_data_taxonomy_term_hierarchy_vid'],
		  oecdObj['taxonomy_term_data_taxonomy_term_hierarchy_tid'],	 oecdObj['taxonomy_term_data_taxonomy_term_hierarchy__taxonomy_vocabul'],
		  oecdObj['taxonomy_term_data_name'],
		  oecdObj['taxonomy_term_data_vid'],		  
		  oecdObj['taxonomy_vocabulary_machine_name'],
		  oecdObj['tid']
		],
                    function() {
                        console.log('INSERT success');
                    },
                    function(tx, error) {
                        alert('INSERT error: ' + error.message);
                    });

	    });
    }

    this.getAllPlacetypes = function(callback) {
      var sql = "SELECT * FROM placetypes ORDER BY hname;";
      
      this.odb.transaction(function(tx) {
	tx.executeSql(sql, [],
	  function(tx, r) {
	    callback(r);
	  },
	  function(tx, e) {
	    console.log(e);
	  });
    });
    }

    this.initializeDatabase(successCallback, errorCallback);

}
