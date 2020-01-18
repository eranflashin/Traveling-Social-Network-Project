from werkzeug.exceptions import Unauthorized, BadRequest, Forbidden, NotFound, InternalServerError, Conflict

from backend import app
from backend.routes import auth


@app.errorhandler(400)
def bad_request(e):
    if hasattr(e, 'data') and 'message' in e.data:
        return e.data['message'], 400
    return BadRequest(), 400


@app.errorhandler(403)
def forbidden(e):
    if hasattr(e, 'data') and 'message' in e.data:
        return e.data['message'], 403
    return Forbidden(), 403


@app.errorhandler(404)
def page_not_found(e):
    if hasattr(e, 'data') and 'message' in e.data:
        return e.data['message'], 404
    return NotFound(), 404


@app.errorhandler(500)
def internal_server_error(e):
    return InternalServerError(), 500


@app.errorhandler(409)
def conflict(e):
    if 'message' in e.data:
        return e.data['message'], 409
    return Conflict(), 409


@auth.error_handler
def auth_error():
    return Forbidden(), 403
