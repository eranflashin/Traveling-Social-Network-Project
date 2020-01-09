import React, { Component } from "react";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./Login";
import Register from "./Register";
import TravelImg from "../imgs/landingImg.jpg";

export default class Landing extends Component {
  render() {
    return (
      <div className="form-container">
        <div className="landingImgContainer">
          <img src={TravelImg} className="landingImg" />
        </div>
        <div className="box">
          <Tabs
            defaultactivatekey="login"
            id="register-login-registerAndPost-tab"
          >
            <Tab eventKey="login" title="Login">
              <Login {...this.props} />
            </Tab>
            <Tab eventKey="register" title="Register">
              <Register {...this.props} />
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }
}
