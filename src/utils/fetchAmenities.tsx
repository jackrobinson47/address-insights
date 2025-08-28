export type Amenity = {
    type: string;
    name: string;
    lat: number;
    lng: number;
    walking: boolean;
};

export const fetchNearbyAmenitiesAndBusinesses = async (
    lat: number,
    lng: number,
    walkRadius: number = 500,
    driveRadius: number = 2000
): Promise<Amenity[]> => {

    const fetchAmenities = async (radius: number, walking: boolean) => {
        // Overpass API call:
        const query = `
            [out:json];
            (
                node(around:${radius},${lat},${lng})[amenity];
                node(around:${radius},${lat},${lng})[shop];
            );
            out;
        `;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            return data.elements.map((el: any) => ({
                type: el.tags.amenity || el.tags.shop,
                name: el.tags.name || "Unnamed",
                lat: el.lat,
                lng: el.lon,
                walking: walking,
            }));
        } catch (error) {
            console.error("Amenities/Businesses fetch error:", error);
            return [];
        }
    };

    const walkingAmenities = await fetchAmenities(walkRadius, true);
    const drivingAmenities = await fetchAmenities(driveRadius, false);

    // Use a Map to remove duplicates based on lat/lng
    const uniqueMap = new Map<string, Amenity>();

    [...walkingAmenities, ...drivingAmenities].forEach(a => {
        const key = `${a.lat.toFixed(6)}-${a.lng.toFixed(6)}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, a);
        }
    });

    return Array.from(uniqueMap.values());
};
