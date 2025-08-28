import {MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap, Tooltip} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import L from "leaflet";
import React, { useEffect } from "react";

export type PointOfInterest = {
    name?: string;
    lat: number;
    lng: number;
    type: string;
    walking: boolean;
};

type MapViewProps = {
    lat: number;
    lng: number;
    label?: string;
    points?: PointOfInterest[];
    walkingRadius?: number;
    drivingRadius?: number;
};

const MapUpdater: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 16);
    }, [lat, lng, map]);
    return null;
};

const MapElement: React.FC<MapViewProps> = ({ lat, lng, label, points, walkingRadius, drivingRadius }) => {
    const mainIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });

    return (
        <MapContainer center={[lat, lng]} zoom={16} style={{ width: "100%", height: "100%" }}>
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Main location */}
            <Marker position={[lat, lng]} icon={mainIcon}>
                <Popup>{label || "Selected Location"}</Popup>
            </Marker>

            {/* Radii */}
            {walkingRadius && (
                <Circle center={[lat, lng]} radius={walkingRadius} pathOptions={{ color: "green", opacity: 0.1 }} />
            )}
            {drivingRadius && (
                <Circle center={[lat, lng]} radius={drivingRadius} pathOptions={{ color: "gray", opacity: 0.1 }} />
            )}

            {/* Amenities with clustering */}
            {points && points.length > 0 && (
                <MarkerClusterGroup
                    showCoverageOnHover={false}
                    spiderfyOnMaxZoom={true}
                    iconCreateFunction={(cluster: any) => {
                        const markers = cluster.getAllChildMarkers();
                        const allWalking = markers.every((m: any) => m.options.walking);
                        const allDriving = markers.every((m: any) => !m.options.walking);
                        const color = allWalking ? "green" : allDriving ? "gray" : "green";

                        return L.divIcon({
                            html: `<div style="background:${color};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${cluster.getChildCount()}</div>`,
                            className: "cluster-marker",
                            iconSize: L.point(30, 30, true),
                        });
                    }}
                >
                    {points.map((point, i) => (
                        <CircleMarker
                            key={i}
                            center={[point.lat, point.lng]}
                            radius={4}
                            pathOptions={{ color: point.walking ? "green" : "gray", fillOpacity: 0.8 }}
                            {...{ walking: point.walking }}
                        >
                            <Tooltip direction="top" offset={[0, -5]}>
                                {!point.name || point.name === "Unnamed" ? point.type : point.name}
                            </Tooltip>

                        </CircleMarker>
                    ))}
                </MarkerClusterGroup>
            )}

            <MapUpdater lat={lat} lng={lng} />
        </MapContainer>
    );
};

export default MapElement;
