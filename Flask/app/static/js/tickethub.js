//Empty css global variables because I suck at js, I dont think they are even being used anymore tbh, you can try deleting them
var stored_ticket = '';
var base_css_background_color = '';
var base_css_font_color = '';
var base_css_gradient = '';
var base_css_background = '';
//Get all ticket rows
var ticket_rows = '';


//Passes received search data to the template
function searchQuery(){
    var myData = $('#search_field').val()
    $.post( '/search', { "myData": myData, "tickethub": true } ).done(function(response) {
        $('#search_results-hub').html(response['text']);
        
    }).fail(function() {
        $('#search_entry').text('Error: Could not find search results!');
    });
}

function clearMemory(){
  console.log('Clearing memory');
  $.post( '/ticketselection', { "store_ticket" : 'clear' } ).done(function(response) {
    window.open("/logout", '_self'); 
  });
}


//When clicked on search result, scroll search results window away and select the correct ticket.
//Scroll the right side of the page to the correct ticket.
function ticketSelectScroll(ticket_number){
    $('#search_results-hub').slideUp("fast");
    $('#search_field').css('border-radius','10px 10px 10px 10px');
    //scroll the right box div
    console.log(`Scrolling to: ${ticket_number}`)
    //$('#right-box-hub').animate({scrollTop: $(`#ticket_row_${ticket_number}`).offset().top}, 1000);
    var elmnt = document.getElementById(`ticket_row_${ticket_number}`);
    elmnt.scrollIntoView({behavior: "smooth", block: "nearest"}); 
    selectTicket(ticket_number);
}

//Man xmas tree that makes the ticket hihglighting possible
function manageStoredTicket(ticket_number){
    getStoredTicket(function(stored_ticket) {
      deHighlightTicket(stored_ticket, function(){
        storeTicket(ticket_number, function(){
          highlightTicket(ticket_number)
        });
      });
  })
  }


  function getStoredTicket(callback){
    //Get the stored ticket variable
    $.post( '/ticketselection', { "get_stored_ticket": true } ).done(function(response) {  
      var stored_ticket = response['stored_hub_ticket'];
      console.log('\n1. Stored ticket: '+stored_ticket)
      callback(stored_ticket);
  }).fail(function() {
      console.log('Error: Could not get stored ticket');
      callback(stored_ticket);
  });
}


function deHighlightTicket(stored_ticket, callback){
  if (stored_ticket){
    console.log(`2. Removing highlight from ${stored_ticket}`);
    //Unhighlight the stored ticket
    document.getElementById("ticket_row_"+stored_ticket).style.backgroundColor=base_css_background_color;
    document.getElementById("ticket_row_"+stored_ticket).style.color=base_css_font_color;
    document.getElementById("ticket_row_"+stored_ticket).style.boxShadow=base_css_gradient;         
    document.getElementById("ticket_row_"+stored_ticket).style.backgroundImage=base_css_background;
    callback();
  }else{
    console.log('2. No stored ticket')
    callback();
  }
}


    
function storeTicket(ticket_number, callback){
    $.post( '/ticketselection', { "store_ticket": ticket_number } ).done(function(response) {  
      var stored_ticket = response['stored_hub_ticket'];
      console.log(`3. Newly stored ticket: ${stored_ticket}`);
      var base_css_background_color = $("#ticket_row_"+ticket_number).css("background-color");
      var base_css_font_color = $("#ticket_row_"+ticket_number).css("color");
      var base_css_gradient = $("#ticket_row_"+ticket_number).css("box-shadow");
      var base_css_background = $("#ticket_row_"+ticket_number).css("background-image");
      callback(ticket_number);
    }).fail(function() {
      console.log('Error: Could not store ticket');
      callback(ticket_number);
  });
}

function highlightTicket(ticket_number){
  //Highlight the new one
  console.log('4. Highlighting Ticket ' + ticket_number);
  var base_css_background_color = $("#ticket_row_"+ticket_number).css("background-color");
  var base_css_font_color = $("#ticket_row_"+ticket_number).css("color");
  var base_css_gradient = $("#ticket_row_"+ticket_number).css("box-shadow");
  var base_css_background = $("#ticket_row_"+ticket_number).css("background-image");
  $("#ticket_row_"+ticket_number).fadeTo('fast', 0.3,function(){
  $(this).css({'background-color':'#f04d4d',"color":"white","background-image":"none","box-shadow":"none" });
  }).fadeTo('fast', 1);
  
}



//Get selected ticket data and send to template
function selectTicket(ticket_number){
    manageStoredTicket(ticket_number)
    $.post( '/tickethub', { "ticket_number": ticket_number, } ).done(function(response) {
        //Fade out old ticket num and fade in new
        $('#selected_ticket_number').fadeOut("Fast", function (){
          $('#selected_ticket_number').text(ticket_number).fadeIn("Fast");
        });   
        //Update ticket chain options
        $('#chain_selector').fadeOut("Fast");
        $('#chain_selector').empty();
        $(response['chain_rows']).each(function(){
          $('#chain_selector').append("<option value='"+ticket_number+"'>"+this+"</option>");
        });
        $('#chain_selector').fadeIn("Fast");
        //Show first chain body
        $('#ticket_text_area').fadeOut("Fast", function (){
        $('#ticket_text_area').empty();
        $('#ticket_text_area').html(response['first_chain_body']).fadeIn("Fast");
        });
        //fade out then in for filter button
        $('#filter_by_name').fadeOut("Fast");
        $('#filter_by_name').fadeIn("Fast");
    }).fail(function() {
      console.log('Error: Could not find ticket data');
    });
}

//Select new ticket message from dropdown menu
function selectTicketBody(){
  var x = $("#chain_selector").find(":selected").text();
  var y = $('#selected_ticket_number').text();
  $.post( '/tickethub', { "ticket_message": x,"selected_ticket_number": y } ).done(function(response) {
    $('#ticket_text_area').fadeOut("Fast", function (){
      $('#ticket_text_area').empty();
      $('#ticket_text_area').html(response['chain_body']).fadeIn("Fast");
    });
  });
}

function clearMemory(){
  console.log('Clearing memory');
  $.post( '/ticketselection', { "store_ticket" : 'clear' } ).done(function(response) {
    window.open("/logout", '_self'); 
  });
}

function openMenu(){
    $('#menu_results').fadeToggle('fast');
}

function copyTicketNumber(){
  //get value from the ticket number h1 element
  var copyText = $("#selected_ticket_number").text();
  var dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  // send that value to the dummy textarea we just created
  dummy.value = copyText;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

function filterByName(){
    //$('#filter_results').fadeToggle('fast');
    //Get all users from the backend
    $.post( '/tickethub', { "get_users": true } ).done(function(response) {  
        var userlist = response['users']
        $('#filter_results').html('');
        $('#filter_results').append(
            "<div class='username_entry'>"+
            "<input class='checkbox_filter_box' type='checkbox' id='checkbox_allusers'>"+
            "<label class='checkbox_filter_label' for='horns'>All Users</label>"+
            "<div>"
        );
        document.getElementById("checkbox_allusers").checked = true;
        //Create checkboxes out of the usernames
        userlist.forEach(function (user) {
            $('#filter_results').append(
                "<div class='username_entry'>"+
                "<input class='checkbox_filter_box' type='checkbox' id="+user+">"+
                "<label class='checkbox_filter_label' for='horns'>"+user+"</label>"+
                "<div>"
            )
        });

    });
    
    //allusers_checkbox.setAttribute('checked', 'checked');
    
}

//checkbox change event
$(document).on('change', '.checkbox_filter_box', function() {
    //get name of the checkbox of what was just clicked / unclicked
    var username = $(this).attr('id');
    //if checked
    if(this.checked) {
        //Uncheck the other boxes
        var checkboxes = document.getElementsByClassName("checkbox_filter_box");
        for (let i = 0; i < checkboxes.length; i++) {
           console.log(checkboxes[i].id);
           console.log(username);
           if (checkboxes[i].id != username){
                checkboxes[i].checked = false;
            }
        }
        //if user checked on fade other users
        if (username != 'checkbox_allusers'){
            //get all of the ticket rows from the global variable and loop over them
            ticket_rows.forEach(function (row) {
                var ticket_user = $(`#${row.id}`).find('#username_section').find("span").text();
                if (ticket_user.trim() != username){
                    $(`#${row.id}`).css('border-top','1px solid grey');
                    $(`#${row.id}`).fadeOut('slow');
                }else if (ticket_user.trim() == username){
                    $(`#${row.id}`).css('border-top','1px solid grey');
                    $(`#${row.id}`).fadeOut('slow');             
                    $(`#${row.id}`).fadeIn('slow', function(){
                        $(`#${row.id}`).css('border-top','0px');
                    }); 
        }
        });
        //if all user checked on then fade everything back in
        }else{
            ticket_rows.forEach(function (row) {
                $(`#${row.id}`).css('border-top','1px solid grey');
                $(`#${row.id}`).fadeIn('slow');
                $(`#${row.id}`).css('border-top','0px');
        });
    }
    // if unchecked
    }else if(this.checked == false){
        //get name of user via checkbox id
        var username = $(this).attr('id');
        //prevent checkboxes from being unchecked
        $(this).prop("checked", true);
    }
});


