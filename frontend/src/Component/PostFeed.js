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
import { FaPlus } from "react-icons/fa";
import PostForm from "./PostForm";
import { processDate } from "./PostForm";

const makeASubscription = post_id => {
  axios.defaults.withCredentials = true;
  return axios
    .post(
      "http://127.0.0.1:5000/api/subs/new",
      {
        post_id: post_id
      },
      {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      }
    )
    .then(res => {
      alert("subscription has succeeded!");
    })
    .catch(err => {
      alert("subscription has failed");
    });
};

const addNewPost = post => {
  axios.defaults.withCredentials = true;
  return axios.post(
    "http://127.0.0.1:5000/api/posts/new",
    {
      title: post.title,
      content: post.content,
      start_date: processDate(post.date[0]),
      end_date: processDate(post.date[1]),
      country: post.country,
      city: post.city,
      latitude: post.lat,
      longitude: post.lon
    },
    {
      headers: {
        Authorization: "Basic " + btoa(localStorage.usertoken + ":")
      }
    }
  );
};

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

const updatePost = (new_post, post_id) => {
  axios.defaults.withCredentials = true;
  return axios
    .put(
      "http://127.0.0.1:5000/api/posts/update/" + post_id,
      {
        title: new_post.title,
        content: new_post.content,
        country: new_post.country,
        city: new_post.city,
        latitude: new_post.lat,
        longitude: new_post.lon,
        start_date: processDate(new_post.date[0]),
        end_date: processDate(new_post.date[1])
      },
      {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      }
    )
    .catch(err => {
      return "invalid action";
    });
};

const deletePost = post_id => {
  axios.defaults.withCredentials = true;
  return axios
    .delete("http://127.0.0.1:5000/api/posts/delete/" + post_id, {
      headers: {
        Authorization: "Basic " + btoa(localStorage.usertoken + ":")
      }
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
      self_id: jwt_decode(localStorage.usertoken).id,
      is_loading: true
    };

    this.onClickUsername = this.onClickUsername.bind(this);
    this.onClickDelete = this.onClickDelete.bind(this);
    this.onClickEditStart = this.onClickEditStart.bind(this);
    this.onClickEditEnd = this.onClickEditEnd.bind(this);
    this.onClickSubs = this.onClickSubs.bind(this);
    this.onClickNewPostStart = this.onClickNewPostStart.bind(this);
    this.onClickNewPostEnd = this.onClickNewPostEnd.bind(this);
  }

  postsRefsMap = new Map();

  onClickNewPostStart = () => {
    this.newPostFormRef.handleShow();
  };

  onClickNewPostEnd = post => {
    addNewPost(post).then(res => {
      if (res === "invalid action") {
        this.setState({ invalid_action: 1 });
      } else {
        this.componentDidMount();
      }
    });
  };

  onClickUsername = user_id => {
    this.props.history.push(`/profile/${user_id}`);
  };

  onClickDelete = post_id => {
    deletePost(post_id).then(res => {
      if (res === "invalid action") {
        this.setState({ invalid_action: 1 });
      } else {
        this.componentDidMount();
      }
    });
  };

  onClickEditStart = post_key => {
    this.postsRefsMap.get(post_key).handleShow();
  };

  onClickEditEnd = (new_post, post_id) => {
    updatePost(new_post, post_id).then(res => {
      if (res === "invalid action") {
        this.setState({ invalid_action: 1 });
      } else {
        this.componentDidMount();
      }
    });
  };

  onClickSubs = post_id => {
    makeASubscription(post_id);
  };

  setPostFormRef = (post_id, ref) => {
    this.postsRefsMap.set(post_id, ref);
  };

  componentDidMount() {
    bringUsersPosts().then(res => {
      if (res === "invalid action") {
        this.setState({ invalid_action: 1 });
      } else {
        this.setState({ posts_array: res, is_loading: false });
      }
    });
  }

  render() {
    const newPostComp = (
      <div>
        <PostForm
          update_mode={false}
          onEditEnd={this.onClickNewPostEnd}
          callback_mode={true}
          ref={ref => (this.newPostFormRef = ref)}
        />
        <button
          type="button"
          className="btn btn-success btn-circle btn-lg addNewPostButtonFeed"
          onClick={this.onClickNewPostStart}
        >
          <FaPlus />
        </button>
      </div>
    );
    return this.state.invalid_action ? (
      <Alert color="danger">Sorry but this action is forbidden!</Alert>
    ) : this.state.posts_array.length == 0 ? (
      this.state.is_loading ? (
        <></>
      ) : (
        <div>
          <div className="CarouselContainer">
            <Container>
              <Row>
                <big className="noPostsText">No Posts To Show</big>
              </Row>
            </Container>
          </div>
          {newPostComp}
        </div>
      )
    ) : (
      <>
        <div className="CarouselContainer">
          <Carousel indicators={false} interval={5000}>
            {this.state.posts_array.map(post => {
              return (
                <Carousel.Item key={post.key}>
                  <PostForm
                    post={post}
                    update_mode={true}
                    ref={ref => this.setPostFormRef(post.key, ref)}
                    onEditEnd={this.onClickEditEnd}
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
                            {post.data.dates.start_date} - <span>&nbsp;</span>
                            {post.data.dates.end_date}
                          </small>
                        </Row>
                        <Row>
                          <MdPlace />
                          <small>
                            {post.data.location.country}, <span>&nbsp;</span>
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
                              <div
                                className="postControlButton"
                                onClick={() => this.onClickSubs(post.key)}
                              >
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
                                onClick={() => this.onClickEditStart(post.key)}
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
        {newPostComp}
      </>
    );
  }
}
