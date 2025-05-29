import { useEffect, useRef, useState } from 'react';
import { fetchIsochrone } from '../utils/fetchIsochrone';

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

  const getInitialHeight = () => {
    return window.innerWidth <= 768 ? `${window.innerHeight * 0.6}px` : '100vh';
  };

  const [mapHeight, setMapHeight] = useState(getInitialHeight());

  useEffect(() => {
    modeRef.current = customPointMode;
  }, [customPointMode]);

  useEffect(() => {
    const handleResize = () => {
      setMapHeight(window.innerWidth <= 768 ? `${window.innerHeight * 0.6}px` : '100vh');
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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
        'esri/layers/GraphicsLayer',
        'esri/layers/GeoJSONLayer'
      ], (Map, MapView, FeatureLayer, PictureMarkerSymbol, SimpleRenderer, Graphic, GraphicsLayer, GeoJSONLayer) => {
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

        const driveTimeIsochrones = new GeoJSONLayer({
          url: "./trader_joes_isochrones.geojson",
          title: "Drive Time Isochrones",
          visible: true,
          minScale: 1000000,
          maxScale: 0,
          definitionExpression: "tmin > 5",  // Exclude 5-minute
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [102, 51, 153, 0.2],
              outline: { color: [153, 102, 51, 1], width: 1 }
            }
          }
        });

        const primaryGraphicsLayer = new GraphicsLayer({ title: 'Primary Analysis Graphics' });
        const comparisonGraphicsLayer = new GraphicsLayer({ title: 'Comparison Analysis Graphics' });

        map.addMany([
          walkabilityIndex,
          blockGroupsLayer,
          traderJoesLayer,
          primaryGraphicsLayer,
          comparisonGraphicsLayer,
          driveTimeIsochrones
        ]);

        setLayers({
          blockGroups: blockGroupsLayer,
          traderJoes: traderJoesLayer,
          walkability: walkabilityIndex,
          primaryGraphics: primaryGraphicsLayer,
          comparisonGraphics: comparisonGraphicsLayer,
          isochrones: driveTimeIsochrones
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
            if (window.innerWidth <= 768 && window.innerHeight > window.innerWidth && results.features.length > 0) {
              const allGeometries = results.features.map(f => f.geometry);
              window.require(['esri/geometry/geometryEngine'], (geometryEngine) => {
                const extent = geometryEngine.union(allGeometries).extent;
                view.goTo(extent.expand(1.2)); // Add padding
              });
            }

          });

          view.on('click', async (event) => {
            if (!modeRef.current) return;

            const point = {
              type: 'point',
              longitude: event.mapPoint.longitude,
              latitude: event.mapPoint.latitude
            };

            // Remove old marker and isochrone
            const oldPoint = view.graphics.items.find(g => g.attributes?.id === 'custom-analysis-point');
            if (oldPoint) view.graphics.remove(oldPoint);

            const existingIsoLayer = map.layers.find(l => l.title === 'Isochrone');
            if (existingIsoLayer) map.remove(existingIsoLayer);

            const [Graphic, GraphicsLayer] = await new Promise((resolve) =>
              window.require(['esri/Graphic', 'esri/layers/GraphicsLayer'], (...modules) => resolve(modules))
            );

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
              attributes: { id: 'custom-analysis-point' }
            });

            view.graphics.add(markerGraphic);

            if (setTemporaryGeometry) {
              setTemporaryGeometry(point);
            }

            // Fetch and render isochrone
            try {
              const data = await fetchIsochrone(point.longitude, point.latitude, "YOUR_ORS_API_KEY");
              const polygonCoords = data.features[0].geometry.coordinates[0];

              const isochroneGraphic = new Graphic({
                geometry: {
                  type: "polygon",
                  rings: polygonCoords,
                  spatialReference: { wkid: 4326 }
                },
                symbol: {
                  type: "simple-fill",
                  color: [102, 51, 153, 0.2],
                  outline: { color: [153, 102, 51, 1], width: 1 }
                }
              });

              const isoLayer = new GraphicsLayer({ title: 'Isochrone', id: 'custom-isochrone' });

              isoLayer.add(isochroneGraphic);
              map.add(isoLayer);
            } catch (err) {
              console.error("Isochrone fetch failed:", err);
            }
          });

        });
      });
    };

    waitForArcGIS();
  }, [setLayers, setStores, setTemporaryGeometry]);

  return <div ref={mapRef} style={{
    height: mapHeight,
    width: '100vw'
  }} />;
};

export default MapContainer;
