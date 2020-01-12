import React, { Component, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import MyMap from "./GeoSearchComponent";

export default class PostForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      data: {
        title: "",
        content: "",
        date: [new Date(), new Date()],
        country: "",
        city: "",
        lon: null,
        lat: null
      },
      errors: {
        dates: "",
        postTitle: "",
        postContent: ""
      }
    };
  }

  handleClose = () => {
    this.setState({ show: false });
  };
  handleShow = () => {
    this.setState({ show: true });
  };

  handleChangeDate = date => {
    let errors = this.state.errors;
    this.setState({
      data: { ...this.state.data, date: date }
    });
    if (date != null) {
      errors.dates =
        date[1] < date[0] ? "Start date must be earlier than end date" : "";
    } else {
      errors.dates = "";
    }
  };

  onChange(e) {
    let errors = this.state.errors;
    const { name, value } = e.target;
    this.setState({
      data: { ...this.state.data, [e.target.name]: e.target.value }
    });

    switch (name) {
      case "title":
        if (value.length < 1) {
          errors.postTitle = "Title must contain at least one character";
        } else if (value.length > 20) {
          errors.postTitle = "Title must contain at most 20 characters";
        } else {
          errors.postTitle = `${value.length}/20`;
        }
        break;

      case "content":
        if (value.length > 500) {
          errors.postContent = "Post must contain at most 500 characters";
        } else {
          errors.postContent = `${value.length}/500`;
        }
        break;
    }
  }

  handleMapResult(geo_json) {
    this.setState({ data: { ...this.state.data, ...geo_json } });
  }

  render() {
    console.log(this.state);
    return (
      <>
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
              <Container className="postContainer">
                <Row>
                  <Col>
                    <Row className="formGroup">
                      <DateRangePicker
                        onChange={this.handleChangeDate}
                        value={this.state.data.date}
                        format="dd/MM/yyyy"
                        rangeDivider="to"
                        required={true}
                        minDate={new Date()}
                        noValidate
                      />
                      {this.state.errors.dates.length > 0 && (
                        <span className="error">{this.state.errors.dates}</span>
                      )}
                    </Row>
                    <Row className="form-group">
                      <input
                        className="postContents"
                        type="text"
                        name="title"
                        placeholder="Give this post a name..."
                        value={this.state.data.title}
                        onChange={this.onChange.bind(this)}
                        noValidate
                      />
                      {this.state.errors.postTitle.length > 0 && (
                        <span className="error">
                          {this.state.errors.postTitle}
                        </span>
                      )}
                    </Row>
                    <Row className="form-group">
                      <textarea
                        className="postContents"
                        type="text"
                        name="content"
                        placeholder="What's on your mind?"
                        value={this.state.data.content}
                        onChange={this.onChange.bind(this)}
                        noValidate
                      />
                      {this.state.errors.postContent.length > 0 && (
                        <span className="error">
                          {this.state.errors.postContent}
                        </span>
                      )}
                    </Row>
                  </Col>
                  <Col id="mapCol">
                    <MyMap
                      onResult={this.handleMapResult.bind(this)}
                      initLocation={{
                        lat: this.state.data.lat,
                        lon: this.state.data.lon
                      }}
                    />
                  </Col>
                </Row>
              </Container>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={this.handleClose}>
              I'm done...
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}
