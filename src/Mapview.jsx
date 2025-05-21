import { useState, useEffect } from 'react';
import MapContainer from './components/Map/MapContainer';
import Sidebar from './components/Map/Sidebar';

const MapView = () => {
  const [layers, setLayers] = useState({});
  const [stores, setStores] = useState([]);
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [selectedState, setSelectedState] = useState('');
  const [householdTarget, setHouseholdTarget] = useState(10000);
  const [selectedGeometry, setSelectedGeometry] = useState(null);
  const [customPointMode, setCustomPointMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const [showMobileSplash, setShowMobileSplash] = useState(false);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setShowMobileSplash(true);
    }
  }, []);

  if (showMobileSplash) {
    return (
      <div className="mobile-splash">
        <div className="mobile-splash-box">
          <h2>This map is best viewed on a desktop</h2>
          <p>
            This application is designed for larger screens. Please visit this app on a desktop computer for enhanced functionality and a better viewing experience.
          </p>
          <button onClick={() => setShowMobileSplash(false)}>
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

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
        selectedGeometry={selectedGeometry}
        setSelectedGeometry={setSelectedGeometry}
        customPointMode={customPointMode}
        setCustomPointMode={setCustomPointMode}
        showSidebar={showSidebar}
      />

      <MapContainer
        setLayers={setLayers}
        setStores={setStores}
        setTemporaryGeometry={setSelectedGeometry}
        customPointMode={customPointMode}
      />
    </>
  );
};

export default MapView;
