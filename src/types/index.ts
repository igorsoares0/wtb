export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DrawingTool =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'text'
  | 'pen'
  | 'frame'
  | 'pan';

export interface BaseElement {
  id: string;
  type: DrawingTool;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  roughness: number;
  angle: number;
  isDeleted: boolean;
  seed: number;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
}

export interface EllipseElement extends BaseElement {
  type: 'ellipse';
}

export interface DiamondElement extends BaseElement {
  type: 'diamond';
}

export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: Point[];
  startBinding?: string;
  endBinding?: string;
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: Point[];
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  originalWidth?: number;
  originalHeight?: number;
  originalFontSize?: number;
  userSetFontSize?: boolean;
}

export interface PenElement extends BaseElement {
  type: 'pen';
  points: Point[];
}

export interface FrameElement extends BaseElement {
  type: 'frame';
  name: string;
}

export type DrawingElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | ArrowElement
  | LineElement
  | TextElement
  | PenElement
  | FrameElement;

export interface AppState {
  elements: DrawingElement[];
  selectedElementIds: string[];
  currentTool: DrawingTool;
  isDrawing: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  scrollX: number;
  scrollY: number;
  zoom: number;
  currentStrokeColor: string;
  currentFillColor: string;
  currentStrokeWidth: number;
  currentOpacity: number;
  viewportWidth: number;
  viewportHeight: number;
  history: {
    elements: DrawingElement[];
    selectedElementIds: string[];
  }[];
  historyIndex: number;
}

export interface CanvasStore extends AppState {
  // Actions
  setCurrentTool: (tool: DrawingTool) => void;
  setElements: (elements: DrawingElement[]) => void;
  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  deleteElements: (ids: string[]) => void;
  setSelectedElements: (ids: string[]) => void;
  clearSelection: () => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setDragOffset: (x: number, y: number) => void;
  setScroll: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  setCurrentStrokeColor: (color: string) => void;
  setCurrentFillColor: (color: string) => void;
  setCurrentStrokeWidth: (width: number) => void;
  setCurrentOpacity: (opacity: number) => void;
  setViewportSize: (width: number, height: number) => void;
  // Layer ordering functions
  bringToFront: (ids: string[]) => void;
  sendToBack: (ids: string[]) => void;
  bringForward: (ids: string[]) => void;
  sendBackward: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  pushToHistory: () => void;
  exportAsImage: (format: 'png' | 'svg') => void;
  exportAsJSON: () => void;
  importFromJSON: (data: string) => void;
  reset: () => void;
}