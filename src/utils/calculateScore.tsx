import { Amenity } from "./fetchAmenities";

export const calculateScores = (points: Amenity[], drivingRadius: number) => {
    // Separate points into walkable vs. drivable
    const walkablePoints = points.filter(p => p.walking);
    const drivablePoints = points.filter(p => !p.walking);

    /**
     * Walking score:
     * - Scale number of walkable points to a 0–10 range.
     * - Every 5 nearby walkable amenities adds +1.
     * - Max out at 10 for very dense walkable areas.
     */
    const walkingScore = Math.min(10, walkablePoints.length / 5);

    /**
     * Driving score:
     * - Scale number of drivable points to a 0–10 range.
     * - Every 10 drivable amenities adds +1.
     * - Max out at 10.
     */
    const drivingScore = Math.min(10, drivablePoints.length / 10);

    /**
     * Density calculation:
     * - Total amenities (walkable + drivable) per square km.
     * - drivingRadius is given in meters -> convert to km squared.
     */
    const density = points.length / (Math.PI * Math.pow(drivingRadius / 1000, 2));

    /**
     * Urban/Suburban/Rural classification:
     * - Urban: > 20 amenities per km squared.
     * - Suburban: 2–14 amenities per km squared.
     * - Rural: < 1 amenities per km squared.
     */
    let urbanSuburbanIndex = "Suburban";
    if (density > 15) urbanSuburbanIndex = "Urban";
    else if (density < 1) urbanSuburbanIndex = "Rural";

    return { walkingScore, drivingScore, urbanSuburbanIndex };
};
