from datetime import datetime
from flask import url_for
from flask_login import UserMixin, AnonymousUserMixin
from backend import db, app
from itsdangerous import (
    TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from werkzeug.security import generate_password_hash, check_password_hash
import json

from math import sqrt


class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    payload_json = db.Column(db.Text, nullable=False)

    def get_data(self):
        return json.loads(str(self.payload_json))

    def get_name(self):
        return self.name

    def get_is_read(self):
        return self.is_read

    def get_notified_user(self):
        return self.user

    def to_json(self):

        json_notif = {
            'user': {
                'id': self.user_id,
                'url': url_for('get_user', user_id=self.user_id, _external=True)
            },
            'is_read': self.is_read,
            'name': self.name,
            'data': self.get_data()
        }

        return json_notif

    def __repr__(self):
        return "Notification to: {} , data: {}, is_read: {}".format(self.user_id, self.payload_json, self.is_read)


class Follow(db.Model):
    __tablename__ = "follows"
    follower_id = db.Column(
        db.Integer, db.ForeignKey('users.id'), primary_key=True)
    followed_id = db.Column(
        db.Integer, db.ForeignKey('users.id'), primary_key=True)

    def __repr__(self):
        return "Follow('{}' follows '{}'')".format(self.follower_id, self.followed_id)


class Subscribe(db.Model):
    __tablename__ = "subscriptions"
    user_id = db.Column(db.Integer, db.ForeignKey(
        'users.id'), primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey(
        'posts.id'), primary_key=True)

    def __repr__(self):
        return "Subscription('user {} subscribes post {}')".format(self.user_id, self.post_id)


class Post(db.Model):
    __tablename__ = "posts"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    country = db.Column(db.Text, nullable=False)
    city = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    content = db.Column(db.Text, nullable=False)
    subscribers = db.relationship('Subscribe', foreign_keys=[Subscribe.post_id],
                                  backref=db.backref('post', lazy='joined'),
                                  lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return "Travel('post no: {}: '{}' by {}')".format(self.id, self.title, self.user_id)

    def to_json(self):
        json_post = {
            'url': url_for('get_post', post_id=self.id, _external=True),
            'title': self.title,
            'owner': {
                'id': self.user_id,
                'username': self.owner.username,
                'url': url_for('get_user', user_id=self.user_id, _external=True)
            },
            'last_edit_time': self.timestamp,
            'dates': {
                'start_date': self.start_date,
                'end_date': self.end_date,
            },
            'location': {
                'country': self.country,
                'city': self.city,
                'waypoint': {
                    'longitude': self.longitude,
                    'latitude': self.latitude,
                }
            },
            'content': self.content,
        }

        return json_post


class User(db.Model, UserMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    first_name = db.Column(db.String(20), nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    last_name = db.Column(db.String(20), nullable=False)
    birth_date = db.Column(db.Date())
    email = db.Column(db.String(120), unique=True, nullable=False)
    hashed_password = db.Column(db.String(128), nullable=False)
    image_file = db.Column(db.String(120), nullable=False,
                           default='default.jpg')
    posts = db.relationship('Post', foreign_keys=[Post.user_id],
                            backref=db.backref('owner', lazy='joined'),
                            lazy='dynamic', cascade='all, delete-orphan')
    followed = db.relationship('Follow', foreign_keys=[Follow.follower_id],
                               backref=db.backref('follower', lazy='joined'),
                               lazy='dynamic', cascade='all, delete-orphan')
    followers = db.relationship('Follow', foreign_keys=[Follow.followed_id],
                                backref=db.backref('followed', lazy='joined'),
                                lazy='dynamic', cascade='all, delete-orphan')
    subscriptions = db.relationship('Subscribe', foreign_keys=[Subscribe.user_id],
                                    backref=db.backref(
                                        'subscriber', lazy='joined'),
                                    lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', foreign_keys=[Notification.user_id],
                                    backref=db.backref('user'), lazy='dynamic',
                                    cascade='all, delete-orphan')

    def __repr__(self):
        return "User('{}', '{}', '{}')".format(self.username, self.email, self.image_file)

    def follow(self, user):
        if not self.is_following(user):
            f = Follow(follower=self, followed=user)
            db.session.add(f)

    def unfollow(self, user):
        f = self.followed.filter_by(followed_id=user.id).first()
        if f:
            db.session.delete(f)

    def is_following(self, user):
        if user.id is None:
            return False

        return self.followed.filter_by(followed_id=user.id).first() is not None

    def is_followed_by(self, user):
        if user.id is None:
            return False

        return self.followers.filter_by(follower_id=user.id).first() is not None

    def subscribe_to_post(self, post: Post):
        if not self.is_subscribed(post):
            sub = Subscribe(subscriber=self, post=post)
            db.session.add(sub)

    def is_subscribed(self, post: Post):
        if post.id is None:
            return False

        return self.subscriptions.query.filter_by(subscriber=self, post=post).first() is not None

    def unsubscribe_from_post(self, post: Post):
        if self.is_subscribed(post):
            sub = self.subscriptions.filter_by(
                subscriber=self, post=post).first()
            db.session.delete(sub)

    def generate_auth_token(self, expiration=600):
        s = Serializer(app.config['SECRET_KEY'], expires_in=expiration)
        return s.dumps({'id': self.id})

    @staticmethod
    def verify_auth_token(token):
        s = Serializer(app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None
        except BadSignature:
            return None
        user = User.query.get(data['id'])
        return user

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.hashed_password = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.hashed_password, password)

    def add_notification(self, name, data):
        self.notifications.filter_by(name=name).delete()
        notification = Notification(
            name=name, payload_json=json.dumps(data), user=self)
        db.session.add(notification)
        return notification

    def get_new_notifications(self):
        new_notifs = self.notifications.filter(
            Notification.is_read == False).all()

        return json.dumps([notif.to_json() for notif in new_notifs])

    def num_of_new_notifications(self):
        return self.notifications.filter(Notification.is_read == False).count()

    def num_of_followers(self):
        return self.followers.count()

    def num_of_followed(self):
        return self.followed.count()

    def get_followers(self):
        return [folRel.follower for folRel in self.followers]

    def get_followed(self):
        return [folRel.followed for folRel in self.followed]

    def get_posts(self):
        posts = self.posts.all()
        return {post.id: post.to_json() for post in posts}

    def to_json(self):

        json_user = {
            'url': url_for('get_user', user_id=self.id, _external=True),
            'names': {
                'username': self.username,
                'first_name': self.first_name,
                'last_name': self.last_name
            },
            'gender': self.gender,
            'email': self.email,
            'image_file': url_for('static', filename='profile_pics/' + self.image_file),
            'posts': url_for('get_all_posts', user_id=self.id, _external=True),
            'followers': url_for('get_followers', user_id=self.id, _external=True),
            'followed': url_for('get_followed', user_id=self.id, _external=True),
        }

        if self.birth_date is not None:
            json_user['birth_date'] = self.birth_date

        return json_user


class AnonymousUser(AnonymousUserMixin):
    pass
