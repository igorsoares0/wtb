import { create } from 'zustand';
import { CanvasStore, DrawingElement } from '../types';

const initialState = {
  elements: [],
  selectedElementIds: [],
  currentTool: 'select' as const,
  isDrawing: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  scrollX: 0,
  scrollY: 0,
  zoom: 1,
  currentStrokeColor: '#1e293b',
  currentFillColor: 'transparent',
  currentStrokeWidth: 2,
  currentOpacity: 100,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  history: [],
  historyIndex: -1,
  clipboard: [] as DrawingElement[],
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  ...initialState,

  setCurrentTool: (tool) => {
    set({ currentTool: tool });
    if (tool !== 'select') {
      get().clearSelection();
    }
  },

  setElements: (elements) => set({ elements }),

  addElement: (element) => {
    set((state) => ({
      elements: [...state.elements, element] as DrawingElement[],
    }));
    get().pushToHistory();
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ) as DrawingElement[],
    }));
  },

  deleteElements: (ids) => {
    set((state) => ({
      elements: state.elements.filter((el) => !ids.includes(el.id)) as DrawingElement[],
      selectedElementIds: state.selectedElementIds.filter(
        (id) => !ids.includes(id)
      ),
    }));
    get().pushToHistory();
  },

  setSelectedElements: (ids) => set({ selectedElementIds: ids }),

  clearSelection: () => set({ selectedElementIds: [] }),

  setIsDrawing: (isDrawing) => set({ isDrawing }),

  setDragOffset: (x, y) => set({ dragOffsetX: x, dragOffsetY: y }),

  setScroll: (x, y) => set({ scrollX: x, scrollY: y }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  setCurrentStrokeColor: (color) => set({ currentStrokeColor: color }),

  setCurrentFillColor: (color) => set({ currentFillColor: color }),

  setCurrentStrokeWidth: (width) => set({ currentStrokeWidth: width }),

  setCurrentOpacity: (opacity) => set({ currentOpacity: opacity }),

  setViewportSize: (width, height) => set({ viewportWidth: width, viewportHeight: height }),

  pushToHistory: () => {
    const state = get();
    const historyEntry = {
      elements: [...state.elements] as DrawingElement[],
      selectedElementIds: [...state.selectedElementIds],
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(historyEntry);

    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      set({ historyIndex: state.historyIndex + 1 });
    }

    set({ history: newHistory });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const prevState = state.history[state.historyIndex - 1];
      set({
        elements: [...prevState.elements] as DrawingElement[],
        selectedElementIds: [...prevState.selectedElementIds],
        historyIndex: state.historyIndex - 1,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      set({
        elements: [...nextState.elements] as DrawingElement[],
        selectedElementIds: [...nextState.selectedElementIds],
        historyIndex: state.historyIndex + 1,
      });
    }
  },

  exportAsImage: (format) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Implementation would involve rendering elements to canvas
    // This is a simplified version
    const link = document.createElement('a');
    link.download = `drawing.${format}`;
    canvas.toBlob((blob) => {
      if (blob) {
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    });
  },

  exportAsJSON: () => {
    const state = get();
    const data = {
      type: 'excalidraw',
      version: 1,
      elements: state.elements,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'drawing.excalidraw';
    link.click();
  },

  importFromJSON: (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'excalidraw' && parsed.elements) {
        set({ elements: parsed.elements as DrawingElement[], selectedElementIds: [] });
        get().pushToHistory();
      }
    } catch (error) {
      console.error('Failed to import JSON:', error);
    }
  },

  // Bring selected elements to the front (top of the stack)
  bringToFront: (ids) => {
    set((state) => {
      // Get elements to move and remove them from current position
      const elementsToMove = state.elements.filter(el => ids.includes(el.id));
      const remainingElements = state.elements.filter(el => !ids.includes(el.id));

      // Add the elements at the end (top of the stack)
      const newElements = [...remainingElements, ...elementsToMove] as DrawingElement[];

      return { elements: newElements };
    });
    get().pushToHistory();
  },

  // Send selected elements to the back (bottom of the stack)
  sendToBack: (ids) => {
    set((state) => {
      // Get elements to move and remove them from current position
      const elementsToMove = state.elements.filter(el => ids.includes(el.id));
      const remainingElements = state.elements.filter(el => !ids.includes(el.id));

      // Add the elements at the beginning (bottom of the stack)
      const newElements = [...elementsToMove, ...remainingElements] as DrawingElement[];

      return { elements: newElements };
    });
    get().pushToHistory();
  },

  // Bring selected elements one level forward
  bringForward: (ids) => {
    set((state) => {
      const newElements = [...state.elements] as DrawingElement[];

      // For each selected element
      ids.forEach(id => {
        const index = newElements.findIndex(el => el.id === id);
        if (index !== -1 && index < newElements.length - 1) {
          // Swap with the next element
          [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
        }
      });

      return { elements: newElements };
    });
    get().pushToHistory();
  },

  // Send selected elements one level backward
  sendBackward: (ids) => {
    set((state) => {
      const newElements = [...state.elements] as DrawingElement[];

      // Process elements in reverse order to avoid index issues
      [...ids].reverse().forEach(id => {
        const index = newElements.findIndex(el => el.id === id);
        if (index > 0) {
          // Swap with the previous element
          [newElements[index - 1], newElements[index]] = [newElements[index], newElements[index - 1]];
        }
      });

      return { elements: newElements };
    });
    get().pushToHistory();
  },

  reset: () => {
    set({ ...initialState, history: [], historyIndex: -1 });
  },

  copyElements: () => {
    const state = get();
    const selectedElements = state.elements.filter(el =>
      state.selectedElementIds.includes(el.id)
    );
    set({ clipboard: selectedElements as DrawingElement[] });
  },

  pasteElements: () => {
    const state = get();
    if (state.clipboard.length === 0) return;

    // Generate unique IDs for pasted elements
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Create copies of clipboard elements with new IDs and offset position
    const pastedElements = state.clipboard.map(el => {
      const newElement = {
        ...el,
        id: generateId(),
        x: el.x + 20, // Offset by 20 pixels
        y: el.y + 20,
      } as DrawingElement;
      return newElement;
    });

    // Add pasted elements to canvas
    const newElements = [...state.elements, ...pastedElements] as DrawingElement[];

    // Select the newly pasted elements
    const newIds = pastedElements.map(el => el.id);

    set({
      elements: newElements,
      selectedElementIds: newIds,
    });

    get().pushToHistory();
  },
}));