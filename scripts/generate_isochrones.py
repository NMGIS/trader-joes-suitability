import geopandas as gpd
import openrouteservice
from shapely.geometry import shape
import os
import json
import time
from datetime import datetime

# Paths
base_dir = os.path.dirname(__file__)
locations_path = os.path.join(base_dir, "..", "public", "Locations.geojson")
isochrones_path = os.path.join(base_dir, "..", "public", "trader_joes_isochrones.geojson")
processed_log = os.path.join(base_dir, "..", "processing", "processed.txt")

# Load processed IDs if the log exists
if os.path.exists(processed_log):
    with open(processed_log, 'r') as f:
        processed_ids = set(f.read().splitlines())
else:
    processed_ids = set()

# Load locations
stores = gpd.read_file(locations_path)

# Load existing isochrones if the file exists
if os.path.exists(isochrones_path):
    existing_gdf = gpd.read_file(isochrones_path)
    isochrones = existing_gdf.to_dict("records")
else:
    isochrones = []

# Initialize ORS client
client = openrouteservice.Client(key=os.getenv('ORS_API_KEY'))

new_isos = []

# Process new locations
for idx, row in stores.iterrows():
    try:
        object_id = str(row['ObjectID'])
    except KeyError:
        raise KeyError("Your GeoJSON must have a field named 'ObjectID'")

    if object_id in processed_ids:
        print(f"Skipping already processed ObjectID {object_id}")
        continue

    coords = (row.geometry.x, row.geometry.y)

    try:
        response = client.isochrones(
            locations=[coords],
            profile='driving-car',
            range=[600],
            units='m',
            attributes=['total_pop'],
            interval=300
        )

        for feature in response['features']:
            props = feature['properties']
            geom = shape(feature['geometry'])
            new_isos.append({
                'sid': object_id,
                'tmin': int(props['value'] / 60),
                'geometry': geom
            })

        with open(processed_log, 'a') as f:
            f.write(object_id + '\n')

        print(f"Processed ObjectID {object_id}")
        time.sleep(1.2)

    except Exception as e:
        print(f"Error with ObjectID {object_id}: {e}")
        if "rate limit" in str(e).lower():
            print("Quota hit — exiting.")
            break

# Save combined GeoJSON
if new_isos:
    new_gdf = gpd.GeoDataFrame(new_isos, crs="EPSG:4326")
    combined = gpd.GeoDataFrame(isochrones + new_gdf.to_dict("records"), crs="EPSG:4326")
    combined.to_file(isochrones_path, driver='GeoJSON')
    print("Appended new isochrones to trader_joes_isochrones.geojson")
else:
    print("No new locations processed.")
