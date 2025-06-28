import React from 'react';
import { useCanvasStore } from '../store/canvasStore';
// Importando ícones para os botões de ordem
import { FiArrowUp, FiArrowDown, FiChevronsUp, FiChevronsDown } from 'react-icons/fi';

const colors = [
  '#1e293b', '#dc2626', '#ea580c', '#ca8a04', '#65a30d',
  '#059669', '#a5d8ff', '#2563eb', '#7c3aed', '#eebefa'
];

const PropertyPanel: React.FC = () => {
  const {
    selectedElementIds,
    elements,
    currentStrokeColor,
    currentFillColor,
    currentStrokeWidth,
    currentOpacity,
    setCurrentStrokeColor,
    setCurrentFillColor,
    setCurrentStrokeWidth,
    setCurrentOpacity,
    updateElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
  } = useCanvasStore();

  const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
  const hasSelection = selectedElements.length > 0;

  const handlePropertyChange = (property: string, value: any) => {
    if (hasSelection) {
      selectedElements.forEach(element => {
        updateElement(element.id, { [property]: value });
      });
    } else {
      // Update current tool properties
      switch (property) {
        case 'strokeColor':
          setCurrentStrokeColor(value);
          break;
        case 'fillColor':
          setCurrentFillColor(value);
          break;
        case 'strokeWidth':
          setCurrentStrokeWidth(value);
          break;
        case 'opacity':
          setCurrentOpacity(value);
          break;
      }
    }
  };

  const getPropertyValue = (property: string) => {
    if (hasSelection && selectedElements.length === 1) {
      return selectedElements[0][property as keyof typeof selectedElements[0]];
    }
    
    switch (property) {
      case 'strokeColor':
        return currentStrokeColor;
      case 'fillColor':
        return currentFillColor;
      case 'strokeWidth':
        return currentStrokeWidth;
      case 'opacity':
        return currentOpacity;
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-64">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {hasSelection ? `Properties (${selectedElements.length})` : 'Tool Properties'}
        </h3>

        {/* Stroke Color */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Stroke Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => handlePropertyChange('strokeColor', color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  getPropertyValue('strokeColor') === color
                    ? 'border-gray-400 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Fill Color */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Fill Color
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePropertyChange('fillColor', 'transparent')}
              className={`w-6 h-6 rounded-full border-2 bg-white relative transition-all ${
                getPropertyValue('fillColor') === 'transparent'
                  ? 'border-gray-400 scale-110'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title="Transparent"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-0.5 bg-red-500 rotate-45"></div>
              </div>
            </button>
            {colors.map(color => (
              <button
                key={color}
                onClick={() => handlePropertyChange('fillColor', color)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  getPropertyValue('fillColor') === color
                    ? 'border-gray-400 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Stroke Width: {getPropertyValue('strokeWidth')}px
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={getPropertyValue('strokeWidth') || 2}
            onChange={(e) => handlePropertyChange('strokeWidth', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Opacity */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Opacity: {getPropertyValue('opacity')}%
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={getPropertyValue('opacity') || 100}
            onChange={(e) => handlePropertyChange('opacity', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Layer Order Controls - Only show when elements are selected */}
        {hasSelection && (
          <div className="mb-4 pt-3 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Ordem de Camadas
            </label>
            <div className="flex justify-between gap-2">
              <button
                onClick={() => sendToBack(selectedElementIds)}
                className="flex-1 flex items-center justify-center py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                title="Enviar para trás (para o fundo)"
              >
                <FiChevronsDown className="mr-1" /> Fundo
              </button>
              <button
                onClick={() => sendBackward(selectedElementIds)}
                className="flex-1 flex items-center justify-center py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                title="Recuar uma posição"
              >
                <FiArrowDown className="mr-1" /> Recuar
              </button>
              <button
                onClick={() => bringForward(selectedElementIds)}
                className="flex-1 flex items-center justify-center py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                title="Avançar uma posição"
              >
                <FiArrowUp className="mr-1" /> Avançar
              </button>
              <button
                onClick={() => bringToFront(selectedElementIds)}
                className="flex-1 flex items-center justify-center py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
                title="Trazer para frente (para o topo)"
              >
                <FiChevronsUp className="mr-1" /> Topo
              </button>
            </div>
          </div>
        )}
        
        {/* Selection Info */}
        {hasSelection && (
          <div className="pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {selectedElements.length} element{selectedElements.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;