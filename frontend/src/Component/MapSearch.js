import React, { Component } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Map, TileLayer } from "react-leaflet";
import ReactLeafletSearch from "react-leaflet-search";

export default class MapSearch extends Component {
  componentDidMount() {}

  showSearch = e => {
    console.log(e);
  };

  render() {
    return (
      <div>
        <Container>
          <Row>
            <Col>
              <Row>Date Range Picker</Row>
            </Col>
            <Col>
              <Row>Radius</Row>
            </Col>
          </Row>
          <Row>
            <div className="leaflet-container mapSearchMapContainer">
              <Map
                zoom="10"
                ref={ref => (this.mapRef = ref)}
                center={[51.51, -0.118]}
                className="mapSearchMap"
              >
                <TileLayer
                  attribution="&amp;copy Google"
                  url={"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />
                <div className="pointer"></div>
                <ReactLeafletSearch
                  position="topright"
                  provider="OpenStreetMap"
                  inputPlaceholder="Please choose a location"
                  handler={this.showSearch.bind(this)}
                  mapStateModifier="flyTo"
                  showPopup={false}
                  closeResultsOnClick={true}
                />
              </Map>
            </div>
          </Row>
        </Container>
      </div>
    );
  }
}
