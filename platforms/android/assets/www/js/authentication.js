var auth = {

    //delete bubble
    deleteBubble: function(notifications, notification){
      notifications.deleteNotification(notification);

    },

    //get site token
    getToken: function() {
      var d = $.Deferred();

      // Obtain session token.
      $.ajax({
        url: localStorage.appurl+"/services/session/token",
        type:"get",
        dataType:"text",
        error:function (jqXHR, textStatus, errorThrown) {

          //hide and show dialog auth buttons
          $('#logoutdiv').hide();
          $('#logindiv').show();

          //hide and show panel auth buttons
          $('.panel_login').show();
          $('.panel_logout').hide();
          
          if(errorThrown == ""){
            controller.loadingMsg("Selected Url "+localStorage.appurl+" is Unavailable. Make sure you have an internet connection or try another url.", 5000)  
          }else{
            controller.loadingMsg("Error: "+errorThrown+" Try another url.", 5000)
          }

          $.mobile.changePage("#page_login", "slide", true, false);
          d.reject();
        },
        success: function (token) {
          console.log("token "+ " from "+localStorage.appurl);
          d.resolve(token);
        }
      });

      return d;
    },

    //check if we have a token
    checkToken: function() {
      var d = $.Deferred();

      if(!(localStorage.token == null)){
        d.resolve(localStorage.token);
      }else{
        auth.getToken().then(function(token){
          localStorage.token = token;
          d.resolve(token);
        }).fail(function(){
          d.reject();
        });
      }  
      return d;
    },

    //check if user is logged in
    loginStatus: function() {
      var d = $.Deferred();
      
      auth.getToken().then(function(token){
        // Call system connect with session token.
        $.ajax({
          url : localStorage.appurl+"/api/system/connect.json",
          type : 'post',
          dataType : 'json',
          headers: {'X-CSRF-Token': token},
          error : function(XMLHttpRequest, textStatus, errorThrown) {
            $.unblockUI();

            //hide and show dialog auth buttons
            $('#logoutdiv').hide();
            $('#logindiv').show();

            //hide and show panel auth buttons
            $('.panel_login').show();
            $('.panel_logout').hide();


          },
          success : function(data) {

            var drupal_user = data.user;
            if (drupal_user.uid == 0)
            {
              //user is not logged in
              $.unblockUI();
              

              //hide and show dialog buttons
              $('#logoutdiv').hide();
              $('#logindiv').show();

              //hide and show panel auth buttons
              $('.panel_logout').hide();
              $('.panel_login').show();

              d.reject();
            } else
            { 
              //user is logged in

              //set username in menu
              $(".username").html("Hi, "+localStorage.username+" !");
              
              //set user title in menu
              $(".user_title").html(localStorage.usertitle);

              //hide and show dialog auth buttons
              $('#logindiv').hide();
              $('#logoutdiv').show();

              //hide and show panel auth buttons
              $('.panel_login').hide();
              $('.panel_logout').show();

              d.resolve();

            }
          }
        });
      }).fail(function() {

      });

      return d;
    },

    //login to devtrac
    login: function(name, pass) {
      var d = $.Deferred();
      // Obtain session token.
      auth.getToken().then(function (token) {

        // Call system login with session token.
        $.ajax({
          url : localStorage.appurl+"/api/user/login.json",
          type : 'post',
          data : 'username=' + encodeURIComponent(name) + '&password=' + encodeURIComponent(pass),
          dataType : 'json',
          headers: {'X-CSRF-Token': token},
          beforeSend: function( xhr ) {
            controller.loadingMsg("Logging In ...", 0);

          },
          error : function(XMLHttpRequest, textStatus, errorThrown) {
            $.unblockUI();
            alert("Sorry "+errorThrown);	     
            //hide and show dialog auth buttons
            $('#logoutdiv').hide();
            $('#logindiv').show();

            d.reject();
          },
          success : function(data) {
            
            if(window.localStorage.getItem("dataflag") != data.user.uid){
              window.localStorage.removeItem("dataflag");
              window.localStorage.setItem("dataflag", data.user.uid)
              devtrac.indexedDB.open(function (db) {
                for(var x in controller.objectstores) {
                  devtrac.indexedDB.deleteAllTables(db, controller.objectstores[x]).then(function(){

                  }).fail(function(){

                  });
                }



              });
            }

            
            localStorage.username = name;
            localStorage.pass = pass;
            localStorage.uid = data.user.uid;
            
            localStorage.realname = data.user.realname
            
            if(data.user.field_user_title.length > 0){
              localStorage.usertitle = data.user.field_user_title.und[0].value;  
            }else if(data.user.mail.length > 0){
              localStorage.usertitle = data.user.mail;
            }else{
              localStorage.usertitle = "Unavailable";
            }

            // Obtain session token.
            auth.getToken().then(function (token) {
              localStorage.usertoken = token;
              
              //set username in menu
              $(".username").html("Hi, "+localStorage.username+" !");
              
              //set user title in menu
              $(".user_title").html(localStorage.usertitle);

              //hide and show dialog auth buttons
              $('#logindiv').hide();
              $('#logoutdiv').show();

              //hide and show panel auth buttons
              $('.panel_login').hide();
              $('.panel_logout').show();

              d.resolve();
            });

          }
        });

      });
      return d;

    },

    //logout
    logout: function() {
      var d = $.Deferred();

      controller.loadingMsg("Logging out...", 0);
      // Obtain session token.
      auth.getToken().then(function (token) {
        // Call system logout with session token.
        $.ajax({
          url : localStorage.appurl+"/api/user/logout.json",
          type : 'post',
          dataType : 'json',
          headers: {'X-CSRF-Token': token},
          error : function(XMLHttpRequest, textStatus, errorThrown) {
            $.unblockUI();

            //hide and show dialog auth buttons
            $('#logindiv').hide();
            $('#logoutdiv').show();

            d.reject();
            
          },
          success : function(data) {
            $.unblockUI();

            localStorage.token = null;
            localStorage.pass = null;

            //clear fieldtrip list
            $("#list_fieldtrips").empty();

            //hide or show dialog auth buttons
            $('#logoutdiv').hide();
            $('#logindiv').show();

            //clear login credentials
            
            if(window.localStorage.getItem("usernam") != null && window.localStorage.getItem("passw") != null){
              $("#page_login_name").val(window.localStorage.getItem("usernam"));
              $("#page_login_pass").val(window.localStorage.getItem("passw"));  
            }else
            {
              $("#page_login_name").val('');
              $("#page_login_pass").val('');  
            }

            $.mobile.changePage("#page_login", "slide", true, false);

            d.resolve();
            
          }
        });

      });
      return d;
    }
} 
