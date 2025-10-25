
import React from 'react';
import { PlacedPiece, EdgeBanding } from '../types';

interface SummaryDisplayProps {
  pieces: PlacedPiece[];
}

// Re-using BandingIndicator logic from PieceList for consistency
const BandingIndicator: React.FC<{ banding: EdgeBanding }> = ({ banding }) => {
    if (banding === EdgeBanding.None) return null;
    const baseClasses = "absolute bottom-0 left-0 w-full";
    if (banding === EdgeBanding.Single) {
        // Lowered further for better visual separation
        return <div className={`${baseClasses} h-0.5 bg-current translate-y-1`}></div>;
    }
    if (banding === EdgeBanding.Double) {
        return (
        <>
            {/* Both lines are lowered and spaced out for clarity */}
            <div className={`${baseClasses} h-0.5 bg-current translate-y-1`}></div>
            <div className={`${baseClasses} h-0.5 bg-current translate-y-2`}></div>
        </>
        );
    }
    return null;
};

interface SummaryItem {
    width: number;
    height: number;
    widthBanding: EdgeBanding;
    heightBanding: EdgeBanding;
    quantity: number;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ pieces }) => {
    const summary = React.useMemo(() => {
        const pieceMap = new Map<string, SummaryItem>();

        for (const piece of pieces) {
            // Revert dimensions to original if the piece was rotated for correct grouping
            const originalWidth = piece.rotated ? piece.height : piece.width;
            const originalHeight = piece.rotated ? piece.width : piece.height;
            
            // Create a unique key for each piece type based on dimensions and banding
            const key = `${originalWidth}x${originalHeight}-${piece.widthBanding}-${piece.heightBanding}`;
            
            if (pieceMap.has(key)) {
                pieceMap.get(key)!.quantity++;
            } else {
                pieceMap.set(key, {
                    width: originalWidth,
                    height: originalHeight,
                    widthBanding: piece.widthBanding,
                    heightBanding: piece.heightBanding,
                    quantity: 1,
                });
            }
        }
        // Sort the summary from largest to smallest piece area
        return Array.from(pieceMap.values()).sort((a,b) => (b.width * b.height) - (a.width * a.height));
    }, [pieces]);

    if (pieces.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Desglose de Piezas Utilizadas</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Medidas (cm)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Cantidad
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {summary.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="font-mono text-sm">
                                        <span className="relative inline-block px-1">
                                            {item.width}
                                            <BandingIndicator banding={item.widthBanding} />
                                        </span>
                                        x
                                        <span className="relative inline-block px-1">
                                            {item.height}
                                            <BandingIndicator banding={item.heightBanding} />
                                        </span>
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium">{item.quantity}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SummaryDisplay;
