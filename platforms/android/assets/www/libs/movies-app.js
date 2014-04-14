$(document).ready(function() {

  createSlides();
  
  function createSlides(){
    var owlparent = $("#owl-demo");
    
    localStorage.numbercount = 0;
    devtrac.indexedDB.open(function (db) {//<div class="item"></div>
      devtrac.indexedDB.getAllSitevisits(db, function (ftritems) {
        devtrac.indexedDB.getAllQuestionItems(db, ftritems, function (qtns) {
          if(qtns.length > 0) {
            for (var qtn in qtns) {

              switch (qtns[qtn].questionnaire_question_type.und[0].value) {
              case "radios":
                var radios = "";
                var radiodiv = $("<div class='item'></div>");
                
                localStorage.numbercount = parseInt(localStorage.numbercount) + 1;

                for (var option in qtns[qtn].questionnaire_question_options.und) {
                  var html = '<input type="radio" name="radio'+qtns[qtn].nid+'" id="'+qtns[qtn].nid+'_'+qtns[qtn].questionnaire_question_options.und[option].value+'" value="'+qtns[qtn].questionnaire_question_options.und[option].value+'"><label for="'+qtns[qtn].nid+'_'+qtns[qtn].questionnaire_question_options.und[option].value+'">'+qtns[qtn].questionnaire_question_options.und[option].value+'</label>';            
                  radios = radios + html;

                }

                var qtncontent = '<h1>' + localStorage.numbercount + '</h1><div class="movietext">          <fieldset class="qtions" data-role="controlgroup"><legend>' + qtns[qtn].title + ':</legend>'
                +radios+'</fieldset></div><div class="clearfix"></div>';
          
                radiodiv.append(qtncontent);
                owlparent.append(radiodiv);
                
                break;

              case "number":

                var numberdiv = $("<div class='item'></div>");
                localStorage.numbercount = parseInt(localStorage.numbercount) + 1;

                var qtncontent = '<h1>' + localStorage.numbercount + '</h1><div class="movie-text"><fieldset class="qtions"><legend>' + qtns[qtn].title + ':</legend><input type="text" name="text_"'+qtns[qtn].nid+'" id=' + qtns[qtn].nid + ' value=""></></div>';

                numberdiv.append(qtncontent);
                owlparent.append(numberdiv);
                
                break;

              case "select":
                var selectdiv = $("<div class='item'></div>");
                
                localStorage.numbercount = parseInt(localStorage.numbercount) + 1;
                var arr =  [];
                var obj = {};

                for (var option in qtns[qtn].questionnaire_question_options.und) {                        
                  arr.push(qtns[qtn].questionnaire_question_options.und[option].value);
                }        

                var options = '<option value="Select One">Select One</option>';
                for(var item in arr) {
                  options = options + '<option value="'+arr[item]+'">'+arr[item]+'</option>';
                }

                var innerdiv = '<h1>'+localStorage.numbercount+'</h1><div class="movie-text"><fieldset class="qtions" data-role="controlgroup"><legend>' + qtns[qtn].title + ':</legend><select id=select_'+qtns[qtn].nid+' name=select'+qtns[qtn].nid+'>'+options+'</select></fieldset>       </div>';                                

                selectdiv.append(innerdiv);
                owlparent.append(selectdiv);
                
                break;

              case "checkboxes":
                var checkboxdiv = $("<div class='item'></div>");
                
                var checkbox = "";
                localStorage.numbercount = parseInt(localStorage.numbercount) + 1;

                for (var option in qtns[qtn].questionnaire_question_options.und) {
                  var html = '<input type="checkbox" name="checkbox'+qtns[qtn].nid+'" id="'+qtns[qtn].nid+'_'+qtns[qtn].questionnaire_question_options.und[option].value+'" value="'+qtns[qtn].questionnaire_question_options.und[option].value+'"><label for="'+qtns[qtn].nid+'_'+qtns[qtn].questionnaire_question_options.und[option].value+'">'+qtns[qtn].questionnaire_question_options.und[option].value+'</label>';            
                  checkbox = checkbox + html;

                }

                var qtncontent = '<h1>' + localStorage.numbercount + '</h1><div class="movie-text"><fieldset class="qtions" data-role="controlgroup"><legend>' + qtns[qtn].title + ':</legend>'
                +checkbox+'</fieldset></div>';
 
                checkboxdiv.append(qtncontent);
                owlparent.append(checkboxdiv);
                
                break;
              default:
                break;
              }
            }   
            var lastdiv = $("<div class='item'></div>");
            
            var lastslide = '<h1 id="endqtntitle">Questionnaire Complete</h1><div class="movie-text"><div id="endbuttons">'
              +'<a class="ui-input-btn ui-btn" href="#" id="save_questionnaire" onclick="controller.saveQuestionnaireAnswers()">Save</a><a class="ui-input-btn ui-btn" href="#" id="cancel_questionnaire" data-rel="back">Cancel</a></li>'
              +'<a class="ui-input-btn ui-btn" href="#" onclick="devtracnodes.postQuestionnaire()">Upload</a></div></div>';   
            
            lastdiv.append(lastslide);
            owlparent.append(lastdiv);
            
          }else {
            var noqtnsdiv = $("<div class='item'></div>");
            var noqtnscontent = '<h1 id="endqtntitle">There are no questions</h1>';   
            
            noqtnsdiv.append(noqtnscontent);
            owlparent.append(noqtnsdiv);
            console.log("No questions");
          }
          
          $("#owl-demo").owlCarousel({
            
            navigation : true, // Show next and prev buttons
            slideSpeed : 300,
            paginationSpeed : 400,
            singleItem:true
       
        });

        });          
      });

    }); 
  }
  
});
