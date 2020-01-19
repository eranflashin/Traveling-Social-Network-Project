from datetime import datetime
from geopy import distance

from flask import request, jsonify, url_for, g
from flask_login import logout_user, current_user, login_user
from flask_restful import abort

from backend import app, db, auth, models, utils, permissions


@app.route('/api/token', methods=['GET'])
@auth.login_required
def get_auth_token():
    token = g.user.generate_auth_token()
    return jsonify({'token': token.decode('ascii')}), 200


@app.route('/api/user_by_id/<int:user_id>', methods=['GET'])
@auth.login_required
def get_user_name(user_id):
    user = models.User.query.get(user_id)
    if not user:
        abort(404)
    return jsonify({'username': user.username}), 201


@app.route("/api/user_by_name/<string:name>", methods=['GET'])
@auth.login_required
def get_user_id(name):
    user = models.User.query.filter_by(username=name).first()
    if not user:
        abort(404)
    return jsonify({'id': user.id}), 201


@app.route('/api/user/<int:user_id>', methods=['GET'])
@auth.login_required
@permissions.same_as_or_follows
def get_user(user_id):
    user = models.User.query.get(user_id)
    if not user:
        abort(404)
    return user.to_json(), 201


@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    user = utils.make_new_user_or_abort(data)
    db.session.add(user)
    db.session.commit()
    return jsonify({'status': 'Created', 'username': user.username}), 201, {
        'Location': url_for('get_user', user_id=user.id,
                            _external=True)}


@app.route('/registerAndPost', methods=['POST'])
def register_and_post():
    data = request.get_json()
    try:
        user = utils.make_new_user_or_abort(data['user'])

        db.session.add(user)
        db.session.flush()
        post = utils.make_new_post_or_abort(data['post'], user)

        db.session.add(post)
    except Exception as e:
        db.session.rollback()
        raise e

    db.session.commit()

    return jsonify({'message': 'Created', 'username': user.username, 'post_id': post.id}), 201, {
        'Location': url_for('get_user', user_id=user.id,
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


@app.route("/api/usersearch/<string:val>", methods=['GET'])
@auth.login_required
def get_similar_usernames(val):
    users = models.User.query.filter(
        models.User.username.like('%' + val + '%')).limit(10)
    if users:
        usernames = [user.username for user in users]
        return jsonify({'suggestions': usernames}), 201
    abort(404)


@app.route("/api/notifications/get/<int:user_id>", methods=['GET'])
@auth.login_required
def get_all_notifs(user_id):
    user = models.User.query.get(user_id)
    if not user:
        abort(404)
    notifs = user.get_notifications()
    return notifs, 201


@app.route("/api/notifications/num/<int:user_id>", methods=['GET'])
@auth.login_required
def get_notifs_num(user_id):
    user = models.User.query.get(user_id)
    if not user:
        abort(404)
    num = user.num_of_notifications()
    return jsonify({'num': num}), 201


@app.route("/api/notifications/delete/<int:notif_id>", methods=['DELETE'])
@auth.login_required
@permissions.same_as
def delete_notif(notif_id):
    notif = models.Notification.query.get(notif_id)
    if not notif:
        abort(404)
    db.session.delete(notif)
    db.session.commit()
    return jsonify({"message": "success"}), 204


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


@app.route("/api/posts/get_all_and_of_followed", methods=['GET'])
@auth.login_required
def get_posts_of_self_and_followed():
    followeds = current_user.get_followed()
    result = current_user.get_posts()
    for followed in followeds:
        result.update(followed.get_posts())

    return result


@app.route("/api/posts/new", methods=['POST'])
@auth.login_required
def add_post():
    data = request.get_json()
    new_post = utils.make_new_post_or_abort(data)
    db.session.add(new_post)
    db.session.commit()
    return jsonify({'status': 'success', 'post_id': new_post.id}), 201, {
        'Location': url_for('get_post', post_id=new_post.id, _external=True)}


@app.route("/api/posts/update/<int:post_id>", methods=['PUT'])
@auth.login_required
@permissions.same_as
def update_post(post_id):
    data = request.get_json()

    if not data or 'title' not in data or 'start_date' not in data or \
            'end_date' not in data or 'country' not in data or 'city' not in data or \
            'latitude' not in data or 'longitude' not in data or 'content' not in data:
        abort(400, message="bad_json")

    if not utils.is_date_valid(data['start_date']) or not utils.is_date_valid(
            data['end_date']) or not utils.dates_are_ordered(data['start_date'], data['end_date']):
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

        for subscriber in old_post.get_subscribers():
            notif_name = "{} changed".format(post_id)
            data = {'type': 'edited', 'post_id': post_id,
                            'post_title': old_post.title,
                            'owner_name': current_user.username}
            subscriber.add_notification(notif_name, data)

        return jsonify({'message': 'success', 'post_id': old_post.id}), 200, {
            'Location': url_for('get_post', post_id=old_post.id, _external=True)}
    else:
        add_post()


@app.route("/api/posts/delete/<int:post_id>", methods=['DELETE'])
@auth.login_required
@permissions.same_as
def delete_post(post_id):
    post = models.Post.query.get(post_id)

    if not post:
        abort(404)

    db.session.delete(post)
    db.session.commit()

    return jsonify({"message": "success"}), 204


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


@app.route('/api/follow', methods=['POST'])
@auth.login_required
def follow():
    data = request.get_json()
    if not data or 'user_id' not in data or 'followed_id' not in data:
        abort(400, message="Bad Json")
    user_id = data['user_id']
    followed_id = data['followed_id']
    user = models.User.query.get(user_id)
    followed = models.User.query.get(followed_id)
    if not user or not followed:
        abort(400, message="Bad Json")
    user.follow(followed)
    return jsonify({'status': 'success'}), 201


@app.route('/api/unfollow', methods=['POST'])
@auth.login_required
def unfollow():
    data = request.get_json()
    if not data or 'user_id' not in data or 'followed_id' not in data:
        abort(400, message="Bad Json")
    user_id = data['user_id']
    followed_id = data['followed_id']
    user = models.User.query.get(user_id)
    followed = models.User.query.get(followed_id)
    if not user or not followed:
        abort(400, message="Bad Json")
    user.unfollow(followed)
    return jsonify({'status': 'success'}), 201


@app.route('/api/partner_search', methods=['POST'])
@auth.login_required
def partner_search():
    user_id = current_user.id
    data = request.get_json()

    if not data or 'latitude' not in data or 'longitude' not in data or \
       'start_date' not in data or 'end_date' not in data or 'radius' not in data:
        abort(400, message="Bad Json")

    if not utils.is_date_valid(data['start_date']) or \
       not utils.is_date_valid(data['end_date']) or \
       not utils.dates_are_ordered(data['start_date'], data['end_date']):
        abort(400, message="Bad Dates")

    def filterNotPotentialPartners(post):
        if post.owner.id == user_id:
            return False

        dist_between = distance.distance(
            (data['latitude'], data['longitude']), (post.latitude, post.longitude)).km

        if dist_between > data['radius']:
            return False

        return utils.date_between(data['start_date'], data['end_date'], post.start_date, post.end_date)

    potential_partner_posts = list(filter(
        filterNotPotentialPartners, models.Post.query.all()))

    return {potential_post.id: potential_post.to_json() for potential_post in potential_partner_posts}, 200


@app.route('/api/subs/new', methods=['POST'])
@auth.login_required
def subscribe_user_to_post():
    user_id = current_user.id
    data = request.get_json()

    if not data or 'post_id' not in data:
        abort(400, message="Bad Json")

    post = models.Post.query.get(data['post_id'])
    if post is None:
        abort(404)

    if current_user.is_subscribed(post):
        abort(403, message="Already subscribed")

    current_user.subscribe_to_post(post)

    return jsonify({'status': "Create"}), 201
