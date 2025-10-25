// FIX: Add EdgeBanding enum for SummaryDisplay component
export enum EdgeBanding {
  None = 'none',
  Single = 'single',
  Double = 'double',
}

export enum Rotation {
  None = 'none',
  Allowed = 'allowed',
  Forced = 'forced',
}

export interface Piece {
  id: string;
  width: number;
  height: number;
  // FIX: Add banding properties for SummaryDisplay component
  widthBanding: EdgeBanding;
  heightBanding: EdgeBanding;
  rotation: Rotation;
}

export interface PlacedPiece extends Piece {
  x: number;
  y: number;
  rotated: boolean;
}

export interface Offcut {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Panel {
  width: number;
  height: number;
  pieces: PlacedPiece[];
  offcuts: Offcut[];
}
