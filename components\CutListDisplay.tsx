import React from 'react';
import { RipCut } from '../services/cutlistGenerator';

interface CutListDisplayProps {
  cutList: RipCut[];
  panelIndex: number;
  cutPieces: Set<string>;
  onToggleCut: (pieceId: string) => void;
}

const CutListDisplay: React.FC<CutListDisplayProps> = ({ cutList, panelIndex, cutPieces, onToggleCut }) => {
  return (
    <div className="p-2 space-y-6 text-sm">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Instrucciones de Corte para Tablero {panelIndex + 1}
      </h4>
      <ol className="list-decimal list-inside space-y-4">
        {cutList.map((rip, ripIndex) => (
          <li key={`rip-${ripIndex}`} className="pl-2">
            <span className="font-bold text-gray-800 dark:text-gray-200">
              Cortar Tira #{ripIndex + 1}:
            </span>
            <span className="ml-2 font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
              {rip.size.toFixed(1)}cm de alto
            </span>
            <ul className="list-disc list-inside mt-2 ml-6 space-y-2 text-gray-700 dark:text-gray-300">
              {rip.crossCuts.map((crossCut, crossCutIndex) => {
                const isCut = cutPieces.has(crossCut.piece.id);
                return (
                  <li 
                    key={`cross-${crossCutIndex}`}
                    onClick={() => onToggleCut(crossCut.piece.id)}
                    className={`cursor-pointer transition-all ${isCut ? 'line-through text-gray-500 dark:text-gray-400 opacity-70' : ''}`}
                    >
                    Cortar pieza de{' '}
                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                      {crossCut.piece.width.toFixed(1)}cm &times; {crossCut.piece.height.toFixed(1)}cm
                    </span>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Nota: Las medidas corresponden a las piezas finales. El plano visual es la referencia principal para la posición.
      </p>
    </div>
  );
};

export default CutListDisplay;
