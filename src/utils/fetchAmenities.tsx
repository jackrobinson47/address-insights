export type Amenity = {
    type: string;
    name: string;
    lat: number;
    lng: number;
    walking: boolean;
};

const categories = [
    // Food & Drink
    "amenity=restaurant",
    "amenity=cafe",
    "amenity=bar",
    "amenity=pub",
    "amenity=fast_food",
    "amenity=coffee_shop",
    "amenity=food_court",
    "amenity=ice_cream",
    "amenity=biergarten",
    "amenity=brewery",
    "amenity=winery",

    // Shops
    "shop",

    // Recreation / Fun
    "leisure=park",
    "leisure=garden",
    "leisure=playground",
    "leisure=fitness_centre",
    "leisure=sports_centre",
    "leisure=gym",
    "leisure=stadium",
    "leisure=pitch",
    "leisure=track",
    "leisure=swimming_pool",
    "amenity=theatre",
    "amenity=cinema",
    "tourism=museum",
    "leisure=water_park",
    "tourism=attraction",
    "amenity=casino",
    "amenity=arcade",
    "amenity=nightclub",
    "tourism=theme_park",
    "tourism=gallery",
    "tourism=zoo",
    "tourism=aquarium",
    "amenity=planetarium",

    // Community / Public
    "amenity=library",
    "amenity=community_centre",
    "amenity=townhall",
    "amenity=post_office",
    "amenity=fuel",

    // Churches / Places of Worship
    "amenity=place_of_worship",
];


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
                  ${categories.map(cat => `node(around:${radius},${lat},${lng})[${cat}];`).join("\n  ")}
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
