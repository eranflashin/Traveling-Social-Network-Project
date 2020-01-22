import React, { Component } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker";
import Alert from "reactstrap/es/Alert";
import axios from "axios";
import { login } from "./Login";
import PostForm from "./PostForm";
import { processDate } from "./PostForm";
import jwt_decode from "jwt-decode";
import { notify } from "react-notify-toast";

export const editUser = newUser => {
  const token = localStorage.usertoken;
  const decoded = jwt_decode(token);
  return axios
    .put(
      "http://127.0.0.1:5000/api/updateuser/" + decoded.id,
      {
        username: newUser.username,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        gender: newUser.gender,
        birth_date: newUser.birth_date,
        email: newUser.email,
        password: newUser.password
      },
      {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      }
    )
    .then(response => {
      return response.data.message;
    })
    .catch(err => {
      if (err.response && err.response.status === 409) {
        return err.response.data;
      } else {
        console.log("invalid request");
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

class EditForm extends Component {
  constructor() {
    super();
    this.state = {
      data: {
        username: "",
        first_name: "",
        last_name: "",
        gender: "",
        birth_date: new Date(),
        email: "",
        password: ""
      },
      user_taken: 0,
      email_taken: 0,
      invalid: 0,
      errors: {
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        gender: "Please choose your gender"
      }
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    let curr_user = this.props.currUser;
    this.setState({
      data: {
        username: curr_user.username,
        first_name: curr_user.first_name,
        last_name: curr_user.last_name,
        gender: curr_user.gender,
        birth_date: new Date(),
        email: curr_user.email,
        password: ""
      }
    });
  }

  handleChange = date => {
    this.setState({
      data: { ...this.state.data, birth_date: date }
    });
  };

  onChange(e) {
    let errors = this.state.errors;
    const { name, value } = e.target;
    this.setState({
      data: { ...this.state.data, [e.target.name]: e.target.value }
    });

    switch (name) {
      case "username":
        this.setState({ user_taken: 0 });
        errors.username =
          value.length < 1 || value.length > 20 ? "Username is not valid!" : "";
        break;
      case "gender":
        errors.gender = "";
        break;
      case "email":
        this.setState({ email_taken: 0 });
        errors.email =
          validEmailRegex.test(value) && value.length <= 120
            ? ""
            : "Email is not valid!";
        break;
      case "password":
        errors.password =
          value.length < 1 || value.length > 60 ? "Password is not valid!" : "";
        break;
      case "first_name":
        errors.first_name = value.length > 20 ? "First name is too long" : "";
        break;
      case "last_name":
        errors.last_name = value.length > 20 ? "Last name is too long" : "";
        break;
      default:
        break;
    }
    this.setState({ errors, [name]: value });
  }

  onSubmit(e) {
    e.preventDefault();
    this.setState({ invalid: 0 });
    this.setState({ user_taken: 0 });
    this.setState({ email_taken: 0 });

    const newUser = {
      username: this.state.data.username,
      first_name: this.state.data.first_name,
      last_name: this.state.data.last_name,
      gender: this.state.data.gender,
      birth_date: processDate(this.state.data.birth_date),
      email: this.state.data.email,
      password: this.state.data.password
    };

    if (validateForm(this.state.errors)) {
      editUser(newUser).then(res => {
        if (res == "Updated") {
          notify.show("Account Edited Successfully", "success", 3000);
        }
        if (res == "Username Taken") {
          this.setState({ user_taken: 1 });
          this.setState({ invalid: 1 });
        }
        if (res == "Email Taken") {
          this.setState({ email_taken: 1 });
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
        <div className="form-group">
          <label htmlFor="name">Username</label>
          <input
            type="text"
            className="myForm"
            name="username"
            placeholder="Enter your username"
            value={this.state.data.username}
            onChange={this.onChange}
            noValidate
          />
          {this.state.errors.username.length > 0 && (
            <span className="error">{this.state.errors.username}</span>
          )}
          {this.state.user_taken > 0 && (
            <span className="error">This username is taken</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="name">First name</label>
          <input
            type="text"
            className="myForm"
            name="first_name"
            placeholder="Enter your first name"
            value={this.state.data.first_name}
            onChange={this.onChange}
            noValidate
          />
          {this.state.errors.first_name.length > 0 && (
            <span className="error">{this.state.errors.first_name}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="name">Last name</label>
          <input
            type="text"
            className="myForm"
            name="last_name"
            placeholder="Enter your last name"
            value={this.state.data.last_name}
            onChange={this.onChange}
            noValidate
          />
          {this.state.errors.last_name.length > 0 && (
            <span className="error">{this.state.errors.last_name}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="name">Gender</label>
          <br></br>
          <input
            type="radio"
            name="gender"
            value="Male"
            onChange={this.onChange}
          />{" "}
          Male<br></br>
          <input
            type="radio"
            name="gender"
            value="Female"
            onChange={this.onChange}
          />{" "}
          Female<br></br>
          <input
            type="radio"
            name="gender"
            value="other"
            onChange={this.onChange}
          />{" "}
          Other
        </div>
        {this.state.errors.gender.length > 0 && (
          <span className="error">{this.state.errors.gender}</span>
        )}
        <div className="form-group">
          <label htmlFor="name">Birth date</label>
          <br></br>
          <DatePicker
            name="birth_date"
            selected={this.state.data.birth_date}
            onChange={this.handleChange}
            dateFormat="dd/MM/yyyy"
            maxDate={new Date()}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            className="myForm"
            name="email"
            placeholder="Enter email"
            value={this.state.data.email}
            onChange={this.onChange}
            noValidate
          />
          {this.state.errors.email.length > 0 && (
            <span className="error">{this.state.errors.email}</span>
          )}
          {this.state.email_taken > 0 && (
            <span className="error">This email is taken</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            className="myForm"
            name="password"
            placeholder="Password"
            value={this.state.data.password}
            onChange={this.onChange}
            noValidate
          />
          {this.state.errors.password.length > 0 && (
            <span className="error">{this.state.errors.password}</span>
          )}
        </div>

        <div className="button submit">
          <div className="registerButtonsOuter">
            <button type="submit">
              <span>Save</span> <i className="fa" />
            </button>
          </div>

          {this.state.invalid > 0 && (
            <Alert color="danger">
              Your update is invalid. Please try again!
            </Alert>
          )}
        </div>
      </form>
    );
  }
}

export default EditForm;
