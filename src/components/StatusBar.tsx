import React from 'react';
import { useCanvasStore } from '../store/canvasStore';

const StatusBar: React.FC = () => {
  const { 
    elements, 
    selectedElementIds, 
    zoom, 
    scrollX, 
    scrollY,
    setZoom,
  } = useCanvasStore();

  const totalElements = elements.filter(el => !el.isDeleted).length;
  const selectedCount = selectedElementIds.length;

  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        {/* Left side - Element info */}
        <div className="flex items-center gap-4">
          <span>
            {totalElements} element{totalElements !== 1 ? 's' : ''}
          </span>
          {selectedCount > 0 && (
            <span className="text-indigo-600">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Center - Position info */}
        <div className="flex items-center gap-4">
          <span>
            X: {Math.round(scrollX)} Y: {Math.round(scrollY)}
          </span>
        </div>

        {/* Right side - Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoom / 1.2)}
            className="px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            disabled={zoom <= 0.1}
          >
            −
          </button>
          
          <select
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="px-2 py-1 rounded border border-gray-300 bg-white text-sm min-w-[80px]"
          >
            {zoomLevels.map(level => (
              <option key={level} value={level}>
                {Math.round(level * 100)}%
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setZoom(zoom * 1.2)}
            className="px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            disabled={zoom >= 5}
          >
            +
          </button>
          
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 rounded hover:bg-gray-100 transition-colors text-xs"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;