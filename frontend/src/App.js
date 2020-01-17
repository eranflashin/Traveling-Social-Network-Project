import React, { Component } from "react";
import { BrowserRouter as Router, Redirect, Route } from "react-router-dom";
import jwt_decode from "jwt-decode";

import Landing from "./Component/Landing";
import Navbar from "./Component/NavBar";
import PostFeed from "./Component/PostFeed";
import UserProfile from "./Component/Profile";
import MapSearch from "./Component/MapSearch";

function isLoggedIn() {
  return !!localStorage.usertoken;
}

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Route render={() => (isLoggedIn() ? <Navbar /> : null)} />
          <Route
            exact
            path="/"
            render={props =>
              isLoggedIn() ? (
                <Redirect to={"/postfeed"} />
              ) : (
                <Redirect to={"/landing"} />
              )
            }
          />

          <Route
            exact
            path="/landing"
            render={props =>
              !isLoggedIn() ? (
                <Landing {...props} />
              ) : (
                <Redirect to="/postfeed" />
              )
            }
          />

          <Route
            exact
            path="/postfeed"
            render={props =>
              isLoggedIn() ? (
                <PostFeed {...props} />
              ) : (
                <Redirect to="/landing" />
              )
            }
          />

          <Route
            exact
            path="/profile"
            render={props =>
              isLoggedIn() ? (
                <Redirect
                  to={"/profile/" + jwt_decode(localStorage.usertoken).id}
                />
              ) : (
                <Redirect to={"/landing"} />
              )
            }
          />

          <Route
            exact
            path="/profile/:user_id"
            render={props =>
              isLoggedIn() ? (
                <UserProfile {...props} />
              ) : (
                <Redirect to={"/landing"} />
              )
            }
          />

          <Route
            exact
            path="/mapsearch"
            render={props =>
              isLoggedIn() ? (
                <MapSearch {...props} />
              ) : (
                <Redirect to={"/landing"} />
              )
            }
          />
        </div>
      </Router>
    );
  }
}

export default App;
