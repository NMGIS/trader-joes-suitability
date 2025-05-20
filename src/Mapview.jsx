// 🔷 Imports and component setup
import { useEffect, useRef, useState } from "react";

// 🔷 MapView Component
const MapView = () => {
  // 🔹 References and State
  const mapRef = useRef(null);
  const [layers, setLayers] = useState({});
  const [totalHouseholds, setTotalHouseholds] = useState(0);

  // 🔷 Load ArcGIS API and Initialize Map + Layers
  useEffect(() => {
    const waitForArcGIS = () => {
      if (!window.require) {
        setTimeout(waitForArcGIS, 100);
        return;
      }

      window.require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
      ], function (Map, MapView, FeatureLayer) {
        // 🔹 Create map and view
        const map = new Map({
          basemap: "streets-navigation-vector",
        });

        const view = new MapView({
          container: mapRef.current,
          map,
          center: [-118.2437, 34.0522],
          zoom: 10,
        });

        // 🔹 Define layers
        const blockGroupsLayer = new FeatureLayer({
          url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population/FeatureServer/4",
          outFields: ["*"],
          title: "Block Groups",
          popupTemplate: {
            title: "Block Group {GEOID}",
            content: `
              <b>Total Population:</b> {TOTPOP_CY}<br>
              <b>White:</b> {WHITE_CY}<br>
              <b>Black:</b> {BLACK_CY}<br>
              <b>Hispanic:</b> {HISPPOP_CY}
            `,
          },
          visible: true,
        });

        const tractsLayer = new FeatureLayer({
          url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population/FeatureServer/3",
          outFields: ["*"],
          title: "Census Tracts",
          popupTemplate: {
            title: "Census Tract {GEOID}",
            content: `
              <b>Total Population:</b> {TOTPOP_CY}<br>
              <b>White:</b> {WHITE_CY}<br>
              <b>Black:</b> {BLACK_CY}<br>
              <b>Hispanic:</b> {HISPPOP_CY}
            `,
          },
          visible: true,
        });

        const traderJoesLayer = new FeatureLayer({
          url: "https://services.arcgis.com/CkYmj4Spu6bZ7mge/arcgis/rest/services/Trader_Joes_Locations/FeatureServer",
          outFields: ["*"],
          title: "Trader Joe’s",
          popupTemplate: {
            title: "{Name}",
            content: `
              <b>Address:</b> {Address}<br>
              <b>City:</b> {City}<br>
              <b>State:</b> {State}
            `,
          },
          visible: true,
        });

        // 🔹 Add layers to map and store in state
        map.addMany([blockGroupsLayer, tractsLayer, traderJoesLayer]);

        setLayers({
          blockGroups: blockGroupsLayer,
          tracts: tractsLayer,
          traderJoes: traderJoesLayer,
        });

        // 🔷 Setup events and household logic
        view.when(() => {
          // 🔹 Track household target from slider
          let householdTarget = 10000;
          let selectedGraphic = null;

          document.querySelector("input[type=range]").addEventListener("input", (e) => {
            householdTarget = parseInt(e.target.value, 10);
            document.getElementById("slider-value").textContent = householdTarget.toLocaleString();
          });

          // 🔹 Click a Trader Joe’s to build selection
          view.on("click", async (event) => {
            const response = await view.hitTest(event);
            const result = response.results.find((r) => r.graphic?.layer?.title === "Trader Joe’s");
            if (!result) return;

            const storePoint = result.graphic.geometry;

            const query = blockGroupsLayer.createQuery();
            query.returnGeometry = true;
            query.outFields = ["GEOID", "H0010001"];
            query.geometry = storePoint;
            query.distance = 50;
            query.units = "miles";
            query.spatialRelationship = "intersects";

            const all = await blockGroupsLayer.queryFeatures(query);

            const features = all.features
              .map((f) => {
                f.distance = Math.sqrt(
                  Math.pow(storePoint.latitude - f.geometry.latitude, 2) +
                  Math.pow(storePoint.longitude - f.geometry.longitude, 2)
                );
                return f;
              })
              .sort((a, b) => a.distance - b.distance);

            let selected = [];
            let total = 0;

            for (const f of features) {
              const h = f.attributes.H0010001 || 0;
              total += h;
              selected.push(f);
              if (total >= householdTarget) break;
            }

            const Graphic = await window.require("esri/Graphic");
            if (selectedGraphic) {
              view.graphics.removeMany(selectedGraphic);
            }

            selectedGraphic = selected.map((f) => {
              return new Graphic({
                geometry: f.geometry,
                attributes: f.attributes,
                symbol: {
                  type: "simple-fill",
                  color: [255, 165, 0, 0.4],
                  outline: {
                    color: "#000000",
                    width: 1,
                  },
                },
              });
            });

            view.graphics.addMany(selectedGraphic);
            setTotalHouseholds(total);
          });

          // 🔹 Store view reference globally
          window.view = view;
        });
      });
    };

    waitForArcGIS();
  }, []);

  // 🔷 Toggle Layer Visibility
  const toggleLayer = (layerKey) => {
    const layer = layers[layerKey];
    if (layer) {
      layer.visible = !layer.visible;
      setLayers((prev) => ({ ...prev }));
    }
  };

  // 🔷 Render UI: Sidebar and Map Container
  return (
    <>
      {/* 🧩 Sidebar UI */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "white",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          width: "220px",
          color: "#000000",
        }}
      >
        {/* 🔹 Layer Toggles */}
        <h4>Layers</h4>
        <label>
          <input
            type="checkbox"
            checked={layers.blockGroups?.visible ?? false}
            onChange={() => toggleLayer("blockGroups")}
          />
          Block Groups
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={layers.tracts?.visible ?? false}
            onChange={() => toggleLayer("tracts")}
          />
          Census Tracts
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={layers.traderJoes?.visible ?? false}
            onChange={() => toggleLayer("traderJoes")}
          />
          Trader Joe’s
        </label>

        <hr />
        {/* 🔹 Household Slider */}
        <h4>Household Target</h4>
        <p style={{ marginBottom: "4px" }}>
          <strong id="slider-value">10,000</strong> households
        </p>
        <input
          type="range"
          min="5000"
          max="50000"
          step="1000"
          defaultValue="10000"
          onInput={(e) => {
            const count = parseInt(e.target.value, 10);
            document.getElementById("slider-value").textContent = count.toLocaleString();
          }}
          style={{ width: "100%" }}
        />
        <p style={{ fontSize: "0.9em" }}>
          Adjust slider, then click a Trader Joe’s
        </p>

        {/* 🔹 Household Count Display */}
        <p style={{ fontSize: "0.9em", marginTop: "10px" }}>
          <strong>Selected Households:</strong><br />
          {totalHouseholds > 0 ? totalHouseholds.toLocaleString() : "None"}
        </p>

        {/* 🔹 Reset Button */}
        <button
          style={{
            marginTop: "8px",
            padding: "6px 12px",
            background: "#eee",
            border: "1px solid #aaa",
            borderRadius: "4px",
            cursor: "pointer",
            color: "#000000",
          }}
          onClick={() => {
            setTotalHouseholds(0);
            if (window.view) {
              window.view.graphics.removeAll();
            }
          }}
        >
          Reset Selection
        </button>
      </div>

      {/* 🗺️ Map container */}
      <div
        ref={mapRef}
        style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}
      />
    </>
  );
};

export default MapView;
