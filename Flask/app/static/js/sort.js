//Run this when a checkbox is checked off
$(document).on('change', '.checkbox_filter_box', function() {
  //get name of the checkbox of what was just clicked / unclicked
  var selected_option = $(this).attr('id');
  //if a box is checked
  if(this.checked) {
      //Uncheck the other boxes
      var checkboxes = document.getElementsByClassName("checkbox_filter_box");
      for (let i = 0; i < checkboxes.length; i++) {
          if (checkboxes[i].id != selected_option){
              checkboxes[i].checked = false;
          }
      }
      //sort by date
      if (selected_option == 'checkbox_date'){
          sortByDate(selected_option)
      //sort by type
      }else if (selected_option == 'checkbox_type'){
          sortByType(selected_option)
      }else if(selected_option == 'checkbox_status'){
          //ticket_rows = document.querySelectorAll('[id^="ticket_row_"]');
          sortByStatus(selected_option)//, ticket_rows)
      }else{
      //sort by custom order
          console.log('Selecting Custom Sort Option')
          customSort(selected_option)
      }
      //updateOrder(ticket_order,username);
  // if unchecked
  }else if(this.checked == false){
    //prevent checkboxes from being unchecked
    $(this).prop("checked", true);
  }
});

//sort tickets by date
function sortByDate(selected_option){
  //hide the checkbox window
  $('.sort_results').fadeOut();
  console.log('Sorting by date');
  //convert node list of divs to array
  var array = [];
  //ticket_rows.forEach(element => {
  //  array.push(element);
  //});
  for (var i = 0; i < document.querySelectorAll('[id^="ticket_row_"]').length; i++){
    array.push(ticket_rows[i]);
  }
  //Resort the newly created array
  array.sort(function(a,b) {
    //element a get date object
    var unformatted_date_a = $(`#${a.id}`).find('#date_section').find("span").text()
    split_date_a = unformatted_date_a.split('-');
    var newDate_a = split_date_a[1] + '/' + split_date_a[2] + '/' + split_date_a[0];
    var date_a = new Date(newDate_a);
    //element b get date object
    var unformatted_date_b = $(`#${b.id}`).find('#date_section').find("span").text()
    split_date_b = unformatted_date_b.split('-');
    var newDate_b = split_date_b[1] + '/' + split_date_b[2] + '/' + split_date_b[0];
    var date_b = new Date(newDate_b);
    return  date_a < date_b ? 1 : -1; // the part after ? is needed for Chrome to work
  });
  $('.right-box').fadeOut("fast");
  $('.right-box').empty();
  //Apply the new order
  for(var i = 0, l = array.length; i < l; i++) {
    $('.right-box').append(array[i]);
  }
  $('.right-box').slideDown("slow");
  var first_ticket_id = $(`#${array[0].id}`).find('#id_section').find("span").text()
  selectTicket(first_ticket_id.trim())
  //send data to backend
  ticket_order = 'date'
  var username = current_logged_on_user;
  var sortedIDs = $( ".right-box" ).sortable( "toArray" );
  tickets_array = []
  sortedIDs.forEach(element => {
  $(`#${element}`).css('border-top','0px solid grey');
    tickets_array.push(String(element));
  });
  updateOrder(ticket_order, tickets_array, username);
  organizeByMonth();
}

//sort by ticket type (deprecated)
/*function sortByType(selected_option){
    //clear existing month separators
    array = []
    var month_separators = $('#right-box').children('.month-separator');
    for (let i = 0; i < month_separators.length; i++) {
      array.push(month_separators[i]);
    }
    array.forEach(element => {
      element.remove();
    });
  //hide the checkbox window
  $('.sort_results').fadeOut();
  console.log('Sorting by Type');
  //convert node list of divs to array
  var array = [];
  //ticket_rows = $("#right-box").children("div:visible").not('.month-separator');
  //for (let i = 0; i < ticket_rows.length; i++) {
  //  array.push(ticket_rows[i]);
  //}
  ticket_rows.forEach(element => {
    array.push(element);
  });
  //Resort the newly created array
  array.sort(function(a,b) {
    //element a get id
    var id_a = $(`#${a.id}`).find('#id_section').find("span").text()

    //element b get id
    var id_b = $(`#${b.id}`).find('#id_section').find("span").text()
    return  id_a > id_b ? 1 : -1; // the part after ? is needed for Chrome to work
  });
  $('.right-box').fadeOut("fast");
  $('.right-box').empty();
  //Apply the new order
  for(var i = 0, l = array.length; i < l; i++) {
    $('.right-box').append(array[i]);
  }
  $('.right-box').slideDown("slow");
  var first_ticket_id = $(`#${array[0].id}`).find('#id_section').find("span").text()
  selectTicket(first_ticket_id.trim())
  //send data to backend
  ticket_order = 'type'
  var username = $(`#current_user`).find("span").text();
  var sortedIDs = $( ".right-box" ).sortable( "toArray" );
  tickets_array = []
  sortedIDs.forEach(element => {
  $(`#${element}`).css('border-top','0px solid grey');
    tickets_array.push(String(element));
  });
  updateOrder(ticket_order, tickets_array, username);
}*/

function sortByStatus(selected_option){//, ticket_rows){
  //hide the checkbox window
  $('.sort_results').fadeOut();
  console.log('Sorting by date')
  //convert node list of divs to array
  //ticket_rows = $("#right-box").children("div:visible").not('.month-separator');
  //for (let i = 0; i < ticket_rows.length; i++) {
  //  array.push(ticket_rows[i]);
  //}
  var array = [];
  ticket_rows.forEach(element => {
    array.push(element);
  });
  //Resort the newly created array
  array.sort(function(a,b) {
    //get ticket id for a
    var row_id = `${a.id}`;
    var ticket_number = row_id.split('_');
    var ticket_number_a = ticket_number[2]
    var status_a = $(`#${a.id}`).find(`#status_section_${ticket_number_a}`).find("span").text().trim();
    //get ticket id for b
    var row_id = `${b.id}`;
    var ticket_number = row_id.split('_');
    var ticket_number_b = ticket_number[2]
    var status_b = $(`#${b.id}`).find(`#status_section_${ticket_number_b}`).find("span").text().trim();
    //console.log(`Ticket ID: ${a.id} - ${status_a}\nTicket ID: ${b.id} - ${status_b}`);
    return  status_b > status_a ? 1 : -1; // the part after ? is needed for Chrome to work, a ternary operator
  });
  console.log(array[0]);
  $('.right-box').fadeOut("fast");
  $('.right-box').empty();
  //Apply the new order
  for(var i = 0, l = array.length; i < l; i++) {
    $('.right-box').append(array[i]);
  }
  $('.right-box').slideDown("slow");
  var first_ticket_id = $(`#${array[0].id}`).find('#id_section').find("span").text()
  selectTicket(first_ticket_id.trim())
  //send data to backend
  ticket_order = 'status'
  var username = $(`#current_user`).find("span").text();
  var sortedIDs = $( ".right-box" ).sortable( "toArray" );
  tickets_array = []
  sortedIDs.forEach(element => {
    $(`#${element}`).css('border-top','0px solid grey');
    tickets_array.push(String(element));
  });
  updateOrder(ticket_order, tickets_array, username);
}

function customSort(selected_option){
  selected_option = selected_option.split('checkbox_')[1]
  $.post( '/getcustomorder', { 'selected_option': selected_option } ).done(function(response) {
    var rows = response['rows'];
    //hide the checkbox window
    $('.sort_results').fadeOut();
    $('.right-box').fadeOut();
    $('.right-box').empty();
    var first_ticket = rows[0][1]
    rows.forEach(row => {
      //If ticket completed
      if ( row[4] == 'COMPLETED' ){
        $('.right-box').append(`
        <div id='ticket_row_${ row[1] }' href="${ row[1] }" onClick="selectTicket('${ row[1] }')" class="entry-row-hub-completed">
            <div id='id_section' class="entry-row-hub-section"> <span> ${ row[1] }</span></div>
            <div id='title_section' class="entry-row-hub-section"> <span> ${ row[2] }</span></div>
            <div id='date_section' class="entry-row-hub-section"> <span> ${ row[3] }</span></div>
            <div id='username_section_${ row[1] }' class="entry-row-hub-section"><span>${ row[7] }</span></div>
            <div id='status_section_${ row[1] }' class="entry-row-hub-section"><span>${ row[4] }</span></div>
        </div>
        `);
      //If ticket is in progress
      }else{
        $('.right-box').append(`
        <div id='ticket_row_${ row[1] }' href="${ row[1] }"onClick="selectTicket('${ row[1] }')"class="entry-row-hub">
            <div id='id_section' class="entry-row-hub-section"><span> ${ row[1] }</span></div>
            <div id='title_section' class="entry-row-hub-section"><span> ${ row[2] }</span></div>
            <div id='date_section' class="entry-row-hub-section"><span> ${ row[3] }</span></div>
            <div id='username_section_${ row[1] }' class="entry-row-hub-section"> <span> ${ row[7] }</span></div>
            <div id='status_section_${ row[1] }' class="entry-row-hub-section"> <span> ${ row[4] }</span></div>
        </div>
        `);
      }
      });
      $('.right-box').slideDown("slow");
      selectTicket(first_ticket);
      //send data to backend
      ticket_order = selected_option
      var username = $(`#current_user`).find("span").text();
      var sortedIDs = $( ".right-box" ).sortable( "toArray" );
      tickets_array = []
      sortedIDs.forEach(element => {
      $(`#${element}`).css('border-top','0px solid grey');
        tickets_array.push(String(element));
      });
      updateOrder(ticket_order, tickets_array, username);
    });  
}

//send the new ticket order to the backend
function updateOrder(ticket_order,ticket_order_list,username){
  tickets_array = ticket_order_list;
  console.log(`Sending ticket order to config file:${username}, ${ticket_order}`);
  $.post( '/setorder', { "tickets_array": tickets_array, "username": username, "ticket_order":ticket_order } ).done(function(response) {
    console.log(response['confirm']);
  });
}


//new sort option button
function newSortOption(username, num){
  console.log('Creating new sort option');
  // Create a new element and add class name
  var newNode = document.createElement('div');
  newNode.className = 'sort_entry';
  // Get the reference node
  var referenceNode = document.getElementsByClassName('sort_entry');
  var referenceNode = referenceNode[referenceNode.length -2 ];
  var num_of_options = getNumOfOptions()
  var custom_option_name = prompt("Please enter the new sort option name", `Sort Option ${num_of_options}`);
  if ((!custom_option_name)){
    //pass if no name given
  }else{
    //check if sort name already exists
    var sort_option_list = document.getElementsByClassName('sort_entry');
    var sort_option_list = [].slice.call(sort_option_list);
    sort_option_list.forEach(element => {
      if( custom_option_name == $(`#${element.id}`).find('label').text() ){
        exit = true
      }else{
        exit = false
      }
    });
    if(exit){
      //pass, name exists
      alert('Sort option with that name already exists');
    }else{
      console.log('name does not exist');
      // Assign new node ID
      newNode.id = `sort_option_${num_of_options}`;
      if (custom_option_name){
        newNode.innerHTML = `<input class='checkbox_filter_box' type='checkbox' id='checkbox_${custom_option_name}'> <label class='checkbox_filter_label'>
                                ${custom_option_name}</label> <i id='${custom_option_name}_trash_icon' class='fa fa-remove fa-lg'></i>`;
      // Insert the new node before the reference node
        referenceNode.after(newNode);
        $('.fa-remove').hide();
        $('.sort_entry').hover(function(){
          $(this).find('i').show();
      });
      $('.sort_entry').mouseleave(function(){
        $(this).find('i').hide();
      });
      $('.fa-remove').click(function(){
        $(this).parent().hide('fast');
        $(this).parent().remove();
        deleteSortOption(this);
      });
      }else{
        console.log('Ignoring')
      }
      //get ticket order data
      var sortedIDs = $( ".right-box" ).sortable( "toArray" );
      tickets_array = []
      sortedIDs.forEach(element => {
        $(`#${element}`).css('border-top','0px solid grey');
        tickets_array.push(String(element));
      });
      //send new order data to backend for precessing
      $.post( '/neworder', { 
        "tickets_array": tickets_array, 
        "username": username, 
        "ticket_order":custom_option_name
        } ).done(function(response) {
        console.log(response['confirm']);
      });
        uncheckAllCheckboxes()
        document.getElementById(`checkbox_${custom_option_name}`).checked = true;
      }
    }
}


//extras
function deleteSortOption(sort_option){
  sort_option = $(sort_option).attr('id').split('_trash_icon')[0];
  console.log('Deleting sort option: '+sort_option);
  $.post( '/deletesortoption', {'sort_option':sort_option}  ).done(function(response){
    //pass
    document.getElementById(`checkbox_date`).checked = true;
    $('#checkbox_date').trigger('change')
  });
  
}

function uncheckAllCheckboxes(){
  var checkboxes = document.getElementsByClassName("checkbox_filter_box");
  for (let i = 0; i < checkboxes.length; i++) {
          checkboxes[i].checked = false;
  }
}

function getNumOfOptions(){
  num = document.getElementsByClassName('sort_entry').length;
  return num
}


function organizeByYear(year, selected_ticket, ticket_order){
  console.log('Filtering by '+year);
  //clear existing month separators
  array = []
  var month_separators = $('#right-box').children('.month-separator');
  for (let i = 0; i < month_separators.length; i++) {
    array.push(month_separators[i]);
  }
  array.forEach(element => {
    element.remove();
  });
  console.log('Step 1: Existing month separator Elements removed')
  //Split tickets up by year
  var ticket_divs = document.querySelectorAll('[id^="ticket_row_"]');
  //var ticket_divs = $("#right-box > div:not(.month-separator)");
  var year_list = []
  for (let i = 0; i < ticket_divs.length; i++) {
    //get ticket date
    var unformatted_date = $(`#${ticket_divs[i].id}`).find('#date_section').find("span").text()
    split_date = unformatted_date.split('-');
    var ticket_year = split_date[0].trim()
    year_list.push(ticket_year)
  }
  //append the years into the date selector
  year_list_unique = Array.from(new Set(year_list))
  $('#year_selector').empty();
  for (let i = 0; i < year_list_unique.length; i++) {
    $('#year_selector').append(`<option value='${year_list_unique[i]}'>${year_list_unique[i]}</option>`)
  }
  //hide tickets from year variable passed to the function
  filter_by_year = year
  for (let i = 0; i < ticket_divs.length; i++) {
    //get ticket date
    var unformatted_date = $(`#${ticket_divs[i].id}`).find('#date_section').find("span").text()
    split_date = unformatted_date.split('-');
    var ticket_year = split_date[0].trim()
    var ticket_category = $(`#status_section_${ticket_divs[i].id.split("_")[2]}`).find("span").text() //get ticket status
    if (ticket_year == filter_by_year){
      /*
      Instead of just hiding the divs we are applying a hidden css class instead. 
      using .hide and .show causes a crazy performance hog when trying to drag items around with other items hidden in the same div
      This is a good alternative that doesnt cause lag.
      */
      if(ticket_category.trim() == "IN PROGRESS"){
        $(`#${ticket_divs[i].id}`).removeClass("hidden");
        $(`#${ticket_divs[i].id}`).addClass("entry-row-hub");
      }else if((ticket_category.trim() == "COMPLETED")){
        $(`#${ticket_divs[i].id}`).removeClass("hidden");
        $(`#${ticket_divs[i].id}`).addClass("entry-row-hub-completed");
      }else{
        console.log("exception when showing ticket " + ticket_divs[i].id.split("_")[2]);
      }
    }else{
      if(ticket_category.trim() == "IN PROGRESS"){
        $(`#${ticket_divs[i].id}`).removeClass("entry-row-hub");
        $(`#${ticket_divs[i].id}`).addClass("hidden");
      }else if((ticket_category.trim() == "COMPLETED")){
        $(`#${ticket_divs[i].id}`).removeClass("entry-row-hub-completed");
        $(`#${ticket_divs[i].id}`).addClass("hidden");
      }else{
        console.log("exception when hiding ticket " + ticket_divs[i].id.split("_")[2]);
      }
      //$(`#${ticket_divs[i].id}`).hide();
      //$(`#${ticket_divs[i].id}`).css({"width":"0px !important","overflow":"hidden","visibility":"hidden","display":"block !important"});
    }
  }
  //change selection
  //latest_ticket = $("#right-box").find('div:visible:first').not('.month-separator').attr('href')
  latest_ticket = $("#right-box").find('.entry-row-hub, .entry-row-hub-completed').eq(0).attr('href');
  $('#year_selector').val(year);
  //check year of the selected ticket, if not matching the filtered year then select first ticket in the list
  var selected_ticket_date = $(`#ticket_row_${selected_ticket}`).find('#date_section').find("span").text()
  var selected_ticket_date = selected_ticket_date.split('-');
  var selected_ticket_year = selected_ticket_date[0].trim()
  if (selected_ticket_year != filter_by_year){
    console.log("Selecting first ticket for new year: "+latest_ticket);
    selectTicket(latest_ticket);
  }else{
    console.log("Select previously selected ticket since year did not change: "+selected_ticket);
    selectTicket(selected_ticket);
  }
  console.log('Step 2: Sorting by month')
  if (ticket_order == 'date'){
    organizeByMonth()
  }
}


function organizeByMonth(){
  //Organize tickets by month and add separators
  var ticket_divs = $("#right-box").children("div:visible").not('.month-separator');
  var month_table = {
                      'January':[],'February':[],'March':[], 'April':[], 'May':[], 'June':[],
                      'July':[], 'August':[], 'September':[],'October':[], 'November':[], 'December':[]
                    };
  for (let i = 0; i < ticket_divs.length; i++) {
    //get ticket date
    var unformatted_date = $(`#${ticket_divs[i].id}`).find('#date_section').find("span").text()
    split_date = unformatted_date.split('-');
    var ticket_month = split_date[1]
    switch (ticket_month){
      case '01':
        month_table['January'].push(ticket_divs[i])
        break;
      case '02':
        month_table['February'].push(ticket_divs[i])
        break;
      case '03':
        month_table['March'].push(ticket_divs[i])
        break;
      case '04':
        month_table['April'].push(ticket_divs[i])
        break;
      case '05':
        month_table['May'].push(ticket_divs[i])
        break;
      case '06':
        month_table['June'].push(ticket_divs[i])
        break;
      case '07':
        month_table['July'].push(ticket_divs[i])
        break;
      case '08':
        month_table['August'].push(ticket_divs[i])
        break;
      case '09':
        month_table['September'].push(ticket_divs[i])
        break;
      case '10':
        month_table['October'].push(ticket_divs[i])
        break;
      case '11':
        month_table['November'].push(ticket_divs[i])
        break;
      case '12':
        month_table['December'].push(ticket_divs[i])
        break;
    }
  }
  console.log('Step 3: Organized by month')
  //create separators
  for (month in month_table) {
    if (month_table[month].length > 0){
      last_for_month = month_table[month][0]
      var month_separator = document.createElement("div");
      month_separator.classList.add("month-separator");
      month_separator.innerHTML = `<span>${month.toUpperCase()}</span>`;
      last_for_month.before(month_separator)
    }
  }
  console.log('Step 4: Done, added separators')
}