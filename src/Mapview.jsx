import { useState } from 'react';
import MapContainer from './components/Map/MapContainer';
import Sidebar from './components/Map/Sidebar';

const MapView = () => {
  const [layers, setLayers] = useState({});
  const [stores, setStores] = useState([]);
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [selectedState, setSelectedState] = useState('');
  const [householdTarget, setHouseholdTarget] = useState(10000);

  return (
    <>
      <Sidebar
        layers={layers}
        setLayers={setLayers}
        stores={stores}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        totalHouseholds={totalHouseholds}
        setTotalHouseholds={setTotalHouseholds}
        householdTarget={householdTarget}
        setHouseholdTarget={setHouseholdTarget}
      />
      <MapContainer
        layers={layers}
        setLayers={setLayers}
        setStores={setStores}
        householdTarget={householdTarget}
        setTotalHouseholds={setTotalHouseholds}
      />
    </>
  );
};

export default MapView;
