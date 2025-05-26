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

  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [showMobileSplash, setShowMobileSplash] = useState(false);
  const [hasDismissedSplash, setHasDismissedSplash] = useState(false);

  const isMobile = screenWidth <= 768;

  // Track screen resizing or orientation changes
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Control splash visibility
  useEffect(() => {
    if (isMobile && !hasDismissedSplash) {
      setShowMobileSplash(true);
    } else {
      setShowMobileSplash(false);
    }
  }, [isMobile, hasDismissedSplash]);

  if (showMobileSplash) {
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
            This map is best viewed on a desktop
          </h2>
          <p>
            This application is designed for larger screens. Please visit this app on a desktop computer for enhanced functionality and a better viewing experience.
          </p>
          <p>TRY ROTATING YOUR PHONE</p>
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
              setHasDismissedSplash(true);
            }}
          >
            Continue Anyway
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

      {(!isMobile || hasDismissedSplash) && (
        <MapContainer
          setLayers={setLayers}
          setStores={setStores}
          setTemporaryGeometry={setSelectedGeometry}
          customPointMode={customPointMode}
        />
      )}
    </div>
  );

};

export default MapView;
