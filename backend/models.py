from datetime import datetime

from flask import url_for
from flask_login import UserMixin, AnonymousUserMixin
from backend import db, app
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from werkzeug.security import generate_password_hash, check_password_hash
from time import time
import json

from math import sqrt


# class Permission:
#     VIEW_BASIC_INFO_AND_POSTS = 0x1
#     EDIT_INFO_AND_ADD_POSTS = 0x2
#     SEARCH_FOR_MEMBERS = 0x4
#     VIEW_TRAVELS_ON_THE_MAP = 0x8


class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    timestamp = db.Column(db.Float, index=True, default=time)
    payload_json = db.Column(db.Text)

    def get_data(self):
        return json.loads(str(self.payload_json))

class Follow(db.Model):
    __tablename__ = "follows"
    follower_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    followed_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)

    def __repr__(self):
        return "Follow('{}' follows '{}'')".format(self.follower_id, self.followed_id)


class Subscribe(db.Model):
    __tablename__ = "subscriptions"
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), primary_key=True)

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
    subscribers = db.relationship('Subscribe',foreign_keys=[Subscribe.post_id],
                    backref=db.backref('post', lazy='joined'),
                    lazy='dynamic',cascade='all, delete-orphan')

    def __repr__(self):
        return "Travel('post no: {}: '{}' by {}')".format(self.id, self.title, self.user_id)

    def is_close(self,user_latitude:float,user_longitude:float, start_date:datetime,end_date:datetime,radius:float):
        distance = sqrt((user_latitude-self.latitude)**2 - (user_longitude-self.longitude)**2)
        if distance > radius:
            return False
        return start_date == self.start_date and end_date == self.end_date


class User(db.Model, UserMixin):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    first_name = db.Column(db.String(20), nullable=False)
    last_name = db.Column(db.String(20), nullable=False)
    birth_date = db.Column(db.Date())
    email = db.Column(db.String(120), unique=True, nullable=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    hashed_password = db.Column(db.String(128), nullable=False)
    image_file = db.Column(db.String(20), nullable=False, default='default.jpg')
    posts = db.relationship('Post', foreign_keys=[Post.user_id],
                            backref=db.backref('owner', lazy='joined'),
                            lazy='dynamic', cascade='all, delete-orphan')
    followed = db.relationship('Follow', foreign_keys=[Follow.follower_id],
                               backref=db.backref('follower', lazy='joined'),
                               lazy='dynamic', cascade='all, delete-orphan')
    followers = db.relationship('Follow',foreign_keys=[Follow.followed_id],
                                backref=db.backref('followed', lazy='joined'),
                                lazy='dynamic', cascade='all, delete-orphan')
    subscriptions = db.relationship('Subscribe',foreign_keys=[Subscribe.user_id],
                                    backref=db.backref('subscriber',lazy='joined'),
                                    lazy='dynamic',cascade='all, delete-orphan')
    notifications = db.relationship('Notification',foreign_keys=[Notification.user_id],
                                    backref=db.backref('user'), lazy = 'dynamic',
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

    def get_post_feed_posts(self):
        result_list = self.posts
        for followed in self.followed:
            result_list+=followed.posts
        return result_list

    def subscribe_to_post(self,post:Post):
        if not self.is_subscribed(post):
            sub = Subscribe(subscriber=self,post=post)
            db.session.add(sub)

    def un_subscribe_from_post(self, post: Post):
        sub = self.subscriptions.filter_by(subscriber=self,post=post).first()

        if sub:
            db.session.delete(sub)

    def generate_auth_token(self, expiration = 600):
        s = Serializer(app.config['SECRET_KEY'],expires_in = expiration)
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
    def password(self,password):
        self.hashed_password = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.hashed_password, password)

    def num_of_new_notifications(self):
        last_read_time = self.last_notification_read_time or datetime(1900, 1, 1)
        return self.notifications.filter_by(recipient=self).\
            filter(Notification.timestamp > last_read_time).count()

    def add_notification(self, name, data):
        self.notifications.filter_by(name=name).delete()
        notification = Notification(name=name,payload_json=json.dumps(data),user=self)
        db.session.add(notification)
        return notification

    def to_json(self):
        image_file = url_for('static', filename='profile_pics/' + self.image_file)

        json_user = {
            'url': url_for('get_user',user_id=self.id, _external=True),
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'last_seen': self.last_seen,
            'image_file': image_file
        }

        if self.birth_date is not None:
            json_user['birth_date']=self.birth_date

        return json_user

    # def can(self,permissionRequired,onUser:str=None):
    #     selfPermission = 0x01


class AnonymousUser(AnonymousUserMixin):
    def can(self, permissionsRequired):
        return False


# if __name__ == "__main__":
#     db.drop_all()
#     db.session.commit()
#     db.create_all()
#
#     User1 = User(username="user1",first_name="fname1",last_name="lname1",gender="m",email="user1@gmail.com",
#                  hashed_password="%898f")
#     User2 = User(username="user2",first_name="fname2",last_name="lname2",gender="f",email="user2@gmail.com",
#                  hashed_password="564*&")
#     User3 = User(username="user3",first_name="fname3",last_name="lname3",gender="m",email="user3@gmail.com",
#                  hashed_password="%f8r8f")
#
#     Post1=Post(title="Post1",owner=User2,start_date=datetime(2019,12,30),end_date=datetime(2020,1,12),country="UK",
#                city="London",latitude=12.5,longitude=24.5,content="Almost two weeks in London")
#     Post2=Post(title="Post2",owner=User2,start_date=datetime(2020,1,5),end_date=datetime(2020,1,12),country="USA",
#                city="NYC",latitude=24.5,longitude=12.5,content="Some days in NYC")
#     Post3=Post(title="Post3",owner=User3,start_date=datetime(2019,12,30),end_date=datetime(2020,1,12),country="Israel",
#                city="TLV",latitude=23.5,longitude=22.5,content="TLV!")
#
#     fol1 = Follow(follower=User1, followed=User2)
#     fol2 = Follow(follower=User2, followed=User3)
#     fol3 = Follow(follower=User2, followed=User1)
#
#     sub1 = Subscribe(post=Post1, subscriber=User1)
#     sub2 = Subscribe(post=Post1, subscriber=User2)
#     sub3 = Subscribe(post=Post2, subscriber=User2)
#
#     db.session.add_all([User1,User2,User3,Post1,Post2,Post3,fol1,fol2,fol3,sub1,sub2,sub3])
#     db.session.commit()