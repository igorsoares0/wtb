import React, { useEffect } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import PropertyPanel from './components/PropertyPanel';
import StatusBar from './components/StatusBar';
import { useCanvasStore } from './store/canvasStore';

function App() {
  const { pushToHistory } = useCanvasStore();

  useEffect(() => {
    // Initialize history
    pushToHistory();

    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is editing text - look for active textarea or input
      const activeElement = document.activeElement;
      const isEditingText = activeElement && (
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.tagName === 'INPUT' ||
        (activeElement as HTMLElement).contentEditable === 'true'
      );

      // If editing text, don't process keyboard shortcuts
      if (isEditingText) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              useCanvasStore.getState().redo();
            } else {
              useCanvasStore.getState().undo();
            }
            break;
          case 'y':
            e.preventDefault();
            useCanvasStore.getState().redo();
            break;
          case 'a':
            e.preventDefault();
            const allIds = useCanvasStore.getState().elements
              .filter(el => !el.isDeleted)
              .map(el => el.id);
            useCanvasStore.getState().setSelectedElements(allIds);
            break;
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            const { selectedElementIds, deleteElements } = useCanvasStore.getState();
            if (selectedElementIds.length > 0) {
              deleteElements(selectedElementIds);
            }
            break;
        }
      }

      // Tool shortcuts
      switch (e.key) {
        case 'v':
          useCanvasStore.getState().setCurrentTool('select');
          break;
        case 'r':
          useCanvasStore.getState().setCurrentTool('rectangle');
          break;
        case 'o':
          useCanvasStore.getState().setCurrentTool('ellipse');
          break;
        case 'm':
          useCanvasStore.getState().setCurrentTool('diamond');
          break;
        case 'a':
          if (!e.ctrlKey && !e.metaKey) {
            useCanvasStore.getState().setCurrentTool('arrow');
          }
          break;
        case 'l':
          useCanvasStore.getState().setCurrentTool('line');
          break;
        case 't':
          useCanvasStore.getState().setCurrentTool('text');
          break;
        case 'd':
          useCanvasStore.getState().setCurrentTool('pen');
          break;
        case 'h':
          useCanvasStore.getState().setCurrentTool('pan');
          break;
        case 'Escape':
          useCanvasStore.getState().clearSelection();
          useCanvasStore.getState().setCurrentTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pushToHistory]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden relative">
      <Canvas />
      <Toolbar />
      <PropertyPanel />
      <StatusBar />
      
      {/* Help overlay */}
      <div className="fixed bottom-4 right-4 max-w-sm">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 opacity-80">
          <div className="font-medium mb-1">Keyboard Shortcuts:</div>
          <div className="space-y-0.5">
            <div>V - Select • R - Rectangle • O - Circle</div>
            <div>M - Diamond • A - Arrow • L - Line • T - Text • D - Draw</div>
            <div>Ctrl+Z - Undo • Ctrl+Y - Redo</div>
            <div>Wheel + Ctrl - Zoom • Wheel - Pan</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;