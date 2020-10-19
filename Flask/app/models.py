from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from app import login

class Users(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    workstation = db.Column(db.String(64))
    sync = db.Column(db.String(64))
    lastsyncdate = db.Column(db.String(64))
    password_hash = db.Column(db.String(128))
    email = db.Column(db.String(64))
    status = db.Column(db.String())
    notifications = db.Column(db.String(64))
    name = db.Column(db.String(64))

    def __repr__(self):
        return f'{self.username}'
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Chains(db.Model):
    id = db.Column(db.Integer, unique=True, primary_key=True)
    ticket = db.Column(db.String(64))
    title = db.Column(db.String(64))
    date_submitted = db.Column(db.String(64))
    body = db.Column(db.String())

class Tickets(db.Model):
    id = db.Column(db.Integer, unique=True, primary_key=True)
    ticket = db.Column(db.String(64))
    title = db.Column(db.String(64))
    date_submitted = db.Column(db.String(64))
    status = db.Column(db.String())
    escalated = db.Column(db.String())
    edited = db.Column(db.String())
    workstation = db.Column(db.String())
    ttf = db.Column(db.Integer())


@login.user_loader
def load_user(id):
    return Users.query.get(int(id))
