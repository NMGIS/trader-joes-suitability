import { useEffect, useRef } from "react";

const MapView = () => {
  const mapRef = useRef(null);

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
        const map = new Map({
          basemap: "streets-navigation-vector",
        });

        const view = new MapView({
          container: mapRef.current,
          map,
          center: [-118.2437, 34.0522],
          zoom: 10,
        });

        const blockGroupsLayer = new FeatureLayer({
          url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population/FeatureServer/4",
          outFields: ["*"],
          popupTemplate: {
            title: "Block Group {GEOID}",
            content: `
              <b>Total Population:</b> {TOTPOP_CY}<br>
              <b>White:</b> {WHITE_CY}<br>
              <b>Black:</b> {BLACK_CY}<br>
              <b>Hispanic:</b> {HISPPOP_CY}
            `
        }
        });
        const tractsLayer = new FeatureLayer({
        url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population/FeatureServer/3",
        outFields: ["*"],
        popupTemplate: {
            title: "Census Tract {GEOID}",
            content: `
            <b>Total Population:</b> {TOTPOP_CY}<br>
            <b>White:</b> {WHITE_CY}<br>
            <b>Black:</b> {BLACK_CY}<br>
            <b>Hispanic:</b> {HISPPOP_CY}
          `
        }
        });
        const traderJoesLocations = new FeatureLayer({
        url: "https://services.arcgis.com/CkYmj4Spu6bZ7mge/arcgis/rest/services/Trader_Joes_Locations/FeatureServer",
        outFields: ["*"],
        popupTemplate: {
            title: "{Name}",
            content: `
            <b>Address:</b> {Address}<br>
            <b>City:</b> {City}<br>
            <b>State:</b> {State}<br>
            <b>Zipcode:</b> {Zipcode}
          `
        }
        });
        map.add(traderJoesLocations);
        map.add(blockGroupsLayer);
        map.add(tractsLayer);
      });
    };

    waitForArcGIS();
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}
    />
  );
};

export default MapView;
