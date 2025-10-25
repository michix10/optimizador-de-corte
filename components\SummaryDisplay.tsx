
import React from 'react';
import { Panel, PlacedPiece, EdgeBanding } from '../types.ts';

interface CostSummaryProps {
  panels: Panel[];
  pieces: PlacedPiece[];
  panelCost: number;
  bandingCost: number;
}

const CostSummary: React.FC<CostSummaryProps> = ({ panels, pieces, panelCost, bandingCost }) => {
  const calculations = React.useMemo(() => {
    const numPanels = panels.length;
    const totalPanelCost = numPanels * panelCost;

    let totalBandingLengthCm = 0;
    for (const piece of pieces) {
      // Use original dimensions for banding calculation
      const originalWidth = piece.rotated ? piece.height : piece.width;
      const originalHeight = piece.rotated ? piece.width : piece.height;

      if (piece.widthBanding === EdgeBanding.Single) {
        totalBandingLengthCm += originalWidth;
      } else if (piece.widthBanding === EdgeBanding.Double) {
        totalBandingLengthCm += originalWidth * 2;
      }

      if (piece.heightBanding === EdgeBanding.Single) {
        totalBandingLengthCm += originalHeight;
      } else if (piece.heightBanding === EdgeBanding.Double) {
        totalBandingLengthCm += originalHeight * 2;
      }
    }

    const totalBandingLengthM = totalBandingLengthCm / 100;
    const totalBandingCost = totalBandingLengthM * bandingCost;
    const totalCost = totalPanelCost + totalBandingCost;

    return {
      numPanels,
      totalPanelCost,
      totalBandingLengthM,
      totalBandingCost,
      totalCost,
    };
  }, [panels, pieces, panelCost, bandingCost]);

  if (panels.length === 0 || (panelCost <= 0 && bandingCost <= 0)) {
    return null;
  }

  // A simple currency formatter for locale-specific display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="mt-8 p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Resumen de Costos</h3>
      <div className="space-y-3">
        {panelCost > 0 && (
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <span className="font-medium text-gray-700 dark:text-gray-300">Costo de Tableros</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">{`${calculations.numPanels} x ${formatCurrency(panelCost)} = ${formatCurrency(calculations.totalPanelCost)}`}</span>
          </div>
        )}
        {bandingCost > 0 && (
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <span className="font-medium text-gray-700 dark:text-gray-300">Costo de Canto</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">{`${calculations.totalBandingLengthM.toFixed(2)}m x ${formatCurrency(bandingCost)}/m = ${formatCurrency(calculations.totalBandingCost)}`}</span>
          </div>
        )}
        <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/50 rounded-md border-t-2 border-indigo-500">
          <span className="font-bold text-lg text-indigo-800 dark:text-indigo-200">Costo Total Estimado</span>
          <span className="font-mono text-lg font-bold text-indigo-800 dark:text-indigo-200">{formatCurrency(calculations.totalCost)}</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Nota: Los costos son una estimación basada en los datos introducidos. No incluyen mano de obra ni otros gastos.
      </p>
    </div>
  );
};

export default CostSummary;            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Desglose de Piezas Utilizadas</h3>
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

export default SummaryDisplay;            <div className="overflow-x-auto">
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
