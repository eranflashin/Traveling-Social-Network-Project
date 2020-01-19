import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { FaHome, FaUserAlt, FaMapMarkedAlt, FaSearch } from "react-icons/fa";
import { MdNotifications } from "react-icons/md";
import notAuth from "./Utils";
import { notify } from "react-notify-toast";

import Popup from "reactjs-popup";
import "bootstrap/dist/css/bootstrap.min.css";

class Navbar extends Component {
  state = {
    current_user: 0,
    username: "",
    notifications: [],
    notifs_num: -2,
    suggestions: []
  };

  get_user() {
    axios.defaults.withCredentials = true;
    return axios
      .get("http://127.0.0.1:5000/api/user_by_name/" + this.state.username, {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      })
      .then(response => {
        this.props.history.push(`/profile/` + response.data.id);
      })
      .catch(err => {
        if (err.response && err.response.status === 403) {
          notAuth(this.props.history);
        } else {
          if (this.state.username.length > 0) {
            notify.show("No user with this name", "warning", 3000);
          } else {
            notify.show("Please enter a username first", "warning", 3000);
          }
        }
      });
  }

  onChange(e) {
    this.setState({ username: e.target.value });
    axios.defaults.withCredentials = true;
    axios
      .get("http://127.0.0.1:5000/api/usersearch/" + e.target.value, {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      })
      .then(response => {
        this.setState({ suggestions: response.data.suggestions });
      })
      .catch(err => {
        if (err.response && err.response.status === 403) {
          notAuth(this.props.history);
        } else {
          this.setState({ suggestions: [] });
        }
      });
  }

  logOut(e) {
    e.preventDefault();
    axios.defaults.withCredentials = true;
    axios
      .get("http://127.0.0.1:5000/logout", {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      })
      .then(response => {
        localStorage.removeItem("usertoken");
        this.props.history.push("/");
      })
      .catch(err => {
        notAuth(this.props.history);
      });
  }

  handleNotifClick(notif_id) {
    axios.defaults.withCredentials = true;
    return axios
      .delete("http://127.0.0.1:5000/api/notifications/delete/" + notif_id, {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      })
      .then(res => {
        this.setState({ notifications: [] });
        this.componentDidMount();
      })
      .catch(err => {
        if (err.response && err.response.status === 403) {
          notAuth(this.props.history);
        } else {
          return "invalid action";
        }
      });
  }

  get_notifs() {
    axios.defaults.withCredentials = true;
    axios
      .get(
        "http://127.0.0.1:5000/api/notifications/get/" +
          this.state.current_user,
        {
          headers: {
            Authorization: "Basic " + btoa(localStorage.usertoken + ":")
          }
        }
      )
      .then(response => {
        this.setState({ notifications: response.data });
      })
      .catch(err => {
        if (err.response && err.response.status === 403)
          notAuth(this.props.history);
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.componentDidMount();
    }
  }

  componentDidMount() {
    const token = localStorage.usertoken;
    if (token) {
      const decoded = jwt_decode(token);
      this.setState({
        current_user: decoded.id
      });
      axios.defaults.withCredentials = true;
      axios
        .get("http://127.0.0.1:5000/api/notifications/num/" + decoded.id, {
          headers: {
            Authorization: "Basic " + btoa(localStorage.usertoken + ":")
          }
        })
        .then(response => {
          this.setState({ notifs_num: response.data.num });
        })
        .catch(err => {
          if (err.response && err.response.status === 403) {
            notAuth(this.props.history);
          }
          this.setState({ notifs_num: -1 });
        });
    }
  }

  render() {
    let notif_arr = this.state.notifications.map(notif => {
      return (
        <div
          className="menu-item"
          onClick={() => this.handleNotifClick(notif.notif_id)}
          key={`notif-${notif.notif_id}`}
        >
          <b>
            Post by {notif.data.owner_name} : "{notif.data.post_title}" has been{" "}
            {notif.data.type}
          </b>
        </div>
      );
    });

    let suggestions_arr = this.state.suggestions.map((sugg, index) => {
      return <option value={sugg} key={`option-${index}`} />;
    });

    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed justify-content-end">
          <div className="collapse navbar-collapse justify-content-md-center col-md-13 ">
            <ul className="navbar-nav nav-fill w-75">
              <li className="nav-item" key={1}>
                <Link to="/mapsearch" className="nav-link">
                  <FaMapMarkedAlt /> &nbsp; Map Search
                </Link>
              </li>

              <li className="nav-item" key={2}>
                <Link to="/postfeed" className="nav-link">
                  <FaHome /> &nbsp; Home
                </Link>
              </li>

              <li className="nav-item" key={3}>
                <Link
                  to={"/profile/" + this.state.current_user}
                  className="nav-link"
                >
                  <FaUserAlt /> &nbsp; User
                </Link>
              </li>

              <Form
                inline
                onSubmit={e => {
                  e.preventDefault();
                  this.get_user().then(res => {
                    this.setState({ username: "" });
                  });
                }}
              >
                <input
                  list="browsers"
                  name="browser"
                  value={this.state.username}
                  onChange={this.onChange.bind(this)}
                />

                <datalist id="browsers">{suggestions_arr}</datalist>

                <Button type="submit" variant="outline-secondary">
                  <FaSearch /> &nbsp; Search
                </Button>
              </Form>

              <li className="nav-item" key={4}>
                <a
                  href=""
                  onClick={this.logOut.bind(this)}
                  className="logout-button"
                >
                  <span>Logout</span>
                </a>
              </li>

              <li className="nav-item" key={5}>
                <Popup
                  trigger={
                    <Button type="button" className="btn btn-secondary  ">
                      <MdNotifications /> &nbsp; Notifications &nbsp;&nbsp;
                      <span className="badge badge-pill badge-light">
                        {this.state.notifs_num}{" "}
                      </span>
                    </Button>
                  }
                  position="bottom center"
                  closeOnDocumentClick
                  onOpen={this.get_notifs.bind(this)}
                  contentStyle={{
                    padding: "0px",
                    border: "none",
                    borderRadius: "7px"
                  }}
                >
                  <div className="menu">
                    {notif_arr}
                    {!this.state.notifs_num ? (
                      <div className="menu-item">no notifications</div>
                    ) : null}
                  </div>
                </Popup>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    );
  }
}

export default withRouter(Navbar);
