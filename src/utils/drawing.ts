import { DrawingElement, Point } from '../types';

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: DrawingElement,
  isSelected: boolean = false,
  zoom: number = 1,
  isBeingEdited: boolean = false
): void {
  ctx.save();
  
  // Apply transformations
  if (element.angle !== 0) {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(element.angle);
    ctx.translate(-centerX, -centerY);
  }
  
  // Set styles
  ctx.globalAlpha = element.opacity / 100;
  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.fillStyle = element.fillColor === 'transparent' ? 'transparent' : element.fillColor;
  
  // Draw based on element type
  switch (element.type) {
    case 'rectangle':
      drawRectangle(ctx, element);
      break;
    case 'ellipse':
      drawEllipse(ctx, element);
      break;
    case 'diamond':
      drawDiamond(ctx, element);
      break;
    case 'arrow':
      drawArrow(ctx, element);
      break;
    case 'line':
      drawLine(ctx, element);
      break;
    case 'text':
      if (!isBeingEdited) {
        drawText(ctx, element);
      }
      break;
    case 'pen':
      drawPen(ctx, element);
      break;
  }
  
  // Draw selection outline
  if (isSelected) {
    drawSelectionOutline(ctx, element, zoom);
  }
  
  ctx.restore();
}

function drawRectangle(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
  if (element.fillColor !== 'transparent') {
    ctx.fillRect(element.x, element.y, element.width, element.height);
  }
  ctx.strokeRect(element.x, element.y, element.width, element.height);
}

function drawEllipse(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const radiusX = Math.abs(element.width) / 2;
  const radiusY = Math.abs(element.height) / 2;
  
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  
  if (element.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawDiamond(ctx: CanvasRenderingContext2D, element: DrawingElement): void {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const halfWidth = element.width / 2;
  const halfHeight = element.height / 2;
  
  ctx.beginPath();
  // Top point
  ctx.moveTo(centerX, element.y);
  // Right point
  ctx.lineTo(element.x + element.width, centerY);
  // Bottom point
  ctx.lineTo(centerX, element.y + element.height);
  // Left point
  ctx.lineTo(element.x, centerY);
  // Close the path
  ctx.closePath();
  
  if (element.fillColor !== 'transparent') {
    ctx.fill();
  }
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, element: any): void {
  if (element.points && element.points.length >= 2) {
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    
    // Draw line - add element position to points
    ctx.beginPath();
    ctx.moveTo(element.x + start.x, element.y + start.y);
    for (let i = 1; i < element.points.length; i++) {
      ctx.lineTo(element.x + element.points[i].x, element.y + element.points[i].y);
    }
    ctx.stroke();
    
    // Draw arrowhead - add element position to end point
    const endX = element.x + end.x;
    const endY = element.y + end.y;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }
}

function drawLine(ctx: CanvasRenderingContext2D, element: any): void {
  if (element.points && element.points.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(element.x + element.points[0].x, element.y + element.points[0].y);
    for (let i = 1; i < element.points.length; i++) {
      ctx.lineTo(element.x + element.points[i].x, element.y + element.points[i].y);
    }
    ctx.stroke();
  }
}

function drawText(ctx: CanvasRenderingContext2D, element: any): void {
  const fontFamily = element.fontFamily || 'Arial';
  const fontSize = element.fontSize || 20;
  const textAlign = element.textAlign || 'left';
  
  // Always use stroke color for text
  ctx.fillStyle = element.strokeColor;
  ctx.textBaseline = 'top';
  
  // Set font
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // Handle multi-line text
  const lines = (element.text || '').split('\n');
  if (lines.length === 0 || lines[0] === '') return;
  
  // Calculate line height
  const lineHeight = fontSize * 1.2;
  
  // Set text alignment
  ctx.textAlign = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'right' : 'left';
  
  // Calculate starting X position based on alignment
  let startX = element.x;
  if (textAlign === 'center') {
    startX = element.x + element.width / 2;
  } else if (textAlign === 'right') {
    startX = element.x + element.width;
  }
  
  // Draw each line
  lines.forEach((line: string, index: number) => {
    const y = element.y + (index * lineHeight);
    ctx.fillText(line, startX, y);
  });
}

function drawPen(ctx: CanvasRenderingContext2D, element: any): void {
  if (element.points && element.points.length > 0) {
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (element.points.length === 1) {
      // Single point - draw a small circle
      const point = element.points[0];
      ctx.arc(element.x + point.x, element.y + point.y, Math.max(ctx.lineWidth / 2, 2), 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Multiple points - draw smooth path
      const points = element.points.map((p: any) => ({
        x: element.x + p.x,
        y: element.y + p.y
      }));
      
      ctx.moveTo(points[0].x, points[0].y);
      
      if (points.length === 2) {
        // Just two points - draw a straight line
        ctx.lineTo(points[1].x, points[1].y);
      } else {
        // Multiple points - use smooth curves
        for (let i = 1; i < points.length - 1; i++) {
          const currentPoint = points[i];
          const nextPoint = points[i + 1];
          
          // Create smooth curve using quadratic curves
          const controlX = (currentPoint.x + nextPoint.x) / 2;
          const controlY = (currentPoint.y + nextPoint.y) / 2;
          
          ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
        }
        
        // Draw to the final point
        const lastPoint = points[points.length - 1];
        ctx.lineTo(lastPoint.x, lastPoint.y);
      }
      
      ctx.stroke();
    }
  }
}

function drawSelectionOutline(ctx: CanvasRenderingContext2D, element: DrawingElement, zoom: number = 1): void {
  ctx.save();
  
  // For line and arrow elements, don't draw the selection box, only handles
  if (element.type !== 'line' && element.type !== 'arrow') {
    // Get correct bounds for the element
    const bounds = {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
    
    // For pen elements, calculate actual bounds from points
    if (element.type === 'pen') {
      const pointsElement = element as any;
      if (pointsElement.points && pointsElement.points.length > 0) {
        const xs = pointsElement.points.map((p: any) => element.x + p.x);
        const ys = pointsElement.points.map((p: any) => element.y + p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);
        
        bounds.x = minX;
        bounds.y = minY;
        bounds.width = maxX - minX;
        bounds.height = maxY - minY;
      }
    }
    
    // Draw selection border with solid line - adjust line width for zoom
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1 / zoom;
    const borderOffset = 2 / zoom;
    ctx.strokeRect(bounds.x - borderOffset, bounds.y - borderOffset, bounds.width + borderOffset * 2, bounds.height + borderOffset * 2);
  }
  
  // Draw resize handles - adjust size for zoom
  const handleSize = 8 / zoom;
  const handles = getResizeHandles(element);
  
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1.5 / zoom;
  
  handles.forEach(handle => {
    const x = handle.x - handleSize / 2;
    const y = handle.y - handleSize / 2;
    
    // For line/arrow elements, draw circular handles at endpoints
    if (handle.direction === 'start' || handle.direction === 'end') {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, handleSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else {
      // For other elements, draw square handles
      ctx.fillRect(x, y, handleSize, handleSize);
      ctx.strokeRect(x, y, handleSize, handleSize);
    }
  });
  
  ctx.restore();
}

export function getResizeHandles(element: DrawingElement): { x: number; y: number; direction: string }[] {
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
  
  // For other elements, calculate bounds and use corner handles
  let bounds = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
  
  // For pen elements, calculate actual bounds from points
  if (element.type === 'pen') {
    const pointsElement = element as any;
    if (pointsElement.points && pointsElement.points.length > 0) {
      const xs = pointsElement.points.map((p: any) => element.x + p.x);
      const ys = pointsElement.points.map((p: any) => element.y + p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      
      bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
  }
  
  // Ensure minimum size for resize handles visibility (only for very small elements)
  const minHandleSize = 8;
  const adjustedWidth = Math.max(bounds.width, minHandleSize);
  const adjustedHeight = Math.max(bounds.height, minHandleSize);
  
  const { x, y } = bounds;
  
  return [
    // Only corners
    { x: x, y: y, direction: 'nw' },
    { x: x + adjustedWidth, y: y, direction: 'ne' },
    { x: x + adjustedWidth, y: y + adjustedHeight, direction: 'se' },
    { x: x, y: y + adjustedHeight, direction: 'sw' },
  ];
}

export function drawGrid(ctx: CanvasRenderingContext2D, scrollX: number, scrollY: number, zoom: number, width: number, height: number): void {
  const gridSize = 20 * zoom;
  const offsetX = scrollX % gridSize;
  const offsetY = scrollY % gridSize;
  
  ctx.save();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.5;
  
  // Vertical lines
  for (let x = offsetX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let y = offsetY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  ctx.restore();
}