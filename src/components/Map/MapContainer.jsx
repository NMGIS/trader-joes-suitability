import { useEffect, useRef } from 'react';

const hollowRenderer = {
  type: 'simple',
  symbol: {
    type: 'simple-fill',
    color: [0, 0, 0, 0],  // transparent fill
    outline: {
      color: [0, 0, 0, 0.4],  // black at 20% opacity
      width: 0.5
    }

  }
};

const MapContainer = ({ setLayers, setStores }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    const waitForArcGIS = () => {
      if (!window.require) {
        setTimeout(waitForArcGIS, 100);
        return;
      }

      window.require([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/FeatureLayer'
      ], (Map, MapView, FeatureLayer) => {
        const map = new Map({ basemap: 'topo-vector' });

        const view = new MapView({
          container: mapRef.current,
          map,
          center: [-101.0, 39.8283], // Geographic center of the continental US
          zoom: 4                      // Broad national scale
        });

        const blockGroupsLayer = new FeatureLayer({
          url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population/FeatureServer/4',
          outFields: ['*'],
          title: 'Block Groups',
          renderer: hollowRenderer,
          visible: true
        });

        const tractsLayer = new FeatureLayer({
          url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_2020_DHC_Total_Population/FeatureServer/3',
          outFields: ['*'],
          title: 'Census Tracts',
          renderer: hollowRenderer,
          visible: true
        });

        const traderJoesLayer = new FeatureLayer({
          url: 'https://services.arcgis.com/CkYmj4Spu6bZ7mge/arcgis/rest/services/Trader_Joes_Locations/FeatureServer/0',
          outFields: ['*'],
          title: 'Trader Joe’s',
          visible: true
        });

        map.addMany([blockGroupsLayer, tractsLayer, traderJoesLayer]);
        setLayers({
          blockGroups: blockGroupsLayer,
          tracts: tractsLayer,
          traderJoes: traderJoesLayer
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
        });
      });
    };

    waitForArcGIS();
  }, [setLayers, setStores]);

  return <div ref={mapRef} style={{ height: '100vh', width: '100vw' }} />;
};

export default MapContainer;