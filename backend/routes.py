from datetime import datetime

from flask import request, jsonify, url_for, g
from flask_login import logout_user, current_user, login_user
from flask_restful import abort

from backend import app, db, auth
from backend.models import User


@app.route('/api/token', methods=['GET'])
@auth.login_required
def get_auth_token():
    token = g.user.generate_auth_token()
    return jsonify({'token': token.decode('ascii')})


@app.route('/api/users/<int:user_id>', methods=['GET'])
@auth.login_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        abort(404)
    return user.to_json(), 201


# @app.route('api/posts/<int:post_id>', methods=['GET'])
# @auth.login_required
# def get_post(post_id):
#     post = Post.query.get(post_id)
#     if not post:
#         abort(404)
#     return post.to_json(), 201


# @app.route('api/posts/', methods=['GET'])
# @auth.login_required
# def get_posts():
#     post = Post.query.get()
#     if not post:
#         abort(404)
#     return post.to_json(), 201


@app.route("/api/users/<string:name>", methods=['GET'])
@auth.login_required
def get_user_id(name):
    user = User.query.filter_by(username=name).first()
    if not user:
        abort(404)
    return jsonify({'id': user.id}), 201, {'Location': url_for('get_user', user_id=user.id, _external=True)}


@app.route('/register', methods=['POST'])
def register_user():
    if current_user.is_authenticated:
        abort(400)
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data\
            or 'first_name' not in data or 'last_name' not in data or 'username' not in data:
        abort(400)

    if User.query.filter_by(email=data['email']).first() is not None:
        return 'Email Taken', 409

    if User.query.filter_by(username=data['username']).first() is not None:
        return 'Username Taken', 409

    # noinspection PyArgumentList
    user = User(username=data['username'], first_name=data['first_name'],
                last_name=data['last_name'], password=data['password'],
                email=data['email'])
    if 'image_file' in data:
        user.image_file = data['image_file']
    if 'birth_date' in data:
        user.birth_date = datetime.strptime(data['birth_date'], '%Y-%m-%d')
    db.session.add(user)
    db.session.commit()
    return jsonify({'status': 'created', 'username': user.username}), 201, {'Location': url_for('get_user', user_id=user.id,
                                                                                                _external=True)}


@app.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        abort(404)
    user_data = request.get_json()
    if not user_data or 'password' not in user_data or 'email' not in user_data:
        abort(400)
    user = User.query.filter_by(email=user_data['email']).first()
    if user and user.verify_password(user_data['password']):
        login_user(user, remember=True)
        access_token = user.generate_auth_token()
        return access_token, 200
    else:
        abort(400)


@app.route("/logout", methods=['GET'])
@auth.login_required
def logout():
    logout_user()
    return 'Logged Out', 201
