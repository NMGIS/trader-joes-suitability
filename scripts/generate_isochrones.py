import geopandas as gpd
import openrouteservice
from shapely.geometry import shape
import os
import time
from datetime import datetime
import pandas as pd

# Paths relative to repo structure
base_dir = os.path.dirname(__file__)
locations_path = os.path.join(base_dir, "..", "public", "Locations.geojson")
isochrones_path = os.path.join(base_dir, "..", "public", "trader_joes_isochrones.geojson")
processed_log = os.path.join(base_dir, "..", "processing", "processed.txt")

# Load processed ObjectIDs
if os.path.exists(processed_log):
    with open(processed_log, 'r') as f:
        processed_ids = set(f.read().splitlines())
else:
    processed_ids = set()

# Load store locations
stores = gpd.read_file(locations_path)

# Load existing isochrones if present
if os.path.exists(isochrones_path):
    existing_gdf = gpd.read_file(isochrones_path)
else:
    existing_gdf = gpd.GeoDataFrame(columns=["sid", "tmin", "geometry"], crs="EPSG:4326")

# Initialize ORS client
client = openrouteservice.Client(key=os.getenv('ORS_API_KEY'))

new_isos = []

# Process stores
for idx, row in stores.iterrows():
    try:
        object_id = str(row['ObjectID'])
    except KeyError:
        raise KeyError("GeoJSON must contain 'ObjectID' field")

    if object_id in processed_ids:
        print(f"Skipping already processed ObjectID {object_id}")
        continue

    coords = (row.geometry.x, row.geometry.y)

    try:
        response = client.isochrones(
            locations=[coords],
            profile='driving-car',
            range=[600],
            interval=300,
            units='m',
            attributes=['total_pop']
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
        time.sleep(1.2)  # avoid hitting ORS rate limits

    except Exception as e:
        print(f"Failed to process ObjectID {object_id}: {e}")
        if "rate limit" in str(e).lower() or "quota
