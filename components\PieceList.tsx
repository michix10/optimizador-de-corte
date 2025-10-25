
import React from 'react';
import { Piece, EdgeBanding, Rotation } from '../types.ts';

interface PieceListProps {
  pieces: Piece[];
  onRemovePiece: (id: string) => void;
  onUpdatePiece: (id: string, updates: Partial<Pick<Piece, 'widthBanding' | 'heightBanding' | 'rotation'>>) => void;
}

const BandingIndicator: React.FC<{ banding: EdgeBanding }> = ({ banding }) => {
    if (banding === EdgeBanding.None) return null;
    const baseClasses = "absolute bottom-0 left-0 w-full";
    if (banding === EdgeBanding.Single) {
        return <div className={`${baseClasses} h-0.5 bg-current translate-y-1`}></div>;
    }
    if (banding === EdgeBanding.Double) {
        return (
        <>
            <div className={`${baseClasses} h-0.5 bg-current translate-y-1`}></div>
            <div className={`${baseClasses} h-0.5 bg-current translate-y-2`}></div>
        </>
        );
    }
    return null;
};

const RotateIcon: React.FC<{ rotation: Rotation }> = ({ rotation }) => {
    if (rotation === Rotation.None) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
            </svg>
        );
    }
    // Same icon for Allowed and Forced, color is handled by parent
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 3a1 1 0 011 1v1.268a8 8 0 11-7.279 12.245 1 1 0 011.242-1.562A6 6 0 1012 5.068V7a1 1 0 11-2 0V4a1 1 0 011-1z" />
        </svg>
    );
};

const PieceList: React.FC<PieceListProps> = ({ pieces, onRemovePiece, onUpdatePiece }) => {
  const bandingCycle: EdgeBanding[] = [EdgeBanding.None, EdgeBanding.Single, EdgeBanding.Double];

  const handleBandingClick = (piece: Piece, type: 'width' | 'height') => {
    const currentBanding = type === 'width' ? piece.widthBanding : piece.heightBanding;
    const currentIndex = bandingCycle.indexOf(currentBanding);
    const nextBanding = bandingCycle[(currentIndex + 1) % bandingCycle.length];
    
    if (type === 'width') {
      onUpdatePiece(piece.id, { widthBanding: nextBanding });
    } else {
      onUpdatePiece(piece.id, { heightBanding: nextBanding });
    }
  };

  const rotationCycle: Rotation[] = [Rotation.None, Rotation.Allowed, Rotation.Forced];
  const handleRotateClick = (piece: Piece) => {
    const currentIndex = rotationCycle.indexOf(piece.rotation);
    const nextRotation = rotationCycle[(currentIndex + 1) % rotationCycle.length];
    onUpdatePiece(piece.id, { rotation: nextRotation });
  };
  
  const getRotationButtonProps = (rotation: Rotation) => {
      switch(rotation) {
          case Rotation.Forced:
              return {
                  className: 'text-blue-500 hover:text-blue-600',
                  title: 'Rotación de 90° forzada (a contraveta)',
                  'aria-label': 'Rotación forzada',
              };
          case Rotation.Allowed:
              return {
                  className: 'text-green-500 hover:text-green-600',
                  title: 'Rotación de 90° permitida (ignora veta)',
                  'aria-label': 'Rotación permitida',
              };
          case Rotation.None:
          default:
              return {
                  className: 'text-gray-400 hover:text-gray-500',
                  title: 'Rotación no permitida (respeta veta)',
                  'aria-label': 'Rotación no permitida',
              };
      }
  };

  return (
    <div className="mt-6 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Lista de Piezas</h2>
      {pieces.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No hay piezas en la lista.</p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {pieces.map((piece) => (
            <li key={piece.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="font-mono text-sm">
                 <span 
                    className="relative inline-block px-2 py-1 cursor-pointer"
                    onClick={() => handleBandingClick(piece, 'width')}
                    title={`Canto Ancho: ${piece.widthBanding}`}
                >
                    {piece.width}
                    <BandingIndicator banding={piece.widthBanding} />
                </span>
                <span className="mx-1">x</span>
                <span 
                    className="relative inline-block px-2 py-1 cursor-pointer"
                    onClick={() => handleBandingClick(piece, 'height')}
                    title={`Canto Largo: ${piece.heightBanding}`}
                >
                    {piece.height}
                    <BandingIndicator banding={piece.heightBanding} />
                </span>
                <span className="ml-1">cm</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                    onClick={() => handleRotateClick(piece)}
                    {...getRotationButtonProps(piece.rotation)}
                >
                    <RotateIcon rotation={piece.rotation} />
                </button>
                <button
                    onClick={() => onRemovePiece(piece.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    aria-label={`Eliminar pieza ${piece.width}x${piece.height}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PieceList;              };
          case Rotation.Allowed:
              return {
                  className: 'text-green-500 hover:text-green-600',
                  title: 'Rotación de 90° permitida (ignora veta)',
                  'aria-label': 'Rotación permitida',
              };
          case Rotation.None:
          default:
              return {
                  className: 'text-gray-400 hover:text-gray-500',
                  title: 'Rotación no permitida (respeta veta)',
                  'aria-label': 'Rotación no permitida',
              };
      }
  };

  return (
    <div className="mt-6 p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Lista de Piezas</h2>
      {pieces.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No hay piezas en la lista.</p>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {pieces.map((piece) => (
            <li key={piece.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="font-mono text-sm">
                 <span 
                    className="relative inline-block px-2 py-1 cursor-pointer"
                    onClick={() => handleBandingClick(piece, 'width')}
                    title={`Canto Ancho: ${piece.widthBanding}`}
                >
                    {piece.width}
                    <BandingIndicator banding={piece.widthBanding} />
                </span>
                <span className="mx-1">x</span>
                <span 
                    className="relative inline-block px-2 py-1 cursor-pointer"
                    onClick={() => handleBandingClick(piece, 'height')}
                    title={`Canto Largo: ${piece.heightBanding}`}
                >
                    {piece.height}
                    <BandingIndicator banding={piece.heightBanding} />
                </span>
                <span className="ml-1">cm</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                    onClick={() => handleRotateClick(piece)}
                    {...getRotationButtonProps(piece.rotation)}
                >
                    <RotateIcon rotation={piece.rotation} />
                </button>
                <button
                    onClick={() => onRemovePiece(piece.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    aria-label={`Eliminar pieza ${piece.width}x${piece.height}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PieceList;
