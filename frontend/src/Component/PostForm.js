import React, { Component, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import "react-datepicker/dist/react-datepicker.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import MyMap from "./GeoSearchComponent";
import Alert from "reactstrap/es/Alert";

export const processDate = date => {
  let processed_date = new Date(date);
  processed_date =
    processed_date.getFullYear() +
    "-" +
    (processed_date.getMonth() + 1) +
    "-" +
    processed_date.getDate();

  return processed_date;
};

export default class PostForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      update_mode: this.props.update_mode,
      callback_mode: this.props.callback_mode,
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
      dates_not_valid: 0,
      post_title_not_valid: 1,
      post_content_not_valid: 0,
      location_not_chosen: 1,
      invalid: 0,
      errors: {
        dates: "",
        postTitle: "",
        postContent: ""
      }
    };
  }

  handleClose = () => {
    if (
      this.state.dates_not_valid > 0 ||
      this.state.post_title_not_valid > 0 ||
      this.state.post_content_not_valid > 0 ||
      this.state.location_not_chosen > 0
    ) {
      this.setState({ invalid: 1 });
      return;
    } else {
      this.setState({ invalid: 0 });
    }

    this.setState({ show: false });
    if (this.state.update_mode) {
      this.props.onEditEnd(this.state.data, this.props.post.key);
    }
    if (this.state.callback_mode) {
      this.props.onEditEnd(this.state.data);
    }
  };

  handleShow = () => {
    if (this.state.update_mode) {
      const post = this.props.post;
      this.setState({
        data: {
          title: post.data.title,
          content: post.data.content,
          date: [
            new Date(post.data.dates.start_date),
            new Date(post.data.dates.end_date)
          ],
          lon: post.data.location.waypoint.longitude,
          lat: post.data.location.waypoint.latitude,
          country: post.data.location.country,
          city: post.data.location.city
        },
        dates_not_valid: 0,
        post_title_not_valid: 0,
        post_content_not_valid: 0,
        location_not_chosen: 0,
        invalid: 0
      });
    }
    this.setState({ show: true });
  };

  handleChangeDate = date => {
    let errors = this.state.errors;
    this.setState({
      data: { ...this.state.data, date: date }
    });
    if (date != null) {
      if (date[1] < date[0]) {
        errors.dates = "Start date must be earlier than end date";
        this.setState({ dates_not_valid: 1 });
      } else {
        this.setState({ dates_not_valid: 0 });
      }
    } else {
      errors.dates = "";
      this.setState({ dates_not_valid: 1 });
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
          this.setState({ post_title_not_valid: 1 });
        } else if (value.length > 20) {
          errors.postTitle = "Title must contain at most 20 characters";
          this.setState({ post_title_not_valid: 1 });
        } else {
          errors.postTitle = "";
          this.setState({ post_title_not_valid: 0 });
        }
        break;

      case "content":
        if (value.length > 500) {
          errors.postContent = "Post must contain at most 500 characters";
          this.setState({ post_content_not_valid: 1 });
        } else {
          errors.postContent = "";
          this.setState({ post_title_not_valid: 0 });
        }
        break;
    }
  }

  handleMapResult(geo_json) {
    this.setState({ data: { ...this.state.data, ...geo_json } });
    this.setState({ location_not_chosen: 0 });
  }

  render() {
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
            {this.state.update_mode ? (
              <h1 className="postHeader">Edit Post</h1>
            ) : (
              <h1 className="postHeader">Create Post</h1>
            )}
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
            {this.state.invalid > 0 && (
              <Alert color="danger">
                Something is wrong with your post. Also Make sure to choose a
                location, and fill correct dates
              </Alert>
            )}
            <Button variant="primary" onClick={this.handleClose}>
              I'm done...
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}
