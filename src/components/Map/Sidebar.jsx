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
}) => {
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedGeometry, setSelectedGeometry] = useState(null);

  useEffect(() => {
    if (!selectedGeometry || !layers.blockGroups || !window.view) return;

    selectNearbyBlockGroups({
      center: selectedGeometry,
      layer: layers.blockGroups,
      view: window.view,
      householdTarget,
      onResult: (graphics, total) => {
        window.view.graphics.removeAll();
        window.view.graphics.addMany(graphics);
        setTotalHouseholds(total);
      }
    });
  }, [householdTarget, selectedGeometry, layers]);

  return (
    <div
      style={{
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
      }}
    >
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
      />

      <HouseholdSlider
        householdTarget={householdTarget}
        setHouseholdTarget={setHouseholdTarget}
      />

      <p style={{ fontSize: '0.9em', marginTop: '10px' }}>
        <strong>Selected Households:</strong><br />
        {totalHouseholds > 0 ? totalHouseholds.toLocaleString() : 'None'}
      </p>
    </div>
  );
};

export default Sidebar;
