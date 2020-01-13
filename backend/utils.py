import binascii
import os
from datetime import datetime
import re

from PIL import Image
from flask import g
from flask_login import current_user
from flask_restful import abort

from backend import login_manager, app, db, models, auth
from email_validator import validate_email, EmailNotValidError


def is_email_valid(email: str):
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False


def is_date_valid(date: str):
    try:
        datetime.strptime(date, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def dates_are_ordered(date_1:str, date_2:str):
    date_1_obj = datetime.strptime(date_1, '%Y-%m-%d')
    date_2_obj = datetime.strptime(date_2, '%Y-%m-%d')

    return date_1_obj < date_2_obj

@app.before_first_request
def create_tables():
    db.create_all()
    db.session.commit()


@app.before_request
def before_request():
    if current_user.is_authenticated:
        current_user.last_seen = datetime.utcnow()
        db.session.commit()


@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(int(user_id))


@auth.verify_password
def verify_password(username_or_token, password):
    user = models.User.verify_auth_token(username_or_token)
    if not user:
        user = models.User.query.filter_by(email=username_or_token).first()
        if not user or not user.verify_password(password):
            g.user = models.AnonymousUser()
            return False
    g.user = user
    return True


def save_picture(form_picture):
    random_hex = binascii.b2a_hex(os.urandom(8))
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    picture_path = os.path.join(
        app.root_path, 'static/profile_pics', picture_fn)

    output_size = (125, 125)
    i = Image.open(form_picture)
    i.thumbnail(output_size)
    i.save(picture_path)
    return picture_fn


def date_between(start_date, end_date, start_date_arg, end_date_arg):
    start_date_arg_converted = datetime.datetime.strptime(
        start_date_arg.split('T')[0], '%Y-%m-%d').date()
    end_date_arg_converted = datetime.datetime.strptime(
        end_date_arg.split('T')[0], '%Y-%m-%d').date()

    if start_date.date() <= end_date_arg_converted:
        return end_date.date() >= start_date_arg_converted
    return False


def make_new_user_or_abort(data):
    if current_user.is_authenticated:
        abort(400, message='Already Logged In')

    if not data or 'email' not in data or 'password' not in data \
            or 'first_name' not in data or 'last_name' not in data \
            or 'username' not in data or 'birth_date' not in data or 'gender' not in data:
        abort(400, message="Bad Json")

    if len(data['email']) > 120 or len(data['first_name']) > 20 or len(data['last_name']) > 20 or \
            len(data['username']) > 20 or not is_email_valid(data['email']) or not is_date_valid(
        data['birth_date']):
        abort(400, message="Bad Json")

    if models.User.query.filter_by(email=data['email']).first() is not None:
        abort(409, message="Email Taken")

    if models.User.query.filter_by(username=data['username']).first() is not None:
        abort(409, message='Username Taken')

    # noinspection PyArgumentList
    user = models.User(username=data['username'], first_name=data['first_name'],
                       last_name=data['last_name'], password=data['password'],
                       email=data['email'], birth_date=datetime.strptime(data['birth_date'], '%Y-%m-%d'),
                       gender=data['gender'])
    if 'image_file' in data:
        user.image_file = data['image_file']

    return user

def make_new_post_or_abort(data,user=None):
    if(user is None):
        user = current_user

    if not data or 'title' not in data or 'start_date' not in data or \
            'end_date' not in data or 'country' not in data or 'city' not in data or \
            'latitude' not in data or 'longitude' not in data or 'content' not in data:
        abort(400, message="Bad Json")

    if not is_date_valid(data['start_date']) or \
       not is_date_valid(data['end_date']) or \
       not dates_are_ordered(data['start_date'],data['end_date']):
        abort(400, message="Bad Dates")

    new_post = models.Post(title=data['title'], user_id=user.id,
                           start_date=datetime.strptime(data['start_date'], '%Y-%m-%d'),
                           end_date=datetime.strptime(data['end_date'], '%Y-%m-%d'), country=data['country'],
                           city=data['city'],
                           latitude=data['latitude'], longitude=data['longitude'], content=data['content'])

    return new_post