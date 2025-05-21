import { useState } from 'react';

const layerLabels = {
  blockGroups: 'Block Groups',
  // tracts: 'Census Tracts',
  traderJoes: 'Trader Joe’s Stores'
};

const LayerToggles = ({ layers }) => {
  const [_, forceRender] = useState(false); // force UI refresh

  const toggleLayer = (key) => {
    const layer = layers[key];
    if (layer) {
      layer.visible = !layer.visible;
      forceRender((v) => !v);
    }
  };

  return (
    <div>
      <h4>Layers</h4>
      {Object.keys(layerLabels).map((key) => (
        <div key={key} style={{ marginBottom: '6px' }}>
          <label>
            <input
              type="checkbox"
              checked={layers[key]?.visible ?? false}
              onChange={() => toggleLayer(key)}
            />
            {' '}{layerLabels[key]}
          </label>
        </div>
      ))}
    </div>
  );
};

export default LayerToggles;
