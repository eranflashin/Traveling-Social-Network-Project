from werkzeug.exceptions import Unauthorized, BadRequest, Forbidden, NotFound, InternalServerError

from backend import app
from backend.routes import auth


@app.errorhandler(400)
def bad_request(e):
    return BadRequest(), 400

@app.errorhandler(403)
def forbidden(e):
    return Forbidden(), 403


@app.errorhandler(404)
def page_not_found(e):
    return NotFound(), 404


@app.errorhandler(500)
def page_not_found(e):
    return InternalServerError(), 500


@auth.error_handler
def auth_error():
    return Unauthorized('Invalid Credentials'), 401