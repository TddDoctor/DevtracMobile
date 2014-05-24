var devtracnodes = {

    updateNode: function(nid, node) {
      var d = $.Deferred();
      $.ajax({
        url: localStorage.appurl+"/api/node/" + encodeURIComponent(nid) + ".json",
        type: 'put',
        data: node,
        dataType: 'json',
        headers: {
          'X-CSRF-Token': localStorage.usertoken
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          alert('page_node_update_submit - failed to update node');
          console.log(JSON.stringify(XMLHttpRequest));
          console.log(JSON.stringify(textStatus));
          console.log(JSON.stringify(errorThrown));
          d.reject();
        },
        success: function (data) {
          console.log("We have updated the node "+nid);
          d.resolve();
        }
      });
      return d;
    },

    //create node
    postNode: function(node) {
      var d = $.Deferred();
      var updates = [];

      $.ajax({
        url: localStorage.appurl+"/api/node.json",
        type: 'post',
        data: node,
        //data: "node[title]=test70&node[status]=1&node[type]=ftritem&node[uid]=314&node[taxonomy_vocabulary_7][und][tid]=209&node[field_ftritem_date_visited][und][0][value][date]=29/04/2014&node[field_ftritem_public_summary][und][0][value]=Check for sanitation and hygiene at food service points&node[field_ftritem_narrative][und][0][value]=Compile statistics of cleanliness&node[field_ftritem_field_trip][und][0][target_id]=Inspect the Warehouses(14065)&node[field_ftritem_place][und][0][target_id]=Amuru(14066)&node[field_ftritem_images][0][fid]=7895",
        dataType: 'json',
        headers: {
          'X-CSRF-Token': localStorage.usertoken
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          console.log('error '+errorThrown);
          d.reject();
        },
        success: function (data) {         
          updates['submit'] = 1;
          updates['nid'] = data['nid'];

          d.resolve(updates);

        }
      }); 
      return d;
    },

    //create node
    postImageFile: function(filedata) {
      var d = $.Deferred();

      $.ajax({
        url: localStorage.appurl+"/api/file.json",
        type: 'post',
        data: filedata,
        //data: JSON.stringify(filedata),
        dataType: 'json',
        headers: {
          'X-CSRF-Token': localStorage.usertoken
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          console.log('error '+errorThrown);
          d.reject(errorThrown);

        },
        success: function (data) {         
          d.resolve(data);

        }
      }); 
      return d;
    },

    //Post Questionnaire in devtrac
    postQuestionnaire: function() {
      var d = $.Deferred();
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllSavedAnswers(db, function (answers) {

          for (var ans in answers) {
            $.ajax({
              url: localStorage.appurl+"/api/questionnaire/submit",
              type: 'post',
              data: JSON.stringify(answers[ans]),
              headers: {'X-CSRF-Token': localStorage.token},
              dataType: 'json',
              contentType: 'application/json',
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log('error '+errorThrown);
                d.reject();
              },
              success: function (data) {
                console.log('Answers upload success');
                d.resolve();
              }
            });
          } 
        });
      });
      return d;
    },

    //Post action item comments to devtrac
    postComments: function() {
      var d = $.Deferred();
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllComments(db, function (comments) {
          for (var comment in comments) {
            $.ajax({
              url: localStorage.appurl+"/api/comment",
              type: 'post',
              data: JSON.stringify(comments[comment]),
              headers: {'X-CSRF-Token': localStorage.token},
              dataType: 'json',
              contentType: 'application/json',
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log('error '+errorThrown);
                d.reject();
              },
              success: function (data) {
                console.log('Comments upload success');
                d.resolve();
              }
            });
          } 
        });
      });
      return d;
    },

    //upload action items
    uploadActionItems: function(){

      var d = $.Deferred();
      var nodestring = {};
      var jsonstring;
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllActionitems(db, function(actionitems) {
          for(var actionitem in actionitems) {

            if(actionitems[actionitem]['submit'] == 0 && actionitems[actionitem]['user-added'] == true) {
              delete actionitems[actionitem]['submit'];
              localStorage.currentanid = actionitems[actionitem]['nid'];
              delete actionitems[actionitem]['nid'];
              devtracnodes.getActionItemString(actionitems[actionitem]).then(function(jsonstring) {

                devtracnodes.postNode(jsonstring).then(function(updates){

                  devtrac.indexedDB.editActionitem(db, parseInt(localStorage.currentanid), updates).then(function() {
                    var count_container = $("#actionitem_count").html().split(" ");
                    var updated_count = parseInt(count_container[0]) - 1;
                    $("#actionitem_count").html(updated_count);
                    d.resolve();
                    devtracnodes.postComments().then(function() {
                      d.resolve();

                    });
                  });

                }).fail(function() {
                  d.reject();
                });   
              });
            }
          }
        });  
      });

      return d;
    },


    //upload locations
    uploadLocations: function(){

      var d = $.Deferred();
      var loc_nids = {};
      var nodestring = {};
      var jsonstring;

      var count = 0;
      
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllplaces(db, function(locations) {
          
          for(var location in locations) {
            
            if(locations[location]['submit'] == 0 && locations[location]['user-added'] == true) {
              count = count + 1;
              delete locations[location]['submit'];
              localStorage.currentpnid = locations[location]['nid'];
              delete locations[location]['nid'];
              delete locations[location]['field_actionitem_ftreportitem'];
              devtracnodes.getLocationString(locations[location]).then(function(jsonstring) {

                devtracnodes.postNode(jsonstring).then(function(updates){
                  loc_nids[parseInt(localStorage.currentpnid)] = updates['nids'];
                  //devtrac.indexedDB.addUploadedLocations = function(db, lObj) {
/*                  devtrac.indexedDB.editPlace(db, parseInt(localStorage.currentpnid), updates).then(function() {
                    var count_container = $("#location_count").html().split(" ");
                    var updated_count = parseInt(count_container[0]) - 1;
                    $("#location_count").html(updated_count);

                  });*/
                }).fail(function(e) {
                  if(e == "Unauthorized: CSRF validation failed") {
                    auth.getToken().then(function(token) {
                      localStorage.usertoken = token;
                      devtracnodes.uploadLocations();
                    });  
                  }else
                  {
                    d.reject(e);
                  }
                });   
              });
            }
            
          }
        });  

      });
      if(controller.sizeme(loc_nids) == count) {
        d.resolve(loc_nids);  
      }
      return d;
    },

    //upload sitevisits
    uploadsitevisits: function() {
      var d = $.Deferred();
      
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllSitevisits(db, function(sitevisits) {

          for(var k in sitevisits) {
            if(sitevisits[k]['submit'] == 0 && sitevisits[k]['user-added'] == true) {

              localStorage.imageid = sitevisits[k]['nid'];
              devtracnodes.getSitevisitString(sitevisits[k]).then(function(jsonstring) {
                
                console.log("we have the site visits");
                d.resolve();
 /*               devtracnodes.postNode(jsonstring).then(function(updates) {
                  devtrac.indexedDB.deleteImage(db, localStorage.imageid);
                  devtrac.indexedDB.editSitevisit(db, persistedNid, updates).then(function() {
                    var count_container = $("#sitevisit_count").html().split(" ");
                    if(typeof parseInt(count_container[0]) == "number") {
                      var updated_count = parseInt(count_container[0]) - 1;
                      $("#sitevisit_count").html(updated_count);
                    }
                    else
                    {
                      $("#sitevisit_count").html(0);
                    }

                    controller.refreshSitevisits();
                    d.resolve();
                  });
                }); */ 
                
              });

            }
          }
        });  

      });

      return d;
    },

    //upload fieldtrips
    uploadFieldtrips: function(){
      var d = $.Deferred();

      var nodestring = {};

      var jsonstring;
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllFieldtripItems(db, function(fieldtrips) {

          for(var k in fieldtrips) {
            if(fieldtrips[k]['editflag'] == 1) {
              delete fieldtrips[k]['editflag'];
              localStorage.title = fieldtrips[k]['title'];
              localStorage.currentfnid = fieldtrips[k]['nid'];

              devtracnodes.getFieldtripString(fieldtrips[k]).then(function(jsonstring) {

                devtracnodes.updateNode(localStorage.currentfnid, jsonstring).then(function(updates) {
                  var updates = {};
                  updates['editflag'] = 0;
                  updates['title'] = localStorage.title;

                  devtrac.indexedDB.editFieldtrip(db, localStorage.currentfnid, updates).then(function() {
                    var count_container = $("#fieldtrip_count").html().split(" ");
                    var updated_count = parseInt(count_container[0]) - 1;
                    $("#fieldtrip_count").html(updated_count);

                    d.resolve();
                  });

                }).fail(function() {
                  d.reject();
                }); 
              });
            }
          }
        });  

      });

      return d;
    },

    uploadImages: function(db) {
      var d = $.Deferred();
/*
      var filedata = {};
      filedata['file'] = {};

      var filedata = {
          "file":{
            "file": data,
            "filename":imageObj['names'][0],
            "filepath":"public://"+imageObj['names'][0],
            "mimeType":"image/"+imageObj['names'][0].split(".")[1],
            "filesize":  imageObj['sizes'][0],
          }
      };*/

      devtrac.indexedDB.getAllImages(db, function(images) {
        var base64s = images[0];
        
        for(var image in base64s) {
          filedata['file']['file'] = base64s[image]
          
        }
        console.log("images are received");
        d.resolve(images);
      });

      
      /*        devtracnodes.postImageFile(filedata).then(function(data) {

          data['title'] = imageObj['names'][0].split(".")[0];
          data['height'] = imageObj['height'];
          data['width'] = imageObj['width'];

          d.resolve(data, inid, currentIndex);
        }).fail(function(e) {
          if(e == "Unauthorized: CSRF validation failed") {
            auth.getToken().then(function(token) {
              localStorage.usertoken = token;
              devtracnodes.uploadImage(db, inid, currentIndex);
            });  
          }else
          {
            d.reject(e);
          }
        });*/

      return d;
    },

    syncAll: function() {
      if(controller.connectionStatus){
        devtracnodes.checkLocationsforUpload().then(function(){
          devtracnodes.uploadLocations().then(function(locations){
            console.log("we have locations "+locations);
          });  
          
        });
        
      }else{
        controller.loadingMsg("No Internet Connection", 2000);
      }
    },

    //
    checkSitevisitforUpload: function(){
      var sitevisit = false;
      
      devtrac.indexedDB.open(function (db) {
        //check for sitevisits to upload
        devtrac.indexedDB.getAllSitevisits(db, function(sitevisits) {
          for(var k in sitevisits) {
            if(sitevisits[k]['submit'] == 0 && sitevisits[k]['user-added'] == true) {
              sitevisit = true;
              break;
            }
          }
          if(sitevisit) {
            d.resolve();
          }else{
            d.reject();
          }
        });
       
      });
      
    },
    
    checkLocationsforUpload: function(){
      var d = $.Deferred();
      var place = false;
      
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllplaces(db, function(places) {
          for(var k in places) {
            if(places[k]['submit'] == 0 && places[k]['user-added'] == true) {
              place = true;
              break;
            }
          }
          if(place) {
            d.resolve();
          }else{
            d.reject();
          }
        });  
      });
      
      return d;
    },
    
    //return site visit string
    getSitevisitString: function(aObj) {
      var d = $.Deferred();      
      delete aObj['dbsavetime'];
      delete aObj['submit'];
      delete aObj['editflag'];
      delete aObj['field_actionitem_ftreportitem'];

      var nodestring = '';
      for(var a in aObj) {
        if(typeof aObj[a] == 'object') {
          switch(a) {
          case 'taxonomy_vocabulary_7': 
            nodestring = nodestring + a+'[und][tid]='+aObj[a]['und'][0]['tid']+'&';
            break;
          case 'field_ftritem_public_summary': 
            nodestring = nodestring +a+'[und][0][value]='+aObj[a]['und'][0]['value']+'&';
            break;
          case 'field_ftritem_narrative':
            nodestring = nodestring +a+'[und][0][value]='+aObj[a]['und'][0]['value']+'&';
            break;
          case 'field_ftritem_field_trip':
            nodestring = nodestring +a+'[und][0][target_id]='+localStorage.ftitle+"("+aObj[a]['und'][0]['target_id']+")"+'&';
            break;
          case 'field_ftritem_date_visited':
            var duedate = null;
            if(aObj['user-added']) {
              var dateparts = aObj[a]['und'][0]['value'].split('/');
              duedate = dateparts[2]+'/'+dateparts[1]+'/'+dateparts[0];
            }else{
              var sitedate = aObj[a]['und'][0]['value'];
              var sitedatestring = JSON.stringify(sitedate);
              var sitedateonly = sitedatestring.substring(1, sitedatestring.indexOf('T'));
              var sitedatearray = sitedateonly.split("-");

              duedate =  sitedatearray[2] + "/" + sitedatearray[1] + "/" + sitedatearray[0];

            }

            nodestring = nodestring +a+'[und][0][value][date]='+duedate+'&';

            break;
          case 'field_ftritem_place':
            nodestring = nodestring +a+'[und][0][target_id]='+localStorage.ptitle+"("+aObj[a]['und'][0]['target_id']+")"+'&';
            break;

          case 'field_ftritem_lat_long':
            nodestring = nodestring +a+'[und][0][geom]='+aObj[a]['und'][0]['geom']+'&';
            break;

          /*case 'field_ftritem_images':
            nodestring = nodestring + a+'[und][0][fid]='+imageObj['fid']+'&['+a+'][und][0][title]='+imageObj['title']+'&';
            break;*/

          default :
            break
          }
        }
        else {
          if(a != 'user-added' && a != 'image' && a != "nid") {
            nodestring = nodestring +a+'='+aObj[a]+"&";  
          }
        }
      }
      var nodestringlen = nodestring.length;
      var newnodestring = nodestring.substring(0, nodestringlen - 1);

      d.resolve(newnodestring);

      return d;

    },

    //return fieldtrip string
    getFieldtripString: function(aObj) {
      var d = $.Deferred();         
      var nodestring = '';
      for(var a in aObj) {
        if(typeof aObj[a] == 'object') {
          switch(a) {
          case 'field_fieldtrip_start_end_date':
            var sitedate = aObj[a]['und'][0]['value'];
            var sitedate2 = aObj[a]['und'][0]['value2'];

            var sitedatestring = JSON.stringify(sitedate);
            var sitedateonly = sitedatestring.substring(1, sitedatestring.indexOf('T'));
            var sitedatearray = sitedateonly.split("-");

            var formatedsitedate = sitedatearray[2] + "/" + sitedatearray[1] + "/" + sitedatearray[0];

            var sitedatestring2 = JSON.stringify(sitedate2);
            var sitedateonly2 = sitedatestring2.substring(1, sitedatestring2.indexOf('T'));
            var sitedatearray2 = sitedateonly2.split("-");

            var formatedsitedate2 = sitedatearray2[2] + "/" + sitedatearray2[1] + "/" + sitedatearray2[0];

            nodestring = nodestring + 'node['+a+'][und][0][value][date]='+formatedsitedate+'&';
            nodestring = nodestring + 'node['+a+'][und][0][value2][date]='+formatedsitedate2+'&';
            break;

          default :
            break
          }
        }
        else{
          if(a == 'title') {
            nodestring = nodestring + 'node['+a+']='+aObj[a]+"&";  
          }

        }
      }
      var nodestringlen = nodestring.length;
      var newnodestring = nodestring.substring(0, nodestringlen - 1);

      d.resolve(newnodestring);

      return d;

    },

    //return place
    getLocationString: function(pObj) {
      var d = $.Deferred();

      var nodestring = '';
      for(var p in pObj) {
        if(typeof pObj[p] == 'object') {
          switch(p) {
          case 'field_place_responsible_website': 
            nodestring = nodestring + 'node['+p+'][und][0][url]='+pObj[p]['und'][0]['url']+'&';
            break;
          case 'field_place_responsible_email': 
            nodestring = nodestring + 'node['+p+'][und][0][email]='+pObj[p]['und'][0]['email']+'&';
            break;
          case 'field_place_responsible_phone': 
            nodestring = nodestring + 'node['+p+'][und][0][value]='+pObj[p]['und'][0]['value']+'&';
            break;
          case 'field_place_responsible_person': 
            nodestring = nodestring + 'node['+p+'][und][0][value]='+pObj[p]['und'][0]['value']+'&';
            break;
          case 'field_place_lat_long': 
            nodestring = nodestring + 'node['+p+'][und][0][geom]='+pObj[p]['und'][0]['geom']+'&';
            break;
          case 'taxonomy_vocabulary_6':
            nodestring = nodestring + 'node['+p+'][und][tid]='+pObj[p]['und'][0]['tid']+'&';
            break;
          case 'taxonomy_vocabulary_1':
            nodestring = nodestring + 'node['+p+'][und][tid]='+pObj[p]['und'][0]['tid']+'&';
            break;
          default :
            break
          }
        }
        else{
          if(p != 'user-added') {
            nodestring = nodestring + 'node['+p+']='+pObj[p]+"&";  
          }

        }
      }
      var nodestringlen = nodestring.length;
      var newnodestring = nodestring.substring(0, nodestringlen - 1);

      d.resolve(newnodestring);

      return d;

    },

    //return action item string
    getActionItemString: function(aObj) {
      var d = $.Deferred();

      var nodestring = '';
      for(var a in aObj) {
        if(typeof aObj[a] == 'object') {
          switch(a) {
          case 'field_actionitem_severity': 
            nodestring = nodestring + 'node['+a+'][und][value]='+aObj[a]['und'][0]['value']+'&';
            break;
          case 'field_actionitem_resp_place': 
            nodestring = nodestring + 'node['+a+'][und][0][target_id]='+aObj[a]['und'][0]['target_id']+'&';
            break;
          case 'field_actionitem_ftreportitem':
            nodestring = nodestring + 'node['+a+'][und][0][target_id]='+aObj[a]['und'][0]['target_id']+'&';
            break;
          case 'field_actionitem_followuptask':
            nodestring = nodestring + 'node['+a+'][und][0][value]='+aObj[a]['und'][0]['value']+'&';
            break;
          case 'taxonomy_vocabulary_6':
            nodestring = nodestring + 'node['+a+'][und][tid]='+aObj[a]['und'][0]['tid']+'&';
            break;
          case 'taxonomy_vocabulary_8':
            nodestring = nodestring + 'node['+a+'][und][tid]='+aObj[a]['und'][0]['tid']+'&';
            break;
          case 'field_actionitem_due_date':
            var duedate = null;
            if(aObj['user-added']) {
              var dateparts = aObj[a]['und'][0]['value']['date'].split('/');
              duedate = dateparts[2]+'/'+dateparts[1]+'/'+dateparts[0];
            }else{
              var sitedate = aObj[a]['und'][0]['value'];
              var sitedatestring = JSON.stringify(sitedate);
              var sitedateonly = sitedatestring.substring(1, sitedatestring.indexOf('T'));
              var sitedatearray = sitedateonly.split("-");

              duedate =  sitedatearray[2] + "/" + sitedatearray[1] + "/" + sitedatearray[0];

            }

            nodestring = nodestring + 'node['+a+'][und][0][value][date]='+duedate+'&';
            break;
          case 'field_actionitem_status':
            nodestring = nodestring + 'node['+a+'][und][value]='+aObj[a]['und'][0]['value']+'&';
            break;
          case 'field_actionitem_responsible':
            nodestring = nodestring + 'node['+a+'][und][0][target_id]='+aObj[a]['und'][0]['target_id']+'&';
            break;
          default :
            break
          }
        }
        else{
          if(a != 'user-added') {
            nodestring = nodestring + 'node['+a+']='+aObj[a]+"&";  
          }

        }
      }
      var nodestringlen = nodestring.length;
      var newnodestring = nodestring.substring(0, nodestringlen - 1);

      d.resolve(newnodestring);

      return d;

    },

    //Returns devtrac fieldtrips json list and saves to indexdb
    getFieldtrips: function(db) {
      var d = $.Deferred();

      $.ajax({
        url : localStorage.appurl+"/api/views/api_fieldtrips.json?display_id=current_trip&filters[field_fieldtrip_status_value]=All",
        type : 'get',
        dataType : 'json',
        //headers: {'X-CSRF-Token': localStorage.usertoken},
        error : function(XMLHttpRequest, textStatus, errorThrown) { 
          //creating bubble notification
          devtracnodes.notify("Fieldtrips. "+errorThrown);

          d.reject(errorThrown);
        },
        success : function(data) {
          //create bubble notification
          if(data.length <= 0) {
            devtracnodes.notify("Fieldtrips Data Unavailable");
            $.unblockUI();

            controller.loadingMsg("Please Create Fieldtrips in Devtrac",2000);
          }
          else {
            devtrac.indexedDB.addFieldtripsData(db, data).then(function() {
              devtracnodes.notify("Fieldtrips Saved");
              d.resolve();
            }).fail(function() {
              console.log("Error saving fieldtrips");
              d.resolve();
            });
          }

        }
      });

      return d;

    },

    //Returns devtrac site visit json list 
    getSiteVisits: function(db) {
      var d = $.Deferred();

      devtrac.indexedDB.getAllFieldtripItems(db, function(fnid){
        if(controller.sizeme(fnid) > 0){
          for(var key in fnid) {
            $.ajax({
              url : localStorage.appurl+"/api/views/api_fieldtrips.json?display_id=sitevisits&filters[field_ftritem_field_trip_target_id]="+fnid[key]['nid'],
              type : 'get',
              dataType : 'json',
              error : function(XMLHttpRequest, textStatus, errorThrown) { 
                //create bubble notification
                devtracnodes.notify("Sitevisits. "+errorThrown);
                d.reject(errorThrown);
              },
              success : function(data) {
                //create bubble notification
                if(data.length <= 0) {
                  devtracnodes.notify("Sitevisits Data Unavailable");
                  d.resolve();
                }else{

                  devtracnodes.saveSiteVisit(db, data, 0).then(function(){
                    devtracnodes.notify("Sitevisits Saved");

                  }).fail(function(e){
                    devtracnodes.notify("Sitevisits Not Saved, Reload Data");
                  });

                  d.resolve();
                }

              }
            });

          }
        }else {
          devtracnodes.getSiteVisits(db);
        }

      });
      return d;
    },

    //Returns devtrac action items json list 
    getActionItems: function(db) {
      var d = $.Deferred();

      devtrac.indexedDB.getAllFieldtripItems(db, function(fnid){
        for(var key in fnid){
          $.ajax({
            url : localStorage.appurl+"/api/views/api_fieldtrips.json?display_id=actionitems&args[nid]="+fnid[key]['nid']+"&filters[field_actionitem_status_value][]=1&filters[field_actionitem_status_value][]=3",
            type : 'get',
            dataType : 'json',
            error : function(XMLHttpRequest, textStatus, errorThrown) { 
              //create bubble notification
              devtracnodes.notify("Action items. "+errorThrown);
              d.reject(errorThrown);
            },
            success : function(data) {
              //create bubble notification
              if(data.length <= 0) {
                devtracnodes.notify("Action items Unavailable");
              }else{
                data[0]['submit'] = 0;
                devtracnodes.saveActionItems(db, data, 0).then(function(){
                  d.resolve();
                });
              }
            }
          });
        }
      });
      return d;

    },

    saveActionItems: function(db, data, count) {
      var d = $.Deferred();
      var arrlength = data.length;
      var counter = count;

      if(counter != arrlength) {
        devtrac.indexedDB.addActionItemsData(db, data[counter]);
        counter = counter + 1;
        devtracnodes.saveActionItems(db, data, counter); 
      }
      else {
        d.resolve();
      }
      return d;
    },

    saveSiteVisit: function(db, data, count) {
      var d = $.Deferred();
      var arrlength = data.length;
      var counter = count;

      if(counter != arrlength) {
        devtrac.indexedDB.addSiteVisitsData(db, data[counter]);
        counter = counter + 1;
        devtracnodes.saveSiteVisit(db, data, counter); 
      }
      else {
        d.resolve();
      }
      return d;
    },

    //Returns devtrac places json list 
    downloadPlaces: function(db, snid) {
      $.ajax({
        url : localStorage.appurl+"/api/views/api_fieldtrips.json?display_id=place&filters[nid]="+snid,
        type : 'get',
        dataType : 'json',
        error : function(XMLHttpRequest, textStatus, errorThrown) { 
          //create bubble notification
          devtracnodes.notify("Places. "+errorThrown);

          $.unblockUI();
        },
        success : function(data) {

          //create bubble notification
          if(data.length <= 0) {
            devtracnodes.notify("Places Data Unavailable");
          }else {

            devtrac.indexedDB.addPlacesData(db, data).then(function(){
              devtracnodes.notify("Places Saved");

            }).fail(function(e) {
              if(e.target.error.message != "Key already exists in the object store." && e.target.error.message != undefined) {
                devtracnodes.notify("Places Error: "+e.target.error.message);
              }

            });
          }

        }
      });
    },

    //
    getPlaces: function(db) {
      devtrac.indexedDB.getAllSitevisits(db, function(snid){
        if(snid.length > 0) {
          var marker = snid[0];
          for(var k in snid) {
            if(marker['nid'] == snid[k]['nid']) {
              devtracnodes.downloadPlaces(db, snid[k]['nid']);
            }else if(marker['field_ftritem_field_trip']['und'][0]['target_id'] != snid[k]['field_ftritem_field_trip']['und'][0]['target_id']){
              devtracnodes.downloadPlaces(db, snid[k]['nid']);
            }
          }
        }/*else {
          devtracnodes.getPlaces(db);
        }*/
      });
    },

    //Returns devtrac question json list 
    getQuestions: function(db) {
      var d = $.Deferred();

      $.ajax({
        url : localStorage.appurl+"/api/views/api_questions?offset=0&limit=10&filters[active]=1&filters[changed]=2%20011­02­01",
        type : 'get',
        dataType : 'json',
        error : function(XMLHttpRequest, textStatus, errorThrown) { 
          //create bubble notification
          devtracnodes.notify("Questions. "+errorThrown);

          d.reject(errorThrown);
        },
        success : function(data) {
          //create bubble notification
          if(data.length <= 0) {
            devtracnodes.notify("Questions Data Unavailable");
          }else {

            devtrac.indexedDB.addQuestionsData(db, data).then(function(){
              devtracnodes.notify("Questions Saved");
              d.resolve();
            }).fail(function(e) {

              d.resolve();
            });
          }

        }
      });
      return d;

    },

    notify: function(msg){
      $('#refreshme').addBubble(
          {
            message: msg
          }
      );
    }
} 
