
from flask_login import current_user
from backend.models import User
from flask_restful import abort


def same_as_or_follows(user_id: int):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = User.query.get(user_id)
            if user is None:
                abort(404)
            if user_id == current_user.get_id() or current_user.is_following(user):
                return f(*args, **kwargs)
            else:
                abort(403)
        return decorated_function
    return decorator


def same_as(user_id: int):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = User.query.get(user_id)
            if user is None:
                abort(404)
            if user_id == current_user.get_id():
                return f(*args, **kwargs)
            else:
                abort(403)
        return decorated_function
    return decorator


def is_not_anonymous():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if current_user.is_anonymous():
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
