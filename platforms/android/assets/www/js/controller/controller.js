var controller = {    
    // Application Constructor
    initialize: function() {
      
      //set application url if its not set
      if(!localStorage.appurl) {
        localStorage.appurl = "http://192.168.38.114/dt6";
      }
      
      this.store = new WebSqlStore();
      this.bindEvents(this.store);
    },

    //Bind any events that are required on startup.
    bindEvents: function(dbObject) {
      document.addEventListener('deviceready', this.onDeviceReady, false);

      //validate set url field for annonymous users
      var form = $("#urlForm");
      form.validate({
          rules: {
            url: {
              required: true,
              url: true
            }
          }    
      });
      
      //save annonymous user's url
      $('#save_url').bind("click", function(event, ui) {
        if(form.valid()) {
          localStorage.appurl = $('#url').val();
          $.mobile.changePage("#home_page", "slide", true, false);
        }
      });
      
      //cancel url dialog
      $('#cancel_url').bind("click", function(event, ui) {
        var urlvalue = $('#url').val();
        if(urlvalue.charAt(urlvalue.length-1) == '/'){
          localStorage.appurl = urlvalue.substr(0, urlvalue.length - 2);
        }else {
          localstorage.appurl = $('#url').val();
        }
        $.mobile.changePage("#home_page", "slide", true, false);
      });
      
      //validate login form
      $("#loginForm").validate();      
      
      //handle login click event from dialog
      $('#page_login_submit').bind("click", function(event, ui) {
        if($("#page_login_name").valid() && $("#page_login_pass").valid()) {
          controller.login($('#page_login_name').val(), $('#page_login_pass').val()); 
        }
      });

      //handle logout click event from dialog
      $('#page_logout_submit').bind("click", function(event, ui) {
        controller.logout();
      });
      
      //handle logout click from panel menu
      $('#panel_logout').bind("click", function(event, ui) {
        controller.logout();
      });
      
    },
    
    // device ready event handler
    onDeviceReady: function() {
          controller.loginStatus().then(function(){
            $.unblockUI();
          }).fail(function(){
            $.unblockUI();
          });
    },
    
    // onOnline event handler
    checkOnline: function() {
      var d = $.Deferred();
      
      var networkState = navigator.connection.type;

      var states = {};
      states[Connection.UNKNOWN]  = 'Unknown connection';
      states[Connection.ETHERNET] = 'Ethernet connection';
      states[Connection.WIFI]     = 'WiFi connection';
      states[Connection.CELL_2G]  = 'Cell 2G connection';
      states[Connection.CELL_3G]  = 'Cell 3G connection';
      states[Connection.CELL_4G]  = 'Cell 4G connection';
      states[Connection.CELL]     = 'Cell generic connection';
      states[Connection.NONE]     = 'No network connection';

      if((states[networkState] == 'No network connection') ||
        (states[networkState] == 'Unknown connection'))
      {
        d.reject();
      }
      else {
        d.resolve();
      }
      return d;
    },
    
    //show loading message
    showMessage: function(msg) {
      $.blockUI({
        message : '<h4><img src="css/images/ajax-loader.gif" /><br/>'+msg+'</h4>',
        css : {
          top : ($(window).height()) / 3 + 'px',
          left : ($(window).width() - 200) / 2 + 'px',
          width : '200px',
          backgroundColor : '#C9C9C9',
          '-webkit-border-radius' : '10px',
          '-moz-border-radius' : '10px',
          color : '#000000',
          border : 'none'
        }
      });
    },
    
    //hide loading message
    hideMessage: function() {
      $.unblockUI();
    },

    //download placetypes from devtrac
    loadPlacetypes: function() {
      var categories = [];
      var categoryValues = {}; 
      var category = "";
      var htid;

      vocabularies.getPlacetypeVocabularies().then(function(dbObject) {
        dbObject.getAllPlacetypes(function(results) {

          for(var i = 0; i < results.rows.length; i++) {
            if(category != results.rows.item(i).hname) {
              category = results.rows.item(i).hname;
              categories[results.rows.item(i).htid] = results.rows.item(i).hname;
              htid = results.rows.item(i).htid;
              categoryValues[htid] = [];
            }
            categoryValues[htid][i] = results.rows.item(i).dname;
          }
          controller.buildSelect(categoryValues, categories);

        });
      }).fail(function(err) {
        console.log(err);

      });

    },
    
    //build select from downloaded values
    buildSelect: function(categoryValues, categories) {
      var select = "<select>";
      var optgroup = "";
      var options = "";
      var flag = false;

      for(var key in categories) {
        optgroup = optgroup + "<optgroup label="+categories[key]+">";

        for(var mark in categoryValues) {
          if(flag){
            flag = false;
            optgroup = optgroup + options +"</optgroup>";
            options = "";
            break;
          }
          for(var item in categoryValues[mark]) {
            if(mark == key){
              options = "<option value=" + categoryValues[mark][item] + ">"+categoryValues[mark][item]+"</option>" + options;
              flag = true;
            }else {
              break;
            }
          }
        }
      }
      optgroup = optgroup + options +"</optgroup>";
      select = select + optgroup + "</select>";
      document.getElementById('oecdcontent').innerHTML = select;

    },
    
    //check if user is logged in
    loginStatus: function() {
      var d = $.Deferred();
      var user = $('#page_login_submit').val(),
      pass = $('#page_logout_submit').val();
      
      // Obtain session token.
      $.ajax({
        url: localStorage.appurl+"/?q=services/session/token",
        type:"get",
        dataType:"text",
        beforeSend: function( xhr ) {
          controller.showMessage('Please wait, checking connection to devtrac');
          },
        error:function (jqXHR, textStatus, errorThrown) {
          $.unblockUI();
          
          $('#logoutdiv').hide();
          $('#logindiv').show();
          
          $('#panel_login').show();
          $('#panel_logout').hide();
          
          alert('Cannot obtain token for '+localStorage.appurl+'. Please Try Alternative Url '+textStatus);
        },
        success: function (token) {
          // Call system connect with session token.
          $.ajax({
            url : localStorage.appurl+"/?q=api/system/connect.json",
            type : 'post',
            dataType : 'json',
            headers: {'X-CSRF-Token': token},
            error : function(XMLHttpRequest, textStatus, errorThrown) {
              $.unblockUI();
              
              $('#logoutdiv').hide();
              $('#logindiv').show();
              
              $('#panel_login').show();
              $('#panel_logout').hide();
              
              alert('Cannot Connect to Devtrac Site Now. Check your internet connection is working '+errorThrown);
            },
            success : function(data) {
              $.unblockUI();
              
              var drupal_user = data.user;
              if (drupal_user.uid == 0)
              {
                //user is not logged in
                $('#logoutdiv').hide();
                $('#logindiv').show();
                
                $('#panel_logout').hide();
                $('#panel_login').show();
                
                $('#setup_urls').show();
                
                d.reject();
              } else
              { 
                //user is logged in
                $('#logindiv').hide();
                $('#logoutdiv').show();
                
                $('#panel_login').hide();
                $('#panel_logout').show();
                
                $('#setup_urls').hide();
                $.mobile.changePage("#home_page", "slide", true, false);

                d.resolve();

              }
            }
          });
        }
      });
      return d;
    },

    //login to devtrac
    login: function(name, pass) {
      var d = $.Deferred();

      // Obtain session token.
      $.ajax({
        url: localStorage.appurl+"/?q=services/session/token",
        type:"get",
        dataType:"text",
        beforeSend: function( xhr ) {
          controller.showMessage('Please wait ...');
          },
        error:function (jqXHR, textStatus, errorThrown) {
          $.unblockUI();
          alert(errorThrown);
        },
        success: function (token) {
          // Call system login with session token.
          $.ajax({
            url : localStorage.appurl+"/?q=api/user/login.json",
            type : 'post',
            data : 'username=' + encodeURIComponent(name) + '&password=' + encodeURIComponent(pass),
            dataType : 'json',
            headers: {'X-CSRF-Token': token},
            error : function(XMLHttpRequest, textStatus, errorThrown) {
              $.unblockUI();
              alert(errorThrown);
              $('#logoutdiv').hide();
              $('#logindiv').show();
            },
            success : function(data) {
              $.unblockUI();
              $('#logindiv').hide();
              $('#logoutdiv').show();
              
              $('#panel_login').hide();
              $('#panel_logout').show();
              
              $('#setup_urls').hide();
              $.mobile.changePage("#home_page", "slide", true, false);
              
              //save username and passwords on sdcard
              window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, savePasswords, failsavePass);

            }
          });

        }
      });

      return d;

    },

    //logout
    logout: function() {
      // Obtain session token.
      $.ajax({
        url: localStorage.appurl+"/?q=services/session/token",
        type:"get",
        dataType:"text",
        beforeSend: function( xhr ) {
          controller.showMessage('Please wait ...');
          },
        error:function (jqXHR, textStatus, errorThrown) {
          $.unblockUI();
          alert(errorThrown);
        },
        success: function (token) {
          // Call system logout with session token.
          $.ajax({
            url : localStorage.appurl+"/?q=api/user/logout.json",
            type : 'post',
            dataType : 'json',
            headers: {'X-CSRF-Token': token},
            error : function(XMLHttpRequest, textStatus, errorThrown) {
              $.unblockUI();
              alert('Failed to logout ' + errorThrown);
              $('#logindiv').hide();
              $('#logoutdiv').show();
            },
            success : function(data) {
              $.unblockUI();
              
              $('#logoutdiv').hide();
              $('#logindiv').show();

              $("#page_login_name").val('');
              $("#page_login_pass").val('');
              
              $('#panel_login').show();
              $('#panel_logout').hide();
              
              $('#setup_urls').show();
              
              $("#navpanel").panel( "close" );
              
              //clear passwords from file
              window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, clearPasswords, failclearPass);
            }
          });
        }
      });
    }

};