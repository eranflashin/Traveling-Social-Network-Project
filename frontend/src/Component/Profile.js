import React, { Component } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { Button } from "react-bootstrap";
import { notify } from "react-notify-toast";
import notAuth from "./Utils";

export default class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curr_user_id: 0,
      is_following: false,
      id: 0,
      username: "",
      first_name: "",
      last_name: "",
      birth_date: "",
      email: "",
      image_file: ""
    };
  }

  componentDidMount() {
    const token = localStorage.usertoken;
    const decoded = jwt_decode(token);
    this.setState({
      curr_user_id: decoded.id
    });

    let user_id = this.props.match.params.user_id;
    if (user_id == "") user_id = decoded.id;

    axios.defaults.withCredentials = true;
    axios
      .get("http://127.0.0.1:5000/api/user/" + user_id, {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      })
      .then(response => {
        this.setState({
          is_following: true,
          id: user_id,
          username: response.data.names.username,
          first_name: response.data.names.first_name,
          last_name: response.data.names.last_name,
          birth_date: response.data.birth_date,
          email: response.data.email,
          image_file: response.data.image_file
        });
      })
      .catch(err => {
        axios
          .get("http://127.0.0.1:5000/api/user_by_id/" + user_id, {
            headers: {
              Authorization: "Basic " + btoa(localStorage.usertoken + ":")
            }
          })
          .then(response => {
            this.setState({
              is_following: false,
              id: user_id,
              username: response.data.username,
              first_name: "",
              last_name: "",
              birth_date: "",
              email: "",
              image_file: "/static/profile_pics/default.jpg"
            });
          })
          .catch(err => {
            notify.show("No such user", "warning", 3000);
            this.props.history.push("/");
          });
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname) {
      this.componentDidMount();
    }
  }

  unfollowUser() {
    axios
      .post(
        "http://127.0.0.1:5000/api/unfollow",
        {
          user_id: this.state.curr_user_id,
          followed_id: this.state.id
        },
        {
          headers: {
            Authorization: "Basic " + btoa(localStorage.usertoken + ":")
          }
        }
      )
      .then(response => {
        this.setState({ is_following: false });
      })
      .catch(err => {
        if (err.response && err.response.status === 403) {
          notAuth(this.props.history);
        } else {
          notify("no such user", "warning", 3000);
        }
      });
  }

  followUser() {
    axios
      .post(
        "http://127.0.0.1:5000/api/follow",
        {
          user_id: this.state.curr_user_id,
          followed_id: this.state.id
        },
        {
          headers: {
            Authorization: "Basic " + btoa(localStorage.usertoken + ":")
          }
        }
      )
      .then(response => {
        this.setState({ is_following: true });
      })
      .catch(err => {
        if (err.response && err.response.status === 403) {
          notAuth(this.props.history);
        } else {
          notify("no such user", "warning", 3000);
        }
      });
  }

  render() {
    const follow_button = (
      <Button variant="primary" onClick={this.followUser.bind(this)}>
        Follow
      </Button>
    );

    const unfollow_button = (
      <Button variant="primary" onClick={this.unfollowUser.bind(this)}>
        Unfollow
      </Button>
    );

    const user_details = (
      <>
        {this.state.curr_user_id != this.state.id ? unfollow_button : null}
        <div className="text-light">
          {this.state.first_name + " " + this.state.last_name}
        </div>
        <div className="text-light">{this.state.birth_date}</div>
        <div className="text-light">{this.state.email}</div>
      </>
    );

    return (
      <>
        <div className="profile-block">
          <img
            className="profile-img"
            src={"http://127.0.0.1:5000" + this.state.image_file}
            alt="profile image"
          />
          <h1 className="text-heading">{this.state.username}</h1>
          {this.state.is_following ? user_details : follow_button}
        </div>
      </>
    );
  }
}
