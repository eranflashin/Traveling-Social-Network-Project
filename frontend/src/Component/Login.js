import React, { Component } from "react";
import Alert from "reactstrap/es/Alert";
import axios from "axios";

export const login = user => {
  axios.defaults.withCredentials = true;
  return axios({
    url: "http://127.0.0.1:5000/login",
    method: "POST",
    mode: "cors",
    data: {
      email: user.email,
      password: user.password
    }
  })
    .then(response => {
      localStorage.setItem("usertoken", response.data);
      return response.data;
    })
    .catch(err => {
      console.log(err);
      if (err.response && err.response.status === 404) {
        axios.defaults.withCredentials = true;
        axios({
          url: "http://127.0.0.1:5000/api/token",
          method: "GET",
          mode: "cors",
          headers: {
            Authorization: "Basic " + btoa(user.email + ":" + user.password)
          }
        })
          .then(response => {
            localStorage.setItem("usertoken", response.data.token);
            return response.data.token;
          })
          .catch(err => {
            console.log(err);
            return "loginError";
          });
      } else {
        return "loginError";
      }
    });
};

const validEmailRegex = RegExp(
  /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
);

const validateForm = errors => {
  let valid = true;
  Object.values(errors).forEach(val => val.length > 0 && (valid = false));
  return valid;
};

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      errors: {
        email: "",
        password: ""
      },
      invalid: 0
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(e) {
    this.setState({ [e.target.name]: e.target.value });
    e.preventDefault();
    const { name, value } = e.target;
    let errors = this.state.errors;

    switch (name) {
      case "email":
        errors.email =
          validEmailRegex.test(value) && value.length <= 120
            ? ""
            : "Email is not valid!";
        break;
      case "password":
        errors.password =
          value.length < 1 || value.length > 60 ? "Password is not valid!" : "";
        break;
      default:
        break;
    }
    this.setState({ errors, [name]: value });
  }

  onSubmit(e) {
    e.preventDefault();
    this.setState({ invalid: 0 });
    const user = {
      email: this.state.email,
      password: this.state.password
    };

    if (validateForm(this.state.errors)) {
      login(user).then(res => {
        if (res !== "loginError") {
          this.props.history.push(`/profile`);
        } else {
          this.setState({ invalid: 1 });
        }
      });
    } else {
      this.setState({ invalid: 1 });
    }
  }

  render() {
    return (
      <form noValidate onSubmit={this.onSubmit}>
        <h1 className="header">Login</h1>
        <div className="form-group">
          <input
            type="email"
            className="myForm"
            name="email"
            placeholder="Email Address"
            value={this.state.email}
            onChange={this.onChange}
            noValidate
          />
          {this.state.errors.email.length > 0 && (
            <span className="error">{this.state.errors.email}</span>
          )}
        </div>
        <div className="form-group">
          <input
            type="password"
            className="myForm"
            name="password"
            placeholder="Password"
            value={this.state.password}
            onChange={this.onChange}
            noValidate
          />
          {this.state.errors.password.length > 0 && (
            <span className="error">{this.state.errors.password}</span>
          )}
        </div>
        <div className="button submit">
          <button>
            <span>GO</span> <i className="fa fa-check" />
          </button>
        </div>
        {this.state.invalid > 0 && (
          <Alert color="danger">
            Invalid email or password. Please try again!
          </Alert>
        )}
      </form>
    );
  }
}
