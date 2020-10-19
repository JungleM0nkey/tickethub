from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, SelectField
from wtforms.validators import DataRequired


def validate_staff(form, field):
    if field.data == "":
        raise ValidationError("Sorry, you did not choose a name")


class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password',validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In', id="login_button")
    forgotpw = SubmitField('Forgot Password', id="forgotpw_button")

class SearchForm(FlaskForm):
    searchentry = StringField('Searchentry')
    submit = SubmitField('Search Tickets')
