import { selectNearbyBlockGroups } from '../utils/selectNearbyBlockGroups';

const StoreDropdown = ({
  stores,
  selectedState,
  setSelectedState,
  selectedStore,
  setSelectedStore,
  setSelectedGeometry,
  layers,
  setTotalHouseholds,
  householdTarget,
  setDemographics // Added to handle population density and other demographic results
}) => {
  const handleStoreSelect = async (storeNo) => {
    setSelectedStore(storeNo);
    const store = stores.find((s) => String(s.storeNo) === storeNo);
    if (!store || !window.view || !layers.blockGroups || !store.geometry) return;

    const view = window.view;
    setSelectedGeometry(store.geometry);

    await view.goTo({ target: store.geometry, zoom: 12 });

    await selectNearbyBlockGroups({
      center: store.geometry,
      layer: layers.blockGroups,
      view,
      householdTarget,
      onResult: (graphics, total, demo) => {
        view.graphics.removeAll();
        view.graphics.addMany(graphics);
        setTotalHouseholds(total);
        setDemographics(demo); // Capture population density, median age, etc.
      }
    });
  };

  return (
    <>
      <div className="store-dropdown">
        <label>Filter by State:</label>
        <select
          style={{ width: '100%', marginBottom: '10px' }}
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
        >
          <option value="">All States</option>
          {[...new Set(stores.map((s) => s.state))]
            .sort()
            .map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
        </select>

        <label>Select StoreNo:</label>
        <select
          style={{ width: '100%', marginBottom: '10px' }}
          value={selectedStore}
          onChange={(e) => handleStoreSelect(e.target.value)}
        >
          <option value="">-- Select Store --</option>
          {stores
            .filter((s) => !selectedState || s.state === selectedState)
            .sort((a, b) => a.storeNo - b.storeNo)
            .map((s) => (
              <option key={s.storeNo} value={s.storeNo}>
                {s.storeNo}
              </option>
            ))}
        </select>
      </div>
    </>
  );
};

export default StoreDropdown;
