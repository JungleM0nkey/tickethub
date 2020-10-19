
//Empty css global variables because I suck at js
var stored_ticket = '';
var base_css_background_color = '';
var base_css_font_color = '';
var base_css_gradient = '';
var base_css_background = '';
//all the ticket rows
var ticket_rows = '';
//dealing with a currently logged on user
var current_logged_on_user = '';
//currently selected ticket order
var ticket_order = '';
var current_page = 'main_page';
//currently selected user in the management interface
var selected_user = '';



 //Get selected ticket data and send to template
 function selectTicket(ticket_number){
     manageStoredTicket(ticket_number)
     var status = $(`#status_section_${ticket_number}`).find("span").text();
     var ticket_status = status.trim();
     $.post( '/tickethub', { "ticket_number": ticket_number, } ).done(function(response) {
         //Fade out old ticket num and fade in new
         $('#selected_ticket_number').fadeOut("Fast", function (){
           $('#selected_ticket_number').text(ticket_number).fadeIn("Fast");
         });   
         //Fade out the buttons and status selector and fade them in on the left side of the screen
         $('#sort_button').fadeOut("Fast");
         $('#sort_button').fadeIn("Fast");
         $('#edit_g_ticket').fadeOut("Fast");
         $("#copy-btn").fadeOut("Fast");
         $("#copy-btn").fadeIn("Fast");
         $('#delete_g_ticket').fadeOut("Fast");
         $('#edit_g_ticket').fadeIn("Fast");
         $('#delete_g_ticket').fadeIn("Fast");
         $('#status_selector').fadeOut("Fast");
         $('#status_selector').empty();
         if (ticket_status == 'IN PROGRESS'){
            $('#status_selector').append("<option value='IN PROGRESS'>IN PROGRESS</option>")
            $('#status_selector').append("<option value='COMPLETED'>COMPLETED</option>")
         }else if (ticket_status == 'COMPLETED'){
            $('#status_selector').append("<option value='COMPLETED'>COMPLETED</option>")
            $('#status_selector').append("<option value='IN PROGRESS'>IN PROGRESS</option>")
         }
         $('#status_selector').fadeIn("Fast");
         $('#status_selector_label').fadeOut("Fast");
         $('#status_selector_label').fadeIn("Fast");
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
         // Disable or Enable buttons based on ticket type
         if (ticket_number[0] == 'G'){
           $('#edit_g_ticket').removeClass("styled_button_disabled");
           $('#delete_g_ticket').removeClass("styled_button_disabled");
           $('#edit_g_ticket').addClass("styled_button");
           $('#delete_g_ticket').addClass("styled_button");
           $('#chain_selector').addClass("chain_selector_disabled");
           document.getElementById('chain_selector').disabled = true;
           $('#edit_g_ticket').attr("onclick","editTicketNotes()")
           $('#delete_g_ticket').attr("onclick", "deleteTicket()");
         }else{
           $('#delete_g_ticket').removeClass("styled_button");
           $('#chain_selector').removeClass("chain_selector_disabled");
           document.getElementById('chain_selector').disabled = false;
           $('#delete_g_ticket').addClass("styled_button_disabled");
           $('#edit_g_ticket').attr("onclick","editTicketNotes()");
           $('#edit_g_ticket').addClass("styled_button");
           $('#edit_g_ticket').removeClass("styled_button_disabled");
           //$('#edit_g_ticket').removeClass("styled_button");
           //$('#edit_g_ticket').addClass("styled_button_disabled");
           //$('#edit_g_ticket').attr("onclick","false")
           $('#delete_g_ticket').attr("onclick", "false");
         }

         
     }).fail(function() {
       console.log('Error: Could not find ticket data');
     });
 }

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
    var status = $(`#status_section_${stored_ticket}`).find("span").text();
    var ticket_status = status.trim();
   if (stored_ticket){
     console.log(`2. Removing highlight from ${stored_ticket}`);
     if (ticket_status == 'IN PROGRESS'){
        document.getElementById("ticket_row_"+stored_ticket).classList.remove('entry-row-hub-completed');
        document.getElementById("ticket_row_"+stored_ticket).classList.add('entry-row-hub');
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundColor="";
        document.getElementById("ticket_row_"+stored_ticket).style.color="";
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundSize="";
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundImage="";
     }else if (ticket_status == 'COMPLETED'){
        //Unhiglight the stored ticket, set the css to completed
        document.getElementById("ticket_row_"+stored_ticket).classList.remove('entry-row-hub');
        document.getElementById("ticket_row_"+stored_ticket).classList.add('entry-row-hub-completed');
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundColor="";
        document.getElementById("ticket_row_"+stored_ticket).style.color="";
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundSize=""; 
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundImage="";
      }else{
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundColor=base_css_background_color;
        document.getElementById("ticket_row_"+stored_ticket).style.color=base_css_font_color;
        document.getElementById("ticket_row_"+stored_ticket).style.boxShadow=base_css_gradient;         
        document.getElementById("ticket_row_"+stored_ticket).style.backgroundImage=base_css_background;
     }
     //Set line height and height back to normal regardless if its completed or in progress
     document.getElementById("ticket_row_"+stored_ticket).style.height='41px';
     $("#ticket_row_"+stored_ticket).find('#id_section').css({'line-height':'40px'});
     $("#ticket_row_"+stored_ticket).find('#date_section').css({'line-height':'40px'});
     $("#ticket_row_"+stored_ticket).find(`#date_completed_${stored_ticket}`).css({'line-height':'40px'});
     $("#ticket_row_"+stored_ticket).find(`#username_section_${stored_ticket}`).css({'line-height':'40px'});
     $("#ticket_row_"+stored_ticket).find(`#status_section_${stored_ticket}`).css({'line-height':'40px'});
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
   //Apply the clicked ref effect
   $("#ticket_row_"+ticket_number).fadeTo('fast', 0.3,function(){
      $(this).css({'background-color':'#f04d4d',"color":"white","background-image":"none","box-shadow":"none"});
      var title_section = $(this).find('#title_section')
      //Change the height if the title section of the clicked ticket is overflowing
      if ( title_section.prop('scrollHeight') > title_section.height() ){
        $(this).css({'height':'80px'});
        $(this).find('#id_section').css({'line-height':'80px'});
        $(this).find('#date_section').css({'line-height':'80px'});
        $(this).find(`#date_completed_${ticket_number}`).css({'line-height':'80px'});
        $(this).find(`#username_section_${ticket_number}`).css({'line-height':'80px'});
        $(this).find(`#status_section_${ticket_number}`).css({'line-height':'80px'});
      }
   }).fadeTo('fast', 1);
}

 //Passes received data to the template
 function searchQuery(){
     var myData = $('#search_field').val()
     $.post( '/search', { "myData": myData, "tickethub": false } ).done(function(response) {
         $('#search_results').html(response['text']);
     }).fail(function() {
         $('#search_entry').text('Error: Could not find search results');
     });
}
 //When clicked on search result, scroll search results window away and select the correct ticket.
 //Scroll the right side of the page to the correct ticket.
 function ticketSelectScroll(ticket_number){
     $('#search_results').slideUp("fast");
     $('#search_field').css('border-radius','10px 10px 10px 10px');
     //scroll the right box div
     console.log(`Scrolling to: ${ticket_number}`);
     var elmnt = document.getElementById(`ticket_row_${ticket_number}`);
     //check if the ticket is hidden because of the year it was submitted
     if ($(`#${elmnt.id}`).is(":hidden")){
        //get the year of the ticket
        var unformatted_date = $(`#${elmnt.id}`).find('#date_section').find("span").text()
        split_date = unformatted_date.split('-');
        var ticket_year = split_date[0].trim()
        //change page to that year
        $('#year_selector').val(ticket_year)
        organizeByYear(ticket_year, ticket_number, ticket_order)
        //scroll to it
        elmnt.scrollIntoView({behavior: "smooth", block: "nearest"});
     }else{
        elmnt.scrollIntoView({behavior: "smooth", block: "nearest"});
        selectTicket(ticket_number);
     }
}
 
 //Buttons functions
 function editTicketNotes(){
   current_page = 'editing_page';
   ticket_number = $('#selected_ticket_number').text();
   ticket_message_num = 'Ticket Message 1'
   $('body').hide();
   console.log('Editing ticket: '+ticket_number)
  $.post( '/home', { "editing_ticket": ticket_number, "ticket_message_num":ticket_message_num } ).done(function(response) {
          $('body').html(response);
          $('body').fadeIn();
   }).fail(function() {
      console.log('Failed sending ticket number to the home view')
   });
 }

   //Select new ticket message from dropdown menu
 function selectTicketBody(){
   var x = $("#chain_selector").find(":selected").text();
   var y = $('#selected_ticket_number').text();
   console.log(`Selecting ${x} for ${y}`);
   $.post( '/tickethub', { "ticket_message": x,"selected_ticket_number": y } ).done(function(response) {
     $('#ticket_text_area').fadeOut("Fast", function (){
       $('#ticket_text_area').empty();
       $('#ticket_text_area').html(response['chain_body']).fadeIn("Fast");
     });
   });
 }

 //Change the ticket status
 function changeTicketStatus(){
   var ticket_status = $("#status_selector").find(":selected").text();
   var ticket_number = $('#selected_ticket_number').text();
   var current_date = new Date();
   var completed_date = `${current_date.getFullYear()}-${String(current_date.getMonth() + 1).padStart(2,'0')}-${String(current_date.getDate()).padStart(2, '0')}`
   console.log(`Changing status for ${ticket_number} on ${completed_date}`);
   $.post( '/home', { "status_change": ticket_status,"ticket_number": ticket_number, "completed_date":completed_date } ).done(function(response) {
     //Update ticket status
     $(`#status_section_${ticket_number}`).find("span").text(ticket_status);
     //Update completed date
     if (ticket_status == 'COMPLETED'){
      $(`#date_completed_${ticket_number}`).find("span").text(completed_date);
     }else if(ticket_status == 'IN PROGRESS'){
      $(`#date_completed_${ticket_number}`).find("span").text('N/A');
     }
     if (document.getElementById('checkbox_status').checked){
      sortByStatus();
     }
   }).fail(function(){
     console.log('Failed to change the ticket status');
   });
 }

 //Deletes the selected ticket
 function deleteTicket(){
   var ticket_number = $('#selected_ticket_number').text();
   if (confirm("Are you sure you want to delete this ticket?")) {
    $.post( '/newticket', { "delete_ticket": ticket_number } ).done(function(response) {
      $(`#ticket_row_${ticket_number}`).hide('fast');
      selectTicket(response['ticket_number']);
    });
  } else {
    txt = "Ticket Delete canceled";
  } 
 }

 function clearMemory(){
   console.log('Clearing memory');
   $.post( '/ticketselection', { "store_ticket" : 'clear' } ).done(function(response) {
     window.open("/logout", '_self'); 
   });
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

 //Fix the styling temporarily during the drag event
function fixStyling(ticket_row, ticket_row_below){
    //get lifted ticket ID
    var lifted_ticket_number = document.getElementById(`${ticket_row}`).getAttribute("href");
    console.log(lifted_ticket_number);
    //lifted ticket
    $(`#${ticket_row}`).css('box-sizing','border-box');
    $(`#${ticket_row}`).css('height','42px');
    $(`#${ticket_row}`).find('#id_section').css({'line-height':'42px'});
    $(`#${ticket_row}`).find('#date_section').css({'line-height':'42px'});
    $(`#${ticket_row}`).find(`#username_section_${lifted_ticket_number}`).css({'line-height':'42px'});
    $(`#${ticket_row}`).find(`#status_section_${lifted_ticket_number}`).css({'line-height':'42px'});
    $(`#${ticket_row}`).css('border-top','1px solid grey');
    //ticket below
    $(`#${ticket_row_below}`).css('border-top','1px solid grey');
}



//detect keyboard presses by the browser
document.addEventListener("keydown", onKeyPressed);
function onKeyPressed(e) {
  //console.log(current_page);
  if ( ($(document.activeElement).attr("id") == "search_field") || (current_page != 'main_page')) {
    //console.log("search field clicked, ignoring");
  }else{
    var keyCode = e.keyCode;
    var key = e.key;
    console.log('Key Code: ' + keyCode + ' Key: ' + key);
    if(key =='Delete'){
      deleteTicket();//delete current ticket
    }else if(key == 'n'){
      window.open("/newticket", '_self'); //new ticket
    }else if(key == 'e'){
      editTicketNotes(); //edit current ticket
    }
  }

}

//populates the user list for the assign ticket button
function getuserlist(){
  $('#user_results').empty();
  $.post( '/getuserlist', {'users':'users'} ).done(function(response) {
    var rows = response['users'];
    rows.forEach(row => {
      if(row != 'it'){ //ignore the tickethub IT multi user
        $('#user_results').append(
          `<div class="menu_item" onClick="assignticket('${row}')">${row}</div>`
        );
      }
    });
  });
}

//assigns ticket to another it technician 
function assignticket(username){
  var left_box_top = document.getElementById('left_box_top');
  var left_top_child = left_box_top.children;
  $('#user_results').fadeOut('fast');
  console.log("Assigning ticket to user: "+username);
  ticket_number = $('#selected_ticket_number').text();
  $.post('/assignticket', {'username': username, 'ticket_number':ticket_number}).done(function(response){
    selectTicket(response['ticket_number_to_select']);
    console.log(`Ticket ${ticket_number} Assigned to user ${username}`)
    $(`#ticket_row_${ticket_number}`).hide('fast');
  });
  //unblur the stuff underneath
  for (var i = 0; i < left_top_child.length; i++) {
    if (left_top_child[i].id != menu_results){
      $(`#${left_top_child[i].id}`).css('filter','none');
    }
  }
  
}


// user management functions
function selectUser(username){
  delete_user_button = document.getElementById('delete_user_button')
  $(`#${delete_user_button.id}`).removeClass('button_disabled');
  $(`#${delete_user_button.id}`).addClass('button');
  console.log(`Selecting user_row_${username}`)
  $(`#user_row_${username}`).addClass('selected_user_row');
  var table = document.getElementById("user_table");
  for (var i = 1, row; row=table.rows[i]; i++){
    if(row.id != `user_row_${username}`){
      //console.log("Removing highlight from " + row.id)
      $(`#${row.id}`).removeClass('selected_user_row');
    }
  }
  selected_user = username
  
}

function deleteUser(){
  console.log("Deleting user " + selected_user);
  if (confirm(`Are you sure you want to delete ${selected_user}?`)){
    $.post('/deleteuser', {'username': selected_user}).done(function(response){
      console.log(`User deleted`);
      $(`#user_row_${selected_user}`).hide('fast');
    });
     
  }
}