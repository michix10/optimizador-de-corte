
import { Piece, Panel, PlacedPiece, Offcut, Rotation } from '../types.ts';

interface Node {
  x: number;
  y: number;
  width: number;
  height: number;
  used: boolean;
  down?: Node;
  right?: Node;
}

export const optimizeCuts = (
  pieces: Piece[],
  panelWidth: number,
  panelHeight: number,
  sawKerf: number,
): Panel[] => {
  const panels: Panel[] = [];
  let remainingPieces = [...pieces];

  while (remainingPieces.length > 0) {
    const newPanel: Panel = {
      width: panelWidth,
      height: panelHeight,
      pieces: [],
      offcuts: [],
    };
    
    // Sort pieces from largest to smallest area to try and place big ones first.
    remainingPieces.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    let root: Node = { x: 0, y: 0, width: panelWidth, height: panelHeight, used: false };

    const findNode = (rootNode: Node, w: number, h: number): Node | null => {
        if (rootNode.used) {
            const rightResult = rootNode.right ? findNode(rootNode.right, w, h) : null;
            if (rightResult) return rightResult;
            const downResult = rootNode.down ? findNode(rootNode.down, w, h) : null;
            return downResult;
        } else if (w <= rootNode.width && h <= rootNode.height) {
            return rootNode;
        } else {
            return null;
        }
    };

    const splitNode = (node: Node, w: number, h: number): void => {
        node.used = true;

        const remainingHeight = node.height - h - sawKerf;
        const remainingWidth = node.width - w - sawKerf;

        node.down = { 
            x: node.x, 
            y: node.y + h + sawKerf, 
            width: node.width, 
            height: remainingHeight > 0 ? remainingHeight : 0, 
            used: false 
        };
        node.right = { 
            x: node.x + w + sawKerf, 
            y: node.y, 
            width: remainingWidth > 0 ? remainingWidth : 0, 
            height: h, 
            used: false 
        };
    };

    let placedAPieceOnThisIteration = true;
    while(placedAPieceOnThisIteration) {
        placedAPieceOnThisIteration = false;
        
        let pieceToPlaceInfo: {
            piece: Piece;
            index: number;
            node: Node;
            rotated: boolean;
        } | null = null;

        // Find the first piece from the sorted list that fits
        for (let i = 0; i < remainingPieces.length; i++) {
            const piece = remainingPieces[i];
            
            let node: Node | null = null;
            let rotated = false;

            switch (piece.rotation) {
                case Rotation.None:
                    node = findNode(root, piece.width, piece.height);
                    if (node) rotated = false;
                    break;
                case Rotation.Allowed:
                    // Try without rotation first
                    node = findNode(root, piece.width, piece.height);
                    if (node) {
                        rotated = false;
                    } else {
                        // Try with rotation
                        node = findNode(root, piece.height, piece.width);
                        if (node) rotated = true;
                    }
                    break;
                case Rotation.Forced:
                    node = findNode(root, piece.height, piece.width);
                    if (node) rotated = true;
                    break;
            }

            if (node) {
                pieceToPlaceInfo = { piece, index: i, node, rotated };
                break; // Break from the piece finding loop
            }
        }

        if (pieceToPlaceInfo) {
            const { piece, index, node, rotated } = pieceToPlaceInfo;
    
            const placedWidth = rotated ? piece.height : piece.width;
            const placedHeight = rotated ? piece.width : piece.height;
            
            splitNode(node, placedWidth, placedHeight);
            
            newPanel.pieces.push({
                ...piece,
                x: node.x,
                y: node.y,
                width: placedWidth,
                height: placedHeight,
                rotated: rotated,
            });
        
            remainingPieces.splice(index, 1);
            placedAPieceOnThisIteration = true;
        }
    }
    
    if (newPanel.pieces.length > 0) {
        const offcuts: Offcut[] = [];
        const collectOffcuts = (node: Node) => {
            if (node.used) {
                if (node.right) collectOffcuts(node.right);
                if (node.down) collectOffcuts(node.down);
            } else if (node.width > 0 && node.height > 0) {
                offcuts.push({ x: node.x, y: node.y, width: node.width, height: node.height });
            }
        };

        collectOffcuts(root);
        newPanel.offcuts = offcuts;
        panels.push(newPanel);
    } else if (remainingPieces.length > 0) {
        console.warn("No se pudieron colocar algunas piezas porque podrían ser demasiado grandes para las dimensiones del tablero.", remainingPieces);
        break;
    }
  }

  return panels;
};
