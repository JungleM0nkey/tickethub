from flask import render_template
from app import flaskapp, db, CWD, AZR_ID, AZR_PW, AZR_CRED, AZR_SCOPES, AZR_STATE
from app.forms import LoginForm, SearchForm
from flask import render_template, flash, redirect, url_for, request, jsonify, make_response, send_from_directory, send_file, abort, request
from flask_login import current_user, login_user, logout_user, login_required
from app.models import Users, Tickets, Chains
import glob, os
import sqlite3
import datetime
from werkzeug.urls import url_parse
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date
import json
from werkzeug.utils import secure_filename
from pathlib import Path
from sqlalchemy import or_, and_, __dict__
import pandas as pd

today = date.today()
#o365 setup
app_dir = str(Path(CWD).parent)
token_dir = f'{app_dir}\\tokens'

def init_db():
    db_file = f'{app_dir}\\db\\db.sqlite'
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    return conn,c

@flaskapp.route("/", methods=['GET', 'POST'])
@flaskapp.route("/index", methods=['GET', 'POST'])
def index():
    if current_user.is_authenticated:
        if str(current_user) == 'it':
            return redirect(url_for('tickethub', user=current_user))
        else:
            return redirect(url_for('home', user=current_user))
    form = LoginForm()
    if form.validate_on_submit():
        site_form_usr = form.username.data
        site_form_pwd = form.password.data
        user = Users.query.filter_by(username=site_form_usr).first()
        if user is None or not user.check_password(site_form_pwd):
            flash('Invalid username or password')
            return redirect(url_for('index'))
        login_user(user, remember=form.remember_me.data)
        #forward user to their intended page
        next_page = request.args.get('next')
        print(f'Logging in {form.username.data}')
        #check if the home user data folder has been created and make files if its not
        if (os.path.isdir(f"{app_dir}\\data\\{form.username.data}")):
            print('Dir exists')
        else:
            os.mkdir(f"{app_dir}\\data\\{form.username.data}")
            f = open(f"{app_dir}\\data\\{form.username.data}\\config.json","w+")
            f.close()
            f = open(f"{app_dir}\\data\\{form.username.data}\\orders.json","w+")
            f.close()
            with open(f"{app_dir}\\data\\{form.username.data}\\config.json", mode='w', encoding='utf-8') as f:
                #grabs existing tickets if the user data folder is being rebuilt due to some error (should normaly never happen)
                existing_tickets = [ x.ticket for x in Tickets.query.filter_by(workstation=form.username.data).all() ]
                existing_tickets.reverse()
                json.dump({"ticket_order": "date", "ticket_order_list": existing_tickets}, f)
            with open(f"{app_dir}\\data\\{form.username.data}\\orders.json", mode='w', encoding='utf-8') as f:
                json.dump({}, f)
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('index.html', title='Sign In', form=form)

@flaskapp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

global cst,selected_ticket
cst = ''
selected_ticket = ''
@flaskapp.route("/home", methods=['GET', 'POST'])
@login_required
def home():
    global selected_ticket, cst
    selected_ticket_message = ''
    new_status = ''
    #Database connection
    workstation = str(current_user)
    rows = [ (t.id, t.ticket, t.title, t.date_submitted, t.status, t.escalated, t.edited, t.workstation, t.ttf) for t in Tickets.query.filter_by(workstation=workstation).all() ]
    #rows.reverse()
    #try:
    #read config json and get the current ticket order
    with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as read_file:
        config_file = json.load(read_file)
        ticket_order_list = config_file['ticket_order_list']
        ticket_order = config_file['ticket_order']
        print(f'\nSorting tickets by: {ticket_order}')
    #sort the queries rows by the saved ticket order
    rows.sort(key=lambda x: ticket_order_list.index(x[1]))
    #read order json and get all the saved ticket orders
    with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as read_file:
        orders_file = json.load(read_file)
        custom_orders_list = [ x.strip() for x in orders_file ]
    #sort the rows via the order list
    if request.method == 'POST':
        #Edit the ticket body or title request
        if request.form.get('editing_ticket'):
            ticket_number = request.form['editing_ticket']
            ticket_message_num = request.form['ticket_message_num']
            print(f'Editing ticket {ticket_number}, ticket number: {ticket_message_num}')
            editing=True
            try:
                ticket_title = Tickets.query.filter_by(ticket=ticket_number).first().title
                ticket_body = Chains.query.filter(Chains.ticket == ticket_number, Chains.title == ticket_message_num).first().body
                ticket_body = ticket_body.strip()
            except:
                pass
            return render_template('newticket.html', ticket_number=ticket_number,ticket_title=ticket_title,ticket_body=ticket_body,editing=editing)
        #Update Ticket Status request
        if request.form.get('status_change'):
            new_status = request.form['status_change']
            ticket_number = request.form['ticket_number']
            #completed_date = request.form['completed_date']
            print(f'Changing status to: {new_status}')
            Tickets.query.filter_by(ticket=ticket_number).update({'status': new_status})
            db.session.commit()
    #which ticket to select, if page is being redirected to select the one specified, otherwise just select the first one
    if selected_ticket:
        #check that the selected ticket is from the correct user, if its not then reselect the first ticket again
        ticket_row = Tickets.query.filter(Tickets.workstation == workstation, Tickets.ticket == selected_ticket).first()
        if ticket_row:
            pass
        else:
            selected_ticket = rows[0][1]
    else:
        try:
            selected_ticket = rows[0][1]
        #If user was just created and has no tickets to select, this will create a new example ticket for the user
        except IndexError:
            ticket_date = str(datetime.datetime.now()).split(' ')[0]
            ticket_status = 'COMPLETED'
            chain_title = 'Ticket Message 1'
            ticket_body = 'This is an example of ticket notes, tickets created by users can be edited by clicking Edit Notes above'
            hostname = str(current_user)
            latest_ticket = [ (x.ticket,) for x in Tickets.query.all() ]
            latest_ticket = latest_ticket.split('-')[1]
            ticket_number = str(int(latest_ticket) + 1).zfill(len(latest_ticket))
            ticket_number=f'G-{ticket_number}'
            new_ticket = Tickets(ticket_number=ticket_number,title='Example Ticket Title',date_submitted=ticket_date, status=status, workstation=hostname)
            new_chain = Chains(ticket=ticket_number,title=chain_title,datE_submitted=ticket_date,body=ticket_body)
            db.session.add(new_ticket)
            db.session.add(new_chain)
            db.session.commit()
            rows = [ (t.id, t.ticket, t.title, t.date_submitted, t.status, t.escalated, t.edited, t.workstation, t.ttf) for t in Tickets.query.filter_by(workstation=workstation).all() ]
            rows.reverse()
            #Update ticket order config files for the new user
            #update the config file
            with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as read_file:
                data_file = json.load(read_file)
            data_file['ticket_order_list'].append(ticket_number)
            with open(f"{app_dir}\\data\\{current_user}\\config.json","w") as write_file:
                json.dump(data_file, write_file)
            #update the order file
            with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as read_file:
                data_file = json.load(read_file)
            #update all custom sorts with the new ticket in them in the first position
            for x in data_file:
                data_file[x].append(ticket_number)
            with open(f"{app_dir}\\data\\{current_user}\\orders.json","w") as write_file:
                json.dump(data_file, write_file)
            selected_ticket= rows[0][1]
    print(f'\nRefreshing Page, selecting ticket: {selected_ticket}')
    #query and print the ticket correspondance
    chain_rows = [ (x.title,) for x in Chains.query.filter_by(ticket=selected_ticket).all() ]
    #On First load select ticket and parse chain
    if chain_rows and selected_ticket_message == '':
        ticket_message = Chains.query.filter(Chains.ticket==selected_ticket, Chains.title==chain_rows[0][0]).first().body
        selected_ticket_message = chain_rows[0][0]
    elif chain_rows and not selected_ticket_message == '':
        ticket_message = Chains.query.filter(Chains.ticket==selected_ticket, Chains.title==chain_rows[0][0]).first().body
    elif not chain_rows:
        print('No comm chains found for ticket')
        ticket_message = None
        chain_rows = None
    #print('Selected ticket Message: ' + selected_ticket_message + " For ticket number: " + selected_ticket)
    cst = selected_ticket
    ticket_title = Tickets.query.filter_by(ticket=selected_ticket).first().title
    ticket_status = Tickets.query.filter_by(ticket=selected_ticket).first().status
    ticket_status2 = ''
    if ticket_status == 'COMPLETED':
        ticket_status2 = 'IN PROGRESS'
    elif ticket_status == 'IN PROGRESS':
        ticket_status2 = 'COMPLETED'
    status_list = [ ticket_status, ticket_status2 ]
    #Clean up the leading whitespace for the ticket body text.
    if ticket_message:
        ticket_message = ticket_message.lstrip()
    return render_template('home.html',
     title='Home',
     rows=rows,
     selected_ticket=selected_ticket, 
     chain_rows=chain_rows,
     ticket_message=ticket_message,
     ticket_title=ticket_title,
     status_list=status_list,
     selected_ticket_message=selected_ticket_message,
     ticket_order=ticket_order,
     _anchor=selected_ticket,
     custom_orders_list=custom_orders_list
     )


@flaskapp.route("/tickethub", methods=['GET','POST'])
def tickethub():
    #Database connection
    global selected_ticket
    selected_ticket_message = ''
    selected_ticket = ''
    #Fetch tickets for both users
    rows = [ (t.id, t.ticket, t.title, t.date_submitted, t.status, t.escalated, t.edited, t.workstation, t.ttf) for t in Tickets.query.all() ]
    rows.reverse()
    selected_ticket = rows[0][1]
    #POST REQUESTS FROM JQUERY
    if request.method == 'POST':
        #Fetches single ticket data for both tickethub and single users
        if request.form.get('ticket_number'):
            selected_ticket = request.form['ticket_number']
            chain_rows = [ (x.title,) for x in Chains.query.filter(Chains.ticket == selected_ticket).all() ]
            first_chain_query = Chains.query.filter(Chains.ticket == selected_ticket, Chains.title == 'Ticket Message 1').first()
            first_chain_body = str(first_chain_query.body)
            #Cleanup the text if possible
            if 'Problem Description:' in first_chain_body:
                first_chain_body = first_chain_body.split('Problem Description:')[1]
            return jsonify({'chain_rows':chain_rows, 'first_chain_body':first_chain_body.lstrip()})
        elif request.form.get('ticket_message'):
            selected_ticket_message = request.form['ticket_message']
            selected_ticket = request.form['selected_ticket_number']
            chain_query = Chains.query.filter(Chains.ticket == selected_ticket, Chains.title==selected_ticket_message).first()
            chain_body = chain_query.body
            return jsonify({'chain_body':chain_body.lstrip()})
        elif request.form.get('get_users'):
            users = [ x.username for x in Users.query.all() if x.username != 'it' ]
            for x in users:
                print(x)
            return jsonify({'users':users})
    #query and print the ticket correspondance
    chain_rows = [ (x.title,) for x in Chains.query.filter(Chains.ticket == selected_ticket).all() ]
    #On First load select ticket and parse chain
    if chain_rows and selected_ticket_message == '':
        ticket_message = Chains.query.filter(Chains.ticket == selected_ticket, Chains.title == chain_rows[0][0]).first().body
        selected_ticket_message = chain_rows[0][0]
    elif chain_rows and not selected_ticket_message == '':
        ticket_message = Chains.query.filter(Chains.ticket == selected_ticket, Chains.title == selected_ticket_message).first().body
    elif not chain_rows:
        ticket_message = None
        chain_rows = None
    print('Selected ticket Message: ' + selected_ticket_message + " For ticket number: " + selected_ticket)
    selected_workstation = Tickets.query.filter(Tickets.ticket == selected_ticket).first().workstation
    ticket_title = Tickets.query.filter(Tickets.ticket == selected_ticket).first().title
    #Clean up the leading whitespace for the ticket body text.
    if ticket_message:
        ticket_message = ticket_message.lstrip()
    return render_template('tickethub.html',
     title='Home',
     rows=rows,
     chain_rows=chain_rows,
     ticket_message=ticket_message,
     selected_ticket=selected_ticket,
     ticket_title=ticket_title,
     selected_ticket_message=selected_ticket_message,
     _anchor=selected_ticket,
     selected_workstation=selected_workstation
     )

global stored_hub_ticket
stored_hub_ticket = {}
@flaskapp.route("/ticketselection", methods=['POST'])
def ticketselection():
    global stored_hub_ticket, selected_ticket
    current_username = str(current_user) 
    try:
        print(f'\nCurrently stored ticket for {current_username}: {stored_hub_ticket[current_username]}\n')
    except KeyError:
        print('No stored ticket, creating empty entry')
        stored_hub_ticket[current_username] = ''
    if request.method == 'POST':
        #Update the global variable for the currently selected ticket
        if request.form.get('store_ticket'):
            stored_hub_ticket[current_username] = request.form['store_ticket']
            if stored_hub_ticket[current_username] == 'clear':
                print('Clearing stored variables')
                stored_hub_ticket[current_username] = ''
                selected_ticket = None
                print(f'Setting stored ticket to: {stored_hub_ticket[current_username]}')
                print(f'Setting selected ticket to: {selected_ticket}')
                return jsonify({"stored_hub_ticket":stored_hub_ticket[current_username]})
            else:
                print(f'\nStoring ticket: {stored_hub_ticket[current_username]}\n')
                return jsonify({"stored_hub_ticket":stored_hub_ticket[current_username]})
        #Get the stored ticket variable and send to template
        if request.form.get('get_stored_ticket'):
            if stored_hub_ticket[current_username]:
                print(f'\nFetching currently selected ticket {stored_hub_ticket[current_username]}\n')
                return jsonify(stored_hub_ticket=stored_hub_ticket[current_username])
            else:
                print('\nNo stored ticket found\n')
                return jsonify({'stored_ticket':False})


@flaskapp.route("/ticketmsgparse", methods=['GET','POST'])
def ticketmsgparse():
    db_file = '{app_dir}\\db\\db.sqlite'
    conn = sqlite3.connect(db_file)
    c = conn.cursor()
    if request.method == 'POST':
        print(request.form)
        if request.form['chainmsgselect']:
            selected_message = request.form['chainmsgselect']
            ticket_message = Chains.query.filter(Chains.ticket==selected_ticket, Chains.title==selected_message).first().body
            #ticket_message = ticket_message[0][773:]
            return redirect(url_for('home', ticket_message=ticket_message))


@flaskapp.route("/newticket", methods=['GET', 'POST'])
def newticket():
    tickets_query = [ (x.ticket,) for x in Tickets.query.all() ]
    latest_ticket = tickets_query[-1][0].split('-')[1]
    ticket_number = str(int(latest_ticket) + 1).zfill(len(latest_ticket))
    ticket_number=f'G-{ticket_number}'
    editing=False
    ticket_title=''
    ticket_body=''
    if request.method == 'POST':
        global selected_ticket
        if request.form.get('create_ticket'):
            hostname=''
            ticket_title = request.form['ticket_title']
            ticket_body = request.form['ticket_body']
            ticket_date = str(datetime.datetime.now()).split(' ')[0]
            ticket_status = 'IN PROGRESS'
            chain_title = 'Ticket Message 1'
            hostname = str(current_user)
            new_ticket = Tickets(ticket=ticket_number,title=ticket_title,date_submitted=ticket_date,status=ticket_status,workstation=hostname)
            new_chain = Chains(ticket=ticket_number,title=chain_title,date_submitted=ticket_date,body=ticket_body)
            db.session.add(new_ticket)
            db.session.add(new_chain)
            db.session.commit()
            #connection.commit()
            selected_ticket = ticket_number
            #update the config file
            print(hostname, ticket_number)
            with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as read_file:
                data_file = json.load(read_file)
            data_file['ticket_order_list'].insert(0, ticket_number)
            with open(f"{app_dir}\\data\\{current_user}\\config.json","w") as write_file:
                json.dump(data_file, write_file)
            #update the order file
            with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as read_file:
                data_file = json.load(read_file)
            #update all custom sorts with the new ticket in them in the first position
            for x in data_file:
                data_file[x].insert(0, ticket_number)
            with open(f"{app_dir}\\data\\{current_user}\\orders.json","w") as write_file:
                json.dump(data_file, write_file)
            return redirect(url_for('home', selected_ticket=selected_ticket))
        if request.form.get('edit_g_ticket'):
            ticket_number = request.form['currently_selected_ticket']
            editing=True
            ticket_title = Tickets.query.filter_by(ticket=ticket_number).first().title
            ticket_body = Chains.query.filter_by(ticket=ticket_number).first().body
        #this portion deals with updating ticket contents with new titles and body text
        if request.form.get('update_ticket'):
            ticket_title = request.form['ticket_title']
            ticket_body = request.form['ticket_body']
            ticket_number = request.form['currently_selected_ticket']
            #sql queries
            Tickets.query.filter_by(ticket=ticket_number).update({'title': ticket_title})
            Chains.query.filter_by(ticket=ticket_number).update({'body': ticket_body})
            db.session.commit()
            return redirect(url_for('home', selected_ticket=ticket_number))
        if request.form.get('delete_ticket'):
            ticket_number = request.form['delete_ticket']
            print(f'Deleting ticket {ticket_number}')
            #Get the next ticket to select from the config ticket order list file
            with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as read_file:
                data_file = json.load(read_file)
                ticket_order_list = data_file['ticket_order_list']
            ticket_position = ticket_order_list.index(ticket_number)
            ticket_number_to_select = ticket_order_list[ticket_position+1]
            print(f'Next ticket to select: {ticket_number_to_select}')
            #Delete the chains and the ticket itself
            Tickets.query.filter(Tickets.ticket==ticket_number).delete()
            Chains.query.filter(Chains.ticket==ticket_number).delete()
            db.session.commit()
            with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as read_file:
                data_file = json.load(read_file)
            data_file['ticket_order_list'].remove(ticket_number)
            with open(f"{app_dir}\\data\\{current_user}\\config.json","w") as write_file:
                json.dump(data_file, write_file)
            #update the order file
            with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as read_file:
                data_file = json.load(read_file)
            #update all custom sorts with the ticket removed
            for x in data_file:
                data_file[x].remove(ticket_number)
            with open(f"{app_dir}\\data\\{current_user}\\orders.json","w") as write_file:
                json.dump(data_file, write_file)
            return jsonify({'ticket_number':ticket_number_to_select})
    return render_template('newticket.html', ticket_number=ticket_number,ticket_title=ticket_title,ticket_body=ticket_body,editing=editing)

@flaskapp.route('/search', methods=['POST'])
@login_required
def search():
    search_string = request.form['myData']
    workstation = str(current_user)
    #check if the search request is from tickethub (will probably remove in the future)
    if request.form['tickethub'] == 'true':
        #c.execute(f"SELECT * FROM tickets")
        #rows =  c.fetchall()
        rows = [ (t.id, t.ticket, t.title, t.date_submitted, t.status, t.escalated, t.edited, t.workstation, t.ttf) for t in Tickets.query.all() ]
    else:
        #c.execute(f"SELECT * FROM tickets WHERE workstation = '{workstation}'")
        rows = [ (t.id, t.ticket, t.title, t.date_submitted, t.status, t.escalated, t.edited, t.workstation, t.ttf) for t in Tickets.query.filter_by(workstation=workstation).all() ]
    #Check the title
    title_row = [ x for x in rows if str(search_string) in x[2].lower() or str(search_string.upper()) in x[2] ]
    if len(title_row) <= 0:
        #Check ticket number
        title_row = [ x for x in rows if str(search_string) in x[1].lower() or str(search_string.upper()) in x[1] ]
    return jsonify({'text':render_template('search.html', title_row=title_row)})

@flaskapp.route('/usermgmt', methods=['POST','GET'])
@login_required
def usermgmt():
    #Fetch user data here
    user_data = [ (x.username, x.email, x.notifications,) for x in Users.query.all() ]
    usernames = [ x[0] for x in user_data ]
    #Fetch ticket numbers for every user
    ticket_collection = {}
    for username in usernames:
        ticket_query = [ x.ticket for x in Tickets.query.filter(Tickets.workstation == username).all() ]
        ticket_collection[username] = len(ticket_query)
    #Change user status
    if request.method == 'POST':
        username = request.form['username']
        status = request.form['status']
        if status == 'ENABLED':
            new_status = 'DISABLED'
        else:
            new_status = 'ENABLED'
        print(f'Changing user notifications for user {username} to {new_status}')
        Users.query.filter_by(username=username).update({'notifications': new_status})
        db.session.commit()
        return jsonify({'new_status':new_status})
    total_query = [ x.ticket for x in Tickets.query.all() ]
    total = len(total_query)
    return render_template('usermgmt.html', user_data=user_data, ticket_collection=ticket_collection, total=total)


@flaskapp.route('/register', methods=['POST','GET'])
@login_required
def register():
    if request.method == 'POST':
        username=request.form['username']
        email=request.form['email']
        password=request.form['password']
        password_hash = generate_password_hash(password)
        try:
            o365__tickets = request.form['mbc_checkbox']
        except:
            o365__tickets = None
        status='ENABLED'
        #Check if fields are entered correctly
        username_query = Users.query.filter_by(username=username).first()
        pwlength = len(password)
        if username_query:
            error = "Username already exists"
            return render_template('register.html', error=error)
        elif pwlength < 4:
            error = "Password less than 4 characters"
            return render_template('register.html', error=error)
        new_user = Users(username=username,password_hash=password_hash,email=email,notifications=status)
        db.session.add(new_user)
        db.session.commit()
        #start the o365 app registration if checkbox is checked off by the user
        if o365__tickets:
            callback = f"{request.url_root}register_step_two" #where to redirect to after authentication, this needs to be https
            print("Adding new user to the ticket app via O365")
            #Save authentication token in the file system
            global state, token_backend
            token_backend = FileSystemTokenBackend(token_path=token_dir, token_filename=f'token_{username}.txt')
            #Authentication with azure o365 is done here
            account = Account(AZR_CRED, token_backend=token_backend)
            url, state = account.con.get_authorization_url(requested_scopes=AZR_SCOPES, redirect_uri=callback)
            return redirect(url)
        else:
            return render_template('register.html',o365_message='User Created, did not register for O365 level tickets')
    return render_template('register.html')

@flaskapp.route('/getuserlist', methods=['POST','GET'])
@login_required
def getuserlist():
    rows = [ (x.username,) for x in Users.query.all() ] 
    return jsonify({'users': rows})

@flaskapp.route('/assignticket', methods=['POST','GET'])
@login_required
def assignticket():
    username = request.form['username']
    ticket_number = request.form['ticket_number']
    Tickets.query.filter(ticket==ticket_number).update({'workstation':username})
    db.session.commit()
    #Get the next ticket to select from the config ticket order list file
    with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as read_file:
        data_file = json.load(read_file)
        ticket_order_list = data_file['ticket_order_list']
    ticket_position = ticket_order_list.index(ticket_number)
    ticket_number_to_select = ticket_order_list[ticket_position+1]
        #update the config file
    with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as read_file:
        data_file = json.load(read_file)
    data_file['ticket_order_list'].remove(ticket_number)
    with open(f"{app_dir}\\data\\{current_user}\\config.json","w") as write_file:
        json.dump(data_file, write_file)
    #update the order file
    with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as read_file:
        data_file = json.load(read_file)
    #update all custom sorts with the ticket removed
    for x in data_file:
        data_file[x].remove(ticket_number)
    with open(f"{app_dir}\\data\\{current_user}\\orders.json","w") as write_file:
        json.dump(data_file, write_file)
    return jsonify({'ticket_number_to_select': ticket_number_to_select})

@flaskapp.route('/deleteuser', methods=['POST','GET'])
@login_required
def deleteuser():
    username = request.form['username']
    Users.query.filter_by(username=username).delete()
    Tickets.query.filter(Tickets.workstation==username).update({'workstation':'it'})
    db.session.commit()
    return jsonify({'user_deleted':'user_deleted'})

@flaskapp.route('/register_step_two')
@login_required
def register_step_two():
    global state,token_backend
    account = Account(AZR_CRED, token_backend=token_backend)
    #get saved state
    my_saved_state = state
    callback = f"{request.url_root}register_step_two"
    result = account.con.request_token(request.url,state=my_saved_state,redirect_uri=callback)
    if result:
        print('success')      
        return render_template('register.html',o365_message='User Created, Registered with O365')
    else:
        print('fail')
        return render_template('register.html',o365_message='User Created, Failed to register with O365')

#Save the order of the ticket after every ticket move
@flaskapp.route('/setorder', methods=['POST'])
@login_required
def setorder():
    #order of the tickets
    if request.method == 'POST':
        username = request.form['username']
        tickets_id_list = request.form.getlist('tickets_array[]')
        ticket_order = request.form['ticket_order']
        ticket_order_list = [ x[-8:] for x in tickets_id_list ]
        print(f'Opening file {app_dir}\\data\\{current_user}\\config.json')
        with open(f"{app_dir}\\data\\{current_user}\\config.json","w") as write_file:
            entry = {'ticket_order': ticket_order, 'ticket_order_list': ticket_order_list}
            json.dump(entry, write_file)
        return jsonify({'confirm': 'Ticket order saved in config file'})

#Get custom order from file
@flaskapp.route('/getcustomorder', methods=['POST'])
@login_required
def getcustomorder():
    print('Fetching custom order')
    if request.method == 'POST':
        selected_order_option = request.form['selected_option']
        #grab order info from json file
        with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as read_file:
            orders_file = json.load(read_file)
            ticket_order = orders_file[selected_order_option]
        #Fetch rows
        workstation = str(current_user)
        rows = [ (t.id, t.ticket, t.title, t.date_submitted, t.status, t.escalated, t.edited, t.workstation, t.ttf) for t in Tickets.query.filter_by(workstation=workstation).all() ]
        rows.reverse()
        rows.sort(key=lambda x: ticket_order.index(x[1]))
    return jsonify({'rows': rows})

#Create new custom order of tickets
@flaskapp.route('/neworder', methods=['POST'])
@login_required
def neworder():
    #order of the tickets
    if request.method == 'POST':
        tickets_id_list = request.form.getlist('tickets_array[]')
        ticket_order = request.form['ticket_order']
        ticket_order_list = [ x[-8:] for x in tickets_id_list ]
        #Get existing custom order list and load it into the variable
        with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as order_file:
            order_list = json.load(order_file)
        #add new order into the order list
        with open(f"{app_dir}\\data\\{current_user}\\orders.json","w") as write_file:    
            #entry = {ticket_order : ticket_order_list}
            order_list[ticket_order] = ticket_order_list
            json.dump(order_list, write_file)
        #update the config file and set the new custom list as the current order
        with open(f"{app_dir}\\data\\{current_user}\\config.json","w") as write_file:
            entry = {'ticket_order': ticket_order, 'ticket_order_list': ticket_order_list}
            json.dump(entry, write_file)
        return jsonify({'confirm': True})

@flaskapp.route('/deletesortoption', methods=['POST'])
@login_required
def deletesortoption():
    if request.method == 'POST':
        sort_option = request.form['sort_option']
        print(f'deleting sort option: {sort_option}')
        #edit the orders json file
        with open(f"{app_dir}\\data\\{current_user}\\orders.json","r") as order_file:
            order_list = json.load(order_file)
        del order_list[sort_option]
        with open(f"{app_dir}\\data\\{current_user}\\orders.json","w") as write_file:    
            json.dump(order_list, write_file)
        #edit the config json file if necessary
        with open(f"{app_dir}\\data\\{current_user}\\config.json","r") as config_file:
            config_file = json.load(config_file)
        if config_file['ticket_order'] == sort_option:
            config_file['ticket_order'] = 'custom'
            with open(f"{app_dir}\\data\\{current_user}\\config.json","w") as write_file:    
                json.dump(config_file, write_file)
        return sort_option

@flaskapp.route("/changepw", methods=['GET', 'POST'])
def changepw():
    error=''
    asterix=''
    if request.method == 'POST':
        #get the login credentials
        username = request.form['username']
        old_pw = request.form['oldpw']
        new_pw = request.form['newpw']
        new_pw2 = request.form['newpw2']
        #check if username is correct
        row = Users.query.filter_by(username=username).first().username
        if not row:
            error = 'Username not valid'
            print(error)
            return render_template('changepw.html', error=error)
        #check if old password is correct
        password_hash = Users.query.filter_by(username=username).first().password_hash
        result = check_password_hash(password_hash, old_pw)
        if not result:
            error = 'Old Password not valid'
            print(error)
            return render_template('changepw.html', error=error)
        #check if new password is good
        if not new_pw == new_pw2:
            error = 'New passwords do not match'
            print(error)
            return render_template('changepw.html', error=error)
        #generate new hash for new pw
        new_password_hash = generate_password_hash(new_pw)
        Users.query.filter_by(username=username).update({'password_hash':new_password_hash})
        db.session.commit()
        success='Password Updated Sucessfuly'
        return render_template('changepw.html',success=success)
    return render_template('changepw.html')


@flaskapp.route('/exportcsv', methods=['GET','POST'])
def exportcsv():
    #conn, c = init_db()
    username = str(current_user)
    csv_dir = flaskapp.config['CSV_FOLDER']
    #if username == 'it':
    #    c.execute(f"SELECT * FROM tickets")
    #else:
    #    c.execute(f"SELECT * FROM tickets WHERE workstation = '{username}'")
    #data = c.fetchall()
    #data.reverse()
    data = [ (t.id, t.ticket, t.title, t.date_submitted, t.status, t.escalated, t.edited, t.workstation, t.ttf) for t in Tickets.query.filter_by(workstation=workstation).all() ]
    data.reverse()
    ticket_numbers = [ x[1] for x in data ]
    ticket_titles = [ x[2] for x in data ]
    ticket_dates = [ x[3] for x in data ]
    ticket_states = [ x[4] for x in data ]
    ticket_usernames = [ x[7] for x in data ]
    filename = f'{username}_ticket_export.csv'
    df = pd.DataFrame(data={'Ticket Number':ticket_numbers,'Ticket Title':ticket_titles,'Date Started':ticket_dates,'Ticket States':ticket_states, 'Assigned User': ticket_usernames})
    df.to_csv(f"{csv_dir}\\{filename}", sep=',',index=False)
    return send_file(f'{csv_dir}\\{username}_ticket_export.csv',mimetype='text/csv', attachment_filename=f'{filename}', as_attachment=True)


#ERROR CODE HANDLING

@flaskapp.errorhandler(404)
def page_not_found(e):
   return render_template(f'error/404.html', error=e), 404