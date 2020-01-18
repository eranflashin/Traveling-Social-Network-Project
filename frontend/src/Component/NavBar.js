import React, {Component} from "react";
import {Link, withRouter} from "react-router-dom";
import axios from "axios";
import jwt_decode from "jwt-decode";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import {FaHome, FaUserAlt, FaMapMarkedAlt, FaSearch} from "react-icons/fa";
import {MdNotifications} from "react-icons/md";

import Popup from "reactjs-popup";
import "bootstrap/dist/css/bootstrap.min.css";

class Navbar extends Component {
    state = {
        current_user: 0,
        username: "",
        notifications: [],
        notifs_num: -2,
        suggestions: []
    };

    get_user() {
        axios.defaults.withCredentials = true;
        axios
            .get("http://127.0.0.1:5000/api/user_by_name/" + this.state.username, {
                headers: {
                    Authorization: "Basic " + btoa(localStorage.usertoken + ":")
                }
            })
            .then(response => {
                this.props.history.push(`/profile/` + response.data.id);
            })
            .catch(err => {
                alert("no user with this name");
            });
    }

    onChange(e) {
        this.setState({username: e.target.value});
        axios.defaults.withCredentials = true;
        axios
            .get("http://127.0.0.1:5000/api/usersearch/" + e.target.value, {
                headers: {
                    Authorization: "Basic " + btoa(localStorage.usertoken + ":")
                }
            })
            .then(response => {
                this.setState({suggestions: response.data.suggestions});
            })
            .catch(err => {
                this.setState({suggestions: []});
            });
    }

    logOut(e) {
        e.preventDefault();
        axios.defaults.withCredentials = true;
        axios
            .get("http://127.0.0.1:5000/logout", {
                headers: {
                    Authorization: "Basic " + btoa(localStorage.usertoken + ":")
                }
            })
            .then(response => {
                localStorage.removeItem("usertoken");
                this.props.history.push("/");
            })
            .catch(err => {
                console.log(err);
            });
    }

    handleNotifClick(notif_id) {
        //delete notification now that it is read
        return axios.delete("http://127.0.0.1:5000/api/notifications/delete/" + notif_id, {
            headers: {
                Authorization: "Basic " + btoa(localStorage.usertoken + ":")
            }
        }).catch(err => {
            return "invalid action";
        });

        //TODO:open post from notification

    }

    get_notifs() {
        axios
            .get(
                "http://127.0.0.1:5000/api/notafications/get/" + this.state.current_user,
                {
                    headers: {
                        Authorization: "Basic " + btoa(localStorage.usertoken + ":")
                    }
                }
            )
            .then(response => {
                if (response.data.notifications)
                    this.setState({notifications: response.data.notifications});

            })
            .catch(err => {
                console.log(err);
            });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.componentDidMount();
        }
    }

    componentDidMount() {
        const token = localStorage.usertoken;
        if (token) {
            const decoded = jwt_decode(token);
            axios
                .get("http://127.0.0.1:5000/api/notifications/num/" + decoded.id, {
                    headers: {
                        Authorization: "Basic " + btoa(localStorage.usertoken + ":")
                    }
                })
                .then(response => {
                    this.setState({notifs_num: response.data.num});
                })
                .catch(err => {
                    this.setState({notifs_num: -1});
                });
            this.setState({
                current_user: decoded.id
            });
        }
    }

    render() {
        let notif_arr = this.state.notifications.map(notif => {
            return (
                <div className="menu-item" onClick={() => this.handleNotifClick(notif.id)}>
                    {notif.name} : {notif.data}{" "}
                </div>
            );
        });

        let suggestions_arr = this.state.suggestions.map(sugg => {
            return <option value={sugg}/>;
        });

        return (
            <div>
                <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed justify-content-end">
                    <div className="collapse navbar-collapse justify-content-md-center col-md-13 ">
                        <ul className="navbar-nav nav-fill w-75">
                            <li className="nav-item">
                                <Link to="/mapsearch" className="nav-link">
                                    <FaMapMarkedAlt/> &nbsp; Map Search
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link to="/postfeed" className="nav-link">
                                    <FaHome/> &nbsp; Home
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link
                                    to={"/profile/" + this.state.current_user}
                                    className="nav-link"
                                >
                                    <FaUserAlt/> &nbsp; User
                                </Link>
                            </li>

                            <Form
                                inline
                                onSubmit={e => {
                                    e.preventDefault();
                                    this.get_user();
                                }}>
                                <input
                                    list="browsers"
                                    name="browser"
                                    onChange={this.onChange.bind(this)}/>

                                <datalist id="browsers">{suggestions_arr}</datalist>

                                <Button type="submit" variant="outline-secondary">
                                    <FaSearch/> &nbsp; Search
                                </Button>
                            </Form>

                            <li className="nav-item">
                                <a
                                    href=""
                                    onClick={this.logOut.bind(this)}
                                    className="logout-button">
                                    <span>Logout</span>
                                </a>
                            </li>

                            <li className="nav-item">
                                <Popup
                                    trigger={
                                        <Button type="button" className="btn btn-secondary  ">
                                            <MdNotifications/> &nbsp; Notifications &nbsp;&nbsp;
                                            <span className="badge badge-pill badge-light">
                                                {this.state.notifs_num}{" "}
                                            </span>
                                        </Button>
                                    }
                                    position="bottom center"
                                    closeOnDocumentClick
                                    onOpen={this.get_notifs.bind(this)}
                                    contentStyle={{padding: "0px", border: "none", borderRadius: "7px"}}>
                                    <div className="menu">
                                        {notif_arr}
                                        {!this.state.notifs_num ?
                                            (<div className="menu-item">
                                                no notifications
                                            </div>) : null}
                                    </div>
                                </Popup>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>
        );
    }
}

export default withRouter(Navbar);
