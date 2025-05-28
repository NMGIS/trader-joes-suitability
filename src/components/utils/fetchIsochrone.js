export async function fetchIsochrone(longitude, latitude, apiKey) {
  const response = await fetch("https://api.openrouteservice.org/v2/isochrones/driving-car", {
    method: "POST",
    headers: {
      "Authorization": "5b3ce3597851110001cf6248433d516d39b9479eb0e8be7a09d14a00",
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
