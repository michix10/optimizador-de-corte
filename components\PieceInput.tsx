import React, { useState } from 'react';
import { EdgeBanding, Rotation } from '../types';

interface PieceInputProps {
  onAddPiece: (width: number, height: number, quantity: number, widthBanding: EdgeBanding, heightBanding: EdgeBanding, rotation: Rotation) => void;
}

const PieceInput: React.FC<PieceInputProps> = ({ onAddPiece }) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [widthBanding, setWidthBanding] = useState<EdgeBanding>(EdgeBanding.None);
  const [heightBanding, setHeightBanding] = useState<EdgeBanding>(EdgeBanding.None);
  const [rotation, setRotation] = useState<Rotation>(Rotation.None);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    const quantityNum = parseInt(quantity, 10);

    if (isNaN(widthNum) || isNaN(heightNum) || isNaN(quantityNum) || widthNum <= 0 || heightNum <= 0 || quantityNum <= 0) {
      setError('Por favor, introduce valores numéricos positivos.');
      return;
    }
    
    setError('');
    onAddPiece(widthNum, heightNum, quantityNum, widthBanding, heightBanding, rotation);
    setWidth('');
    setHeight('');
    setQuantity('1');
    setWidthBanding(EdgeBanding.None);
    setHeightBanding(EdgeBanding.None);
    setRotation(Rotation.None);
  };
  
  const bandingOptions = [
    { value: EdgeBanding.None, label: 'Ninguno' },
    { value: EdgeBanding.Single, label: 'Simple (1 Lado)' },
    { value: EdgeBanding.Double, label: 'Doble (2 Lados)' },
  ];

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Añadir Pieza</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ancho (cm)</label>
            <input
              type="number"
              id="width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 40.5"
              step="0.1"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Largo (cm)</label>
            <input
              type="number"
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 60"
               step="0.1"
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onFocus={handleFocus}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="widthBanding" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Canto en Ancho</label>
            <select
              id="widthBanding"
              value={widthBanding}
              onChange={(e) => setWidthBanding(e.target.value as EdgeBanding)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {bandingOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="heightBanding" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Canto en Largo</label>
            <select
              id="heightBanding"
              value={heightBanding}
              onChange={(e) => setHeightBanding(e.target.value as EdgeBanding)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {bandingOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="pt-2">
            <label htmlFor="rotation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Orientación de Veta</label>
            <select
              id="rotation"
              value={rotation}
              onChange={(e) => setRotation(e.target.value as Rotation)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                <option value={Rotation.None}>Respetar veta (No rotar)</option>
                <option value={Rotation.Allowed}>Permitir rotación (Ignorar veta)</option>
                <option value={Rotation.Forced}>Forzar rotación 90° (A contraveta)</option>
            </select>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Añadir Pieza
        </button>
      </form>
    </div>
  );
};

export default PieceInput;
