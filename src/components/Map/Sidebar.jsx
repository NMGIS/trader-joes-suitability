import { useState, useEffect } from 'react';
import LayerToggles from './LayerToggles';
import StoreDropdown from './StoreDropdown';
import HouseholdSlider from './HouseholdSlider';
import { selectNearbyBlockGroups } from '../utils/selectNearbyBlockGroups';

const Sidebar = ({
  layers,
  setLayers,
  stores,
  selectedState,
  setSelectedState,
  totalHouseholds,
  setTotalHouseholds,
  householdTarget,
  setHouseholdTarget,
  selectedGeometry,
  setSelectedGeometry,
  customPointMode,
  setCustomPointMode,
  showSidebar,
}) => {
  const [selectedStore, setSelectedStore] = useState('');
  const [demographics, setDemographics] = useState({
    totalPop: 0,
    totalAlone: 0,
    avgMedianAge: 0,
    avgPopDensity: 0 // Added pop density
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [showDemographicsOnly, setShowDemographicsOnly] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!selectedGeometry || !layers.blockGroups || !window.view) return;

    selectNearbyBlockGroups({
      center: selectedGeometry,
      layer: layers.blockGroups,
      view: window.view,
      householdTarget,
      onResult: (graphics, total, demo) => {
        const customPoint = window.view.graphics.items.find(g => g.attributes?.id === 'custom-analysis-point');
        window.view.graphics.removeAll();
        if (customPoint) window.view.graphics.add(customPoint);

        window.view.graphics.addMany(graphics);
        setTotalHouseholds(total);
        setDemographics(demo);
      }
    });
  }, [householdTarget, selectedGeometry, layers]);

  const handleCancelCustomPoint = () => {
    window.view.graphics.removeAll();
    setSelectedStore('');
    setSelectedGeometry(null);
    setTotalHouseholds(0);
    setHouseholdTarget(10000);
    setDemographics({ totalPop: 0, totalAlone: 0, avgMedianAge: 0, avgPopDensity: 0 });
    setCustomPointMode(false);
  };

  const handleReset = () => {
    window.view.graphics.removeAll();
    setSelectedStore('');
    setSelectedGeometry(null);
    setTotalHouseholds(0);
    setHouseholdTarget(10000);
    setDemographics({ totalPop: 0, totalAlone: 0, avgMedianAge: 0, avgPopDensity: 0 });
    setCustomPointMode(false);
  };

  if (!showSidebar) return null;

  return (
    <>
      {isMobile && (
        <div style={{ display: 'flex', gap: '0.5em', justifyContent: 'center', marginBottom: '0.5em' }}>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setShowDemographicsOnly(!showDemographicsOnly)}
          >
            {showDemographicsOnly ? 'Show Tools' : 'Show Map'}
          </button>
        </div>
      )}

      {(mobileSidebarOpen || !isMobile) && (
        <div
          className="sidebar-container"
          style={!isMobile ? {
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000,
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            width: '220px',
            color: '#000000',
          } : {}}
        >
          <div className="sidebar-content">
            {(!isMobile || !showDemographicsOnly) && (
              <>
                <LayerToggles layers={layers} />

                <hr />

                <StoreDropdown
                  stores={stores}
                  selectedState={selectedState}
                  setSelectedState={setSelectedState}
                  selectedStore={selectedStore}
                  setSelectedStore={setSelectedStore}
                  setSelectedGeometry={setSelectedGeometry}
                  layers={layers}
                  setTotalHouseholds={setTotalHouseholds}
                  householdTarget={householdTarget}
                  setDemographics={setDemographics} // Pass demographics setter
                />

                <button
                  onClick={customPointMode ? handleCancelCustomPoint : () => setCustomPointMode(true)}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    backgroundColor: customPointMode ? '#ffa500' : '#f0f0f0',
                    border: '1px solid #ccc',
                    padding: '6px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {customPointMode ? 'Cancel Custom Point' : 'Run Custom Point Analysis'}
                </button>

                <button
                  onClick={handleReset}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    backgroundColor: '#6e6e6e',
                    border: '1px solid #ccc',
                    padding: '6px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Reset Selection
                </button>
              </>
            )}

            <HouseholdSlider
              householdTarget={householdTarget}
              setHouseholdTarget={setHouseholdTarget}
            />

            <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
              <strong>Selected Households:</strong><br />
              {totalHouseholds > 0 ? totalHouseholds.toLocaleString() : 'None'}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Total Population:</strong><br />
              {demographics.totalPop > 0 ? demographics.totalPop.toLocaleString() : 'None'}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Living Alone:</strong><br />
              {demographics.totalAlone > 0 ? demographics.totalAlone.toLocaleString() : 'None'}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Median Age:</strong><br />
              {demographics.avgMedianAge > 0 ? demographics.avgMedianAge.toFixed(1) : 'None'}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Population Density:</strong><br />
              {demographics.avgPopDensity > 0 ? demographics.avgPopDensity.toFixed(1) + ' ppl/km²' : 'None'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
