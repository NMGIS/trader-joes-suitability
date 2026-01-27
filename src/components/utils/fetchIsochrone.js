export async function fetchIsochrone(longitude, latitude) {
  const apiKey = import.meta.env.VITE_ORS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing VITE_ORS_API_KEY environment variable");
  }

  const response = await fetch("https://api.openrouteservice.org/v2/isochrones/driving-car", {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      locations: [[longitude, latitude]],
      range: [600],
      units: "mi",
      attributes: ["area", "reachfactor"]
    })
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new Error("ORS isochrone request failed");
  }

  return await response.json();
}
