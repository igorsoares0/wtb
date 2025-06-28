import { Point, DrawingElement, Bounds } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function isPointInBounds(point: Point, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function getElementBounds(element: DrawingElement): Bounds {
  let bounds = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
  
  // For elements with points, calculate actual bounds from points
  if (element.type === 'line' || element.type === 'arrow' || element.type === 'pen') {
    const pointsElement = element as any;
    if (pointsElement.points && pointsElement.points.length > 0) {
      const xs = pointsElement.points.map((p: Point) => element.x + p.x);
      const ys = pointsElement.points.map((p: Point) => element.y + p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      
      const width = maxX - minX;
      const height = maxY - minY;
      
      // For pen elements, add minimal padding for easier interaction but keep it simple
      if (element.type === 'pen') {
        const padding = 2; // Minimal padding for easier interaction
        
        bounds = {
          x: minX - padding,
          y: minY - padding,
          width: Math.max(width + padding * 2, 1),
          height: Math.max(height + padding * 2, 1),
        };
      } else {
        bounds = {
          x: minX,
          y: minY,
          width: Math.max(width, 1),
          height: Math.max(height, 1),
        };
      }
    }
  }
  
  return bounds;
}

// Get actual bounds of pen element without padding (for resize calculations)
export function getActualPenBounds(element: DrawingElement): Bounds {
  if (element.type === 'pen') {
    const pointsElement = element as any;
    if (pointsElement.points && pointsElement.points.length > 0) {
      const xs = pointsElement.points.map((p: Point) => element.x + p.x);
      const ys = pointsElement.points.map((p: Point) => element.y + p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      
      return {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1),
      };
    }
  }
  
  // Fallback to regular bounds
  return getElementBounds(element);
}

export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function normalizeAngle(angle: number): number {
  return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function hitTestElement(element: DrawingElement, point: Point): boolean {
  // Special handling for different element types
  switch (element.type) {
    case 'line':
    case 'arrow':
      return hitTestLineElement(element, point);
    case 'pen':
      return hitTestPenElement(element, point);
    default:
      return hitTestBoundingBox(element, point);
  }
}

function hitTestBoundingBox(element: DrawingElement, point: Point): boolean {
  const bounds = getElementBounds(element);
  
  if (element.angle !== 0) {
    const center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
    const rotatedPoint = rotatePoint(point, center, -element.angle);
    return isPointInBounds(rotatedPoint, bounds);
  }
  
  return isPointInBounds(point, bounds);
}

function hitTestLineElement(element: any, point: Point): boolean {
  if (!element.points || element.points.length < 2) return false;
  
  const tolerance = Math.max(element.strokeWidth || 2, 5);
  
  for (let i = 0; i < element.points.length - 1; i++) {
    const p1 = {
      x: element.x + element.points[i].x,
      y: element.y + element.points[i].y
    };
    const p2 = {
      x: element.x + element.points[i + 1].x,
      y: element.y + element.points[i + 1].y
    };
    
    if (distanceToLineSegment(point, p1, p2) <= tolerance) {
      return true;
    }
  }
  
  return false;
}

function hitTestPenElement(element: any, point: Point): boolean {
  if (!element.points || element.points.length === 0) return false;
  
  // Increase tolerance for easier selection of pen elements
  const tolerance = Math.max(element.strokeWidth || 2, 8); // Increased from 5 to 8
  
  // Handle single point case
  if (element.points.length === 1) {
    const p1 = {
      x: element.x + element.points[0].x,
      y: element.y + element.points[0].y
    };
    return distance(point, p1) <= tolerance;
  }
  
  // Handle multiple points case - check against all line segments
  for (let i = 0; i < element.points.length - 1; i++) {
    const p1 = {
      x: element.x + element.points[i].x,
      y: element.y + element.points[i].y
    };
    const p2 = {
      x: element.x + element.points[i + 1].x,
      y: element.y + element.points[i + 1].y
    };
    
    if (distanceToLineSegment(point, p1, p2) <= tolerance) {
      return true;
    }
  }
  
  // Also check if point is within the bounding box with some tolerance
  const bounds = getElementBounds(element);
  const expandedBounds = {
    x: bounds.x - tolerance,
    y: bounds.y - tolerance,
    width: bounds.width + tolerance * 2,
    height: bounds.height + tolerance * 2,
  };
  
  if (isPointInBounds(point, expandedBounds)) {
    // If within expanded bounds, do a more detailed check
    // Check distance to any point in the path
    for (const pt of element.points) {
      const absolutePoint = {
        x: element.x + pt.x,
        y: element.y + pt.y
      };
      if (distance(point, absolutePoint) <= tolerance) {
        return true;
      }
    }
  }
  
  return false;
}

function distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line start and end are the same point
    return distance(point, lineStart);
  }
  
  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param));
  
  const closestPoint = {
    x: lineStart.x + param * C,
    y: lineStart.y + param * D,
  };
  
  return distance(point, closestPoint);
}

export function getSelectedElementsBounds(elements: DrawingElement[]): Bounds | null {
  if (elements.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  elements.forEach((element) => {
    const bounds = getElementBounds(element);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function screenToCanvas(point: Point, scrollX: number, scrollY: number, zoom: number): Point {
  return {
    x: (point.x - scrollX) / zoom,
    y: (point.y - scrollY) / zoom,
  };
}

export function canvasToScreen(point: Point, scrollX: number, scrollY: number, zoom: number): Point {
  return {
    x: point.x * zoom + scrollX,
    y: point.y * zoom + scrollY,
  };
}

export function hitTestResizeHandle(element: DrawingElement, point: Point, zoom: number = 1): string | null {
  const handles = getResizeHandlesForElement(element);
  const handleSize = Math.max(8 / zoom, 4); // Ensure minimum handle size
  
  for (const handle of handles) {
    // For line/arrow elements, use circular hit detection
    if (handle.direction === 'start' || handle.direction === 'end') {
      const distance = Math.sqrt(
        Math.pow(point.x - handle.x, 2) + Math.pow(point.y - handle.y, 2)
      );
      if (distance <= handleSize / 2) {
        return handle.direction;
      }
    } else {
      // For other elements, use rectangular hit detection
      const bounds = {
        x: handle.x - handleSize / 2,
        y: handle.y - handleSize / 2,
        width: handleSize,
        height: handleSize,
      };
      
      if (isPointInBounds(point, bounds)) {
        return handle.direction;
      }
    }
  }
  
  return null;
}

export function getResizeHandlesForElement(element: DrawingElement): { x: number; y: number; direction: string }[] {
  // For line and arrow elements, show handles at start and end points
  if (element.type === 'line' || element.type === 'arrow') {
    const pointsElement = element as any;
    if (pointsElement.points && pointsElement.points.length >= 2) {
      const startPoint = pointsElement.points[0];
      const endPoint = pointsElement.points[pointsElement.points.length - 1];
      
      return [
        { x: element.x + startPoint.x, y: element.y + startPoint.y, direction: 'start' },
        { x: element.x + endPoint.x, y: element.y + endPoint.y, direction: 'end' },
      ];
    }
  }
  
  // For other elements (including pen), use the same bounds logic
  const bounds = getElementBounds(element);
  const { x, y, width, height } = bounds;
  
  // Ensure minimum size for resize handles visibility (only for very small elements)
  const minHandleSize = 8;
  const adjustedWidth = Math.max(width, minHandleSize);
  const adjustedHeight = Math.max(height, minHandleSize);
  
  return [
    // Only corners
    { x: x, y: y, direction: 'nw' },
    { x: x + adjustedWidth, y: y, direction: 'ne' },
    { x: x + adjustedWidth, y: y + adjustedHeight, direction: 'se' },
    { x: x, y: y + adjustedHeight, direction: 'sw' },
  ];
}

export function getResizeCursor(direction: string): string {
  switch (direction) {
    case 'nw':
    case 'se':
      return 'nw-resize';
    case 'ne':
    case 'sw':
      return 'ne-resize';
    case 'start':
    case 'end':
      return 'move';
    default:
      return 'default';
  }
}

export function resizeElement(
  element: DrawingElement,
  direction: string,
  startPoint: Point,
  currentPoint: Point,
  originalBounds: Bounds
): Partial<DrawingElement> {
  // Handle line and arrow elements differently
  if ((element.type === 'line' || element.type === 'arrow') && (direction === 'start' || direction === 'end')) {
    const pointsElement = element as any;
    if (pointsElement.points && pointsElement.points.length >= 2) {
      const newPoints = [...pointsElement.points];
      
      if (direction === 'start') {
        // For start point, directly set the new position relative to current mouse
        const newStartX = currentPoint.x - element.x;
        const newStartY = currentPoint.y - element.y;
        newPoints[0] = { x: newStartX, y: newStartY };
      } else if (direction === 'end') {
        // For end point, directly set the new position relative to current mouse
        const endIndex = newPoints.length - 1;
        const newEndX = currentPoint.x - element.x;
        const newEndY = currentPoint.y - element.y;
        newPoints[endIndex] = { x: newEndX, y: newEndY };
      }
      
      // Calculate new bounds based on updated points
      const xs = newPoints.map(p => p.x);
      const ys = newPoints.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      
      // Calculate new element position
      const newElementX = element.x + minX;
      const newElementY = element.y + minY;
      
      // Normalize points to new element position
      const normalizedPoints = newPoints.map((point: Point) => {
        return {
          x: point.x - minX,
          y: point.y - minY,
        };
      });
      
      return {
        x: newElementX,
        y: newElementY,
        width: Math.max(maxX - minX, 1),
        height: Math.max(maxY - minY, 1),
        points: normalizedPoints,
      };
    }
  }
  
  // Original logic for other elements
  const deltaX = currentPoint.x - startPoint.x;
  const deltaY = currentPoint.y - startPoint.y;
  
  let newX = originalBounds.x;
  let newY = originalBounds.y;
  let newWidth = originalBounds.width;
  let newHeight = originalBounds.height;
  
  // Only handle corner directions since we removed edge handles
  switch (direction) {
    case 'nw':
      newX = originalBounds.x + deltaX;
      newY = originalBounds.y + deltaY;
      newWidth = originalBounds.width - deltaX;
      newHeight = originalBounds.height - deltaY;
      break;
    case 'ne':
      newY = originalBounds.y + deltaY;
      newWidth = originalBounds.width + deltaX;
      newHeight = originalBounds.height - deltaY;
      break;
    case 'se':
      newWidth = originalBounds.width + deltaX;
      newHeight = originalBounds.height + deltaY;
      break;
    case 'sw':
      newX = originalBounds.x + deltaX;
      newWidth = originalBounds.width - deltaX;
      newHeight = originalBounds.height + deltaY;
      break;
  }
  
  // Ensure minimum size
  const minSize = 20; // Increased minimum size
  if (newWidth < minSize) {
    if (direction.includes('w')) {
      newX = originalBounds.x + originalBounds.width - minSize;
    }
    newWidth = minSize;
  }
  if (newHeight < minSize) {
    if (direction.includes('n')) {
      newY = originalBounds.y + originalBounds.height - minSize;
    }
    newHeight = minSize;
  }
  
  const updates: any = {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };
  
  // Special handling for text elements - adjust font size proportionally
  if (element.type === 'text') {
    const textElement = element as any;
    const text = textElement.text || '';
    
    // Don't store original dimensions if we're just initializing the element
    // Only store when user actually resizes it
    if (!textElement.originalWidth && originalBounds.width > 0 && direction) {
      // First time resizing, store original values
      updates.originalWidth = originalBounds.width;
      updates.originalHeight = originalBounds.height;
      updates.originalFontSize = textElement.fontSize || 20;
    }
    
    // For text elements, we'll let the drawing function handle the font size
    // This allows the text to fill the space better, similar to Excalidraw
    
    // Set a flag to indicate that the text has been resized by the user
    // This will be used in the drawing function to determine whether to auto-size
    updates.userSetFontSize = false;
    
    // We don't need to calculate font size here anymore
    // The drawing function will handle it based on the new dimensions
    
    // However, we should reset the fontSize if the text element is resized to a very different size
    // This prevents issues when dramatically changing the size of a text element
    const currentWidth = textElement.width || 0;
    const currentHeight = textElement.height || 0;
    
    // If the size change is significant (more than doubling or halving), reset the fontSize
    // to allow the drawing function to recalculate it optimally
    const widthRatio = newWidth / currentWidth;
    const heightRatio = newHeight / currentHeight;
    
    if (currentWidth > 0 && currentHeight > 0 && 
        (widthRatio > 2 || widthRatio < 0.5 || heightRatio > 2 || heightRatio < 0.5)) {
      updates.fontSize = undefined; // Let the drawing function calculate it fresh
    }
  }
  // For pen elements, scale points proportionally with improved logic
  else if (element.type === 'pen') {
    const pointsElement = element as any;
    if (pointsElement.points && pointsElement.points.length > 0) {
      // Use the same simple scaling logic as other elements
      const scaleX = newWidth / originalBounds.width;
      const scaleY = newHeight / originalBounds.height;
      
      // Transform points with simple scaling
      const updatedPoints = pointsElement.points.map((point: Point) => {
        return {
          x: point.x * scaleX,
          y: point.y * scaleY,
        };
      });
      
      updates.points = updatedPoints;
    }
  }
  
  return updates;
}