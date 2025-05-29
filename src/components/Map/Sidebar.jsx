import { useState, useEffect } from 'react';
import LayerToggles from './LayerToggles';
import StoreDropdown from './StoreDropdown';
import HouseholdSlider from './HouseholdSlider';
import { selectNearbyBlockGroups } from '../utils/selectNearbyBlockGroups';

const defaultDemographics = {
  totalPop: 0,
  totalAlone: 0,
  avgMedianIncome: null,
  avgMedianAge: 0,
  avgPopDensity: 0,
  avgEduPct: null,
  totalAreaSqMi: 0
};

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
  showSidebar
}) => {
  const [selectedStore, setSelectedStore] = useState('');
  const [comparisonStore, setComparisonStore] = useState('');
  const [demographics, setDemographics] = useState(defaultDemographics);
  const [comparisonDemographics, setComparisonDemographics] = useState(defaultDemographics);
  const [comparisonGeometry, setComparisonGeometry] = useState(null);
  const [comparisonHouseholds, setComparisonHouseholds] = useState(0);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [hasPrimarySelection, setHasPrimarySelection] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [showDemographicsOnly, setShowDemographicsOnly] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedGeometry) setHasPrimarySelection(true);
  }, [selectedGeometry]);

  useEffect(() => {
    if (!selectedGeometry || !layers.blockGroups || !window.view) return;

    selectNearbyBlockGroups({
      center: selectedGeometry,
      layer: layers.blockGroups,
      view: window.view,
      householdTarget,
      onResult: (graphics, total, demo) => {
        layers.primaryGraphics.removeAll();
        layers.primaryGraphics.addMany(graphics);

        setTotalHouseholds(total);
        setDemographics(demo);
      }
    });
  }, [selectedGeometry, householdTarget, layers]);

  useEffect(() => {
    if (!comparisonGeometry || !layers.blockGroups || !window.view) return;

    selectNearbyBlockGroups({
      center: comparisonGeometry,
      layer: layers.blockGroups,
      view: window.view,
      householdTarget,
      isComparison: true,
      onResult: (graphics, total, demo) => {
        layers.comparisonGraphics.removeAll();
        layers.comparisonGraphics.addMany(graphics);

        setComparisonHouseholds(total);
        setComparisonDemographics(demo);
      }
    });
  }, [comparisonGeometry, householdTarget, layers]);

  const handleCancelCustomPoint = () => {
    layers.primaryGraphics.removeAll();
    window.view.graphics.removeAll(); // remove custom marker
    setSelectedStore('');
    setSelectedGeometry(null);
    setTotalHouseholds(0);
    setHouseholdTarget(10000);
    setDemographics(defaultDemographics);
    setCustomPointMode(false);
    setHasPrimarySelection(false);
  };

  const handleReset = () => {
    const isoLayer = window.view.map.findLayerById('custom-isochrone');
    if (isoLayer) window.view.map.remove(isoLayer);
    layers.primaryGraphics.removeAll();
    layers.comparisonGraphics.removeAll();
    window.view.graphics.removeAll(); // remove custom marker
    setSelectedStore('');
    setComparisonStore('');
    setSelectedGeometry(null);
    setComparisonGeometry(null);
    setTotalHouseholds(0);
    setComparisonHouseholds(0);
    setHouseholdTarget(10000);
    setDemographics(defaultDemographics);
    setComparisonDemographics(defaultDemographics);
    setCustomPointMode(false);
    setComparisonMode(false);
    setHasPrimarySelection(false);
  };

  if (!showSidebar) return null;

  return (
    <>
      {isMobile && (
        <div style={{ display: 'flex', gap: '0.5em', justifyContent: 'center', marginBottom: '0.5em', paddingTop: '10px' }}>
          <button
            onClick={() => setShowDemographicsOnly(!showDemographicsOnly)}
          >
            {showDemographicsOnly ? 'Show Tools' : 'Show Map'}
          </button>
        </div>
      )}

      {(mobileSidebarOpen || !isMobile) && (
        <div
          style={!isMobile ? {
            position: 'absolute',
            top: 10,
            left: 10,
            bottom: 10,
            maxHeight: 'calc(100vh - 70px)',
            overflowY: 'auto',
            zIndex: 1000,
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            paddingBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            width: '220px',
            color: '#000000',
          } : {
            paddingLeft: '1em',
            paddingRight: '1em'
          }}

        >
          <div>
            {(!isMobile || !showDemographicsOnly) && (
              <>
                <div style={{ marginBottom: '1em' }}>
                  <details>
                    <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                      Map Layers
                    </summary>
                    <div style={{ paddingTop: '0.5em' }}>
                      <LayerToggles layers={layers} />
                    </div>
                  </details>
                </div>

                <hr />

                {!comparisonMode && (
                  <>
                    {!customPointMode && (
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
                        setDemographics={setDemographics}
                      />
                    )}

                    <button
                      onClick={customPointMode ? handleCancelCustomPoint : () => setCustomPointMode(true)}
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        backgroundColor: customPointMode ? 'var(--tj-accent)' : 'var(--tj-bg)',
                        color: 'var(--tj-text)',
                        border: '1px solid var(--tj-red)',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {customPointMode ? 'Cancel Custom Point' : 'Run Custom Point Analysis'}
                    </button>

                    <button
                      disabled={!hasPrimarySelection}
                      onClick={() => setComparisonMode(true)}
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        backgroundColor: hasPrimarySelection ? 'var(--tj-red)' : '#ccc',
                        color: hasPrimarySelection ? 'white' : '#888',
                        border: '1px solid var(--tj-accent)',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: hasPrimarySelection ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Start Comparison Mode
                    </button>
                  </>
                )}


                {comparisonMode && (
                  <>
                    <StoreDropdown
                      stores={stores}
                      selectedState={selectedState}
                      setSelectedState={setSelectedState}
                      selectedStore={comparisonStore}
                      setSelectedStore={setComparisonStore}
                      setSelectedGeometry={setComparisonGeometry}
                      layers={layers}
                      setTotalHouseholds={setComparisonHouseholds}
                      householdTarget={householdTarget}
                      setDemographics={setComparisonDemographics}
                      labelModifier=" (Comparison)"
                      isComparison={true}
                    />

                    <button
                      onClick={() => {
                        setComparisonMode(false);
                        setComparisonStore('');
                        setComparisonGeometry(null);
                        setComparisonDemographics(defaultDemographics);
                        setComparisonHouseholds(0);
                        layers.comparisonGraphics.removeAll();
                      }}
                      style={{
                        marginTop: '10px',
                        width: '100%',
                        backgroundColor: '#6e6e6e',
                        color: 'white',
                        border: '1px solid #ccc',
                        padding: '6px',
                        borderRadius: '4px'
                      }}
                    >
                      Cancel Comparison Mode
                    </button>
                  </>
                )}

                <button
                  onClick={handleReset}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    backgroundColor: 'white',
                    color: 'var(--tj-red)',
                    border: '2px solid var(--tj-red)',
                    padding: '6px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
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
              {totalHouseholds?.toLocaleString() || 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonHouseholds?.toLocaleString() || 'None'}
                </span>
              )}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Total Population:</strong><br />
              {demographics?.totalPop?.toLocaleString() || 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonDemographics?.totalPop?.toLocaleString() || 'None'}
                </span>
              )}
            </p>
            <p style={{ fontSize: '0.9em' }}>
              <strong>Median Household Income:</strong><br />
              {demographics?.avgMedianIncome
                ? `$${Math.round(demographics.avgMedianIncome).toLocaleString()}`
                : 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonDemographics?.avgMedianIncome
                    ? `$${Math.round(comparisonDemographics.avgMedianIncome).toLocaleString()}`
                    : 'None'}
                </span>
              )}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Population Density:</strong><br />
              {demographics?.avgPopDensity ? demographics.avgPopDensity.toFixed(1) + ' ppl/mi²' : 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonDemographics?.avgPopDensity?.toFixed(1) || 'None'} ppl/mi²
                </span>
              )}
            </p>
            <p style={{ fontSize: '0.9em' }}>
              <strong>Total Area (mi²):</strong><br />
              {demographics?.totalAreaSqMi ? demographics.totalAreaSqMi.toFixed(2) : 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonDemographics?.totalAreaSqMi?.toFixed(2) || 'None'}
                </span>
              )}
            </p>


            <p style={{ fontSize: '0.9em' }}>
              <strong>Living Alone:</strong><br />
              {demographics?.totalAlone?.toLocaleString() || 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonDemographics?.totalAlone?.toLocaleString() || 'None'}
                </span>
              )}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Median Age:</strong><br />
              {demographics?.avgMedianAge ? demographics.avgMedianAge.toFixed(1) : 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonDemographics?.avgMedianAge?.toFixed(1) || 'None'}
                </span>
              )}
            </p>

            <p style={{ fontSize: '0.9em' }}>
              <strong>Bachelor’s Degree or Higher:</strong><br />
              {demographics?.avgEduPct !== null && demographics?.avgEduPct !== undefined
                ? demographics.avgEduPct.toFixed(1) + '%'
                : 'None'}
              {comparisonMode && (
                <span style={{ color: 'blue' }}>
                  {' '}~ {comparisonDemographics?.avgEduPct !== null && comparisonDemographics?.avgEduPct !== undefined
                    ? comparisonDemographics.avgEduPct.toFixed(1) + '%'
                    : 'None'}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
