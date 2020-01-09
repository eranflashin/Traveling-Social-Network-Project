from functools import wraps
from flask_login import current_user
from backend import models
from flask_restful import abort


def same_as_or_follows(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' in kwargs:
            user = models.User.query.get(kwargs['user_id'])
            if user is None:
                abort(404)
            if kwargs['user_id'] == current_user.id or current_user.is_following(user):
                return f(*args, **kwargs)
            else:
                abort(403)

        if 'post_id' in kwargs:
            post = models.Post.query.get(kwargs['post_id'])
            if post is not None:
                owner = post.owner
                if owner.id == current_user.id or current_user.is_following(owner):
                    return f(*args, **kwargs)
                else:
                    abort(403)
            else:
                return f(*args, **kwargs)
    return decorated_function


#
# def is_not_anonymous():
#     def decorator(f):
#         @wraps(f)
#         def decorated_function(*args, **kwargs):
#             if current_user.is_anonymous():
#                 abort(403)
#             return f(*args, **kwargs)
#         return decorated_function
#     return decorator
