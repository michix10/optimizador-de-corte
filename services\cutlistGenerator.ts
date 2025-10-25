import { Panel, PlacedPiece } from '../types';

export interface CrossCut {
  position: number; // x-position relative to the strip
  piece: PlacedPiece; // The final piece produced by this cut
}

export interface RipCut {
  position: number; // y-position on the panel
  size: number; // height of the strip created
  crossCuts: CrossCut[];
}

export const generateCutList = (panel: Panel): RipCut[] => {
  // Group pieces into strips based on their y-coordinate.
  const strips = new Map<number, PlacedPiece[]>();

  panel.pieces.forEach(piece => {
    if (!strips.has(piece.y)) {
      strips.set(piece.y, []);
    }
    strips.get(piece.y)!.push(piece);
  });

  // Sort strips by their y-position (from top to bottom).
  const sortedStrips = Array.from(strips.entries()).sort((a, b) => a[0] - b[0]);

  const cutList: RipCut[] = sortedStrips.map(([y, piecesInStrip]) => {
    // Sort pieces within the strip by their x-position (from left to right).
    piecesInStrip.sort((a, b) => a.x - b.x);
    
    // The rip cut size is determined by the tallest piece in that strip.
    const ripSize = Math.max(...piecesInStrip.map(p => p.height));

    const crossCuts: CrossCut[] = piecesInStrip.map(piece => ({
      position: piece.x,
      piece: piece,
    }));

    return {
      position: y,
      size: ripSize,
      crossCuts,
    };
  });

  return cutList;
};
