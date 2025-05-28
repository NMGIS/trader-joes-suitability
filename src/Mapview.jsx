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
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    if (isMobile) {
      setShowMobileSplash(true);
    }
  }, []);

  if (showMobileSplash || showInfoPopup) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--tj-bg)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2em',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '1.5em',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: 'var(--tj-text)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <h2 style={{ color: 'var(--tj-red)', marginBottom: '0.5em' }}>
            Trader Joe's Suitability Explorer
          </h2>
          <p>This application is not affiliated with Trader Joe’s and is for educational purposes only. Accuracy of data is not guaranteed.</p>
          <p>This application is designed for larger screens. Please visit this app on a desktop computer for enhanced functionality and a better viewing experience. Try rotating your phone.</p>
          <p>
            <a href="https://www.nevinm.com" target="_blank" rel="noopener noreferrer">Website</a> |{' '}
            <a href="https://github.com/NMGIS" target="_blank" rel="noopener noreferrer">GitHub</a> |{' '}
            <a href="https://www.linkedin.com/in/nevinmcintyregis" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </p>
          <button
            style={{
              marginTop: '1em',
              backgroundColor: 'var(--tj-red)',
              color: 'white',
              border: 'none',
              padding: '0.6em 1.2em',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => {
              setShowMobileSplash(false);
              setShowInfoPopup(false);
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? 'mobile-scroll-wrapper' : ''}>
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

      <button
        onClick={() => setShowInfoPopup(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1500,
          backgroundColor: '#24a0ed',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          fontSize: '10px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          cursor: 'pointer'
        }}
        title="Info / Disclaimer"
      >
        i
      </button>


    </div>
  );
};

export default MapView;
