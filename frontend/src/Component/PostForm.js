import React, { Component } from "react";
import { Modal, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Alert from "reactstrap/es/Alert";
import { LocationSearchInput } from "./LocationSearchInput";

export default class PostForm extends Component {
  constructor() {
    super();
    this.state = {
      show: false,
      pressed: false,
      data: {
        title: "",
        content: "",
        start_date: null,
        end_date: null,
        country: "",
        city: "",
        latitude: 0,
        longitude: 0
      }
    };
  }

  handleClose = () => this.setState({ show: false });
  handleShow = () => {
    this.setState({ show: true, pressed: true });
  };

  renderFunc = ({ getInputProps, getSuggestionItemProps, suggestions }) => (
    <div className="autocomplete-root">
      <input {...getInputProps()} />
      <div className="autocomplete-dropdown-container">
        {suggestions.map(suggestion => (
          <div {...getSuggestionItemProps(suggestion)}>
            <span>{suggestion.description}</span>
          </div>
        ))}
      </div>
    </div>
  );

  render() {
    return (
      <>
        {this.state.pressed ? (
          <button
            type="button"
            className="editPostButton"
            onClick={this.handleShow}
          >
            <i className="fa" />
            <span>Edit Post</span>
          </button>
        ) : (
          <button
            type="button"
            className="addPostButton"
            onClick={this.handleShow}
          >
            <i className="fa" />
            <span>Add Post</span>
          </button>
        )}

        <Modal
          show={this.state.show}
          onHide={this.handleClose}
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          centered
        >
          <Modal.Header>
            <h1 className="postHeader">Create Post</h1>
          </Modal.Header>
          <Modal.Body>
            <form noValidate onSubmit={this.onSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  name="title"
                  placeholder="Give this post a name..."
                  value={this.state.data.title}
                  onChange={this.onChange}
                  noValidate
                />
              </div>
              <div className="form-group">
                <textarea
                  type="text"
                  name="content"
                  placeholder="What's on your mind?"
                  value={this.state.data.content}
                  onChange={this.onChange}
                  noValidate
                />
              </div>
              <div className="form-group">
                <div>
                  <DatePicker
                    name="start_date"
                    selected={this.state.data.start_date}
                    onChange={this.handleChange}
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div>
                  <DatePicker
                    name="start_date"
                    selected={this.state.data.end_date}
                    onChange={this.handleChange}
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="form-group">
                  {/* <LocationSearchInput
                    value={this.state.data.country}
                    onChange={this.handleChange}
                  />
                  {this.renderFunc}
                  <LocationSearchInput /> */}
                </div>
              </div>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={this.handleClose}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}
