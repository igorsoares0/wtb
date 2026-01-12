import React from 'react';
import {
  MousePointer2,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  Type,
  Pen,
  Frame,
  Image as ImageIcon,
  Hand,
  Undo2,
  Redo2,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { useCanvasStore } from '../store/canvasStore';
import { DrawingTool } from '../types';

const tools: { icon: React.ComponentType<{ size?: string | number }>; name: DrawingTool; label: string }[] = [
  { icon: MousePointer2, name: 'select', label: 'Select' },
  { icon: Square, name: 'rectangle', label: 'Rectangle' },
  { icon: Circle, name: 'ellipse', label: 'Circle' },
  { icon: Diamond, name: 'diamond', label: 'Diamond' },
  { icon: ArrowRight, name: 'arrow', label: 'Arrow' },
  { icon: Minus, name: 'line', label: 'Line' },
  { icon: Type, name: 'text', label: 'Text' },
  { icon: Pen, name: 'pen', label: 'Draw' },
  { icon: Frame, name: 'frame', label: 'Frame' },
  { icon: Hand, name: 'pan', label: 'Pan' },
];

const Toolbar: React.FC = () => {
  const {
    currentTool,
    selectedElementIds,
    history,
    historyIndex,
    setCurrentTool,
    deleteElements,
    undo,
    redo,
    exportAsJSON,
  } = useCanvasStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedElementIds.length > 0;

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // Import functionality would go here
        console.log('Import file:', content);
      };
      reader.readAsText(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataURL = event.target?.result as string;
        // Store the image data URL and switch to image tool
        localStorage.setItem('pendingImageUpload', dataURL);
        setCurrentTool('image');
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be uploaded again
    e.target.value = '';
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex items-center gap-1">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          {tools.map(({ icon: Icon, name, label }) => (
            <button
              key={name}
              onClick={() => setCurrentTool(name)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                currentTool === name
                  ? 'bg-indigo-100 text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={label}
            >
              <Icon size={18} />
            </button>
          ))}

          {/* Image Upload Button */}
          <label
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
              currentTool === 'image'
                ? 'bg-indigo-100 text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Insert Image"
          >
            <ImageIcon size={18} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-2 rounded-lg transition-all duration-200 ${
              canUndo
                ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo2 size={18} />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-2 rounded-lg transition-all duration-200 ${
              canRedo
                ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo2 size={18} />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <button
            onClick={() => deleteElements(selectedElementIds)}
            disabled={!hasSelection}
            className={`p-2 rounded-lg transition-all duration-200 ${
              hasSelection
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Delete Selected"
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={exportAsJSON}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
            title="Export"
          >
            <Download size={18} />
          </button>

          <label className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 cursor-pointer" title="Import">
            <Upload size={18} />
            <input
              type="file"
              accept=".excalidraw,.json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;