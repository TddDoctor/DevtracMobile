var devtracnodes = {
    
    updateNode: function(nid, node, siteid) {
      var d = $.Deferred();
      var updates = {};

      $.ajax({
        url: localStorage.appurl+"/api/node/" + encodeURIComponent(nid) + ".json",
        type: 'put',
        data: node,
        dataType: 'json',
        headers: {
          'X-CSRF-Token': localStorage.usertoken
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          //alert('page_node_update_submit - failed to update node');
          console.log(JSON.stringify(XMLHttpRequest));
          console.log(JSON.stringify(textStatus));
          console.log(JSON.stringify(errorThrown));
          d.reject(errorThrown);
        },
        success: function (data) {
          updates['submit'] = 1;

          console.log("We have updated the node "+nid);
          d.resolve(updates, siteid, nid);
        }
      });
      return d;
    },

    //create node
    postNode: function(node, index, location_len, pnid, loc_title) {
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
          d.reject(errorThrown);
        },
        success: function (data) {         
          updates['submit'] = 1;
          updates['nid'] = data['nid'];

          var status = false;

          if(index == location_len-1) {
            status = true;  
          }

          d.resolve(updates, status, pnid, loc_title, index, location_len);

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
              //url: "http://jenkinsge.mountbatten.net/devtracmanual/api/questionnaire/submit",
              type: 'post',
              data: JSON.stringify(answers[ans]),
              headers: {'X-CSRF-Token': localStorage.usertoken},
              dataType: 'json',
              contentType: 'application/json',
              error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log('error '+errorThrown);
                d.reject(errorThrown);
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
    postComments: function(commentId) {
      var d = $.Deferred();
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllComments(db, function (comments) {
          if(comments.length > 0){
            for (var comment in comments) {
              comments[comment]['nid'] = commentId['nid'];

              var info = {

                  'node_type': 'comment_node_actionitem',
                  "subject": "<p>Some body text</p>",
                  "language": "und",
                  "taxonomy_vocabulary_8": { "und": { "tid": "328" } },
                  "nid": commentId,

                  "uid": localStorage.uid,
                  "format": 1,
                  "status": '1',
                  "comment_body": { "und": {0 : { "value": "<p>Some body text</p>", "format": '1' }}},
                  "field_actionitem_status": { "und": { "value": '1' }}

              }

              $.ajax({
                url: localStorage.appurl+"/api/comment",
                type: 'post',
                data: info,
                //data: "node[status]=1&node[type]=comment_node_actionitem&node[subject]=<p>comment</p>&node[uid]=561&node[taxonomy_vocabulary_8][und][tid]=328&node[comment_body][und][0][value]=<p>comment</p>&node[nid]="+commentId+"&node[format]=1",
                headers: {'X-CSRF-Token': localStorage.usertoken},
                //dataType: 'json',
                //contentType: 'application/json',
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
          }else{
            d.reject();
          }

        });
      });
      return d;
    },

    //upload action items
    uploadActionItems: function(actionitems){

      var d = $.Deferred();
      var nodestring = {};
      var jsonstring;

      for(var x = 0; x < actionitems.length; x++) {

        if(actionitems[x]['submit'] == 0 && actionitems[x]['user-added'] == true) {
          delete actionitems[x]['submit'];
          localStorage.currentanid = actionitems[x]['nid'];

          devtracnodes.getActionItemString(actionitems[x]).then(function(jsonstring, anid) {

            devtracnodes.postNode(jsonstring, x, actionitems.length, anid).then(function(updates, status, anid) {
              devtrac.indexedDB.open(function (db) {
                /*todo*/   devtrac.indexedDB.editActionitem(db, parseInt(anid), updates).then(function() {
                  var count_container = $("#actionitem_count").html().split(" ");
                  var updated_count = parseInt(count_container[0]) - 1;
                  $("#actionitem_count").html(updated_count);

                });            
              });

              devtracnodes.postComments(updates).then(function() {
                $.unblockUI();
                d.resolve();

              }).fail(function(){
                $.unblockUI();
                d.resolve();

              });

            }).fail(function(e) {
              if(e == "Unauthorized: CSRF validation failed" || e == "Unauthorized") {
                auth.getToken().then(function(token) {
                  localStorage.usertoken = token;
                  devtracnodes.uploadActionItems(actionitems);
                });  
              }else
              {
                d.reject(e);
              }
            });   
          });
        }
      }

      return d;
    },

    getLocations: function() {
      var d = $.Deferred();
      var user_locations = [];

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllplaces(db, function(locations) {

          for(var location in locations) {

            if(locations[location]['submit'] == 0 && locations[location]['user-added'] == true) {              
              user_locations.push(locations[location]);
            }

          }

          if(user_locations.length > 0) {
            d.resolve(user_locations, db);  
          }else{
            d.reject();
          }


        });  

      });

      return d;
    },

    checkSitevisits: function() {
      var d = $.Deferred();
      var sitevisits = [];

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllSitevisits(db, function(ftritems) {

          for(var ftritem in ftritems) {

            if((ftritems[ftritem]['submit'] == 0 && ftritems[ftritem]['user-added'] == true)  || ftritems[ftritem]['editflag'] == 1) {              
              sitevisits.push(ftritems[ftritem]);
            }

          }

          if(sitevisits.length > 0) {
            d.resolve(sitevisits, db);  
          }else{
            d.reject();
          }


        });  

      });

      return d;
    },

    countLocations: function() {
      var d = $.Deferred();
      var locations = [];

      var count = 0;
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllplaces(db, function(locs) {
          for(var loc in locs) {

            if(locs[loc]['submit'] == 0 && locs[loc]['user-added'] == true) {              
              count = count + 1;
            }

          }        
          if(count > 0) {
            d.resolve(count);  
          }else
          {
            d.reject(count);
          }
        });  
      });

      return d;
    },
    
    countSitevisits: function() {
      var d = $.Deferred();
      var sitevisits = [];

      var count = 0;
      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllSitevisits(db, function(ftritems) {

          for(var ftritem in ftritems) {

            if((ftritems[ftritem]['submit'] == 0 && ftritems[ftritem]['user-added'] == true ) || ftritems[ftritem]['editflag'] == 1) {              
              count = count + 1
            }

          }        
          if(count > 0) {
            d.resolve(count);  
          }else
          {
            d.reject();
          }

        });  

        

      });

      return d;
    },
    
    
    countFieldtrips: function() {
      var d = $.Deferred();

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllFieldtripItems(db, function(tripsy) {
    
          if(tripsy.length > 0) {
            d.resolve();  
          }else
          {
            d.reject();
          }

        });  

        

      });

      return d;
    },

    checkActionitems: function() {
      var d = $.Deferred();
      var actionitems = [];

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllActionitems(db, function(actionitems) {

          for(var actionitem in actionitems) {

            if(actionitems[actionitem]['submit'] == 0 && actionitems[actionitem]['user-added'] == true) {              
              actionitems.push(actionitems[actionitem]);
            }

          }

          if(actionitems.length > 0) {
            d.resolve(actionitems, db);  
          }else{
            d.reject();
          }


        });  

      });

      return d;
    },


    //upload locations
    uploadLocations: function() {

      var d = $.Deferred();
      var loc_nids = [];
      
      var poststrings = [];
      var posttitle = [];
      var pnid = 0;

      var oldlocation_nids = [];
      var newlocationnames = [];
      var newlocation_nids = [];

      devtracnodes.getLocations().then(function(locs, db){
        var end_location_loop = locs.length;
        for(var mark = 0; mark < end_location_loop; mark++) {
          end_location_loop = end_location_loop - 1;
          
          localStorage.currentpnid = locs[mark]['nid'];
          if(locs[mark]['user-added']){
            pnid = parseInt(localStorage.currentpnid);
          }else{
            pnid = localStorage.currentpnid;
          }

          delete locs[mark]['submit'];
          delete locs[mark]['nid'];
          delete locs[mark]['field_actionitem_ftreportitem'];

          devtracnodes.getLocationString(locs[mark]).then(function(jsonstring, pnid, loc_title) {
            
            poststrings.push(jsonstring);
            posttitle.push(loc_title);
            
            if(mark == (end_location_loop - 1)) {
              postNodeHelper(poststrings, posttitle, pnid, function(){
                
                
              });
            }

          }); 
        }
        
        end_location_loop
        
        

      }).fail(function(){
        d.reject();
      });

      return d;
    },
    
    postNodeHelper: function(postarray, titlearray, pnid, callback){

      if(postarray.length > 0){
        devtracnodes.postNode(postarray[0], pnid, titlearray).then(function(updates, id, location_title) {
          if(updates['nid'] != undefined || updates['nid'] != null) {
            newlocationnames.push(location_title);
            newlocation_nids.push(updates['nid']);
            oldlocation_nids.push(id);

          }
          
          postarray.splice(0, 1);

          devtrac.indexedDB.editPlace(db, id, updates).then(function(pid) {
            var count_container = $("#location_count").html();
            var updated_count = parseInt(count_container) - 1;
            $("#location_count").html(updated_count);

            postNodeHelper(postarray,);
            //devtrac.indexedDB.deletePlace(db, parseInt(pid));
            
          });
          
          end_location_loop = end_location_loop - 1;
          
          if(end_location_loop == 0) {
            d.resolve(newlocationnames, newlocation_nids, oldlocation_nids,  db);  
          }

        }).fail(function(e) {
          d.reject(e);
        });

      }else{
        callback();
      }
      
    }
    
    //recursive node update for all images images
    updateNodeHelper: function (ftrid, y, fd, names, sdate, upId, callback) {
      var pack = "node[field_ftritem_images][und]["+y+"][fid]="+fd[y]+"&node[field_ftritem_images][und]["+y+"][title]="+names[y]+"&node[field_ftritem_date_visited][und][0][value][date]="+sdate;
      devtracnodes.updateNode(ftrid, pack).then(function(updates, sid, uid) {
        console.log("node updated");
        y = y+1;
        if(y == names.length )  {
          callback(updates, uid, upId);
        }else{
          devtracnodes.updateNodeHelper(ftrid, y, fd, names, sdate, upId, callback);
        }
      }).fail(function(e) {
        callback(e);
      });
    },

    //loop through and upload all images
    imagehelper: function (nid, index, fds, fdn, imagearr, sid_date, sid, callback) {
      var imagestring = "";
      
      devtracnodes.postImageFile(imagearr, index, nid).then(function (fd, imagename, ftrid) {

        index = index + 1;
        fds.push(fd);
        fdn.push(imagename);

        if(parseInt(index, 10) === parseInt(imagearr['base64s'].length, 10)){
          callback(fds, fdn, ftrid, sid_date, sid);  
        }else{
          devtracnodes.imagehelper(nid, index, fds, fdn, imagearr, sid_date, sid, callback);
        }

      }).fail(function(e) {
        if(e == "Could not create destination directory") {
          devtracnodes.uploadsitevisits(db, sitevisits);
          
        }else{
          console.log("rejected post image file error "+e);
          callback(e);
          
        }
      });

    },

    //create node
    postImageFile: function(images, index, nid) {
      var d = $.Deferred();

      var filedata = {
          "file":{
            "file": images['base64s'][index],
            "filename": images['names'][index],
            "filepath":"public://media/images/"+localStorage.uid +"/"+nid+"/"+images['names'][index],
          }
      };

      $.ajax({
        url: localStorage.appurl+"/api/file.json",
        type: 'post',
        data: filedata,
        dataType: 'json',
        headers: {
          'X-CSRF-Token': localStorage.usertoken
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          //console.log('image error '+errorThrown);
          d.reject(errorThrown);

        },
        success: function (data) {         
          //console.log("Image posted "+"public://media/images/"+localStorage.uid +"/"+nid+"/"+images['names'][index]);

          d.resolve(data['fid'], images['names'][index], nid, index);

        }
      }); 
      return d;
    },


    //upload sitevisits
    uploadsitevisits: function(db, sitevisits) {
      var d = $.Deferred();
      var date_visited = "";

      for(var k = 0; k < sitevisits.length; k++) {
        if(sitevisits[k]['user-added'] == true && sitevisits[k]['taxonomy_vocabulary_7']['und'][0]['tid'] == "210") {
          devtracnodes.getSitevisitString(sitevisits[k]).then(function(jsonstring, active_sitereport, date, siteid) {
            devtracnodes.postNode(jsonstring, active_sitereport, date, siteid).then(function(updates, x, y, z, active_ftritem, datevisited) {
              devtrac.indexedDB.getImage(db, parseInt(active_ftritem['nid']), updates['nid'], datevisited, y).then(function(image, nid, vdate, sid) {
                
                var indx = 0;
                var imageid = [];
                var imagename = [];

                devtracnodes.imagehelper(nid, indx, imageid, imagename, image, vdate, sid, function(fds, fdn, ftrid, ftrdate, updateId) {
                  
                  if(fdn == undefined) {
                    d.reject(fds);
                  }else{

                    var y = 0;
                    devtracnodes.updateNodeHelper(ftrid, y, fds, fdn, ftrdate, updateId, function(updates, ftritemid, activeid) {

                      if(ftritemid != undefined) {
                        /*todo: */  devtrac.indexedDB.editSitevisit(db, activeid, updates).then(function() {
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
                                                
                      }else if(updates.indexOf('Unauthorized') != -1){
                        auth.getToken().then(function(token) {
                          localStorage.usertoken = token;
                          devtracnodes.uploadsitevisits(db, sitevisits);
                        });
                      }
                      else{
                        d.reject(updates);
                      }

                    });                   
                  }

                });

              });

              //if post node fails because of expired token, restart
            }).fail(function(e){
              if(e == "Unauthorized: CSRF validation failed" || e == "Unauthorized") {
                auth.getToken().then(function(token) {
                  localStorage.usertoken = token;
                  devtracnodes.uploadsitevisits(db, sitevisits);
                });  
              }else
              {
                d.reject(e);
              }
            });

          });

          //edited site visit
        }else if(sitevisits[k]['user-added'] == undefined && sitevisits[k]['editflag'] == 1) { //if its a sitevisit created from devtrac
          devtracnodes.getSitevisitString(sitevisits[k]).then(function(jsonstring, active_sitereport, date, siteid) {
            devtrac.indexedDB.open(function (db) {

              devtracnodes.updateNode(siteid, jsonstring).then(function(updates, ftritemid, sid) {

                updates['editflag'] = 0;
                /*todo: */  devtrac.indexedDB.editSitevisit(db, sid, updates).then(function() {
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
                
              }).fail(function(e){
                if(e == "Unauthorized: CSRF validation failed" || e == "Unauthorized") {
                  auth.getToken().then(function(token) {
                    localStorage.usertoken = token;
                    devtracnodes.uploadsitevisits(db, sitevisits);
                  });  
                }else
                {
                  d.reject(e);
                }
              });
            });

          });
        }
      }

      return d;
    },


    //upload sitevisits
    uploadFtritemswithLocations: function(names, newnids, oldnids, db) {
      var d = $.Deferred();
      var ftritems = [];
      var idstore = [];
      
      devtracnodes.loopFtritems(names, newnids, oldnids, db, ftritems, idstore).then(function(sitevisits, ids) {
        for(var k = 0; k < sitevisits.length; k++){
          if(sitevisits[k]['submit'] == 0 && sitevisits[k]['user-added'] == true) {

            devtracnodes.getSitevisitString(sitevisits[k], names[k], newnids[k], k).then(function(jsonstring, p, q, r, mark) {

              devtracnodes.postNode(jsonstring, mark, sitevisits.length, r).then(function(updates, stat, snid) {

                /*todo*/             devtrac.indexedDB.editSitevisit(db, parseInt(snid), updates).then(function() {
                  var count_container = $("#sitevisit_count").html().split(" ");
                  if(typeof parseInt(count_container[0]) == "number") {
                    var updated_count = parseInt(count_container[0]) - 1;
                    $("#sitevisit_count").html(updated_count);
                  }
                  else
                  {
                    $("#sitevisit_count").html(0);
                  }

                  //devtrac.indexedDB.deleteSitevisit(db, parseInt(snid));
                  controller.refreshSitevisits();
                  if(stat){
                    d.resolve();           
                  }
                });

              }).fail(function(e){
                if(e == "Unauthorized: CSRF validation failed" || e == "Unauthorized") {
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

      return d;
    },

    //get individual site visits
    loopFtritems: function(names, newnids, oldids, db, sitev, idcontainer) {
      var d = $.Deferred();
      var sitevisits = sitev;

      var idcontainer = idcontainer;

      devtrac.indexedDB.getSitevisit(db, parseInt(oldids[0])).then(function(sitevisit) {
        idcontainer.push(oldids[0]);

        oldids.splice(0, 1);
        sitevisits.push(sitevisit);
        if(oldids.length > 0) {
          devtracnodes.loopFtritems(names, newnids, oldids, db, sitevisits, idcontainer).then(function(sitevisit, idstore) {
            d.resolve(sitevisit, idstore);
          });
        }else{
          d.resolve(sitevisits, idcontainer);
        }
      });

      return d;
    },

    //upload fieldtrips
    uploadFieldtrips: function() {
      var d = $.Deferred();
      var count = 0;

      devtrac.indexedDB.open(function (db) {
        devtrac.indexedDB.getAllFieldtripItems(db, function(fieldtrips) {

          for(var k in fieldtrips) {
            if(fieldtrips[k]['editflag'] == 1) {
              count = count + 1;
              delete fieldtrips[k]['editflag'];
              localStorage.title = fieldtrips[k]['title'];
              localStorage.currentfnid = fieldtrips[k]['nid'];

              devtracnodes.getFieldtripString(fieldtrips[k]).then(function(jsonstring) {

                devtracnodes.updateNode(localStorage.currentfnid, jsonstring).then(function(updates) {
                  var updates = {};
                  updates['editflag'] = 0;
                  updates['title'] = localStorage.title;

                  d.resolve();

                  /*todo*/  devtrac.indexedDB.editFieldtrip(db, localStorage.currentfnid, updates).then(function() {
                    var count_container = $("#fieldtrip_count").html().split(" ");
                    var updated_count = parseInt(count_container[0]) - 1;
                    $("#fieldtrip_count").html(updated_count);

                  });

                }).fail(function(e) {
                  if(e == "Unauthorized: CSRF validation failed" || e == "Unauthorized") {
                    auth.getToken().then(function(token) {
                      localStorage.usertoken = token;
                      devtracnodes.uploadFieldtrips();
                    });  
                  }else
                  {
                    d.reject(e);
                  }
                }); 
              });
            }
          }

          if(count == 0) {
            d.reject();
          }
        });  

      });

      return d;
    },
    
    syncSitevisits: function(ftritems_locs){
      var ftritems = false;
      
      if(parseInt($("#sitevisit_count").html()) > 0) {
        //upload site visits road side observations
        devtracnodes.checkSitevisits().then(function(sitevisits) {     
          devtrac.indexedDB.open(function (db) {
            devtracnodes.uploadsitevisits(db, sitevisits).then(function() {
              ftritems = true;
              if(ftritems_locs = true && ftritems == true){
                $.unblockUI();

              }

            }).fail(function(){
              ftritems = true;
              if(ftritems_locs = true && ftritems == true){
                $.unblockUI();

              }

            });
          });

        //no site visits to upload
        }).fail(function(){
          ftritems = true;
          if(ftritems_locs = true && ftritems == true) {
            $.unblockUI();
          }
        });
        
      }else{
        ftritems = true;
        if(ftritems_locs = true && ftritems == true){
          $.unblockUI();

        }

      }
      
    },

    syncAll: function() {
      var actionitems = false;
      var ftritems_locs = false;
      var fieldtrips = false;

      if(controller.connectionStatus) {
        
        if(parseInt($("#location_count").html()) > 0 || parseInt($("#sitevisit_count").html()) > 0 || parseInt($("#actionitem_count").html()) > 0 || parseInt($("#fieldtrip_count").html()) > 0) {
          
          controller.loadingMsg("Syncing, Please Wait...", 0);
          
          //devtracnodes.syncSitevisits(true);
          
          if(parseInt($("#location_count").html()) > 0) {
            
            //upload locations and sitevisits (human interest stories and site visits)
              devtracnodes.uploadLocations().then(function(names, new_nids, old_nids, db) {
                devtrac.indexedDB.open(function (dbs) {
                  devtracnodes.uploadFtritemswithLocations(names, new_nids, old_nids, dbs).then(function(sitevisits) {
                    ftritems_locs = true;
                    devtracnodes.syncSitevisits(ftritems_locs);
    
                  }).fail(function(){
                    ftritems_locs = true;
                    devtracnodes.syncSitevisits(ftritems_locs);
                    
                  });
                });
              }).fail(function(e){
                if(e == "Unauthorized: CSRF validation failed" || e == "Unauthorized") {
                  auth.getToken().then(function(token) {
                    localStorage.usertoken = token;
                    devtracnodes.uploadLocations().then(function(names, new_nids, old_nids, db) {
                      devtrac.indexedDB.open(function (dbs) {
                        devtracnodes.uploadFtritemswithLocations(names, new_nids, old_nids, dbs).then(function(sitevisits) {
                          ftritems_locs = true;
                          devtracnodes.syncSitevisits(ftritems_locs);

                        }).fail(function(){
                          ftritems_locs = true;
                          devtracnodes.syncSitevisits(ftritems_locs);
                        });
                      });
                    })
                  });  
                }else
                {
                  d.reject(e);
                }
              });
            
          }else {
            ftritems_locs = true;
            devtracnodes.syncSitevisits(ftritems_locs);
          }
          
          
        /*
          if(parseInt($("#actionitem_count").html()) > 0){
            //upload action items and comments
            devtracnodes.checkActionitems().then(function(actionitems, db){
              devtracnodes.uploadActionItems(actionitems).then(function(){
                actionitems = true;
                if(ftritems_locs = true && ftritems == true && fieldtrips == true && actionitems == true){
                  $.unblockUI();

                }

              }).fail(function(){
                actionitems = true;
                if(ftritems_locs = true && ftritems == true && fieldtrips == true && actionitems == true){
                  $.unblockUI();

                }
              });
            }).fail(function(){
              actionitems = true;
              if(ftritems_locs = true && ftritems == true && fieldtrips == true && actionitems == true){
                $.unblockUI();

              }
            });
            
          }else{
            actionitems = true;
            if(ftritems_locs = true && ftritems == true && fieldtrips == true && actionitems == true){
              $.unblockUI();

            }            
          }
          
          if(parseInt($("#fieldtrip_count").html()) > 0) {
            //upload fieldtrips
            devtracnodes.uploadFieldtrips().then(function() {
              fieldtrips = true;
              if(ftritems_locs = true && ftritems == true && fieldtrips == true && actionitems == true){
                $.unblockUI();

              }


            }).fail(function(){
              fieldtrips = true;
              if(ftritems_locs = true && ftritems == true && fieldtrips == true && actionitems == true){
                $.unblockUI();

              }
            });  
            
          }else{
            fieldtrips = true;
            if(ftritems_locs = true && ftritems == true && fieldtrips == true && actionitems == true) {
              $.unblockUI();

            }
          }*/
        }else {
          controller.loadingMsg("Nothing New to Upload", 3000);
        }

        

      }
      else
      {
        controller.loadingMsg("No Internet Connection", 2000);
      }
    },

    //check sitevisits to update
    checkSitevisitforUpdate: function(){
      var d = $.Deferred();
      var sitevisit = false;

      devtrac.indexedDB.open(function (db) {
        //check for sitevisits to upload
        devtrac.indexedDB.getAllSitevisits(db, function(sitevisits) {
          for(var k in sitevisits) {
            if(sitevisits[k]['submit'] == 0 && sitevisits[k]['user-added'] == undefined) {
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

      return d;
    },

    // check locations to upload
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
    getSitevisitString: function(aObj, placename, placeid, index) {
      var d = $.Deferred();      
      var sitevisit_backup = aObj;
      var visited_date = "";

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
            if(aObj['user-added'] || aObj[a]['und'][0]['value'].indexOf('/') != -1) {
              var dateparts = aObj[a]['und'][0]['value'].split('/');
              duedate = dateparts[2]+'/'+dateparts[1]+'/'+dateparts[0];

            }else{
              var sitedate = aObj[a]['und'][0]['value'];
              
              var sitedatestring = JSON.stringify(sitedate);
              var sitedateonly = sitedatestring.substring(1, sitedatestring.indexOf('T'));
              var sitedatearray = sitedateonly.split("-");

              duedate =  sitedatearray[2] + "/" + sitedatearray[1] + "/" + sitedatearray[0];

            }

            visited_date = duedate;

            nodestring = nodestring +a+'[und][0][value][date]='+duedate+'&';

            break;
          case 'field_ftritem_place':
            if(placename != undefined && placename != null){
              nodestring = nodestring +a+'[und][0][target_id]='+placename+"("+placeid+")"+'&';
            }

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
          if(a != 'user-added' && a != 'image' && a != "nid" && a != "ftritem_place") {
            nodestring = nodestring +a+'='+aObj[a]+"&";  
          }
        }
      }
      var nodestringlen = nodestring.length;
      var newnodestring = nodestring.substring(0, nodestringlen - 1);

      d.resolve(newnodestring, sitevisit_backup, visited_date, aObj['nid'], index);

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

    //return fieldtrip string
    getCommentString: function(cObj) {
      var d = $.Deferred();         
      var nodestring = '';
      for(var c in cObj) {
        if(typeof cObj[c] == 'object') {
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

      d.resolve(newnodestring, pObj['title']);

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
          if(a != 'user-added' && a != 'nid') {
            nodestring = nodestring + 'node['+a+']='+aObj[a]+"&";  
          }

        }
      }
      var nodestringlen = nodestring.length;
      var newnodestring = nodestring.substring(0, nodestringlen - 1);

      d.resolve(newnodestring, aObj['nid']);

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
