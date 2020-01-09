from datetime import datetime

from flask import request, jsonify, url_for, g
from flask_login import logout_user, current_user, login_user
from flask_restful import abort

from backend import app, db, auth, models, utils, permissions


@app.route('/api/token', methods=['GET'])
@auth.login_required
def get_auth_token():
    token = g.user.generate_auth_token()
    return jsonify({'token': token.decode('ascii')}), 200


@app.route('/api/users/<int:user_id>', methods=['GET'])
@auth.login_required
def get_user(user_id):
    user = models.User.query.get(user_id)
    if not user:
        abort(404)
    return user.to_json(), 201


@app.route("/api/users/<string:name>", methods=['GET'])
@auth.login_required
def get_user_id(name):
    user = models.User.query.filter_by(username=name).first()
    if not user:
        abort(404)
    return jsonify({'id': user.id}), 201, {'Location': url_for('get_user', user_id=user.id, _external=True)}


@app.route('/register', methods=['POST'])
def register_user():
    if current_user.is_authenticated:
        abort(400, message= 'Already Logged In')
    data = request.get_json()

    if not data or 'email' not in data or 'password' not in data\
            or 'first_name' not in data or 'last_name' not in data\
            or 'username' not in data or 'birth_date' not in data or 'gender' not in data:
        abort(400, message="Bad Json")

    if len(data['email']) > 120 or len(data['first_name']) > 20 or len(data['last_name']) > 20 or\
            len(data['username']) > 20 or not utils.is_email_valid(data['email']) or not utils.is_date_valid(data['birth_date']):
        abort(400, message="Bad Json")

    if models.User.query.filter_by(email=data['email']).first() is not None:
        abort(409, message="Email Taken")

    if models.User.query.filter_by(username=data['username']).first() is not None:
        abort(409, message='Username Taken')

    # noinspection PyArgumentList
    user = models.User(username=data['username'], first_name=data['first_name'],
                       last_name=data['last_name'], password=data['password'],
                       email=data['email'],birth_date=datetime.strptime(data['birth_date'], '%Y-%m-%d'),
                       gender=data['gender'])
    if 'image_file' in data:
        user.image_file = data['image_file']
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Created', 'username': user.username}), 201, {'Location': url_for('get_user', user_id=user.id,
                                                                                                _external=True)}


@app.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        abort(404)
    user_data = request.get_json()
    if not user_data or 'password' not in user_data or 'email' not in user_data:
        abort(400, message="Bad Json")
    if len(user_data['email']) > 120 or not utils.is_email_valid(user_data['email']):
        abort(400, message="Bad Email")
    user = models.User.query.filter_by(email=user_data['email']).first()
    if user and user.verify_password(user_data['password']):
        login_user(user, remember=True)
        access_token = user.generate_auth_token()
        return access_token, 200
    else:
        abort(400, message="Illegal User")


@app.route("/logout", methods=['GET'])
@auth.login_required
def logout():
    logout_user()
    return 'Logged Out', 201


@app.route('/api/posts/get/<int:post_id>', methods=['GET'])
@auth.login_required
@permissions.same_as_or_follows
def get_post(post_id):
    post = models.Post.query.get(post_id)
    return post.to_json(), 200


@app.route("/api/posts/get_all/<int:user_id>", methods=['GET'])
@auth.login_required
@permissions.same_as_or_follows
def get_all_posts(user_id):
    user = models.User.query.get(user_id)
    return user.get_posts(), 200


@app.route("/api/posts/new", methods=['POST'])
@auth.login_required
def add_post():
    data = request.get_json()

    if not data or 'title' not in data or 'start_date' not in data or \
        'end_date' not in data or 'country' not in data or 'city' not in data or\
            'latitude' not in data or 'longitude' not in data or 'content' not in data:
        abort(400, message="Bad Json")


    if not utils.is_date_valid(data['start_date']) or not utils.is_date_valid(data['end_date']):
        abort(400, message="Bad Dates")


    new_post = models.Post(title=data['title'], user_id=current_user.id, start_date=datetime.strptime(data['start_date'], '%Y-%m-%d'),
                           end_date=datetime.strptime(data['end_date'], '%Y-%m-%d'), country=data['country'], city=data['city'],
                           latitude=data['latitude'], longitude=data['longitude'], content=data['content'])
    db.session.add(new_post)
    db.session.commit()
    return jsonify({'status': 'success', 'post_id': new_post.id}), 201, {'Location': url_for('get_post', post_id=new_post.id, _external=True)}


@app.route("/api/posts/update/<int:post_id>", methods=['PUT'])
@auth.login_required
@permissions.same_as_or_follows
def update_post(post_id):
    data = request.get_json()

    if not data or 'title' not in data or 'start_date' not in data or \
        'end_date' not in data or 'country' not in data or 'city' not in data or\
            'latitude' not in data or 'longitude' not in data or 'content' not in data:
        abort(400, message="bad_json")


    if not utils.is_date_valid(data['start_date']) or not utils.is_date_valid(data['end_date']):
        abort(400, message="Bad Dates")


    old_post = models.Post.query.get(post_id)

    if old_post is not None:
        old_post.title = data['title']
        old_post.timestamp = datetime.utcnow()
        old_post.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
        old_post.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')
        old_post.country = data['country']
        old_post.city = data['city']
        old_post.latitude = data['latitude']
        old_post.longitude = data['longitude']
        old_post.content = data['content']

        db.session.commit()

        return jsonify({'message': 'success', 'post_id': old_post.id}), 200, {'Location': url_for('get_post', post_id=old_post.id, _external=True)}
    else:
        add_post()


@app.route('/api/followers/get_all/<int:user_id>', methods=['GET'])
@auth.login_required
@permissions.same_as_or_follows
def get_followers(user_id):
    user = models.User.query.get(user_id)
    return user.get_followers(), 200

@app.route('/api/followed/get_all/<int:user_id>', methods=['GET'])
@auth.login_required
@permissions.same_as_or_follows
def get_followed(user_id):
    user = models.User.query.get(user_id)
    return user.get_followed(), 200