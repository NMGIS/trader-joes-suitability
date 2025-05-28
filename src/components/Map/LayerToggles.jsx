import { useState } from 'react';

const layerInfo = {
  walkability: {
    label: 'Walkability Index'
  },
  blockGroups: {
    label: 'Block Groups',
    icon: './public/blockgroups.svg'
  },
  traderJoes: {
    label: 'Trader Joe’s Stores',
    icon: './public/tjicon.png'
  }
};

const LayerToggles = ({ layers }) => {
  const [_, forceRender] = useState(false);

  const toggleLayer = (key) => {
    const layer = layers[key];
    if (layer) {
      layer.visible = !layer.visible;
      forceRender((v) => !v);
    }
  };

  return (
    <div>
      {Object.keys(layerInfo).map((key) => (
        <div key={key} className="layer-toggle">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={layers[key]?.visible ?? false}
              onChange={() => toggleLayer(key)}
            />
            {layerInfo[key].label}
            {layerInfo[key].icon && (
              <img
                src={layerInfo[key].icon}
                alt=""
                style={{ width: '18px', height: '18px' }}
              />
            )}
          </label>
        </div>
      ))}

    </div>
  );
};

export default LayerToggles;
