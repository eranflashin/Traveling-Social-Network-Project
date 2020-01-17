import React, {Component} from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import {Button} from "react-bootstrap";
import {processDate} from "./PostForm";

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
        axios.get("http://127.0.0.1:5000/api/user/" + user_id, {
            headers: {
                Authorization: "Basic " + btoa(localStorage.usertoken + ":")
            }
        }).then(response => {
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
        }).catch(err => {
            axios.get("http://127.0.0.1:5000/api/user_by_id/" + user_id, {
                headers: {
                    Authorization: "Basic " + btoa(localStorage.usertoken + ":")
                }
            }).then(response => {
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
            }).catch(err => {
                alert("no such user")
            });
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.componentDidMount();
        }
    }

    unfollowUser() {
        alert("unfollowed");
        axios.post(
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
        ).then(response => {
            this.setState({is_following: false});
        }).catch(err => {alert("no such users")});
    }

    followUser() {
        alert("follow");
        axios.post(
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
        ).then(response => {
            this.setState({is_following: true});
        }).catch(err => {alert("no such users")});
    }

    render() {
        const user_details = (
            <>
                <Button variant="primary" onClick={this.unfollowUser.bind(this)}>
                    Unfollow
                </Button>

                <div className="text-light">
                    {this.state.first_name + " " + this.state.last_name}
                </div>
                <div className="text-light">{this.state.birth_date}</div>
                <div className="text-light">{this.state.email}</div>
            </>
        );

        const follow_button = (
            <Button variant="primary" onClick={this.followUser.bind(this)}>
                Follow
            </Button>
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
