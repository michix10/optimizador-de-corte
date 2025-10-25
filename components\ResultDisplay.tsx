import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import { Panel, EdgeBanding, PlacedPiece } from '../types';
import { PANEL_WIDTH, PANEL_HEIGHT } from '../constants';
import { generateCutList } from '../services/cutlistGenerator';
import CutListDisplay from './CutListDisplay';

// FIX: Define ResultDisplayProps interface
interface ResultDisplayProps {
  panels: Panel[];
  sawKerf: number;
}

const BandingLine: React.FC<{ banding: EdgeBanding, side: 'top' | 'bottom' | 'left' | 'right' }> = ({ banding, side }) => {
    if (banding === EdgeBanding.None) return null;

    const baseStyle: React.CSSProperties = {
        position: 'absolute',
        backgroundColor: 'white',
        zIndex: 20,
    };
    
    const inset = '3px';
    const thickness = '2px';
    const gap = '4px';

    const sideStyles = {
        top: { top: inset, left: inset, right: inset, height: thickness },
        bottom: { bottom: inset, left: inset, right: inset, height: thickness },
        left: { left: inset, top: inset, bottom: inset, width: thickness },
        right: { right: inset, top: inset, bottom: inset, width: thickness },
    };

    if (banding === EdgeBanding.Single) {
        return <div style={{ ...baseStyle, ...sideStyles[side] }}></div>;
    }

    if (banding === EdgeBanding.Double) {
        const doubleSideStyles = {
            top: [{...sideStyles.top}, {...sideStyles.top, top: `calc(${inset} + ${gap})`}],
            bottom: [{...sideStyles.bottom}, {...sideStyles.bottom, bottom: `calc(${inset} + ${gap})`}],
            left: [{...sideStyles.left}, {...sideStyles.left, left: `calc(${inset} + ${gap})`}],
            right: [{...sideStyles.right}, {...sideStyles.right, right: `calc(${inset} + ${gap})`}],
        };
        return <>
            <div style={{ ...baseStyle, ...doubleSideStyles[side][0] }}></div>
            <div style={{ ...baseStyle, ...doubleSideStyles[side][1] }}></div>
        </>;
    }
    return null;
};

const PanelItem: React.FC<{ panel: Panel; index: number, sawKerf: number }> = ({ panel, index, sawKerf }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState('visual');
  const [cutPieces, setCutPieces] = useState<Set<string>>(new Set());

  const handleToggleCut = (pieceId: string) => {
    setCutPieces(prev => {
        const newSet = new Set(prev);
        if (newSet.has(pieceId)) {
            newSet.delete(pieceId);
        } else {
            newSet.add(pieceId);
        }
        return newSet;
    });
  };
  
  const handleResetCuts = () => {
    if (cutPieces.size > 0) {
        setCutPieces(new Set());
    }
  };

  const cutList = useMemo(() => generateCutList(panel), [panel]);

  useLayoutEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Add some padding
        const newScale = (containerWidth - 40) / PANEL_WIDTH;
        setScale(newScale);
      }
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const usedArea = panel.pieces.reduce((acc, p) => acc + p.width * p.height, 0);
  const totalPanelArea = panel.width * panel.height;
  const wasteArea = totalPanelArea - usedArea;
  const efficiency = totalPanelArea > 0 ? 100 * (usedArea / totalPanelArea) : 0;
  const usedAreaM2 = usedArea / 10000;
  const wasteAreaM2 = wasteArea / 10000;

  const tabClasses = (tabName: string) => 
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tabName
        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
    }`;

  return (
    <div ref={containerRef} className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Tablero {index + 1}</h3>
      
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button onClick={() => setActiveTab('visual')} className={tabClasses('visual')}>
                  Plano Visual
              </button>
              <button onClick={() => setActiveTab('cuts')} className={tabClasses('cuts')}>
                  Lista de Cortes
              </button>
          </nav>
      </div>
      
      {activeTab === 'visual' && (
        <>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div className="flex items-center space-x-4 flex-wrap">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Eficiencia: <span className="font-bold">{efficiency.toFixed(2)}%</span></p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Usado: <span className="font-bold">{usedAreaM2.toFixed(4)} m²</span></p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Desperdicio: <span className="font-bold">{wasteAreaM2.toFixed(4)} m²</span></p>
                </div>
                 <button 
                    onClick={handleResetCuts}
                    disabled={cutPieces.size === 0}
                    className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    title="Resetear marcas de corte"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M4 4l7 7m0 0l7-7m-7 7v10" />
                    </svg>
                    Resetear
                </button>
            </div>
            <div
                className="relative bg-gray-300 dark:bg-gray-600 border-2 border-gray-500"
                style={{
                width: `${PANEL_WIDTH * scale}px`,
                height: `${PANEL_HEIGHT * scale}px`,
                backgroundImage: `
                    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${10 * scale}px ${10 * scale}px`,
                }}
            >
                {panel.pieces.map((piece) => {
                const isVertical = piece.height > piece.width;
                const isCut = cutPieces.has(piece.id);

                // Determine banding sides based on rotation
                const topBottomBanding = piece.rotated ? piece.heightBanding : piece.widthBanding;
                const leftRightBanding = piece.rotated ? piece.widthBanding : piece.heightBanding;
                
                return (
                    <div
                    key={piece.id}
                    onClick={() => handleToggleCut(piece.id)}
                    className="absolute bg-black text-white flex items-center justify-center text-xs overflow-hidden cursor-pointer group"
                    style={{
                        boxSizing: 'border-box',
                        borderRight: `${sawKerf * scale}px solid rgba(107, 114, 128, 0.5)`, // gray-500
                        borderBottom: `${sawKerf * scale}px solid rgba(107, 114, 128, 0.5)`,
                        left: `${piece.x * scale}px`,
                        top: `${piece.y * scale}px`,
                        width: `${piece.width * scale}px`,
                        height: `${piece.height * scale}px`,
                    }}
                    title={`${piece.width}cm x ${piece.height}cm`}
                    >
                        <BandingLine banding={topBottomBanding} side="top" />
                        <BandingLine banding={topBottomBanding} side="bottom" />
                        <BandingLine banding={leftRightBanding} side="left" />
                        <BandingLine banding={leftRightBanding} side="right" />
                        <span 
                        className="relative z-10 whitespace-nowrap" 
                        style={{
                            transform: isVertical ? 'rotate(90deg)' : 'none',
                            fontSize: Math.max(8, Math.min(piece.width, piece.height) * scale * 0.15) + 'px'
                        }}
                        >
                        {piece.rotated ? `${piece.height}x${piece.width}` : `${piece.width}x${piece.height}`}
                        </span>
                        {isCut && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-1/3 w-1/3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                         {!isCut && (
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center z-20 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-1/4 w-1/4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                         )}
                    </div>
                )
                })}
                {panel.offcuts.map((offcut, offcutIndex) => (
                <div
                    key={`offcut-${offcutIndex}`}
                    className="absolute bg-gray-400/30 dark:bg-gray-700/50"
                    style={{
                    left: `${offcut.x * scale}px`,
                    top: `${offcut.y * scale}px`,
                    width: `${offcut.width * scale}px`,
                    height: `${offcut.height * scale}px`,
                    border: `1px dashed rgba(255, 255, 255, 0.2)`,
                    boxSizing: 'border-box'
                    }}
                    title={`Sobrante: ${offcut.width.toFixed(1)}cm x ${offcut.height.toFixed(1)}cm`}
                ></div>
                ))}
            </div>
        </>
      )}
      {activeTab === 'cuts' && (
        <CutListDisplay cutList={cutList} panelIndex={index} cutPieces={cutPieces} onToggleCut={handleToggleCut} />
      )}
    </div>
  );
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ panels, sawKerf }) => {

  if (panels.length === 0) {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-200 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Los resultados de la optimización aparecerán aquí.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      {panels.map((panel, index) => (
        <PanelItem key={index} panel={panel} index={index} sawKerf={sawKerf} />
      ))}
    </div>
  );
};

export default ResultDisplay;
