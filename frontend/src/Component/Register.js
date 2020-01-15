import React, { Component } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker";
import Alert from "reactstrap/es/Alert";
import axios from "axios";
import { login } from "./Login";
import PostForm from "./PostForm";

const processDate = date => {
  let processed_date = new Date(date);
  processed_date =
    processed_date.getFullYear() +
    "-" +
    (processed_date.getMonth() + 1) +
    "-" +
    processed_date.getDate();

  return processed_date;
};

export const register = newUser => {
  return axios
    .post("http://127.0.0.1:5000/register", {
      username: newUser.username,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      gender: newUser.gender,
      birth_date: newUser.birth_date,
      email: newUser.email,
      password: newUser.password
    })
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

const registerAndPost = (newUser, newPost) => {
  return axios
    .post("http://127.0.0.1:5000/registerAndPost", {
      user: {
        username: newUser.username,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        gender: newUser.gender,
        birth_date: newUser.birth_date,
        email: newUser.email,
        password: newUser.password
      },
      post: {
        title: newPost.title,
        content: newPost.content,
        start_date: newPost.start_date,
        end_date: newPost.end_date,
        country: newPost.country,
        city: newPost.city,
        longitude: newPost.longitude,
        latitude: newPost.latitude
      }
    })
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

class Register extends Component {
  constructor() {
    super();
    this.state = {
      pressed_new_post: false,
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
      if (!this.state.pressed_new_post) {
        register(newUser).then(res => {
          if (res == "Created") {
            const user = {
              email: newUser.email,
              password: newUser.password
            };
            login(user).then(res => {
              this.props.history.push(`/postfeed`);
            });
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
        const newPost = {
          title: this.postRf.state.data.title,
          content: this.postRf.state.data.content,
          start_date: processDate(this.postRf.state.data.date[0]),
          end_date: processDate(this.postRf.state.data.date[1]),
          country: this.postRf.state.data.country,
          city: this.postRf.state.data.city,
          latitude: this.postRf.state.data.lat,
          longitude: this.postRf.state.data.lon
        };
        registerAndPost(newUser, newPost).then(res => {
          if (res == "Created") {
            const user = {
              email: newUser.email,
              password: newUser.password
            };
            login(user).then(res => {
              this.props.history.push(`/postfeed`);
            });
          }
          if (res == "Username Taken") {
            this.setState({ user_taken: 1 });
            this.setState({ invalid: 1 });
          }
          if (res == "Email Taken") {
            this.setState({ email_taken: 1 });
            this.setState({ invalid: 1 });
          }
          if (res == "Post Create Failed") {
            this.setState({ invalid: 1 });
          }
        });
      }
    } else {
      this.setState({ invalid: 1 });
    }
  }

  handle_new_post_press = () => {
    this.setState({ pressed_new_post: true });
    this.postRf.setState({ show: true });
  };

  render() {
    return (
      <form noValidate onSubmit={this.onSubmit}>
        <h1 className="header">Register</h1>
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
            <button>
              <span>Register!</span> <i className="fa" />
            </button>
            <PostForm ref={ref => (this.postRf = ref)} update_mode={false} />
            {this.state.pressed_new_post ? (
              <button
                type="button"
                className="editPostButton"
                onClick={this.handle_new_post_press}
              >
                <i className="fa" />
                <span>Edit Post</span>
              </button>
            ) : (
              <button
                type="button"
                className="addPostButton"
                onClick={this.handle_new_post_press}
              >
                <i className="fa" />
                <span>Add Post</span>
              </button>
            )}
          </div>

          {this.state.invalid > 0 && (
            <Alert color="danger">
              Your registration is invalid. Please try again!
            </Alert>
          )}
        </div>
      </form>
    );
  }
}

export default Register;
