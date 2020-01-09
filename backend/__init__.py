from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from flask_httpauth import HTTPBasicAuth


app = Flask(__name__)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = dict(isolation_level='SERIALIZABLE')
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:technion@localhost:5432/myDB'
app.config['SECRET_KEY'] = '5791628bb0b13ce0c676dfde280ba245'
app.config['JWT_SECRET_KEY'] = '8CF2A6D994091D43B2AC1343346'
app.debug = True
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)
auth = HTTPBasicAuth()

login_manager = LoginManager(app)
login_manager.session_protection = 'strong'
login_manager.login_view = 'login'
login_manager.init_app(app)

from backend import routes, errors, utils, models, permissions
