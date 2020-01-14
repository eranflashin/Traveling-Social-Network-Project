import React, { Component } from "react";
import { BrowserRouter as Router, Redirect, Route } from "react-router-dom";

import Landing from "./Component/Landing";
import Navbar from "./Component/NavBar";
import PostFeed from "./Component/PostFeed";

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
                <PostFeed {...props} />
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
        </div>
      </Router>
    );
  }
}

export default App;
