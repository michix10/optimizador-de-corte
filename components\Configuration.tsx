

import React, { useState, useEffect } from 'react';
import { PRESET_SIZES } from '../constants.ts';

interface ConfigurationProps {
  sawKerf: number;
  setSawKerf: (kerf: number) => void;
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  panelHeight: number;
  setPanelHeight: (height: number) => void;
  panelCost: number;
  setPanelCost: (cost: number) => void;
  bandingCost: number;
  setBandingCost: (cost: number) => void;
}

const Configuration: React.FC<ConfigurationProps> = ({
  sawKerf,
  setSawKerf,
  panelWidth,
  setPanelWidth,
  panelHeight,
  setPanelHeight,
  panelCost,
  setPanelCost,
  bandingCost,
  setBandingCost,
}) => {
  const [preset, setPreset] = useState<string>('207x280');
  
  useEffect(() => {
    const matchingPreset = Object.keys(PRESET_SIZES).find(key => {
        const size = PRESET_SIZES[key];
        return size.width === panelWidth && size.height === panelHeight;
    });
    if (matchingPreset) {
        setPreset(matchingPreset);
    } else {
        setPreset('custom');
    }
  }, [panelWidth, panelHeight]);


  const handleKerfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setSawKerf(value);
    }
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    setPreset(selectedKey);
    if (selectedKey !== 'custom') {
      const size = PRESET_SIZES[selectedKey];
      setPanelWidth(size.width);
      setPanelHeight(size.height);
    }
  };

  const handleCustomWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if(!isNaN(value) && value > 0) setPanelWidth(value);
  }

  const handleCustomHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if(!isNaN(value) && value > 0) setPanelHeight(value);
  }
  
  const handleCostChange = (setter: (cost: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setter(value);
    } else if (e.target.value === '') {
      setter(0);
    }
  };


  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Configuración</h2>
      <div>
        <label htmlFor="panelSizePreset" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tamaño del Tablero
        </label>
        <select
          id="panelSizePreset"
          value={preset}
          onChange={handlePresetChange}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {Object.entries(PRESET_SIZES).map(([key, value]) => (
            <option key={key} value={key}>{value.name}</option>
          ))}
          <option value="custom">Personalizado</option>
        </select>
      </div>
      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
            <div>
                <label htmlFor="customWidth" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ancho (cm)</label>
                <input
                    type="number"
                    id="customWidth"
                    value={panelWidth}
                    onChange={handleCustomWidthChange}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    step="0.1"
                />
            </div>
            <div>
                <label htmlFor="customHeight" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Largo (cm)</label>
                <input
                    type="number"
                    id="customHeight"
                    value={panelHeight}
                    onChange={handleCustomHeightChange}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    step="0.1"
                />
            </div>
        </div>
      )}
      <div>
        <label htmlFor="sawKerf" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Espesor de la Sierra (cm)
        </label>
        <input
          type="number"
          id="sawKerf"
          value={sawKerf}
          onChange={handleKerfChange}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          step="0.01"
          min="0"
          placeholder="e.g., 0.3"
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          El "alma de corte" es el material que elimina la hoja. Un valor común es 0.3cm (3mm).
        </p>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">Costos (Opcional)</h3>
        <div className="space-y-4">
            <div>
                <label htmlFor="panelCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Costo por Tablero (€)
                </label>
                <input
                type="number"
                id="panelCost"
                value={panelCost || ''}
                onChange={handleCostChange(setPanelCost)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                step="0.01"
                min="0"
                placeholder="e.g., 55.95"
                />
            </div>
            <div>
                <label htmlFor="bandingCost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Costo de Canto por Metro (€/m)
                </label>
                <input
                type="number"
                id="bandingCost"
                value={bandingCost || ''}
                onChange={handleCostChange(setBandingCost)}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                step="0.01"
                min="0"
                placeholder="e.g., 0.80"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;
