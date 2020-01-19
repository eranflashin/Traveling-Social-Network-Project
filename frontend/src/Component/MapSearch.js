import React, { Component } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Map, TileLayer } from "react-leaflet";
import L, { geoJSON } from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import axios from "axios";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import jwt_decode from "jwt-decode";
import NumericInput from "react-numeric-input";
import { processDate } from "./PostForm";
import notAuth from "./Utils";

var GeoJSONParser = require("geojson");

var followedIcon = new L.Icon({
  iconUrl:
    "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var searchResIcon = new L.Icon({
  iconUrl:
    "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const convertToGeoJson = (res, user_id) => {
  const data = [];
  for (let [, value] of Object.entries(res.data)) {
    if (value.owner.id !== user_id) {
      data.push({
        dates: value.dates,
        username: value.owner.username,
        lat: value.location.waypoint.latitude,
        lng: value.location.waypoint.longitude,
        country: value.location.country,
        city: value.location.city
      });
    }
  }
  const result = GeoJSONParser.parse(data, {
    Point: ["lat", "lng"]
  });
  return result;
};

const somethingChanged = (prevState, thisState) => {
  if (
    !prevState.query_layer ||
    !prevState.dates_query ||
    !prevState.radius_query
  ) {
    return true;
  }
  if (thisState.radius_query != prevState.radius_query) {
    return true;
  }
  if (
    thisState.dates_query[0] != prevState.dates_query[0] ||
    thisState.dates_query[1] != prevState.dates_query[1]
  ) {
    return true;
  }
  if (thisState.query_layer.getLatLng() != prevState.query_layer.getLatLng()) {
    return true;
  }
  return false;
};

const searchForPartners = (latlng, dates, radius, user_id) => {
  axios.defaults.withCredentials = true;
  return axios
    .post(
      "http://127.0.0.1:5000/api/partner_search",
      {
        start_date: processDate(dates[0]),
        end_date: processDate(dates[1]),
        latitude: latlng.lat,
        longitude: latlng.lng,
        radius: radius
      },
      {
        headers: {
          Authorization: "Basic " + btoa(localStorage.usertoken + ":")
        }
      }
    )
    .then(res => {
      const result = convertToGeoJson(res, user_id);
      return result;
    })
    .catch(err => {
      if (err.response && err.response.status === 403) {
        return "notAuth";
      }
    });
};

const getFollowedGeoJson = user_id => {
  axios.defaults.withCredentials = true;
  return axios
    .get("http://127.0.0.1:5000/api/posts/get_all_and_of_followed", {
      headers: {
        Authorization: "Basic " + btoa(localStorage.usertoken + ":")
      }
    })
    .then(res => {
      return convertToGeoJson(res, user_id);
    })
    .catch(err => {
      if (err.response && err.response.status === 403) {
        return "notAuth";
      }
    });
};

export default class MapSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user_id: jwt_decode(localStorage.usertoken).id,
      followed_layer: null,
      query_layer: null,
      query_result_layer: null,
      dates_query: null,
      radius_query: null
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.followed_layer &&
      this.state.query_layer &&
      this.state.dates_query &&
      this.state.radius_query &&
      somethingChanged(prevState, this.state)
    ) {
      searchForPartners(
        this.state.query_layer.getLatLng(),
        this.state.dates_query,
        this.state.radius_query,
        this.state.user_id
      ).then(res => {
        if (res === "notAuth") {
          notAuth(this.props.history);
        } else {
          const map = this.mapRef.leafletElement;
          const query_res_layer = L.geoJSON(res, {
            pointToLayer: function(feature, latlng) {
              return L.marker(latlng, { icon: searchResIcon });
            },
            onEachFeature: function(feature, layer) {
              const popupText =
                "<big><b>Possible Partner:&nbsp" +
                feature.properties.username +
                "</b></big><br><b>Start Date:</b>&nbsp;" +
                feature.properties.dates.start_date +
                "<br><b>End Date:</b>&nbsp;" +
                feature.properties.dates.end_date +
                "<br><b>Country:</b>&nbsp;" +
                feature.properties.country +
                "<br><b>City:</b>&nbsp;" +
                feature.properties.city;
              layer.bindPopup(popupText, {
                closeButton: true,
                offset: L.point(0, -20)
              });
              layer.on("click", function() {
                layer.openPopup();
              });
            }
          });
          if (this.state.query_result_layer) {
            this.state.query_result_layer.remove();
          }
          this.setState({ query_result_layer: query_res_layer });
          query_res_layer.addTo(map);
        }
      });
    }
  }

  componentDidMount() {
    const map = this.mapRef.leafletElement;

    new GeoSearchControl({
      provider: new OpenStreetMapProvider(),
      autoComplete: true,
      style: "bar",
      autoCompleteDelay: 250,
      showMarker: false,
      showPopup: false,
      marker: {
        icon: new L.Icon.Default(),
        draggable: false
      },
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: "Please choose location",
      keepResult: true
    }).addTo(map);

    map.on("geosearch/showlocation", this.onFoundLocation.bind(this));
    map.on("click", this.onFoundLocation.bind(this));

    getFollowedGeoJson(this.state.user_id).then(res => {
      if (res === "notAuth") {
        notAuth(this.props.history);
      } else {
        const followedPostsLayer = L.geoJSON(res, {
          pointToLayer: function(feature, latlng) {
            return L.marker(latlng, { icon: followedIcon });
          },

          onEachFeature: function(feature, layer) {
            const popupText =
              "<big><b>Followed Traveler:&nbsp" +
              feature.properties.username +
              "</b></big><br><b>Start Date:</b>&nbsp;" +
              feature.properties.dates.start_date +
              "<br><b>End Date:</b>&nbsp;" +
              feature.properties.dates.end_date +
              "<br><b>Country:</b>&nbsp;" +
              feature.properties.country +
              "<br><b>City:</b>&nbsp;" +
              feature.properties.city;

            layer.bindPopup(popupText, {
              closeButton: true,
              offset: L.point(0, -20)
            });
            layer.on("click", function() {
              layer.openPopup();
            });
          }
        }).addTo(map);
        if (res.features.length == 1) {
          map.fitBounds(
            followedPostsLayer.getBounds().extend([[[51.51, -0.118]]])
          );
        } else if (res.features.length > 1) {
          map.fitBounds(followedPostsLayer.getBounds());
        }

        this.setState({
          followed_layer: followedPostsLayer
        });
      }
    });
  }

  onFoundLocation = e => {
    var marker = null;
    if ("marker" in e) {
      marker = e.marker;
    } else {
      marker = L.marker(e.latlng)
        .bindPopup(`latitude:${e.latlng.lat} , longitude:${e.latlng.lng}`, {
          closeButton: true,
          offset: L.point(0, -20)
        })
        .on("click", function() {
          marker.openPopup();
        });
    }
    const map = this.mapRef.leafletElement;
    if (this.state.query_layer) {
      this.state.query_layer.remove();
    }
    if (this.state.query_result_layer) {
      this.state.query_result_layer.remove();
    }
    const work_layer = marker.addTo(map);
    work_layer.addTo(map);
    this.setState({ query_layer: work_layer });
  };

  onChangeDates = dates => {
    if (dates != null) {
      if (dates[0] > dates[1]) {
        alert("Start-date must come before End-date");
        this.setState({ dates_query: null });
      } else {
        this.setState({ dates_query: dates });
      }
    } else {
      this.setState({ dates_query: null });
    }
  };

  render() {
    return (
      <div>
        <Container>
          <Row>
            <Col>
              <Row>
                <DateRangePicker
                  onChange={this.onChangeDates.bind(this)}
                  value={this.state.dates_query}
                  format="dd/MM/yyyy"
                  required={true}
                  minDate={new Date()}
                />
              </Row>
            </Col>
            <Col style={{ alignSelf: "center" }}>
              <Row>
                <NumericInput
                  className="form-control"
                  min={0}
                  max={35000}
                  value={this.state.radius_query}
                  onChange={(val, stringVal, input) => {
                    this.setState({ radius_query: val });
                  }}
                  format={val => {
                    return `${val} Km`;
                  }}
                  strict
                />
              </Row>
            </Col>
          </Row>
          <Row>
            <div className="leaflet-container mapSearchMapContainer">
              <Map
                zoom="10"
                ref={ref => (this.mapRef = ref)}
                center={[51.51, -0.118]}
                className="mapSearchMap"
                ref={ref => {
                  this.mapRef = ref;
                }}
              >
                <TileLayer
                  attribution="&amp;copy Google"
                  url={"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />
              </Map>
            </div>
          </Row>
        </Container>
      </div>
    );
  }
}
