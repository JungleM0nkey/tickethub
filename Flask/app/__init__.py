from flask import Flask
from pathlib import Path
import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

#App
flaskapp = Flask(__name__)
flaskapp.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'your-random-string-here'
flaskapp.debug = True
CWD = os.getcwd()
CWD_PARENT = str(Path(CWD).parent)

#Database
flaskapp.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(f'{CWD_PARENT}\\db\\db.sqlite')
flaskapp.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(flaskapp)
migrate = Migrate(flaskapp, db)

#CSV Export
flaskapp.config['CSV_FOLDER'] = os.path.join(f'{CWD_PARENT}\\csv')

#O365 / Azure
AZR_ID = os.environ.get('AZR_ID')
AZR_PW = os.environ.get('AZR_PW')
AZR_CRED = (AZR_ID, AZR_PW)
AZR_SCOPES = ['https://graph.microsoft.com/Mail.Read','https://graph.microsoft.com/User.Read','https://graph.microsoft.com/Mail.ReadWrite', 'https://graph.microsoft.com/Mail.Send','https://graph.microsoft.com/offline_access','https://graph.microsoft.com/User.ReadBasic.All']
AZR_STATE = None

#User
login = LoginManager(flaskapp)
login.login_view = 'index'

from app import routes, models