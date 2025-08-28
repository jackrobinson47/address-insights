import './App.css';
import MapElement from "./components/MapElement";
import { useEffect, useState } from "react";
import { geocodeAddress, GeoResult } from "./utils/geolocator";
import { Amenity, fetchNearbyAmenitiesAndBusinesses } from "./utils/fetchAmenities";
import { calculateScores } from "./utils/calculateScore";

const baseLocation: GeoResult = {
    lat: 25.7744853,
    lng: -80.1920912,
    displayName: "Rent Engine HQ"
};

function App() {
    // Search Bar:
    const [address, setAddress] = useState<string>("");
    // GEO info from search bar:
    const [loadedGeo, setLoadedGeo] = useState<GeoResult | null>(null);
    const [inferredAddress, setInferredAddress] = useState<string>();
    // GEO info for Map:
    const [geoLocation, setGeoLocation] = useState<GeoResult | null>(null);
    const [points, setPoints] = useState<Amenity[]>([]);
    const [scores, setScores] = useState<{ walkingScore: number, drivingScore: number, urbanSuburbanIndex: string } | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Initialize history from localStorage.
    const [history, setHistory] = useState<string[]>(() => {
        const stored = localStorage.getItem("addressHistory");
        return stored ? JSON.parse(stored) : [];
    });

    // Validate history to localStorage whenever it changes.
    useEffect(() => {
        localStorage.setItem("addressHistory", JSON.stringify(history));
    }, [history]);

    // Fetch geocoding info whenever address changes.
    useEffect(() => {
        const fetchGeo = async () => {
            if (!address) return;

            const geo = await geocodeAddress(address);
            if (geo) {
                setLoadedGeo(geo);
                setInferredAddress(geo.displayName);
            } else {
                setLoadedGeo(null);
                setInferredAddress("No results");
            }
        };

        void fetchGeo();
    }, [address]);

    // Fetch nearby amenities and scores whenever geoLocation changes.
    useEffect(() => {
        const fetchScores = async () => {
            if (!geoLocation) return;

            const nearbyPoints = await fetchNearbyAmenitiesAndBusinesses(geoLocation.lat, geoLocation.lng, 500);
            setPoints(nearbyPoints);

            const newScores = calculateScores(nearbyPoints, 2000);
            setScores(newScores);
            setLoading(false);
        };

        void fetchScores();
    }, [geoLocation]);

    // Handle clicking GO button or selecting from history.
    const handleGo = (geo?: GeoResult) => {
        const selectedGeo = geo || loadedGeo;
        if (!selectedGeo) return;

        // Compare with current geoLocation to avoid redundant calculation.
        if (
            geoLocation &&
            geoLocation.lat === selectedGeo.lat &&
            geoLocation.lng === selectedGeo.lng
        ) {
            // Already at this location, no need to recalc...
            return;
        }

        setScores(null);
        setLoading(true);
        setGeoLocation(selectedGeo);

        if (selectedGeo.displayName) {
            setHistory(prev => {
                const newHistory = [selectedGeo.displayName, ...prev.filter(h => h !== selectedGeo.displayName)];
                return newHistory.slice(0, 10); // keep last 10...
            });
        }
    };


    return (
        <div className="app-background">
            <div className="app-container">

                {/* SCORE */}
                <div className="score-container">
                    <header className="text-bold">Address Insights</header>

                    {!address && (
                        <p className="text-regular">* Please enter an Address to calculate score.</p>
                    )}

                    {/* Loading or Scores */}
                    {geoLocation && loading && (
                        <p className="text-subtitle">Calculating...</p>
                    )}

                    {!loading && scores && (
                        <>
                            {/* Walking Score */}
                            <p className="text-subtitle">
                                Walking Score (Green Radius):{" "}
                                <span
                                    style={{
                                        color:
                                            scores.walkingScore <= 3
                                                ? "darkRed"
                                                : scores.walkingScore <= 6
                                                    ? "darkOrange"
                                                    : scores.walkingScore <= 8
                                                        ? "darkYellow"
                                                        : "darkGreen",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {scores.walkingScore.toFixed(1)}
                                </span>
                            </p>

                            {/* Driving Score */}
                            <p className="text-subtitle">
                                Driving Score (Grey Radius):{" "}
                                <span
                                    style={{
                                        color:
                                            scores.drivingScore <= 3
                                                ? "red"
                                                : scores.drivingScore <= 6
                                                    ? "orange"
                                                    : scores.drivingScore <= 8
                                                        ? "yellow"
                                                        : "green",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {scores.drivingScore.toFixed(1)}
                                </span>
                            </p>

                            <p className="text-subtitle">
                                Urban/Suburban Index: {scores.urbanSuburbanIndex}
                            </p>

                            {/* Total Nearby Spots */}
                            <p className="text-subtitle">
                                Nearby Spots:{" "}
                                <span style={{ fontWeight: "bold" }}>{points.length}</span>
                            </p>
                        </>

                    )}

                    {/* HISTORY */}
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', width: '100%' }}>
                        <h2 className="text-less-bold">History</h2>
                        {history.length > 0 && (<div className="text-regular"> * Select an item to auto fill address.</div>)}
                        {history.length > 0 && (
                            <div className="history-container text-light" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                    {history.map((h, i) => (
                                        <li
                                            key={i}
                                            className="history-item text-subtitle"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setAddress(h)}
                                        >
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                </div>

                {/* MAP & LABEL */}
                <div className="map-container">
                    <div className="map-wrapper">
                        <MapElement
                            lat={geoLocation?.lat ?? baseLocation.lat}
                            lng={geoLocation?.lng ?? baseLocation.lng}
                            label={geoLocation?.displayName ?? baseLocation.displayName}
                            points={points}
                            walkingRadius={500}
                            drivingRadius={2000}
                        />
                    </div>

                    {/* Input row */}
                    <div className="map-input-row">
                        <input
                            className="map-label text-regular"
                            placeholder=" * Enter Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />

                        {/* Only show GO button when there’s a valid-inferred address */}
                        {inferredAddress && inferredAddress !== "No results" && (
                            <button className="go-button" onClick={() => handleGo()}>
                                GO
                            </button>
                        )}

                        {/* Show inferred address on the same line */}
                        {address && inferredAddress && (
                            <p className="text-light">{inferredAddress}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
