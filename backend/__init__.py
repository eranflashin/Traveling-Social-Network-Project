from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = dict(isolation_level='SERIALIZABLE')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SECRET_KEY'] = '5791628bb0b13ce0c676dfde280ba245'
app.config['JWT_SECRET_KEY'] = '8CF2A6D994091D43B2AC1343346DA96D0C4E48D089EE4C583FADC8E581288908'
app.debug = True
db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

login_manager = LoginManager(app)
login_manager.session_protection = 'strong'
login_manager.login_view = 'login'
login_manager.init_app(app)

from backend import routes, errors, utils
