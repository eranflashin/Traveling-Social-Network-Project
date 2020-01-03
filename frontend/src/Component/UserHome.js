import React, {Component} from 'react';
import axios from "axios";
import jwt_decode from "jwt-decode";


export class UserProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: 0,
            username: '',
            first_name: '',
            last_name: '',
            birth_date: '',
            email: '',
            image_file: '',
        };
    }

    componentDidMount() {
        const token = localStorage.usertoken;
        if (token) {
            const decoded = jwt_decode(token);
            this.setState({
                id: decoded.id
            });

            axios.defaults.withCredentials = true;
            axios.get('http://127.0.0.1:5000/api/users/' + decoded.id, {
                auth: {
                    username: localStorage.usertoken
                }
            }).then((response) => {
                this.setState({
                    username: response.data.username,
                    first_name: response.data.first_name,
                    last_name: response.data.last_name,
                    birth_date: response.data.birth_date,
                    email: response.data.email,
                    image_file: response.data.image_file,
                })
            }).catch(err => {
                if(err.status === 401){
                    console.log(err);
                    localStorage.removeItem('usertoken');
                }
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.componentDidMount();
        }
    }

    logOut(e) {
        e.preventDefault();
        axios.defaults.withCredentials = true;
        axios.get('http://127.0.0.1:5000/logout', {
            auth: {
                username: localStorage.usertoken
            }
        }).then(response => {
            localStorage.removeItem('usertoken');
            this.props.history.push('/');
        })
            .catch(err => {
                console.log(err)
            })
    }

    render() {
        return (

            <>
                <a href="" onClick={this.logOut.bind(this)} className="logout-button">
                    <span>Logout</span>
                </a>

                <div className="profile-block">

                    <img className="profile-img"
                         src={"http://127.0.0.1:5000" + this.state.image_file}
                         alt="profile image"/>
                    <h1 className="text-heading">{this.state.username}</h1>
                    <div className="text-secondary">
                        {this.state.first_name + " " + this.state.last_name}
                    </div>
                    <div className="text-secondary">
                        {this.state.birth_date}
                    </div>
                    <div className="text-secondary">
                        {this.state.email}
                    </div>

                </div>

            </>
        );
    }
}