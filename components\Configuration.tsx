import React from 'react';

interface ConfigurationProps {
  sawKerf: number;
  setSawKerf: (kerf: number) => void;
}

const Configuration: React.FC<ConfigurationProps> = ({ sawKerf, setSawKerf }) => {
  const handleKerfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setSawKerf(value);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Configuración</h2>
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
    </div>
  );
};

export default Configuration;
