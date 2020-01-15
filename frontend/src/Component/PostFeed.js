import React, { Component } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Alert from "reactstrap/es/Alert";
import Carousel from "react-bootstrap/Carousel";
import "bootstrap/dist/css/bootstrap.min.css";
import randomColor from "randomcolor";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import { MdDateRange, MdPlace } from "react-icons/md";
import PostForm from "./PostForm";

const bringUsersPosts = () => {
  axios.defaults.withCredentials = true;
  return axios
    .get("http://127.0.0.1:5000/api/posts/get_all_and_of_followed", {
      headers: {
        Authorization: "Basic " + btoa(localStorage.usertoken + ":")
      }
    })
    .then(res => {
      const result_list = [];
      for (let [key, value] of Object.entries(res.data)) {
        result_list.push({ key: key, data: value });
      }

      return result_list;
    })
    .catch(err => {
      return "invalid action";
    });
};

export default class PostFeed extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts_array: [],
      invalid_action: 0,
      self_id: jwt_decode(localStorage.usertoken).id
    };

    this.onClickUsername = this.onClickUsername.bind(this);
    this.onClickDelete = this.onClickDelete.bind(this);
    this.onClickEdit = this.onClickEdit.bind(this);
    this.onClickSubs = this.onClickSubs.bind(this);
  }

  postsRefsMap = new Map();

  onClickUsername = user_id => {
    this.props.history.push(`/profile/${user_id}`);
  };

  onClickDelete = post_id => {
    console.log(post_id);
  };

  onClickEdit = post => {
    this.postsRefsMap.get(post.key).handleShow();
  };

  onClickSubs = post_id => {
    console.log(post_id);
  };

  setPostFormRef = (post_id, ref) => {
    this.postsRefsMap.set(post_id, ref);
  };

  componentDidMount() {
    bringUsersPosts().then(res => {
      if (res === "invalid action") {
        this.setState({ invalid_action: 1 });
      } else {
        this.setState({ posts_array: res });
      }
    });
  }

  render() {
    return this.state.invalid_action ? (
      <Alert color="danger">Sorry but this action is forbidden!</Alert>
    ) : (
      <>
        <div className="CarouselContainer">
          <Carousel indicators={false} interval={5000}>
            {this.state.posts_array.map(post => {
              return (
                <Carousel.Item key={post.key}>
                  <PostForm
                    post={post.data}
                    update_mode={true}
                    ref={ref => this.setPostFormRef(post.key, ref)}
                  />
                  <Card
                    style={{
                      backgroundColor: randomColor({
                        luminosity: "light",
                        hue: "blue"
                      }),
                      borderColor: randomColor({
                        luminosity: "light",
                        hue: "blue"
                      })
                    }}
                  >
                    <Card.Header>
                      <Row>
                        <Col>{<h3>{post.data.title}</h3>}</Col>
                        <Col>
                          <div
                            className="postControlButton"
                            onClick={() =>
                              this.onClickUsername(post.data.owner.id)
                            }
                          >
                            <div className="postControlButton-translate"></div>
                            {post.data.owner.username}
                          </div>
                        </Col>
                      </Row>
                    </Card.Header>
                    <Card.Body>{<big>{post.data.content}</big>}</Card.Body>
                    <Card.Footer>
                      <Container>
                        <Row>
                          <small>Updated on: {post.data.last_edit_time}</small>
                        </Row>
                        <Row>
                          <MdDateRange />
                          <small>
                            {post.data.dates.start_date} -
                            {post.data.dates.end_date}
                          </small>
                        </Row>
                        <Row>
                          <MdPlace />
                          <small>
                            {post.data.location.country},
                            {post.data.location.city}
                          </small>
                        </Row>
                      </Container>
                    </Card.Footer>
                    <Card.Footer>
                      <Container>
                        <Row>
                          <Col>
                            {this.state.self_id !== post.data.owner.id ? (
                              <div className="postControlButton">
                                <div className="postControlButton-translate"></div>
                                Subscribe
                              </div>
                            ) : (
                              <></>
                            )}
                          </Col>
                          <Col>
                            {this.state.self_id === post.data.owner.id ? (
                              <div
                                className="postControlButton"
                                onClick={() => this.onClickEdit(post)}
                              >
                                <div className="postControlButton-translate"></div>
                                Edit
                              </div>
                            ) : (
                              <></>
                            )}
                          </Col>
                          <Col>
                            {this.state.self_id === post.data.owner.id ? (
                              <div
                                className="postControlButton"
                                onClick={() => this.onClickDelete(post.key)}
                              >
                                <div className="postControlButton-translate"></div>
                                Delete
                              </div>
                            ) : (
                              <></>
                            )}
                          </Col>
                        </Row>
                      </Container>
                    </Card.Footer>
                  </Card>
                </Carousel.Item>
              );
            })}
          </Carousel>
        </div>
      </>
    );
  }
}
