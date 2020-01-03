import React, {Component} from 'react';
import {BrowserRouter as Router, Redirect, Route} from 'react-router-dom';

import Login from './Component/Login';
import {UserProfile} from './Component/UserHome';

function isLoggedIn() {
    return !!localStorage.usertoken;
}

class App extends Component {
    render() {
        return (
            <Router>
                <div className="App">
                    <Route exact path="/" render={(props) => (
                        isLoggedIn()? (<UserProfile {...props} />) : (<Redirect to={"/login"}/>)
                    )}/>

                    <Route exact path="/login" render={(props) => (
                        !isLoggedIn() ? (
                            <Login {...props} />) : (<Redirect to="/userHome"/>)
                    )}/>
                    <Route exact path="/userHome" render={(props) => (
                        isLoggedIn() ? (
                            <UserProfile {...props} />) : (<Redirect to="/login"/>)
                    )}/>

                </div>
            </Router>
        );
    }
}



export default App;
