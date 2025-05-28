import { useState } from 'react';

const layerInfo = {
  walkability: {
    label: 'Walkability Index'
  },
  isochrones: {
    label: '10 Minute Drive Time',
    icon: 'https://raw.githubusercontent.com/NMGIS/trader-joes-suitability/main/public/iso.svg'
  },
  blockGroups: {
    label: 'Block Groups',
    icon: 'https://raw.githubusercontent.com/NMGIS/trader-joes-suitability/main/public/blockgroups.svg'
  },
  traderJoes: {
    label: 'Trader Joe’s Stores',
    icon: 'https://raw.githubusercontent.com/NMGIS/trader-joes-suitability/main/public/tjIcon.png'
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
