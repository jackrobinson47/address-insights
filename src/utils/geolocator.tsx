export type GeoResult = {
    lat: number;
    lng: number;
    displayName: string;
};

const LOCATIONIQ_API_KEY = "pk.0c1a052ff7bf163dae62c4afe9476854"; // Free Account...

let debounceTimer: NodeJS.Timeout;

export const geocodeAddress = async (address?: string): Promise<GeoResult | null> => {
    if (!address) return null;

    const fetchGeo = async () => {
        const encoded = encodeURIComponent(address);

        try {
            // LocationIQ request:
            const locIQUrl = `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}&q=${encoded}&format=json&limit=1`;
            let res = await fetch(locIQUrl);
            if (res.ok) {
                const data = await res.json();
                if (data?.length > 0) {
                    return {
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon),
                        displayName: data[0].display_name,
                    };
                }
            }

            // Fallback to Nominatim : (I ran out of free requests during dev.)
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
            res = await fetch(nominatimUrl, {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "Address-Insights-App",
                },
            });
            const data = await res.json();
            if (data?.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    displayName: data[0].display_name,
                };
            }

            return null;
        } catch (error) {
            console.error("Geocoding error:", error);
            return null;
        }
    };

    // Debounce to reduce request calls while keeping 'dynamic' feel.
    return new Promise((resolve) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const result = await fetchGeo();
            resolve(result);
        }, 700);
    });
};
