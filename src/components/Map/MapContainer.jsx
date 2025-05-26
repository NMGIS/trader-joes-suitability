import { useEffect, useRef } from 'react';

const hollowRenderer = {
  type: 'simple',
  symbol: {
    type: 'simple-fill',
    color: [0, 0, 0, 0],  // transparent fill
    outline: {
      color: [0, 0, 0, 0.4],
      width: 0.5
    }
  }
};

const MapContainer = ({ setLayers, setStores, setTemporaryGeometry, customPointMode }) => {
  const mapRef = useRef(null);
  const modeRef = useRef(customPointMode);

  useEffect(() => {
    modeRef.current = customPointMode;
  }, [customPointMode]);

  useEffect(() => {
    const waitForArcGIS = () => {
      if (!window.require) {
        setTimeout(waitForArcGIS, 100);
        return;
      }

      window.require([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/FeatureLayer',
        'esri/symbols/PictureMarkerSymbol',
        'esri/renderers/SimpleRenderer',
        'esri/Graphic',
        'esri/layers/GraphicsLayer'
      ], (Map, MapView, FeatureLayer, PictureMarkerSymbol, SimpleRenderer, Graphic, GraphicsLayer) => {
        const map = new Map({ basemap: 'topo-vector' });

        const view = new MapView({
          container: mapRef.current,
          map,
          center: [-101.0, 39.8283],
          zoom: 5
        });

        const blockGroupsLayer = new FeatureLayer({
          url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population/FeatureServer/4',
          outFields: ['*'],
          title: 'Block Groups',
          renderer: hollowRenderer,
          visible: true
        });

        const walkabilityIndex = new FeatureLayer({
          url: 'https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0',
          outFields: ['*'],
          title: 'Walkability Index',
          visible: false,
          minScale: 200000,
          maxScale: 0
        });

        const censusTractLayer = new FeatureLayer({
          url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Esri_Updated_Demographics_Variables/FeatureServer/4',
          outFields: ['*'],
          title: 'Census Tract Demographics',
          visible: false,
          renderer: hollowRenderer,
          minScale: 250000
        });

        const tjSymbol = new PictureMarkerSymbol({
          url: 'https://raw.githubusercontent.com/NMGIS/trader-joes-suitability/main/public/tjIcon.png',
          width: '24px',
          height: '24px'
        });

        const tjRenderer = new SimpleRenderer({ symbol: tjSymbol });

        const traderJoesLayer = new FeatureLayer({
          url: 'https://services.arcgis.com/CkYmj4Spu6bZ7mge/arcgis/rest/services/Trader_Joes_Locations/FeatureServer/0',
          outFields: ['*'],
          title: 'Trader Joe’s',
          visible: true,
          renderer: tjRenderer,
          labelingInfo: [{
            labelExpressionInfo: {
              expression: "$feature.StoreNo"
            },
            symbol: {
              type: "text",
              color: "#444",
              haloColor: "white",
              haloSize: "1.5px",
              font: {
                size: 11,
                family: "sans-serif",
                weight: "bold"
              },
              xoffset: 0,
              yoffset: -2
            },
            labelPlacement: "above-center",
            minScale: 200000
          }],
          labelsVisible: true
        });

        // --- NEW: Create separate graphics layers ---
        const primaryGraphicsLayer = new GraphicsLayer({ title: 'Primary Analysis Graphics' });
        const comparisonGraphicsLayer = new GraphicsLayer({ title: 'Comparison Analysis Graphics' });

        map.addMany([
          walkabilityIndex,
          blockGroupsLayer,
          traderJoesLayer,
          primaryGraphicsLayer,
          comparisonGraphicsLayer
        ]);

        setLayers({
          blockGroups: blockGroupsLayer,
          traderJoes: traderJoesLayer,
          walkability: walkabilityIndex,
          primaryGraphics: primaryGraphicsLayer,
          comparisonGraphics: comparisonGraphicsLayer
        });

        view.when(() => {
          window.view = view;

          traderJoesLayer.queryFeatures({
            returnGeometry: true,
            outFields: ['StoreNo', 'State'],
            where: '1=1'
          }).then((results) => {
            const features = results.features.map((f) => ({
              geometry: f.geometry,
              storeNo: String(f.attributes.StoreNo),
              state: f.attributes.State
            }));
            setStores(features);
          });

          view.on('click', (event) => {
            if (!modeRef.current) return;

            const point = {
              type: 'point',
              longitude: event.mapPoint.longitude,
              latitude: event.mapPoint.latitude
            };

            // Remove old point marker only
            const oldPoint = view.graphics.items.find(g => g.attributes?.id === 'custom-analysis-point');
            if (oldPoint) view.graphics.remove(oldPoint);

            const markerGraphic = new Graphic({
              geometry: point,
              symbol: {
                type: "simple-marker",
                style: "circle",
                color: [255, 0, 0, 0.8],
                size: 12,
                outline: {
                  color: "black",
                  width: 3
                }
              },
              attributes: {
                id: 'custom-analysis-point'
              }
            });

            view.graphics.add(markerGraphic);

            if (setTemporaryGeometry) {
              setTemporaryGeometry(point);
            }
          });
        });
      });
    };

    waitForArcGIS();
  }, [setLayers, setStores, setTemporaryGeometry]);

  return <div ref={mapRef} style={{
    height: window.innerWidth <= 768 ? '60vh' : '100vh',
    width: '100vw'
  }} />;
};

export default MapContainer;
