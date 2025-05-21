// Slider for selecting target household count
const HouseholdSlider = ({ householdTarget, setHouseholdTarget }) => {
  return (
    <div>
      <p style={{ marginBottom: '4px' }}>
        <strong>{householdTarget.toLocaleString()}</strong> households
      </p>
      <input
        type="range"
        min="5000"
        max="50000"
        step="1000"
        value={householdTarget}
        onChange={(e) => setHouseholdTarget(parseInt(e.target.value, 10))}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default HouseholdSlider;