var controller = {    

    base64Images : [],
    filenames : [],
    filedimensions: [],
    filesizes : [],

    // Application Constructor
    initialize: function () {
      $(window).bind('orientationchange pageshow pagechange resize', mapctlr.resizeMapIfVisible);

      //set application url if its not set
      if (!localStorage.appurl) {
        localStorage.appurl = "http://192.168.38.114/dt11";
      }

      auth.loginStatus().then(function () {
        $('#list_fieldtrips').attr('data-filter',true);
        $('#homeForm').trigger('create');

        //download all devtrac data for user.
        controller.fetchAllData().then(function(){
          //load field trip details from the database if its one and the list if there's more.
          controller.loadFieldTripList();

          //update upload counter
          controller.uploadCounter();

          //set welcome message
          $("#username").html("Welcome " + localStorage.username);
        });


      }).fail(function () {
        $('#list_fieldtrips').attr('data-filter',false);
        $('#homeForm').trigger('create');
        $.mobile.changePage("#home_page", "slide", true, false);
        $("#username").html("Please login to use the application");
      });

      this.bindEvents();
    },

    fetchAllData: function () {
      var d = $.Deferred();   

      $('#refreshme').initBubble();
      devtrac.indexedDB.open(function (db) {
        devtracnodes.getFieldtrips(db).then(function () {
          vocabularies.getPlacetypeVocabularies(db).then(function(){
            devtracnodes.getSiteVisits(db).then(function(){
              devtracnodes.getQuestions(db).then(function() {
                devtracnodes.getActionItems(db);
                devtracnodes.getPlaces(db);
                d.resolve();
              }).fail(function(e) {
                $.unblockUI();

              });

            }).fail(function(error){
              $.unblockUI();
              alert(error+". Try Later");
            });
            vocabularies.getOecdVocabularies(db).then(function(){
            });
          });

        }).fail(function(error){
          $.unblockUI();
          alert(error+". Try Later");
        });
      });

      return d;
    },

    //Bind any events that are required on startup
    bindEvents: function () {

      document.addEventListener("deviceready", controller.onDeviceReady, false);

      $("#sitevisit_add_save").bind('click', function(){
        controller.onSavesitevisit();
      });

      $("#page_fieldtrip_details").bind('pagebeforeshow', function(){
        $("#page_fieldtrip_details").trigger("create");
      });

      //on cancel location click
      $('#location_item_cancel').bind('click', function () { 
        $.mobile.changePage("#page_sitevisits_details", "slide", true, false);

      });

      // on cancel action item click
      $('#action_item_cancel').bind('click', function () { 
        $.mobile.changePage("#page_sitevisits_details", "slide", true, false);

      });

      //on add location click
      $('#addlocation').bind('click', function () { 
        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.getAllPlacetypesItems(db, function (categoryValues, categories) {
            controller.buildSelect("p", categoryValues, categories);
          });

        });

        $('#viewlocation_back').hide();

        $('#addlocation_back').show();

      });

      //on view fieldtrip location click
      $('.panel_map').bind('click', function () { 
        $('#viewlocation_back').show();
        $('#addlocation_back').hide();
      });

      //On Questionnaire button click
      $('#addquestionnaire').bind('click', function () { 

        $.mobile.changePage("#page_add_questionnaire", "slide", true, false);

      }); 

      //hide the notification button if there are no notifcations and its been clicked.
      $('#notify-anchor').bind('click', function () {
        if ($(".notification-bubble").html() <= 0) {
          $("#notify-nav").hide();
        }
      });

      //redownload the devtrac data
      $('.refresh-button').bind('click', function () {
        controller.loadingMsg("Downloading Data ...", 0);
        //get all bubbles and delete them to create room for new ones.
        for (var notify in $('#refreshme').getNotifications()) {
          $(this).deleteBubble($('#refreshme').getNotifications()[notify]);
        }

        //todo: check for internet connection before request
        controller.fetchAllData().then(function(){
          controller.loadFieldTripList();          
        });


        $(".notification-bubble").html(0);
      });

      //validate field to set urls for annonymous users
      var form = $("#urlForm");
      form.validate({
        rules: {
          url: {
            required: true,
            url: true
          }
        }
      });

      //action item validation
      var actionitem_form = $("#form_add_actionitems");
      actionitem_form.validate({
        rules: {
          actionitem_date: {
            required: true,
            date: true
          },
          actionitem_title: {
            required: true
          },
          actionitem_status:{
            required: true
          },
          actionitem_priority:{
            required: true
          },
          actionitem_responsible:{
            required: true
          },actionitem_followuptask:{
            required: true
          },actionitem_report:{
            required: true
          }
        }
      });

      //location validation
      var location_form = $("#form_add_location");
      location_form.validate({
        rules: {
          location_name: {
            required: true,
          },
          location_district: {
            required: true
          },
          select_placetypes:{
            required: true
          }
        }
      });

      //site visit validation
      var sitevisit_form = $("#form_sitevisit_add");
      sitevisit_form.validate({
        rules: {
          sitevisit_add_title: {
            required: true
          },
          sitevisit_add_type: {
            required: true
          },
          sitevisit_add_date:{
            required: true,
            date: true
          },
          sitevisit_add_public_summary:{
            required: true
          },
          sitevisit_add_report:{
            required: true
          }
        }
      });

      //add hidden element
      $('#addactionitem').bind("click", function (event, ui) {
        var snid = $('#sitevisitId').val();
        var form = $('#form_add_actionitems');
        $('<input>').attr({
          'type': 'hidden',
          'id': "action_snid"
        }).val(snid).prependTo(form);

      });

      $('input[type=file]').on('change', function(event, ui) {
        if(this.disabled) return alert('File upload not supported!');
        var F = this.files;
        if(F && F[0]) for(var i=0; i<F.length; i++) controller.readImage( F[i] );
      });

      //handle edit sitevisit click event
      $("#editsitevisit").bind("click", function (event) {
        var editform = $('#form_sitevisit_edits');
        editform.empty();
        var snid = localStorage.snid;
        if(localStorage.user == true){
          snid = parseInt(snid);
        }else{
          snid = snid.toString();
        }

        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.getSitevisit(db, snid, function (sitevisitObject) {
            var sitefieldset = $("<fieldset ></fieldset>");

            var titlelabel = $("<label for='sitevisit_title' >Title</label>");
            var titletextffield = $("<input type='text' value='" + sitevisitObject['title'] + "' id='sitevisit_title'>");

            var datevisited = $("<label for='sitevisit_date' >Date Visited</label>");
            var datetextffield = $("<input type='text' value='" + sitevisitObject['field_ftritem_date_visited']['und'][0]['value'] + "' id='sitevisit_date'>");

            var summarytitle = $("<label for='sitevisit_summary'>Summary</label>");
            var summarytextareadiv = $('<div class="summarytextareadiv"><textarea id="sitevisit_summary" rows="4" cols="12" >'+sitevisitObject['field_ftritem_public_summary']['und'][0]['value']+'</textarea></div>');

            var savesitevisitedits = $('<input type="button" data-inline="true" data-theme="b" id="save_site_visit_edits" onclick="controller.onSitevisitedit();" value="Save" />');

            var cancelsitevisitedits = $('<a href="#" data-role="button" data-inline="true" data-rel="back" data-theme="a" id="cancel_site_visit_edits">Cancel</a>');

            sitefieldset.append(
                titlelabel).append(
                    titletextffield).append(
                        datevisited).append(
                            datetextffield).append(
                                summarytitle).append(
                                    summarytextareadiv).append(
                                        savesitevisitedits).append(
                                            cancelsitevisitedits);

            editform.append(sitefieldset).trigger('create');
          });
        });

      });

      //handle edit fieldtrip click event
      $("#edit_fieldtrip").bind("click", function (event) {
        var editform = $('#form_fieldtrip_edits');
        editform.empty();

        var fnid = localStorage.fnid;

        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.getFieldtrip(db, fnid, function (fieldtripObject) {
            var fieldset = $("<fieldset ></fieldset>");

            var titlelabel = $("<label for='sitevisit_title' >Title</label>");
            var titletextffield = $("<input type='text' value='" + fieldtripObject['title'] + "' id='fieldtrip_title_edit'>");

            var savesitevisitedits = $('<input type="button" data-inline="true" data-theme="b" id="save_fieldtrip_edits" onclick="controller.onFieldtripsave();" value="Save" />');

            var cancelsitevisitedits = $('<a href="#" data-role="button" data-inline="true" data-rel="back" data-theme="a" id="cancel_fieldtrip_edits">Cancel</a>');

            fieldset.append(
                titlelabel).append(
                    titletextffield).append(
                        savesitevisitedits).append(
                            cancelsitevisitedits);

            editform.append(fieldset).trigger('create');
          });
        });

      });

      //save url dialog
      $('#save_url').bind("click", function (event, ui) {
        var url = null;
        $('.url').each(function () {
          if ($(this).attr('checked')) {
            url = $(this).val();
          }
        });
        //      validate url textfield
        //      if(form.valid()) {
        switch (url) {
        case "Uganda":
          localStorage.appurl = "http://192.168.38.114/dt11";
          break;
        case "localhost":
          localStorage.appurl = "http://localhost/dt11";
          break;
        case "android":
          localStorage.appurl = "http://10.0.2.2/dt11";
          break;
        default:
          break;
        }
        $.mobile.changePage("#home_page", "slide", true, false);
        //      }
      });

      //cancel url dialog
      $('#cancel_url').bind("click", function (event, ui) {
        var urlvalue = $('#url').val();
        if (urlvalue.charAt(urlvalue.length - 1) == '/') {
          localStorage.appurl = urlvalue.substr(0, urlvalue.length - 2);
        }
        $('#url').val("");
      });

      //validate login form
      $("#loginForm").validate();

      //handle login click event from dialog
      $('#page_login_submit').bind("click", function (event, ui) {
        if ($("#page_login_name").valid() && $("#page_login_pass").valid()) {
          auth.login($('#page_login_name').val(), $('#page_login_pass').val()).then(function () {
            $.mobile.changePage("#home_page", "slide", true, false);
            //todo: check for internet connection before request
            controller.fetchAllData().then(function(){
              controller.loadFieldTripList();          
            });
          }).fail(function (errorThrown) {
            $.unblockUI();
          });
        }
      });

      //handle logout click event from dialog
      $('#page_logout_submit').bind("click", function (event, ui) {
        auth.logout();

      });

      //handle logout click from panel menu
      $('.panel_logout').bind("click", function (event, ui) {
        if ($(this).attr('id') === "panel2") {
          $("#navpanel2").panel("close");
        } else {
          $("#navpanel").panel("close");
        }
        auth.logout();
      });

    },

    editlocations: function(anchor){
      var pnidarray = $(anchor).attr("id");
      var pnid  = pnidarray.split('-')[1];

      var locationcontent = $("#locationcontent");
      locationcontent.empty();

      if(localStorage.user == true){
        pnid = parseInt(pnid);
      }else{
        pnid = pnid.toString();
      }
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getPlace(db, pnid, function (placeObject) {
          if (placeObject != undefined) {
            var editform = $('<form id="form' + placeObject['nid'] + '"></form>');
            editform.empty();

            var placefieldset = $("<div class='ui-body ui-body-a ui-corner-all'><h3>" + placeObject['title'] + "</h3></div>");

            var titlelabel = $("<label for='place_title' >Title</label>");
            var titletextffield = $("<input type='text' value='" + placeObject['title'] + "' id='place_title'>");

            var name = $("<label for='place_name' >Name</label>");
            var namefield = $("<input type='text' value='" + placeObject['name'] + "' id='place_name'>");

            if (placeObject['field_place_responsible_person']['und'] != undefined || placeObject['field_place_email']['und'] != undefined) {
              var responsibleperson = $("<label for='place_reponsible'>Responsible person</label>");
              var responsiblepersonfield = $("<input type='text' value='" + placeObject['field_place_responsible_person']['und'][0]['value'] + "' id='place_reponsible'>");

              var email = $("<label for='place_email' >Email</label>");
              var emailfield = $("<input type='text' value='" + placeObject['field_place_email']['und'][0]['email'] + "' id='place_email'>");
            }

            var saveplaces = $('<input type="button" data-inline="true" data-theme="b" id="save_places_info" class="place' + placeObject['nid'] + '" onclick="controller.onPlacesave(this);" value="Save" />');

            var cancelplaces = $('<a data-role="button" data-inline="true" data-rel="back" data-theme="a" id="cancel_places_info">Cancel</a>');

            placefieldset.append(
                titlelabel).append(
                    titletextffield).append(
                        name).append(
                            namefield).append(
                                responsibleperson).append(
                                    responsiblepersonfield).append(
                                        email).append(
                                            emailfield).append(
                                                saveplaces).append(
                                                    cancelplaces);

            editform.append(placefieldset);
            locationcontent.append(editform);
            editform.trigger('create');
          }
        });

      });
    },

    //read from files
    readImage: function(file) {
      var reader = new FileReader();
      var image  = new Image();
      
      reader.readAsDataURL(file);  
      reader.onload = function(_file) {
        image.src = _file.target.result;
        
        image.onload = function() {
          var n = file.name,
          s = ~~(file.size/1024) +'KB';
          
          controller.filenames.push(n);
          controller.base64Images.push(image.src);
          controller.filesizes.push(~~(file.size/1024));
          
          $('#uploadPreview').append('<img src="'+ this.src +'"> '+s+' '+n+'<br>');
          
        };
        image.onerror= function() {
          //alert('Invalid file type: '+ file.type);
        };      
      };

    },

    //handle save for user answers from questionnaire
    saveQuestionnaireAnswers: function() {
      var checkvals = {};
      var radiovals = {};
      var txtvals = {};
      var selectvals = {};  	 

      var questionnaire = {};
      questionnaire['answers'] = {};
      questionnaire['qnid'] = localStorage.snid;
      questionnaire['contextnid'] = localStorage.place;

      //find element with class = qtions
      $(".qtions").each(function() {

        //find all inputs inside the qtions class 
        $(this).find(':input').each(function(){

          switch($(this)[0].type) {
          case 'checkbox':       		
            var qtnid = $(this)[0].name.substring($(this)[0].name.indexOf('x')+1);      
            if ($(this)[0].checked) {
              if (questionnaire['answers'][qtnid]) {
                questionnaire['answers'][qtnid] = $(this)[0].value; 	

              }else {
                questionnaire['answers'][qtnid] = {};
                questionnaire['answers'][qtnid] = $(this)[0].value;        		
              }

            }  			
            break;

          case 'radio': 

            var radioid = $(this)[0].name.substring($(this)[0].name.indexOf('o')+1);        		

            if ($(this)[0].checked) {	
              questionnaire['answers'][radioid] = $(this)[0].value; 
            }            

            break;

          case 'text':
            var txtid = $(this)[0].id;        		
            var text_value = $(this)[0].value;  
            var text_len = text_value.length;

            if (text_len > 0) {
              txtvals[txtid] = $(this)[0].value;	
              questionnaire['answers'][txtid] = $(this)[0].value;
            }   

            break;

          case 'select-one': 
            var selectid = $(this)[0].name.substring($(this)[0].name.indexOf('t')+1);        		
            if ($(this)[0].value != "Select One") {	
              questionnaire['answers'][selectid] = $(this)[0].value;
            }

            break;        		

          default:
            break;
          }

        });  
      });
      if(controller.sizeme(questionnaire.answers) > 0) {
        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.addSavedQuestions(db, questionnaire).then(function() {
            controller.loadingMsg("Saved", 2000);

            $(':input','.qtions')
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .removeAttr('checked')
            .removeAttr('selected');     

            $(".qtions input[type='radio']").each(function() {
              $(this).removeAttr('checked');
            });

          }).fail(function() {
            //todo: check if we can answer numerous questions for one site visit
            controller.loadingMsg("Already Saved", 2000);

          });      
        });
      }else {
        controller.loadingMsg("Please Answer Atleast Once", 2000);

      }
    },

    //load field trip list from db
    loadFieldTripList: function () {
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllFieldtripItems(db, function (data) {
          var fieldtripList = $('#list_fieldtrips');
          fieldtripList.empty();

          if (data.length > 1) {
            var sdate;
            var count = 0;
            $('.panel_home').show();
            for (var i = 0, len = data.length; i < len; i++) {
              var fieldtrip = data[i];

              if(fieldtrip['editflag'] == 1) {
                count = count + 1;
              }

              fieldtrip['field_fieldtrip_start_end_date'].length > 0 ? sdate = fieldtrip['field_fieldtrip_start_end_date']['und'][0]['value'] : sdate = "";

              var li = $("<li></li>");
              var a = $("<a href='#page_fieldtrip_details' id='fnid" + fieldtrip['nid'] + "' onclick='controller.onFieldtripClick(this)'></a>");
              var h1 = $("<h1 class='heada1'>" + fieldtrip['title'] + "</h1>");
              var p = $("<p class='para1'>Start Date: " + sdate + "</p>");

              a.append(h1);
              a.append(p);
              li.append(a);
              fieldtripList.append(li);

            }

            fieldtripList.listview('refresh');
            $("#fieldtrip_count").html(count);

            //home_page
            $.mobile.changePage("#home_page", "slide", true, false);
            $.unblockUI();
          } else if (data.length == 1) {
            $('.panel_home').hide();
            var count = 0;
            var fObject = data[0];

            if(fObject['editflag'] == 1) {
              count = count + 1;
            }

            localStorage.pnid = fObject['field_fieldtrip_places']['und'][0]['target_id'];
            localStorage.ftitle = fObject['title'];
            localStorage.fnid = fObject['nid'];

            var sitevisitList = $('#list_sitevisits');
            sitevisitList.empty();

            localStorage.fnid = fObject['nid'];
            var startdate = fObject['field_fieldtrip_start_end_date']['und'][0]['value'];
            var enddate = fObject['field_fieldtrip_start_end_date']['und'][0]['value2'];

            var startdatestring = JSON.stringify(startdate);
            var enddatestring = JSON.stringify(enddate);

            var startdateonly = startdatestring.substring(1, startdatestring.indexOf('T'))
            var enddateonly = enddatestring.substring(1, startdatestring.indexOf('T'))

            var startdatearray = startdateonly.split("-");
            var enddatearray = enddateonly.split("-");

            var formatedstartdate = startdatearray[2] + "/" + startdatearray[1] + "/" + startdatearray[0];
            var formatedenddate = enddatearray[2] + "/" + enddatearray[1] + "/" + enddatearray[0];

            $("#actionitem_date").datepicker({ dateFormat: "yy/mm/dd", minDate: new Date(parseInt(startdatearray[0]), parseInt(startdatearray[1]), parseInt(startdatearray[2])), maxDate: new Date(parseInt(enddatearray[0]), parseInt(enddatearray[1]), parseInt(enddatearray[2])) });
            $("#sitevisit_add_date").datepicker({ dateFormat: "yy/mm/dd", minDate: new Date(parseInt(startdatearray[0]), parseInt(startdatearray[1]), parseInt(startdatearray[2])), maxDate: new Date(parseInt(enddatearray[0]), parseInt(enddatearray[1]), parseInt(enddatearray[2])) });

            $("#fieldtrip_details_title").html(fObject['title']);
            $("#fieldtrip_details_status").html(fObject['field_fieldtrip_status']['und'][0]['value']);
            $("#fieldtrip_details_start").html(formatedstartdate);
            $("#fieldtrip_details_end").html(formatedenddate);

            var sitevisitcount = 0;
            devtrac.indexedDB.open(function (db) {
              devtrac.indexedDB.getAllSitevisits(db, function (sitevisit) {
                for (var i in sitevisit) {
                  if(sitevisit[i]['field_ftritem_field_trip'] != undefined){
                    if (sitevisit[i]['field_ftritem_field_trip']['und'][0]['target_id'] == fObject['nid']) {
                      if(sitevisit[i]['user-added'] && sitevisit[i]['submit'] == 0) {
                        sitevisitcount = sitevisitcount + 1;
                      }

                      var sitevisits = sitevisit[i];
                      var li = $("<li></li>");
                      var a = null;
                      if(sitevisit[i]['user-added']) {
                        a = $("<a href='#page_sitevisits_details' id='user" + sitevisits['nid'] + "' onclick='controller.onSitevisitClick(this)'></a>");  
                      }else{
                        a = $("<a href='#page_sitevisits_details' id='snid" + sitevisits['nid'] + "' onclick='controller.onSitevisitClick(this)'></a>");
                      }

                      var h1 = $("<h1 class='heada1'>" + sitevisits['title'] + "</h1>");
                      var p = $("<p class='para1'>Narrative: " + sitevisits['field_ftritem_narrative']['und'][0]['value'] + "</p>");

                      a.append(h1);
                      a.append(p);
                      li.append(a);
                      sitevisitList.append(li);

                    }    
                  }

                }

                $("#fieldtrip_count").html(count);
                $("#sitevisit_count").html(sitevisitcount);
                sitevisitList.trigger('create');

                $.mobile.changePage("#page_fieldtrip_details", "slide", true, false);

              });

            });
            $.unblockUI();
          } else {
            //load field trip details from the database if its one and the list if there's more.
            $.unblockUI();
          }
        });

      });
    },

    //handle fieldtrip click
    onFieldtripClick: function (anchor) {
      var anchor_id = $(anchor).attr('id');
      var fnid = anchor_id.substring(anchor_id.indexOf('d') + 1);
      localStorage.fnid = fnid;

      var sitevisitList = $('#list_sitevisits');
      sitevisitList.empty();
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getFieldtrip(db, fnid, function (fObject) {
          localStorage.pnid = fObject['field_fieldtrip_places']['und'][0]['target_id'];
          localStorage.ftitle = fObject['title'];

          var startdate = fObject['field_fieldtrip_start_end_date']['und'][0]['value'];
          var enddate = fObject['field_fieldtrip_start_end_date']['und'][0]['value2'];

          var startdatestring = JSON.stringify(startdate);
          var enddatestring = JSON.stringify(enddate);

          var startdateonly = startdatestring.substring(1, startdatestring.indexOf('T'))
          var enddateonly = enddatestring.substring(1, startdatestring.indexOf('T'))

          var startdatearray = startdateonly.split("-");
          var enddatearray = enddateonly.split("-");

          var formatedstartdate = startdatearray[2] + "/" + startdatearray[1] + "/" + startdatearray[0]
          var c = enddatearray[2] + "/" + enddatearray[1] + "/" + enddatearray[0]

          $("#fieldtrip_details_start").html(formatedstartdate);
          $("#fieldtrip_details_end").html(formatedstartdate);

          $("#fieldtrip_details_title").html(fObject['title']);
          $("#fieldtrip_details_status").html(fObject['field_fieldtrip_status']['und'][0]['value']);
        });

        devtrac.indexedDB.getAllSitevisits(db, function (sitevisit) {
          for (var i in sitevisit) {
            if (sitevisit[i]['field_ftritem_field_trip']['und'][0]['target_id'] == fnid) {
              var sitevisits = sitevisit[i];
              var li = $("<li></li>");

              if(sitevisit[i]['user-added']) {
                a = $("<a href='#page_sitevisits_details' id='user" + sitevisits['nid'] + "' onclick='controller.onSitevisitClick(this)'></a>");  
              }else{
                a = $("<a href='#page_sitevisits_details' id='snid" + sitevisits['nid'] + "' onclick='controller.onSitevisitClick(this)'></a>");
              }

              var h1 = $("<h1 class='heada1'>" + sitevisits['title'] + "</h1>");
              var p = $("<p class='para1'>Narrative: " + sitevisits['field_ftritem_narrative']['und'][0]['value'] + "</p>");

              a.append(h1);
              a.append(p);
              li.append(a);
              sitevisitList.append(li);
            }
          }
          sitevisitList.listview('refresh');
        });
      });

    },

    refreshSitevisits: function () {
      var sitevisitList = $('#list_sitevisits');
      sitevisitList.empty();
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllSitevisits(db, function (sitevisit) {
          for (var i in sitevisit) {
            if (sitevisit[i]['field_ftritem_field_trip']['und'][0]['target_id'] == localStorage.fnid) {
              var sitevisits = sitevisit[i];
              var li = $("<li></li>");

              if(sitevisit[i]['user-added']) {
                a = $("<a href='#page_sitevisits_details' id='user" + sitevisits['nid'] + "' onclick='controller.onSitevisitClick(this)'></a>");  
              }else{
                a = $("<a href='#page_sitevisits_details' id='snid" + sitevisits['nid'] + "' onclick='controller.onSitevisitClick(this)'></a>");
              }

              var h1 = $("<h1 class='heada1'>" + sitevisits['title'] + "</h1>");
              var p = $("<p class='para1'>Narrative: " + sitevisits['field_ftritem_narrative']['und'][0]['value'] + "</p>");

              a.append(h1);
              a.append(p);
              li.append(a);
              sitevisitList.append(li);
            }
          }
          sitevisitList.listview('refresh');
        });
      });
    },

    listlocations: function() {
      var locationsList = $('#locationslist');
      locationsList.empty();
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllplaces(db, function (places) {
          for (var i in places) {
            var places = places[i];
            var li = $("<li></li>");
            var a;
            var a2 = $("<a href='#page_location_edits' data-rel='dialog' onclick='controller.editlocations(this);' id="+ places['title'] +"-"+ places['nid']+"></a>");

            var h1 = $("<h1 class='heada1'>" + places['title'] + "</h1>");
            var p = $("<p class='para1'>Responsible person: " + places['field_place_responsible_person']['und'][0]['value'] + "</p>");

            if(places['user-added']) {
              a = $("<a href='#' id='user" + places['nid'] + "' onclick=''></a>");  
            }else{
              a = $("<a href='#' id='pnid" + places['nid'] + "' onclick=''></a>");
            }

            a.append(h1);
            a.append(p);
            li.append(a);
            li.append(a2);

            locationsList.append(li);

          }
          locationsList.listview('refresh');
        });
      });

    },

    //handle site visit click
    onSitevisitClick: function (anchor) {
      var state = false;
      var anchor_id = $(anchor).attr('id');
      var index = 0;
      var snid = 0;

      if(anchor_id.indexOf('d') != -1) {
        snid = anchor_id.substring(anchor_id.indexOf('d') + 1);
        localStorage.snid = snid;
        localStorage.user = false;
      }
      else if(anchor_id.indexOf('r') != -1) {
        snid = anchor_id.substring(anchor_id.indexOf('r') + 1);
        localStorage.snid = snid;
        localStorage.user = true;
        snid = parseInt(snid);
      }

      localStorage.sitevisitname = $(anchor).children('.heada1').html();

      var form = $("#form_sitevisists_details");

      var actionitemList = $('#list_actionitems');
      actionitemList.empty();

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getSitevisit(db, snid, function (fObject) {

          localStorage.pnid = fObject['field_ftritem_place']['und'][0]['target_id'];

          var sitedate = fObject['field_ftritem_date_visited']['und'][0]['value'];
          var formatedsitedate;

          if(localStorage.user == "false"){
            var sitedatestring = JSON.stringify(sitedate);
            var sitedateonly = sitedatestring.substring(1, sitedatestring.indexOf('T'));
            var sitedatearray = sitedateonly.split("-");

            formatedsitedate = sitedatearray[2] + "/" + sitedatearray[1] + "/" + sitedatearray[0];
          }
          else {
            formatedsitedate = sitedate;            
          }

          var sitevisittype = null;
          $("#sitevisists_details_date").html(formatedsitedate);

          switch (fObject['taxonomy_vocabulary_7']['und'][0]['tid']) {
          case "209":
            $("#sitevisists_details_type").html("Site Visit");
            break;
          case "210":
            $("#sitevisists_details_type").html("Roadside Observation");
            break;
          case "211":
            $("#sitevisists_details_type").html("Human Interest Story");
            break;
          default:
            break
          }

          $("#sitevisists_details_subjects").html();
          $("#sitevisists_details_summary").html(fObject['field_ftritem_public_summary']['und'][0]['value']);

          var pnid = fObject['field_ftritem_place']['und'][0]['target_id'];
          //get location name
          devtrac.indexedDB.getPlace(db, pnid, function (place) {
            localStorage.ptitle = place['title'];

            if (place != undefined) {
              $("#sitevisists_details_location").html(place['title']);
              localStorage.respplaceid = place['nid'];
              localStorage.respplacetitle = place['title'];
              localStorage.point = place['field_place_lat_long']['und'][0]['geom'];

              mapctlr.initMap(place['field_place_lat_long']['und'][0]['lat'], place['field_place_lat_long']['und'][0]['lon'], state);
              mapctlr.resizeMapIfVisible(); 
            }else {
              $("#sitevisists_details_location").html("Place Unavailable, Please Redownload.");
              mapctlr.initMap(0.28316, 32.45168, state);
              mapctlr.resizeMapIfVisible(); 
            }

          });

        });

        devtrac.indexedDB.getAllActionitems(db, function (actionitem) {
          var actionitemcount = 0;
          for (var i in actionitem) {
            if(actionitem[i]['user-added'] == true && actionitem[i]['submit'] == 0) {
              actionitemcount = actionitemcount + 1;
            }
            if(actionitem[i]['field_actionitem_ftreportitem'] != undefined) {
              var siteid = actionitem[i]['field_actionitem_ftreportitem']['und'][0]['target_id'];
              var sitevisitid = siteid.substring(siteid.indexOf('(')+1, siteid.length-1);

              if (actionitem[i]['field_actionitem_ftreportitem']['und'][0]['target_id'] == snid || sitevisitid == snid) {
                var aItem = actionitem[i];
                var li = $("<li></li>");
                var a = $("<a href='#' id='" + aItem['nid'] + "' onclick='controller.onActionitemclick(this)'></a>");
                var h1 = $("<h1 class='heada2'>" + aItem['title'] + "</h1>");
                var p = $("<p class='para2'></p>");

                switch (aItem['field_actionitem_status']['und'][0]['value']) {
                case '1':
                  p.html("Status: Open");
                  break;
                case '2':
                  p.html("Status: Rejected");
                  break;
                case '3':
                  p.html("Status: Closed");
                  break;
                default:
                  break;
                }

                a.append(h1);
                a.append(p);
                li.append(a);
                actionitemList.append(li);
              }
            }

          }

          $("#actionitem_count").html(actionitemcount);
          $("#uploads_listview").listview('refresh');
          actionitemList.listview('refresh');
        });
      });

    },

    onSitevisitedit: function () {
      //save site visit edits
      var updates = {};
      $('#form_sitevisit_edits *').filter(':input').each(function () {
        var key = $(this).attr('id').substring($(this).attr('id').indexOf('_') + 1);
        if (key.indexOf('_') == -1) {
          updates[key] = $(this).val();
        }

      });

      devtrac.indexedDB.open(function (db) {
        console.log("siite visit is "+localStorage.snid);

        devtrac.indexedDB.editSitevisit(db, localStorage.snid, updates).then(function () {
          $.mobile.changePage("#page_sitevisits_details", "slide", true, false);
        });
      });

    },

    onPlacesave: function (saveButtonReference) {
      //save places edits
      var snid = $('#sitevisitId').val();
      var saveclass = $(saveButtonReference).attr('class');

      var formId = saveclass.substring(saveclass.indexOf('e') + 1);


      var updates = {};
      updates.lat = localStorage.lat;
      updates.lon = localStorage.lon;

      devtrac.indexedDB.open(function (db) {
        $('#form' + formId + ' *').filter(':input').each(function () {
          var key = $(this).attr('id').substring($(this).attr('id').indexOf('_') + 1);
          if (key.indexOf('_') == -1) {
            updates[key] = $(this).val();
          }

        });

        devtrac.indexedDB.editPlace(db, formId, updates).then(function () {
          controller.loadingMsg('Saved ' + updates['title'], 2000);

          $.mobile.changePage("#page_sitevisits_details", "slide", true, false);
        });
      });

    },

    onSaveactionitem: function () {
      if ($("#form_add_actionitems").valid()) {
        //save added action items
        var updates = {};
        updates[0] = [];
        updates[0]['user-added'] = true;
        updates[0]['nid'] = 1;
        updates[0]['field_actionitem_ftreportitem'] = {};
        updates[0]['field_actionitem_ftreportitem']['und'] = [];
        updates[0]['field_actionitem_ftreportitem']['und'][0] = {};

        updates[0]['field_actionitem_due_date'] = {};
        updates[0]['field_actionitem_due_date']['und'] = [];
        updates[0]['field_actionitem_due_date']['und'][0] = {};
        updates[0]['field_actionitem_due_date']['und'][0]['value'] = {};

        //todo: get value from database or server
        updates[0]['taxonomy_vocabulary_8'] = {};
        updates[0]['taxonomy_vocabulary_8']['und'] = [];
        updates[0]['taxonomy_vocabulary_8']['und'][0] = {};

        //todo: get value from database or server
        updates[0]['taxonomy_vocabulary_6'] = {};
        updates[0]['taxonomy_vocabulary_6']['und'] = [];
        updates[0]['taxonomy_vocabulary_6']['und'][0] = {};

        updates[0]['field_actionitem_followuptask'] = {};
        updates[0]['field_actionitem_followuptask']['und'] = [];
        updates[0]['field_actionitem_followuptask']['und'][0] = {};

        updates[0]['field_actionitem_severity'] = {};
        updates[0]['field_actionitem_severity']['und'] = [];
        updates[0]['field_actionitem_severity']['und'][0] = {};

        updates[0]['field_actionitem_status'] = {};
        updates[0]['field_actionitem_status']['und'] = [];
        updates[0]['field_actionitem_status']['und'][0] = {};

        updates[0]['field_actionitem_responsible'] = {};
        updates[0]['field_actionitem_responsible']['und'] = [];
        updates[0]['field_actionitem_responsible']['und'][0] = {};

        updates[0]['field_actionitem_resp_place'] = {};
        updates[0]['field_actionitem_resp_place']['und'] = [];
        updates[0]['field_actionitem_resp_place']['und'][0] = {};

        updates[0]['uid'] = localStorage.uid;
        updates[0]['submit'] = 0;
        updates[0]['comment'] = 1;
        updates[0]['type'] = 'actionitem';
        updates[0]['status'] = 1;
        updates[0]['title'] = $("#actionitem_title").val();
        updates[0]['field_actionitem_due_date']['und'][0]['value']['date'] = $("#actionitem_date").val();
        updates[0]['field_actionitem_followuptask']['und'][0]['value'] = $("#actionitem_followuptask").val();
        updates[0]['field_actionitem_status']['und'][0]['value'] = $("#actionitem_status").val();
        updates[0]['field_actionitem_severity']['und'][0]['value'] = $("#actionitem_priority").val();
        updates[0]['field_actionitem_responsible']['und'][0]['target_id'] = localStorage.realname+" ("+localStorage.uid+")";
        updates[0]['taxonomy_vocabulary_8']['und'][0]['tid'] = '328';
        updates[0]['taxonomy_vocabulary_6']['und'][0]['tid'] = '100';
        updates[0]['field_actionitem_ftreportitem']['und'][0]['target_id'] = localStorage.sitevisitname+" ("+localStorage.snid+")";
        updates[0]['field_actionitem_resp_place']['und'][0]['target_id'] = localStorage.respplacetitle+" ("+localStorage.respplaceid+")";

        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.getAllActionitems(db, function (actionitems) {
            var actionitemcount = 1;
            for (var k in actionitems) {
              if (actionitems[k]['user-added'] && actionitems[k]['nid'] == updates[0]['nid']) {
                updates[0]['nid'] = actionitems[k]['nid'] + 1;
              }
              if(actionitems[k]['user-added'] == true && actionitems[k]['submit'] == 0) {
                actionitemcount = actionitemcount + 1;
              }
            }
            devtrac.indexedDB.addActionItemsData(db, updates[0]);

            var actionitemList = $('#list_actionitems');

            var li = $("<li></li>");
            var a = $("<a href='#' id='action" + updates[0]['nid'] + "' onclick='controller.onActionitemclick(this)'></a>");
            var h1 = $("<h1 class='heada2'>" + updates[0]['title'] + "</h1>");
            var p = $("<p class='para2'></p>");

            switch (updates[0]['status']) {
            case 1:
              p.html("Status: Open");
              break;
            case 2:
              p.html("Status: Rejected");
              break;
            case 3:
              p.html("Status: Closed");
              break;
            default:
              break;
            }

            a.append(h1);
            a.append(p);
            li.append(a);
            actionitemList.append(li);

            $("#actionitem_count").html(actionitemcount);
            $("#uploads_listview").listview('refresh');

            actionitemList.listview('refresh');
            controller.resetForm($('#form_add_actionitems'));
            $.mobile.changePage("#page_sitevisits_details", "slide", true, false);
          });

        });    
      }
    },

    onFieldtripsave: function() {
      var updates = {};
      updates['title'] = $('#fieldtrip_title_edit').val();
      updates['editflag'] = 1;

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.editFieldtrip(db, localStorage.fnid, updates).then(function() {
          var count_container = $("#actionitem_count").html().split(" ");
          var updated_count = parseInt(count_container[0]) - 1;

          $("#actionitem_count").html(updated_count);
          $('#fieldtrip_details_title').html(updates['title']);
          $.mobile.changePage("#page_fieldtrip_details", "slide", true, false);

        });      
      });

    },

    onActionitemclick: function (anchor) {
      var action_id = $(anchor).attr('id');
      var anid = action_id.substring(action_id.indexOf('n') + 1);

      localStorage.anid = anid;
      var form = $("#form_actionitems_details");

      if(localStorage.anid) {
        anid = parseInt(anid);
      }
      var list_comment = $('#list_comments');

      list_comment.empty();

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getActionItem(db, anid, function (fObject) {
          $("#actionitem_resp_location").html(localStorage.respplacetitle);          

          var sitedate = fObject['field_actionitem_due_date']['und'][0]['value'];

          if(sitedate.date.charAt(4) != "/") {
            var sitedatestring = JSON.stringify(sitedate);
            var sitedateonly = sitedatestring.substring(1, sitedatestring.indexOf('T'));
            var sitedatearray = sitedateonly.split("-");

            var formatedsitedate = sitedatearray[2] + "/" + sitedatearray[1] + "/" + sitedatearray[0];

          }
          else{
            var formatedsitedate = sitedate.date;
          }

          $("#actionitem_due_date").html(formatedsitedate);

          $("#actionitem_ftritem").html(localStorage.sitevisitname);

          if (fObject['status'] == "1") {
            $("#actionitem_details_status").html("Open");
          }else {
            $("#actionitem_details_status").html("Closed");
          }

          if (fObject['field_actionitem_severity']['und'][0]['value'] == "1") {
            $("#actionitem_details_priority").html("High");
          }else if(fObject['priority'] == "2") {
            $("#actionitem_details_priority").html("Medium");
          }else if(fObject['priority'] == "3") {
            $("#actionitem_details_priority").html("Low");
          }        

          $("#actionitem_author").html(localStorage.realname);
          $("#actionitem_resp_person").html(localStorage.realname);
          $("#actionitem_followup_task").html(fObject['field_actionitem_followuptask']['und'][0]['value']);

        });

        devtrac.indexedDB.getAllComments(db, function (comments) {
          for (var i in comments) {
            if (comments[i]['nid'] == localStorage.anid) {
              var aItem = comments[i];

              var li = $("<li></li>");
              var a = $("<a href='#' id='" + aItem['nid'] + "' onclick=''></a>");
              var h1 = $("<h1 class='heada2'>" + aItem['comment_body']['und'][0]['value'] + "</h1>");
              var p = $("<p class='para2'></p>");

              a.append(h1);
              a.append(p);
              li.append(a);
              list_comment.append(li);
            }
          }
          list_comment.listview('refresh');

        });
      });

      $.mobile.changePage("#page_actionitems_details", "slide", true, false);
    },

    //todo: potential code to refresh the action item list view after new items have been added
    /*    refreshActionItemsList: function(){
      var actionitemList = $('#list_actionitems');
      actionitemList.empty();
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllActionitems(db, function (actionitems) {
          var siteid = actionitem[i]['field_actionitem_ftreportitem']['und'][0]['target_id'];
          var sitevisitid = siteid.substring(siteid.indexOf('(')+1, siteid.length-1);

          for(var i in actionitems){
            if (actionitem[i]['field_actionitem_ftreportitem']['und'][0]['target_id'] == localStorage.snid || sitevisitid == localStorage.snid) {
              var aItem = actionitem[i];
              var li = $("<li></li>");
              var a = $("<a href='#' id='" + aItem['nid'] + "' onclick='controller.onActionitemclick(this)'></a>");
              var h1 = $("<h1 class='heada2'>" + aItem['title'] + "</h1>");
              var p = $("<p class='para2'></p>");

              switch (aItem['field_actionitem_status']['und'][0]['value']) {
              case '1':
                p.html("Status: Open");
                break;
              case '2':
                p.html("Status: Rejected");
                break;
              case '3':
                p.html("Status: Closed");
                break;
              default:
                break;
              }

              a.append(h1);
              a.append(p);
              li.append(a);
              actionitemList.append(li);
            }  
          }
        });  
      });

    },*/

    resetForm: function(form) {
      form[0].reset();
      form.find('input:text, input:password, input:file, select').val('');
      form.find('input:radio').removeAttr('checked').removeAttr('selected');
    },

    onSavelocation: function () {
      var locationcount = 0;
      if ($("#form_add_location").valid()) {
        //save added location items
        var updates = {};
        updates[0] = [];
        updates[0]['user-added'] = true;
        updates[0]['nid'] = 1;

        updates[0]['title'] = $('#location_name').val();
        updates[0]['status'] = 1;
        updates[0]['type'] = 'place';
        updates[0]['submit'] = 0;
        updates[0]['uid'] = localStorage.uid;

        updates[0]['field_actionitem_ftreportitem'] = {};
        updates[0]['field_actionitem_ftreportitem']['und'] = [];
        updates[0]['field_actionitem_ftreportitem']['und'][0] = {};
        updates[0]['field_actionitem_ftreportitem']['und'][0]['target_id'] = localStorage.snid;

        updates[0]['field_place_lat_long'] = {};
        updates[0]['field_place_lat_long']['und'] = [];
        updates[0]['field_place_lat_long']['und'][0] = {};
        updates[0]['field_place_lat_long']['und'][0]['geom'] = "POINT ("+localStorage.latlon+")";

        updates[0]['field_place_responsible_person'] = {};
        updates[0]['field_place_responsible_person']['und'] = [];
        updates[0]['field_place_responsible_person']['und'][0] = {};
        updates[0]['field_place_responsible_person']['und'][0]['value'] = $('#location_contact').val();

        updates[0]['field_place_responsible_phone'] = {};
        updates[0]['field_place_responsible_phone']['und'] = [];
        updates[0]['field_place_responsible_phone']['und'][0] = {};
        updates[0]['field_place_responsible_phone']['und'][0]['value'] = $('#location_phone').val();

        updates[0]['field_place_responsible_email'] = {};
        updates[0]['field_place_responsible_email']['und'] = [];
        updates[0]['field_place_responsible_email']['und'][0] = {};
        updates[0]['field_place_responsible_email']['und'][0]['email'] = $('#location_email').val();

        updates[0]['field_place_responsible_website'] = {};
        updates[0]['field_place_responsible_website']['und'] = [];
        updates[0]['field_place_responsible_website']['und'][0] = {};
        updates[0]['field_place_responsible_website']['und'][0]['url'] = $('#location_website').val();

        updates[0]['field_actionitem_status'] = {};
        updates[0]['field_actionitem_status']['und'] = [];
        updates[0]['field_actionitem_status']['und'][0] = {};

        //get placetypes information
        updates[0]['taxonomy_vocabulary_1'] = {};
        updates[0]['taxonomy_vocabulary_1']['und'] = [];
        updates[0]['taxonomy_vocabulary_1']['und'][0] = {};
        updates[0]['taxonomy_vocabulary_1']['und'][0]['tid'] = "3";

        //get district information
        updates[0]['taxonomy_vocabulary_6'] = {};
        updates[0]['taxonomy_vocabulary_6']['und'] = [];
        updates[0]['taxonomy_vocabulary_6']['und'][0] = {};
        updates[0]['taxonomy_vocabulary_6']['und'][0]['tid'] = "93";

        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.getAllplaces(db, function (locations) {
            for (var k in locations) {
              if (locations[k]['user-added'] && locations[k]['nid'] == updates[0]['nid']) {
                updates[0]['nid'] = locations[k]['nid'] + 1;
                locationcount = locationcount + 1;
              }
            }

            devtrac.indexedDB.addPlacesData(db, updates);
            locationcount = locationcount + 1;
            $("#location_count").html(locationcount);
            $.mobile.changePage("#page_sitevisits_details", "slide", true, false);
          });

        });  
      }
    },

    onSavesitevisit: function () {
      var sitevisitscount = 0;
      if ($("#form_sitevisit_add").valid()) {
        //save added site visits

        var updates = {};
        var images = {};
        
        images['base64s'] = controller.base64Images;
        images['names'] = controller.filenames;
        images['sizes'] = controller.filesizes;
        
        updates['user-added'] = true;
        updates['nid'] = 1;

        updates['title'] = $('#sitevisit_add_title').val();
        updates['status'] = 1;
        updates['type'] = 'ftritem';
        updates['submit'] = 0;
        updates['uid'] = localStorage.uid;

        //get site visit type
        updates['taxonomy_vocabulary_7'] = {};
        updates['taxonomy_vocabulary_7']['und'] = [];
        updates['taxonomy_vocabulary_7']['und'][0] = {};
        updates['taxonomy_vocabulary_7']['und'][0]['tid'] = $('#sitevisit_add_type').val();

        updates['field_ftritem_date_visited'] = {};
        updates['field_ftritem_date_visited']['und'] = [];
        updates['field_ftritem_date_visited']['und'][0] = {};
        updates['field_ftritem_date_visited']['und'][0]['value'] = $('#sitevisit_add_date').val();

        updates['field_ftritem_public_summary'] = {};
        updates['field_ftritem_public_summary']['und'] = [];
        updates['field_ftritem_public_summary']['und'][0] = {};
        updates['field_ftritem_public_summary']['und'][0]['value'] = $('#sitevisit_add_public_summary').val();

        updates['field_ftritem_narrative'] = {};
        updates['field_ftritem_narrative']['und'] = [];
        updates['field_ftritem_narrative']['und'][0] = {};
        updates['field_ftritem_narrative']['und'][0]['value'] =  $('#sitevisit_add_report').val();

        updates['field_ftritem_field_trip'] = {};
        updates['field_ftritem_field_trip']['und'] = [];
        updates['field_ftritem_field_trip']['und'][0] = {};
        updates['field_ftritem_field_trip']['und'][0]['target_id'] = localStorage.fnid;

        updates['field_ftritem_place'] = {};
        updates['field_ftritem_place']['und'] = [];
        updates['field_ftritem_place']['und'][0] = {};
        updates['field_ftritem_place']['und'][0]['target_id'] = localStorage.pnid;

        updates['field_ftritem_images'] = {};
        updates['field_ftritem_images']['und'] = [];
        
        if($('#sitevisit_add_type').val() == "210") {
          updates['field_ftritem_lat_long'] = {};
          updates['field_ftritem_lat_long']['und'] = [];
          updates['field_ftritem_lat_long']['und'][0] = {};
          updates['field_ftritem_lat_long']['und'][0]['geom'] = localStorage.point;
        }

        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.getAllSitevisits(db, function (sitevisits) {
            for (var k in sitevisits) {
              if (sitevisits[k]['user-added'] && sitevisits[k]['nid'] == updates['nid']) {
                updates['nid'] = sitevisits[k]['nid'] + 1;
                sitevisitscount = sitevisitscount + 1;
              }
            }

            devtrac.indexedDB.addSiteVisitsData(db, updates).then(function() {
              controller.refreshSitevisits();
              devtrac.indexedDB.addImages(db, images).then(function() {
                controller.base64Images = [];
                controller.filenames = [];
                controller.filesizes = [];
              });
              $.mobile.changePage("#page_fieldtrip_details", "slide", true, false);  
            });

            sitevisitscount = sitevisitscount + 1;
            $("#sitevisit_count").html(sitevisitscount);

          });

        });  
      }
    },

    onSavecomment: function() {
      if ($("#actionitem_comment").valid()) {
        var list_comment = $('#list_comments');
        var comment = {};

        comment['comment_body'] = {};
        comment['comment_body']['und']  = [];
        comment['comment_body']['und'][0] = {};
        comment['comment_body']['und'][0]['value'] = $('#actionitem_comment').val();
        comment['comment_body']['und'][0]['format'] = 1;   
        comment['language'] = 'und';
        comment['nid'] = localStorage.anid;
        comment['cid'] = null;
        comment['submit'] = 0;

        devtrac.indexedDB.open(function (db) {
          devtrac.indexedDB.addCommentsData(db, comment).then(function(){

            devtrac.indexedDB.getAllComments(db, function (comments) {
              for (var i in comments) {
                if (comments[i]['nid'] == localStorage.anid) {
                  var aItem = comments[i];

                  var li = $("<li></li>");
                  var a = $("<a href='#' id='" + aItem['nid'] + "' onclick=''></a>");
                  var h1 = $("<h1 class='heada2'>" + aItem['comment_body']['und'][0]['value'] + "</h1>");
                  var p = $("<p class='para2'></p>");

                  a.append(h1);
                  a.append(p);
                  li.append(a);
                  list_comment.append(li);
                }
              }
              list_comment.listview('refresh');

              controller.loadingMsg("Saved", 2000);

              $('#actionitem_comment').val("");
            });

          }); 	
        });	
      }    
    },

    onAddactionitemclick: function () {
      var snid = $('#sitevisitId').val();
      $('<input>').attr({
        'type': 'hidden',
        'id': "action_snid"
      }).val(snid).prependTo(form);

    },

    // device ready event handler
    onDeviceReady: function () {
      var options = {
          enableHighAccuracy: true
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
      //    onSuccess Geolocation
      //

      function onSuccess(position) {
        localStorage.lat = position.coords.latitude;
        localStorage.lon = position.coords.longitude;
      }

      // onError Callback receives a PositionError object
      //

      function onError(error) {
        alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
      }

    },

    // onOnline event handler
    checkOnline: function () {
      var d = $.Deferred();

      var networkState = navigator.connection.type;

      var states = {};
      states[Connection.UNKNOWN] = 'Unknown connection';
      states[Connection.ETHERNET] = 'Ethernet connection';
      states[Connection.WIFI] = 'WiFi connection';
      states[Connection.CELL_2G] = 'Cell 2G connection';
      states[Connection.CELL_3G] = 'Cell 3G connection';
      states[Connection.CELL_4G] = 'Cell 4G connection';
      states[Connection.CELL] = 'Cell generic connection';
      states[Connection.NONE] = 'No network connection';

      if ((states[networkState] == 'No network connection') || (states[networkState] == 'Unknown connection')) {
        d.reject();
      } else {
        d.resolve();
      }
      return d;
    },

    //build select from downloaded valuesbuild
    buildSelect: function (vocabulary, categoryValues, categories) {
      if(vocabulary == "p"){
        voca = 'placetypes';
      }else{
        voca = 'oecds';
      }
      var select = "<div class='ui-field-contain'><select name='select_"+voca+"' id='select_"+voca+"' data-theme='b' data-mini='true' required>";
      var optgroup = "";
      var options = "<optgroup label='OECD Codes'>OECD Codes</optgroup>";
      var flag = false;

      for (var key in categories) {
        optgroup = optgroup + "<optgroup label=" + categories[key] + ">";

        for (var mark in categoryValues) {
          if (flag) {
            flag = false;
            optgroup = optgroup + options + "</optgroup>";
            options = "";
            break;
          }
          for (var item in categoryValues[mark]) {
            if (mark == key) {
              options = "<option value=" + categoryValues[mark][item] + ">" + categoryValues[mark][item] + "</option>" + options;
              flag = true;
            } else {
              break;
            }
          }
        }
      }
      optgroup = optgroup + options + "</optgroup>";
      select = select + optgroup + "</select></div>";
      var selectGroup = $(select);

      if (vocabulary === "p") {
        //      create placetypes codes optgroup
        $('#location_placetypes').empty().append(selectGroup).trigger('create');
        $('#sitevisists_details_subjects').empty().append(selectGroup).trigger('create');
      } else {
        //      create oecd codes optgroup

      }

    },

    sizeme : function(obj) {
      var size = 0, key;
      for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
      }
      return size;
    },

    uploadCounter: function() {
      var locationcount = 0;
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllplaces(db, function (locations) {
          for(var location in locations){
            if(locations[location]['user-added'] == true && locations[location]['submit'] == 0){
              locationcount = locationcount + 1; 
            }
          }

          $("#location_count").html(locationcount);

        });

      });  
    },

    loadingMsg: function(msg, t){
      $.blockUI({ 
        message: msg, 
        fadeIn: 700, 
        fadeOut: 700,
        timeout: t,

        css: { 
          width: '250px', 
          top : ($(window).height()) / 2 + 'px',
          left : ($(window).width() - 225) / 2 + 'px',
          right: '10px', 
          border: 'none', 
          padding: '5px', 
          backgroundColor: '#000', 
          '-webkit-border-radius': '10px', 
          '-moz-border-radius': '10px', 
          opacity: .6, 
          color: '#fff' 
        } 
      }); 

    }

};
