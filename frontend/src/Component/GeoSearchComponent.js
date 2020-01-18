import React, { Component } from "react";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import { Map, TileLayer } from "react-leaflet";

export default class RegisterMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lat: 51.51,
      lon: -0.118
    };
    if (
      this.props.initLocation.lat != null &&
      this.props.initLocation.lon != null
    ) {
      this.state = this.props.initLocation;
    }
  }
  componentDidMount() {
    const map = this.mapRef.leafletElement;
    new GeoSearchControl({
      provider: new OpenStreetMapProvider(),
      autoComplete: true,
      style: "bar",
      autoCompleteDelay: 250,
      showMarker: true,
      showPopup: false,
      marker: {
        icon: new L.Icon.Default(),
        draggable: false
      },
      popupFormat: ({ query, result }) => result.label,
      maxMarkers: 1,
      retainZoomLevel: false,
      animateZoom: true,
      autoClose: true,
      searchLabel: "Where are you going?",
      keepResult: true
    }).addTo(map);

    map.on("geosearch/showlocation", this.onFoundLocation.bind(this));

    window.dispatchEvent(new Event("resize"));
  }

  onFoundLocation(e) {
    const locationRaw = e.location.raw;
    const city = locationRaw.address.hasOwnProperty("city")
      ? locationRaw.address.city
      : locationRaw.address.hasOwnProperty("county")
      ? locationRaw.address.county
      : locationRaw.address.hasOwnProperty("state")
      ? locationRaw.address.state
      : "";
    this.props.onResult({
      lat: locationRaw.lat,
      lon: locationRaw.lon,
      country: locationRaw.address.country,
      city: city
    });
  }

  render() {
    const center = [this.state.lat, this.state.lon];
    return (
      <Map zoom="10" ref={ref => (this.mapRef = ref)} center={center}>
        <TileLayer
          attribution="&amp;copy Google"
          url={"http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
      </Map>
    );
  }
}
