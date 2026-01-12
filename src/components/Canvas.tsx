import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { DrawingElement, Point, ArrowElement, LineElement, PenElement, TextElement, FrameElement, ImageElement, Bounds } from '../types';
import { drawElement, drawGrid } from '../utils/drawing';
import { generateId, hitTestElement, hitTestResizeHandle, getResizeCursor, resizeElement, getElementBounds } from '../utils/helpers';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [resizeStartPoint, setResizeStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [originalBounds, setOriginalBounds] = useState<Bounds>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragStartPoint, setDragStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isEditingFrameName, setIsEditingFrameName] = useState(false);
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [frameNameInput, setFrameNameInput] = useState('');
  const [lastClickTime, setLastClickTime] = useState(0);
  const [hasMouseMoved, setHasMouseMoved] = useState(false);
  const [lastClickElement, setLastClickElement] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPoint, setPanStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [panStartScroll, setPanStartScroll] = useState<Point>({ x: 0, y: 0 });
  const [lastClickPosition, setLastClickPosition] = useState<Point | null>(null);
  const [elementCycleIndex, setElementCycleIndex] = useState<number>(0);

  const {
    elements,
    currentTool,
    currentStrokeColor,
    currentFillColor,
    currentStrokeWidth,
    currentOpacity,
    selectedElementIds,
    zoom,
    scrollX,
    scrollY,
    addElement,
    updateElement,
    setSelectedElements,
    pushToHistory,
    setScroll,
  } = useCanvasStore();

  // Elementos selecionados para uso em outras partes do código
  const pan = useMemo(() => ({ x: scrollX, y: scrollY }), [scrollX, scrollY]);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const startTextEditing = useCallback((element: TextElement) => {
    setIsEditingText(true);
    setEditingTextId(element.id);
    setTextInput(element.text || '');
    setSelectedElements([element.id]);

    // Position textarea over the text element
    setTimeout(() => {
      const textarea = textareaRef.current;
      const canvas = canvasRef.current;
      if (textarea && canvas) {
        const rect = canvas.getBoundingClientRect();
        
        // Calculate exact position with zoom and pan
        const x = element.x * zoom + pan.x + rect.left;
        const y = element.y * zoom + pan.y + rect.top;
        
        // Calculate size with zoom
        const width = Math.max(element.width * zoom, 150);
        const height = Math.max(element.height * zoom, 30);
        const fontSize = Math.max((element.fontSize || 20) * zoom, 12);
        
        textarea.style.position = 'absolute';
        textarea.style.left = `${x}px`;
        textarea.style.top = `${y}px`;
        textarea.style.width = `${width}px`;
        textarea.style.height = `${height}px`;
        textarea.style.fontSize = `${fontSize}px`;
        textarea.style.fontFamily = element.fontFamily || 'Arial';
        textarea.style.color = element.strokeColor;
        textarea.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        textarea.style.border = '2px solid #1971c2';
        textarea.style.borderRadius = '4px';
        textarea.style.padding = '4px';
        textarea.style.margin = '0';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.overflow = 'hidden';
        textarea.style.zIndex = '1000';
        textarea.style.display = 'block';
        textarea.style.lineHeight = '1.2';
        textarea.style.textAlign = element.textAlign || 'left';
        textarea.style.whiteSpace = 'pre-wrap';
        textarea.style.wordWrap = 'break-word';
        
        textarea.focus();
        textarea.select();
      }
    }, 0);
  }, [zoom, pan, setSelectedElements]);

  const finishTextEditing = useCallback(() => {
    if (!isEditingText || !editingTextId) return;

    const element = elements.find(el => el.id === editingTextId) as TextElement;
    if (!element) return;

    if (textInput.trim() === '') {
      // Remove empty text elements
      const filteredElements = elements.filter(el => el.id !== editingTextId);
      useCanvasStore.setState({ elements: filteredElements });
    } else {
      // Update text and calculate new dimensions
      const lines = textInput.split('\n');
      const fontSize = element.fontSize || 20;
      
      // Simple calculation based on font size and text content
      const estimatedCharWidth = fontSize * 0.6; // Approximate character width
      const lineHeight = fontSize * 1.2;
      
      // Calculate width based on longest line
      const maxLineLength = Math.max(...lines.map(line => line.length), 1);
      const newWidth = Math.max(maxLineLength * estimatedCharWidth + 16, 100); // Add padding
      const newHeight = Math.max(lines.length * lineHeight + 16, 40); // Add padding

      updateElement(editingTextId, {
        text: textInput,
        width: newWidth,
        height: newHeight,
      });
    }

    // Clean up
    setIsEditingText(false);
    setEditingTextId(null);
    setTextInput('');
    
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.display = 'none';
    }

    pushToHistory();
  }, [isEditingText, editingTextId, textInput, elements, updateElement, pushToHistory]);

  const cancelTextEditing = useCallback(() => {
    setIsEditingText(false);
    setEditingTextId(null);
    setTextInput('');

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.display = 'none';
    }
  }, []);

  const startFrameNameEditing = useCallback((element: FrameElement) => {
    setIsEditingFrameName(true);
    setEditingFrameId(element.id);
    setFrameNameInput(element.name || 'Frame');
    setSelectedElements([element.id]);
  }, [setSelectedElements]);

  const finishFrameNameEditing = useCallback(() => {
    if (!isEditingFrameName || !editingFrameId) return;

    const element = elements.find(el => el.id === editingFrameId) as FrameElement;
    if (!element) return;

    const newName = frameNameInput.trim() || 'Frame';
    updateElement(editingFrameId, { name: newName });

    // Clean up
    setIsEditingFrameName(false);
    setEditingFrameId(null);
    setFrameNameInput('');

    pushToHistory();
  }, [isEditingFrameName, editingFrameId, frameNameInput, elements, updateElement, pushToHistory]);

  const createTextElement = useCallback((point: Point) => {
    const textElement: TextElement = {
      id: generateId(),
      type: 'text',
      x: point.x,
      y: point.y,
      width: 150,
      height: 30,
      strokeColor: currentStrokeColor,
      fillColor: currentFillColor,
      strokeWidth: currentStrokeWidth,
      opacity: currentOpacity,
      roughness: 1,
      angle: 0,
      isDeleted: false,
      seed: Math.floor(Math.random() * 2 ** 31),
      text: '',
      fontSize: 20, // Base font size - will be auto-adjusted by drawText
      fontFamily: 'Arial',
      textAlign: 'left',
    };
    
    addElement(textElement);
    setSelectedElements([textElement.id]);
    useCanvasStore.getState().setCurrentTool('select');
    startTextEditing(textElement);
  }, [currentStrokeColor, currentFillColor, currentStrokeWidth, currentOpacity, addElement, startTextEditing, setSelectedElements]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;
    setLastClickTime(now);

    // If editing text, finish it first
    if (isEditingText) {
      finishTextEditing();
      return;
    }

    // If editing frame name, finish it first
    if (isEditingFrameName) {
      finishFrameNameEditing();
      return;
    }

    // PRIORITY: Check if clicking on frame name area (must be FIRST)
    // This needs to be checked before any other element hit tests
    const clickedFrameName = elements
      .filter(el => el.type === 'frame')
      .find(el => {
        const frameEl = el as FrameElement;
        
        // Calculate the area where the frame name text is displayed
        // The text is drawn at y = frameEl.y - 8 (8px above the frame)
        // We need to create a clickable area for the text
        const textY = frameEl.y - 8;
        const nameHeight = 24; // Height of the clickable text area (larger for easier clicking)
        const nameY = textY - nameHeight; // Start of clickable area
        
        // Measure text width (approximate based on font size and text length)
        // For 16px font with weight 600, approximately 9-10px per character
        const textWidth = (frameEl.name || 'Frame').length * 10;
        
        // Create a wider clickable area for easier interaction
        const clickableWidth = Math.max(textWidth + 20, 80); // Add padding and minimum width
        
        return (
          point.x >= frameEl.x - 10 && // Add padding on left
          point.x <= frameEl.x + clickableWidth && // Use calculated width
          point.y >= nameY &&
          point.y <= textY + 8 // Add padding below text
        );
      }) as FrameElement | undefined;

    // If clicked on frame name area
    if (clickedFrameName) {
      // Check if this is a double-click on the same frame name
      // Check both element ID and position (within 15px tolerance for zoom)
      const isSameFrame = lastClickElement === clickedFrameName.id;
      const tolerance = 15 / zoom; // Adjust tolerance based on zoom level
      const isSamePosition = lastClickPosition && 
        Math.abs(lastClickPosition.x - point.x) < tolerance && 
        Math.abs(lastClickPosition.y - point.y) < tolerance;
      
      // Double-click detection: same frame, same position (within tolerance), and within time window
      if (timeSinceLastClick < 500 && timeSinceLastClick > 0 && isSameFrame && isSamePosition) {
        // Double-click detected! Start editing
        e.preventDefault();
        e.stopPropagation();
        startFrameNameEditing(clickedFrameName);
        // Reset tracking to prevent accidental re-triggering
        setLastClickTime(0);
        setLastClickElement(null);
        setLastClickPosition(null);
        return;
      } else {
        // Single click - track for next click to detect double-click
        setLastClickElement(clickedFrameName.id);
        setLastClickPosition(point);
        // Also select the frame but don't start dragging (will wait for mouse move)
        setSelectedElements([clickedFrameName.id]);
        // Don't start dragging immediately - wait to see if this becomes a double-click
        // The dragging will start in handleMouseMove if the mouse actually moves
        return;
      }
    }

    // Check for double-click on text elements (within 500ms)
    if (timeSinceLastClick < 500) {
      const clickedElement = elements.find(el =>
        el.type === 'text' && hitTestElement(el, point)
      ) as TextElement;

      if (clickedElement && lastClickElement === clickedElement.id) {
        startTextEditing(clickedElement);
        return;
      }
    }

    // Update last clicked element for double-click tracking
    const clickedElement = elements.find(el => hitTestElement(el, point));
    setLastClickElement(clickedElement ? clickedElement.id : null);

    // Handle tool-specific actions
    if (currentTool === 'text') {
      createTextElement(point);
      return;
    }

    // Handle Pan tool
    if (currentTool === 'pan') {
      setIsPanning(true);
      setPanStartPoint({ x: e.clientX, y: e.clientY });
      setPanStartScroll({ x: scrollX, y: scrollY });
      document.body.style.cursor = 'grabbing';
      return;
    }

    // Rest of the existing mouse down logic...
    if (currentTool === 'select') {
      // First, check if we're clicking on a resize handle of a selected element
      let resizeHandleClicked = false;
      for (const elementId of selectedElementIds) {
        const selectedElement = elements.find(el => el.id === elementId);
        if (selectedElement) {
          const direction = hitTestResizeHandle(selectedElement, point, zoom);
          if (direction) {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            setResizeDirection(direction);
            setResizeStartPoint(point);
            // Use the same bounds logic for all elements
            setOriginalBounds(getElementBounds(selectedElement));
            document.body.style.cursor = getResizeCursor(direction);
            resizeHandleClicked = true;
            break;
          }
        }
      }
      
      if (!resizeHandleClicked) {
        // Check for elements at the clicked position
        const elementsAtPoint = elements
          .filter(el => !el.isDeleted && hitTestElement(el, point))
          .sort((a, b) => elements.indexOf(b) - elements.indexOf(a)); // Sort by z-index (reverse order in array)
        
        if (elementsAtPoint.length > 0) {
          // Start dragging
          setIsDragging(true);
          setDragStartPoint(point);
          
          // Check if we're clicking at the same position as before
          const isSamePosition = lastClickPosition && 
            Math.abs(lastClickPosition.x - point.x) < 5 && 
            Math.abs(lastClickPosition.y - point.y) < 5;
          
          // If clicking at the same position and there are multiple elements
          if (isSamePosition && elementsAtPoint.length > 1 && timeSinceLastClick < 500) {
            // Cycle through elements at this position
            const newIndex = (elementCycleIndex + 1) % elementsAtPoint.length;
            setElementCycleIndex(newIndex);
            setSelectedElements([elementsAtPoint[newIndex].id]);
            
            // Show a visual indicator that we've cycled to a new element
            const indicator = document.createElement('div');
            indicator.textContent = `${newIndex + 1}/${elementsAtPoint.length}`;
            indicator.style.position = 'absolute';
            indicator.style.left = `${e.clientX + 15}px`;
            indicator.style.top = `${e.clientY - 15}px`;
            indicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
            indicator.style.color = 'white';
            indicator.style.padding = '3px 6px';
            indicator.style.borderRadius = '3px';
            indicator.style.fontSize = '12px';
            indicator.style.pointerEvents = 'none';
            indicator.style.zIndex = '9999';
            document.body.appendChild(indicator);
            
            setTimeout(() => {
              document.body.removeChild(indicator);
            }, 1000);
          } else {
            // First click or different position, select the top element
            setElementCycleIndex(0);
            setSelectedElements([elementsAtPoint[0].id]);
          }
          
          // Update last click position
          setLastClickPosition(point);
        } else {
          // Clear selection if clicking on empty space
          setSelectedElements([]);
          setElementCycleIndex(0);
          setLastClickPosition(null);
        }  
      }
    } else if (currentTool === 'rectangle' || currentTool === 'ellipse' || currentTool === 'diamond') {
      const element: DrawingElement = {
        id: generateId(),
        type: currentTool,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor: currentStrokeColor,
        fillColor: currentFillColor,
        strokeWidth: currentStrokeWidth,
        opacity: currentOpacity,
        roughness: 1,
        angle: 0,
        isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
      };
      
      setCurrentElement(element);
      setIsDrawing(true);
      setHasMouseMoved(false);
      addElement(element);
    } else if (currentTool === 'arrow' || currentTool === 'line') {
      const element: ArrowElement | LineElement = {
        id: generateId(),
        type: currentTool,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor: currentStrokeColor,
        fillColor: currentFillColor,
        strokeWidth: currentStrokeWidth,
        opacity: currentOpacity,
        roughness: 1,
        angle: 0,
        isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        points: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
      } as ArrowElement | LineElement;
      
      setCurrentElement(element);
      setIsDrawing(true);
      setHasMouseMoved(false);
      addElement(element);
    } else if (currentTool === 'frame') {
      const element: FrameElement = {
        id: generateId(),
        type: 'frame',
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor: currentStrokeColor,
        fillColor: 'transparent',
        strokeWidth: 2,
        opacity: currentOpacity,
        roughness: 1,
        angle: 0,
        isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        name: 'Frame',
      };

      setCurrentElement(element);
      setIsDrawing(true);
      setHasMouseMoved(false);
      addElement(element);
    } else if (currentTool === 'image') {
      // Get the pending image data URL from localStorage
      const dataURL = localStorage.getItem('pendingImageUpload');
      if (dataURL) {
        // Load the image to get its dimensions
        const img = new Image();
        img.onload = () => {
          const element: ImageElement = {
            id: generateId(),
            type: 'image',
            x: point.x,
            y: point.y,
            width: img.width,
            height: img.height,
            strokeColor: currentStrokeColor,
            fillColor: 'transparent',
            strokeWidth: 0,
            opacity: 100,
            roughness: 0,
            angle: 0,
            isDeleted: false,
            seed: Math.floor(Math.random() * 2 ** 31),
            dataURL: dataURL,
            originalWidth: img.width,
            originalHeight: img.height,
          };

          addElement(element);
          pushToHistory();
          setSelectedElements([element.id]);
          // Clear the pending upload
          localStorage.removeItem('pendingImageUpload');
          // Switch back to select tool
          useCanvasStore.getState().setCurrentTool('select');
        };
        img.src = dataURL;
      }
    } else if (currentTool === 'pen') {
      const element: PenElement = {
        id: generateId(),
        type: 'pen',
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor: currentStrokeColor,
        fillColor: currentFillColor,
        strokeWidth: currentStrokeWidth,
        opacity: currentOpacity,
        roughness: 1,
        angle: 0,
        isDeleted: false,
        seed: Math.floor(Math.random() * 2 ** 31),
        points: [{ x: 0, y: 0 }],
      };
      
      setCurrentElement(element);
      setIsDrawing(true);
      setHasMouseMoved(false);
      addElement(element);
    }
  }, [
    getCanvasPoint, lastClickTime, isEditingText, finishTextEditing, elements,
    currentTool, selectedElementIds, createTextElement, startTextEditing,
    currentStrokeColor, currentFillColor, currentStrokeWidth, currentOpacity,
    addElement, setSelectedElements, lastClickElement, elementCycleIndex,
    lastClickPosition, scrollX, scrollY, zoom, isEditingFrameName, finishFrameNameEditing,
    startFrameNameEditing, pushToHistory
  ]);

  // Rest of the existing mouse handlers remain the same...
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);

    if (isResizing && resizeDirection && originalBounds) {
      const selectedElement = elements.find(el => selectedElementIds.includes(el.id));
      if (selectedElement) {
        const updates = resizeElement(selectedElement, resizeDirection, resizeStartPoint, point, originalBounds);
        updateElement(selectedElement.id, updates);
      }
    } else if (isDragging && selectedElementIds.length > 0) {
      const dx = point.x - dragStartPoint.x;
      const dy = point.y - dragStartPoint.y;
      
      selectedElementIds.forEach((elementId: string) => {
        const element = elements.find(el => el.id === elementId);
        if (element) {
          // Simplified dragging logic - just update position for all elements
          // Points are relative to element position, so they don't need to be modified
          updateElement(elementId, {
            x: element.x + dx,
            y: element.y + dy,
          });
        }
      });
      
      setDragStartPoint(point);
    } else if (isDrawing && currentElement) {
      setHasMouseMoved(true);
      
      const width = Math.abs(point.x - currentElement.x);
      const height = Math.abs(point.y - currentElement.y);
      const x = Math.min(point.x, currentElement.x);
      const y = Math.min(point.y, currentElement.y);

      if (currentElement.type === 'arrow' || currentElement.type === 'line') {
        const dx = point.x - currentElement.x;
        const dy = point.y - currentElement.y;
        updateElement(currentElement.id, {
          width: Math.abs(dx),
          height: Math.abs(dy),
          points: [{ x: 0, y: 0 }, { x: dx, y: dy }],
        });
      } else if (currentElement.type === 'pen') {
        // Use a versão mais recente do elemento armazenado para não perder pontos anteriores
        const elementInStore = elements.find(el => el.id === currentElement.id) as PenElement;
        const elementOrigin = elementInStore || (currentElement as PenElement);

        const dx = point.x - elementOrigin.x;
        const dy = point.y - elementOrigin.y;
        const currentPoints = elementOrigin.points;
        
        // Check minimum distance to avoid too many close points (smoother drawing)
        const minDistance = 2; // Minimum distance between points
        const lastPoint = currentPoints[currentPoints.length - 1];
        const newPoint = { x: dx, y: dy };
        
        let newPoints = [...currentPoints];
        
        // Only add point if it's far enough from the last point
        if (currentPoints.length === 0 || 
            Math.sqrt(Math.pow(newPoint.x - lastPoint.x, 2) + Math.pow(newPoint.y - lastPoint.y, 2)) >= minDistance) {
          newPoints = [...currentPoints, newPoint];
        } else {
          // Update the last point instead of adding a new one
          newPoints[newPoints.length - 1] = newPoint;
        }
        
        const minX = Math.min(...newPoints.map(p => p.x));
        const minY = Math.min(...newPoints.map(p => p.y));
        const maxX = Math.max(...newPoints.map(p => p.x));
        const maxY = Math.max(...newPoints.map(p => p.y));
        
        updateElement(currentElement.id, {
          points: newPoints,
          width: Math.max(maxX - minX, 1),
          height: Math.max(maxY - minY, 1),
        });
      } else {
        updateElement(currentElement.id, {
          x,
          y,
          width,
          height,
        });
      }
    } else if (currentTool === 'select') {
      // Update cursor based on hover state
      const hoveredElement = elements.find(el => hitTestElement(el, point));
      if (hoveredElement && selectedElementIds.includes(hoveredElement.id)) {
        const direction = hitTestResizeHandle(hoveredElement, point, zoom);
        if (direction) {
          document.body.style.cursor = getResizeCursor(direction);
        } else {
          document.body.style.cursor = 'move';
        }
      } else if (hoveredElement) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    }

    if (isPanning) {
      const dx = e.clientX - panStartPoint.x;
      const dy = e.clientY - panStartPoint.y;
      setScroll(panStartScroll.x + dx, panStartScroll.y + dy);
      return;
    }

    // Se a ferramenta atual é pan e não estamos arrastando, use cursor de mão
    if (!isPanning && currentTool === 'pan') {
      document.body.style.cursor = 'grab';
    }
  }, [
    getCanvasPoint, isResizing, resizeDirection, originalBounds, isDragging,
    selectedElementIds, isDrawing, currentElement, currentTool, elements,
    resizeStartPoint, dragStartPoint, updateElement, isPanning, panStartPoint, panStartScroll, setScroll, zoom
  ]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentElement) {
      // Only apply default size if there was no mouse movement (true single click)
      if (!hasMouseMoved) {
        const defaultSize = 50; // Default size for single-click creation
        
        if (currentElement.type === 'arrow' || currentElement.type === 'line') {
          // For line-based elements, create a line from start to default end point
          updateElement(currentElement.id, {
            width: defaultSize,
            height: 0,
            points: [{ x: 0, y: 0 }, { x: defaultSize, y: 0 }],
          });
        } else if (currentElement.type === 'pen') {
          // For pen, create a small circular dot
          updateElement(currentElement.id, {
            width: 8,
            height: 8,
            points: [
              { x: 0, y: 4 },
              { x: 1, y: 2 },
              { x: 3, y: 0 },
              { x: 5, y: 1 },
              { x: 8, y: 4 },
              { x: 5, y: 7 },
              { x: 3, y: 8 },
              { x: 1, y: 6 },
              { x: 0, y: 4 }
            ],
          });
        } else {
          // For shape elements (rectangle, circle, diamond)
          updateElement(currentElement.id, {
            width: defaultSize,
            height: defaultSize,
          });
        }
      }
      
      // Automatically select the created element and switch to select tool
      setSelectedElements([currentElement.id]);
      useCanvasStore.getState().setCurrentTool('select');
      
      pushToHistory();
    }
    
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setCurrentElement(null);
    setResizeDirection('');
    setHasMouseMoved(false); // Reset movement flag
    document.body.style.cursor = 'default';

    if (isPanning) {
      setIsPanning(false);
      document.body.style.cursor = 'default';
    }
  }, [isDrawing, currentElement, hasMouseMoved, pushToHistory, updateElement, setSelectedElements, isPanning]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is editing text or frame name - prevent deletion of elements
      const activeElement = document.activeElement;
      const isInputActive = activeElement && (
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'INPUT' ||
        (activeElement as HTMLElement).contentEditable === 'true'
      );

      // If editing text, handle text-specific shortcuts
      if (isEditingText) {
        if (e.key === 'Escape') {
          cancelTextEditing();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          finishTextEditing();
        }
        return;
      }

      // If editing frame name or any input is active, don't process delete shortcuts
      // Let the input handle Delete/Backspace for text editing
      if (isEditingFrameName || isInputActive) {
        return;
      }

      // Handle other keyboard shortcuts...
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          selectedElementIds.forEach((elementId: string) => {
            updateElement(elementId, { isDeleted: true });
          });
          setSelectedElements([]);
          pushToHistory();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditingText, isEditingFrameName, selectedElementIds, updateElement, setSelectedElements, pushToHistory, cancelTextEditing, finishTextEditing]);

  // Handle text input changes
  const handleTextInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  }, []);

  // Handle textarea blur
  const handleTextareaBlur = useCallback(() => {
    // Only finish editing if the blur wasn't caused by clicking on the canvas
    setTimeout(() => {
      if (isEditingText) {
        finishTextEditing();
      }
    }, 100);
  }, [isEditingText, finishTextEditing]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    drawGrid(ctx, scrollX, scrollY, zoom, rect.width, rect.height);

    // Draw elements
    elements.forEach(element => {
      if (!element.isDeleted) {
        const isBeingEdited = editingTextId === element.id;
        drawElement(ctx, element, selectedElementIds.includes(element.id), zoom, isBeingEdited);
      }
    });

    ctx.restore();
  }, [elements, selectedElementIds, zoom, pan, scrollX, scrollY, editingTextId]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <textarea
        ref={textareaRef}
        value={textInput}
        onChange={handleTextInputChange}
        onBlur={handleTextareaBlur}
        style={{ display: 'none' }}
        className="absolute"
      />
      {isEditingFrameName && editingFrameId && (
        <input
          type="text"
          value={frameNameInput}
          onChange={(e) => setFrameNameInput(e.target.value)}
          onBlur={finishFrameNameEditing}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              finishFrameNameEditing();
            } else if (e.key === 'Escape') {
              setIsEditingFrameName(false);
              setEditingFrameId(null);
              setFrameNameInput('');
            }
          }}
          autoFocus
          style={{
            position: 'absolute',
            left: `${
              ((elements.find(el => el.id === editingFrameId) as FrameElement)?.x || 0) * zoom +
              pan.x +
              (canvasRef.current?.getBoundingClientRect().left || 0)
            }px`,
            top: `${
              ((elements.find(el => el.id === editingFrameId) as FrameElement)?.y || 0) * zoom +
              pan.y +
              (canvasRef.current?.getBoundingClientRect().top || 0) -
              32
            }px`,
            fontSize: `${16 * zoom}px`,
            fontFamily: 'Arial, sans-serif',
            fontWeight: '600',
            color: (elements.find(el => el.id === editingFrameId) as FrameElement)?.strokeColor || '#000',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #6366f1',
            borderRadius: '4px',
            padding: '4px 8px',
            outline: 'none',
            zIndex: 1001,
            minWidth: '100px',
          }}
        />
      )}
    </div>
  );
};

export default Canvas;