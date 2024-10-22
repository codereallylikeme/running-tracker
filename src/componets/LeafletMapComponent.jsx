import React, { useRef, useEffect } from "react";
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import 'leaflet-defaulticon-compatibility';
import L from "leaflet";
import 'leaflet-loading'



// Define an icon for the marker (default Leaflet marker icon)
const userIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.6.0/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LeafletMapComponent = ({ userLocation, route ,center}) => {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [userLocation]);

  return (
    <MapContainer 
       loadingControl={true}
      center={[userLocation.lat, userLocation.lng]}
      zoom={13}
      style={{ height: "400px", width: "450px", objectFit: "cover"}}
      ref={mapRef}
    >
      {/* OpenStreetMap Tiles */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Marker showing the current location */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />

      {/* Polyline to show the running route */}
      {route.length > 1 && <Polyline positions={route} color="blue" />}
    </MapContainer>
  );
};

export default LeafletMapComponent;
