# Documentação Técnica - Clone do Excalidraw

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Gerenciamento de Estado](#gerenciamento-de-estado)
6. [Componentes Principais](#componentes-principais)
7. [Sistema de Desenho](#sistema-de-desenho)
8. [Sistema de Coordenadas](#sistema-de-coordenadas)
9. [Interações do Usuário](#interações-do-usuário)
10. [Tipos e Interfaces](#tipos-e-interfaces)
11. [Funcionalidades](#funcionalidades)

---

## Visão Geral

Este é um clone do Excalidraw, uma aplicação de whiteboard/desenho interativa para criar diagramas, esquemas e esboços. A aplicação permite desenhar formas geométricas, linhas, setas, textos e desenhos livres com suporte a zoom, pan, histórico de undo/redo e exportação.

### Características Principais
- Editor de canvas HTML5 baseado em React
- Gerenciamento de estado com Zustand
- Sistema de coordenadas com zoom e pan
- Histórico ilimitado (até 50 entradas)
- Exportação/importação JSON
- Sistema de camadas (z-index)
- Edição de texto inline
- Atalhos de teclado

---

## Arquitetura

A aplicação segue uma arquitetura baseada em componentes React com gerenciamento de estado centralizado:

```
┌─────────────────────────────────────────┐
│           App Component                 │
│  - Atalhos de teclado globais          │
│  - Inicialização da aplicação          │
└─────────────────────────────────────────┘
           │
           ├─────────────────────────────┐
           │                             │
    ┌──────▼──────┐              ┌──────▼──────┐
    │   Canvas    │              │  UI Layer   │
    │             │              │             │
    │ - Rendering │              │ - Toolbar   │
    │ - Events    │              │ - Panel     │
    │ - Drawing   │              │ - Status    │
    └──────┬──────┘              └──────┬──────┘
           │                             │
           └──────────┬──────────────────┘
                      │
              ┌───────▼────────┐
              │  Zustand Store │
              │  (State Mgmt)  │
              └────────────────┘
```

### Fluxo de Dados

O fluxo de dados é unidirecional:

1. **Interação do Usuário** → Canvas/UI Components
2. **Ações** → Zustand Store (via actions)
3. **State Update** → Re-render dos componentes
4. **Canvas Re-draw** → Renderização visual

---

## Stack Tecnológica

### Core
- **React 18.3.1** - Biblioteca UI
- **TypeScript 5.5.3** - Tipagem estática
- **Vite 5.4.2** - Build tool e dev server

### State Management
- **Zustand 4.4.7** - Gerenciamento de estado leve e eficiente

### Styling
- **Tailwind CSS 3.4.1** - Framework CSS utility-first
- **PostCSS 8.4.35** - Processamento de CSS
- **Autoprefixer 10.4.18** - Prefixos CSS automáticos

### Icons
- **Lucide React 0.344.0** - Ícones principais
- **React Icons 5.5.0** - Ícones complementares

### Development
- **ESLint 9.9.1** - Linter
- **TypeScript ESLint 8.3.0** - Regras TypeScript

---

## Estrutura de Arquivos

```
project/
├── src/
│   ├── components/
│   │   ├── Canvas.tsx           # Componente principal de desenho
│   │   ├── Toolbar.tsx          # Barra de ferramentas
│   │   ├── PropertyPanel.tsx    # Painel de propriedades
│   │   └── StatusBar.tsx        # Barra de status
│   │
│   ├── store/
│   │   └── canvasStore.ts       # Store Zustand centralizado
│   │
│   ├── types/
│   │   └── index.ts             # Definições TypeScript
│   │
│   ├── utils/
│   │   ├── drawing.ts           # Funções de renderização
│   │   └── helpers.ts           # Utilitários gerais
│   │
│   ├── App.tsx                  # Componente raiz
│   └── main.tsx                 # Entry point
│
├── index.html                   # HTML template
├── vite.config.ts              # Configuração Vite
├── tsconfig.json               # Configuração TypeScript
└── tailwind.config.js          # Configuração Tailwind
```

---

## Gerenciamento de Estado

### Zustand Store (`canvasStore.ts`)

O store centraliza todo o estado da aplicação usando Zustand, que oferece uma API simples e performática.

#### Estado Principal

```typescript
interface AppState {
  // Elementos desenhados no canvas
  elements: DrawingElement[];

  // IDs dos elementos selecionados
  selectedElementIds: string[];

  // Ferramenta ativa
  currentTool: DrawingTool;

  // Estado de desenho
  isDrawing: boolean;

  // Offset de drag
  dragOffsetX: number;
  dragOffsetY: number;

  // Pan/Scroll
  scrollX: number;
  scrollY: number;

  // Zoom level (0.1 - 5.0)
  zoom: number;

  // Propriedades da ferramenta atual
  currentStrokeColor: string;
  currentFillColor: string;
  currentStrokeWidth: number;
  currentOpacity: number;

  // Dimensões do viewport
  viewportWidth: number;
  viewportHeight: number;

  // Histórico (undo/redo)
  history: {
    elements: DrawingElement[];
    selectedElementIds: string[];
  }[];
  historyIndex: number;
}
```

#### Actions Principais

**Gerenciamento de Elementos:**
- `setElements()` - Define array de elementos
- `addElement()` - Adiciona novo elemento
- `updateElement()` - Atualiza elemento existente
- `deleteElements()` - Remove elementos

**Seleção:**
- `setSelectedElements()` - Define seleção
- `clearSelection()` - Limpa seleção

**Histórico:**
- `pushToHistory()` - Adiciona estado ao histórico
- `undo()` - Desfaz última ação
- `redo()` - Refaz última ação desfeita

**Camadas (Z-Index):**
- `bringToFront()` - Move para frente (topo)
- `sendToBack()` - Move para trás (fundo)
- `bringForward()` - Avança uma posição
- `sendBackward()` - Recua uma posição

**Exportação/Importação:**
- `exportAsImage()` - Exporta como PNG/SVG
- `exportAsJSON()` - Exporta como JSON
- `importFromJSON()` - Importa de JSON

#### Histórico de Undo/Redo

O histórico é implementado como um array com índice:

```typescript
// Adicionar ao histórico
pushToHistory: () => {
  const state = get();
  const historyEntry = {
    elements: [...state.elements],
    selectedElementIds: [...state.selectedElementIds],
  };

  // Trunca histórico futuro ao adicionar nova entrada
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(historyEntry);

  // Limita a 50 entradas
  if (newHistory.length > 50) {
    newHistory.shift();
  } else {
    set({ historyIndex: state.historyIndex + 1 });
  }

  set({ history: newHistory });
}

// Undo
undo: () => {
  const state = get();
  if (state.historyIndex > 0) {
    const prevState = state.history[state.historyIndex - 1];
    set({
      elements: [...prevState.elements],
      selectedElementIds: [...prevState.selectedElementIds],
      historyIndex: state.historyIndex - 1,
    });
  }
}
```

---

## Componentes Principais

### 1. Canvas (`Canvas.tsx`)

O componente mais complexo, responsável por:
- Renderização de todos os elementos
- Captura de eventos de mouse
- Gerenciamento de interações (desenho, drag, resize)
- Edição de texto inline

#### Estados Locais

```typescript
const [isDrawing, setIsDrawing] = useState(false);
const [isDragging, setIsDragging] = useState(false);
const [isResizing, setIsResizing] = useState(false);
const [isEditingText, setIsEditingText] = useState(false);
const [isPanning, setIsPanning] = useState(false);
```

#### Refs

```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
const textareaRef = useRef<HTMLTextAreaElement>(null);
```

#### Eventos Principais

**handleMouseDown:**
- Detecta clique duplo para edição de texto
- Inicia desenho de novos elementos
- Inicia drag de elementos existentes
- Inicia resize via handles
- Gerencia seleção de elementos (com ciclagem em caso de overlap)

**handleMouseMove:**
- Atualiza posição durante desenho
- Move elementos durante drag
- Redimensiona durante resize
- Atualiza cursor baseado no hover

**handleMouseUp:**
- Finaliza desenho/drag/resize
- Adiciona tamanho padrão para cliques simples
- Adiciona ao histórico

#### Sistema de Coordenadas

```typescript
const getCanvasPoint = (clientX: number, clientY: number): Point => {
  const canvas = canvasRef.current;
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - pan.x) / zoom,
    y: (clientY - rect.top - pan.y) / zoom,
  };
};
```

#### Renderização

O canvas usa `useEffect` para re-renderizar sempre que elementos, seleção ou transformações mudam:

```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');

  // 1. Limpa canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  // 2. Aplica zoom e pan
  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  // 3. Desenha grid
  drawGrid(ctx, scrollX, scrollY, zoom, rect.width, rect.height);

  // 4. Desenha elementos
  elements.forEach(element => {
    drawElement(ctx, element, isSelected, zoom);
  });

  ctx.restore();
}, [elements, selectedElementIds, zoom, pan]);
```

#### Edição de Texto Inline

Quando o usuário clica duas vezes em um elemento de texto:

1. Um `textarea` é posicionado sobre o elemento
2. O textarea recebe foco e seleciona o texto
3. Ao finalizar (Enter ou blur), o texto é atualizado
4. O textarea é escondido

```typescript
const startTextEditing = (element: TextElement) => {
  setIsEditingText(true);
  setEditingTextId(element.id);

  // Posiciona textarea
  const x = element.x * zoom + pan.x + rect.left;
  const y = element.y * zoom + pan.y + rect.top;

  textarea.style.left = `${x}px`;
  textarea.style.top = `${y}px`;
  textarea.focus();
};
```

### 2. Toolbar (`Toolbar.tsx`)

Barra de ferramentas flutuante centralizada no topo.

#### Ferramentas

```typescript
const tools = [
  { icon: MousePointer2, name: 'select', label: 'Select' },
  { icon: Square, name: 'rectangle', label: 'Rectangle' },
  { icon: Circle, name: 'ellipse', label: 'Circle' },
  { icon: Diamond, name: 'diamond', label: 'Diamond' },
  { icon: ArrowRight, name: 'arrow', label: 'Arrow' },
  { icon: Minus, name: 'line', label: 'Line' },
  { icon: Type, name: 'text', label: 'Text' },
  { icon: Pen, name: 'pen', label: 'Draw' },
  { icon: Hand, name: 'pan', label: 'Pan' },
];
```

#### Ações Disponíveis
- Undo/Redo (com estado disabled quando não disponível)
- Delete (apenas quando há seleção)
- Export JSON
- Import JSON

### 3. PropertyPanel (`PropertyPanel.tsx`)

Painel lateral direito para edição de propriedades.

#### Propriedades Editáveis

1. **Stroke Color** - 10 cores pré-definidas
2. **Fill Color** - Transparente + 10 cores
3. **Stroke Width** - Range 1-10px
4. **Opacity** - Range 10-100%

#### Controles de Camadas

Quando há elementos selecionados:
- **Fundo** - Envia para trás de todos
- **Recuar** - Recua uma posição
- **Avançar** - Avança uma posição
- **Topo** - Traz para frente de todos

#### Lógica de Propriedades

```typescript
const handlePropertyChange = (property: string, value: any) => {
  if (hasSelection) {
    // Atualiza elementos selecionados
    selectedElements.forEach(element => {
      updateElement(element.id, { [property]: value });
    });
  } else {
    // Atualiza propriedades da ferramenta atual
    setCurrentStrokeColor(value);
  }
};
```

### 4. StatusBar (`StatusBar.tsx`)

Barra inferior com informações de status:
- Posição do cursor
- Nível de zoom
- Número de elementos

---

## Sistema de Desenho

### Funções de Renderização (`drawing.ts`)

#### drawElement()

Função principal que desenha cada tipo de elemento:

```typescript
export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: DrawingElement,
  isSelected: boolean,
  zoom: number,
  isBeingEdited: boolean
): void {
  ctx.save();

  // Aplica rotação (se houver)
  if (element.angle !== 0) {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(element.angle);
    ctx.translate(-centerX, -centerY);
  }

  // Aplica estilos
  ctx.globalAlpha = element.opacity / 100;
  ctx.strokeStyle = element.strokeColor;
  ctx.lineWidth = element.strokeWidth;
  ctx.fillStyle = element.fillColor;

  // Desenha baseado no tipo
  switch (element.type) {
    case 'rectangle': drawRectangle(ctx, element); break;
    case 'ellipse': drawEllipse(ctx, element); break;
    case 'diamond': drawDiamond(ctx, element); break;
    case 'arrow': drawArrow(ctx, element); break;
    case 'line': drawLine(ctx, element); break;
    case 'text': drawText(ctx, element); break;
    case 'pen': drawPen(ctx, element); break;
  }

  // Desenha outline de seleção
  if (isSelected) {
    drawSelectionOutline(ctx, element, zoom);
  }

  ctx.restore();
}
```

#### Tipos de Elementos

**1. Rectangle**
```typescript
function drawRectangle(ctx, element) {
  if (element.fillColor !== 'transparent') {
    ctx.fillRect(element.x, element.y, element.width, element.height);
  }
  ctx.strokeRect(element.x, element.y, element.width, element.height);
}
```

**2. Ellipse**
```typescript
function drawEllipse(ctx, element) {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const radiusX = element.width / 2;
  const radiusY = element.height / 2;

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  if (element.fillColor !== 'transparent') ctx.fill();
  ctx.stroke();
}
```

**3. Diamond**
```typescript
function drawDiamond(ctx, element) {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, element.y); // Top
  ctx.lineTo(element.x + element.width, centerY); // Right
  ctx.lineTo(centerX, element.y + element.height); // Bottom
  ctx.lineTo(element.x, centerY); // Left
  ctx.closePath();

  if (element.fillColor !== 'transparent') ctx.fill();
  ctx.stroke();
}
```

**4. Arrow/Line**

Usa array de pontos relativos ao elemento:

```typescript
function drawArrow(ctx, element) {
  const start = element.points[0];
  const end = element.points[element.points.length - 1];

  // Desenha linha
  ctx.beginPath();
  ctx.moveTo(element.x + start.x, element.y + start.y);
  element.points.forEach(p => {
    ctx.lineTo(element.x + p.x, element.y + p.y);
  });
  ctx.stroke();

  // Desenha ponta da seta
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = 15;

  ctx.beginPath();
  ctx.moveTo(element.x + end.x, element.y + end.y);
  ctx.lineTo(
    element.x + end.x - headLength * Math.cos(angle - Math.PI / 6),
    element.y + end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  // ... outro lado da seta
  ctx.stroke();
}
```

**5. Pen (Desenho Livre)**

Usa curvas quadráticas para suavização:

```typescript
function drawPen(ctx, element) {
  const points = element.points.map(p => ({
    x: element.x + p.x,
    y: element.y + p.y
  }));

  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length - 1; i++) {
    const controlX = (points[i].x + points[i + 1].x) / 2;
    const controlY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, controlX, controlY);
  }

  ctx.stroke();
}
```

**6. Text**

Sistema de auto-ajuste de fonte:

```typescript
function drawText(ctx, element) {
  let fontSize = element.fontSize || 20;

  // Busca binária para encontrar tamanho ideal
  let minSize = 8, maxSize = 200;
  while (minSize <= maxSize) {
    const midSize = Math.floor((minSize + maxSize) / 2);
    const testWidth = ctx.measureText(text).width;

    if (testWidth <= maxWidth * 0.95) {
      minSize = midSize + 1;
      calculatedFontSize = midSize;
    } else {
      maxSize = midSize - 1;
    }
  }

  // Aplica fonte calculada
  ctx.font = `${fontSize}px ${fontFamily}`;

  // Word wrapping
  const lines = wrapText(text, maxWidth);

  // Desenha cada linha
  lines.forEach((line, index) => {
    ctx.fillText(line, startX, startY + index * lineHeight);
  });
}
```

#### Seleção e Resize Handles

```typescript
function drawSelectionOutline(ctx, element, zoom) {
  // Desenha borda de seleção
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 1 / zoom;
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  // Desenha handles de resize
  const handleSize = 8 / zoom;
  const handles = getResizeHandles(element);

  handles.forEach(handle => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6366f1';

    if (handle.direction === 'start' || handle.direction === 'end') {
      // Handles circulares para linhas
      ctx.arc(handle.x, handle.y, handleSize / 2, 0, 2 * Math.PI);
    } else {
      // Handles quadrados para formas
      ctx.fillRect(x, y, handleSize, handleSize);
    }
  });
}
```

#### Grid

```typescript
export function drawGrid(ctx, scrollX, scrollY, zoom, width, height) {
  const gridSize = 20 * zoom;
  const offsetX = scrollX % gridSize;
  const offsetY = scrollY % gridSize;

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.5;

  // Linhas verticais
  for (let x = offsetX; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  // Linhas horizontais
  for (let y = offsetY; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
}
```

---

## Sistema de Coordenadas

### Transformações de Coordenadas

A aplicação trabalha com dois sistemas de coordenadas:

1. **Coordenadas de Tela** (Screen Coordinates)
   - Pixels na viewport do navegador
   - Origem no canto superior esquerdo da tela

2. **Coordenadas de Canvas** (Canvas Coordinates)
   - Sistema de coordenadas virtual infinito
   - Independente de zoom e pan

#### Conversão Screen → Canvas

```typescript
const getCanvasPoint = (clientX: number, clientY: number): Point => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - scrollX) / zoom,
    y: (clientY - rect.top - scrollY) / zoom,
  };
};
```

#### Conversão Canvas → Screen

```typescript
export function canvasToScreen(point: Point, scrollX, scrollY, zoom): Point {
  return {
    x: point.x * zoom + scrollX,
    y: point.y * zoom + scrollY,
  };
}
```

### Zoom

- Limite: 0.1 (10%) a 5.0 (500%)
- Controlado via scroll do mouse com Ctrl pressionado
- O zoom é aplicado via `ctx.scale(zoom, zoom)`

### Pan

- Controlado via scroll do mouse (sem Ctrl)
- Ou via ferramenta Pan + drag
- Aplicado via `ctx.translate(scrollX, scrollY)`

### Ordem de Transformações

```typescript
ctx.save();
ctx.translate(scrollX, scrollY); // 1. Pan
ctx.scale(zoom, zoom);            // 2. Zoom
// ... desenha elementos
ctx.restore();
```

---

## Interações do Usuário

### Atalhos de Teclado

Implementados em `App.tsx`:

```typescript
// Ferramentas
'v' → select
'r' → rectangle
'o' → ellipse (circle)
'm' → diamond
'a' → arrow
'l' → line
't' → text
'd' → pen (draw)
'h' → pan (hand)

// Ações
Ctrl+Z → Undo
Ctrl+Shift+Z → Redo
Ctrl+Y → Redo
Ctrl+A → Selecionar todos
Delete/Backspace → Deletar selecionados
Escape → Limpar seleção
```

### Mouse Events

#### Desenho de Novos Elementos

1. **MouseDown** com ferramenta ativa:
   - Cria elemento com posição inicial
   - Adiciona ao store
   - Define `isDrawing = true`

2. **MouseMove** enquanto `isDrawing`:
   - Atualiza width/height do elemento
   - Para pen: adiciona pontos

3. **MouseUp**:
   - Finaliza desenho
   - Aplica tamanho padrão se não houve movimento
   - Adiciona ao histórico

#### Seleção e Movimentação

1. **MouseDown** com ferramenta Select:
   - Hit test para encontrar elementos no ponto
   - Se múltiplos: permite ciclagem com cliques sucessivos
   - Define `isDragging = true`

2. **MouseMove** enquanto `isDragging`:
   - Calcula delta de movimento
   - Atualiza posição de todos elementos selecionados

3. **MouseUp**:
   - Finaliza drag
   - Adiciona ao histórico

#### Redimensionamento

1. **MouseDown** em handle de resize:
   - Identifica direção (nw, ne, se, sw)
   - Armazena bounds originais
   - Define `isResizing = true`

2. **MouseMove** enquanto `isResizing`:
   - Calcula novas dimensões baseado na direção
   - Aplica tamanho mínimo (20px)
   - Para texto: recalcula fontSize
   - Para pen: escala pontos proporcionalmente

3. **MouseUp**:
   - Finaliza resize
   - Adiciona ao histórico

#### Edição de Texto

1. **Clique Duplo** em elemento de texto:
   - Posiciona textarea sobre o elemento
   - Aplica estilos (zoom, cor, fonte)
   - Foca e seleciona texto

2. **Durante edição**:
   - Enter → finaliza
   - Shift+Enter → nova linha
   - Escape → cancela

3. **Blur ou Enter**:
   - Atualiza texto do elemento
   - Recalcula dimensões
   - Adiciona ao histórico

### Zoom e Pan

#### Zoom (Wheel + Ctrl)

```typescript
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(zoom * delta);
  }
};
```

#### Pan (Wheel ou Pan Tool)

```typescript
// Via wheel
if (!e.ctrlKey) {
  setScroll(scrollX - e.deltaX, scrollY - e.deltaY);
}

// Via Pan tool
if (isPanning) {
  const dx = e.clientX - panStartPoint.x;
  const dy = e.clientY - panStartPoint.y;
  setScroll(panStartScroll.x + dx, panStartScroll.y + dy);
}
```

---

## Tipos e Interfaces

### Point

```typescript
export interface Point {
  x: number;
  y: number;
}
```

### Bounds

```typescript
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### DrawingTool

```typescript
export type DrawingTool =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'text'
  | 'pen'
  | 'pan';
```

### BaseElement

```typescript
export interface BaseElement {
  id: string;               // ID único gerado
  type: DrawingTool;        // Tipo do elemento
  x: number;                // Posição X (canvas coords)
  y: number;                // Posição Y (canvas coords)
  width: number;            // Largura
  height: number;           // Altura
  strokeColor: string;      // Cor da borda
  fillColor: string;        // Cor de preenchimento
  strokeWidth: number;      // Espessura da borda (1-10)
  opacity: number;          // Opacidade (10-100)
  roughness: number;        // Rugosidade (não implementado)
  angle: number;            // Rotação em radianos
  isDeleted: boolean;       // Flag de deleção
  seed: number;             // Seed para aleatoriedade
}
```

### Elementos Específicos

**TextElement:**
```typescript
export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  originalWidth?: number;        // Para cálculo de resize
  originalHeight?: number;
  originalFontSize?: number;
  userSetFontSize?: boolean;     // Flag de ajuste manual
}
```

**ArrowElement/LineElement:**
```typescript
export interface ArrowElement extends BaseElement {
  type: 'arrow';
  points: Point[];               // Pontos relativos a (x, y)
  startBinding?: string;         // ID do elemento conectado (não impl.)
  endBinding?: string;
}
```

**PenElement:**
```typescript
export interface PenElement extends BaseElement {
  type: 'pen';
  points: Point[];               // Pontos do caminho
}
```

### DrawingElement (Union Type)

```typescript
export type DrawingElement =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | ArrowElement
  | LineElement
  | TextElement
  | PenElement;
```

---

## Funcionalidades

### 1. Sistema de Camadas (Z-Index)

Os elementos são armazenados em um array onde o índice determina a ordem de renderização:
- Índice 0 = fundo
- Último índice = frente

**Operações:**

```typescript
// Trazer para frente (move para final do array)
bringToFront: (ids) => {
  const elementsToMove = elements.filter(el => ids.includes(el.id));
  const remaining = elements.filter(el => !ids.includes(el.id));
  return [...remaining, ...elementsToMove];
}

// Enviar para trás (move para início do array)
sendToBack: (ids) => {
  const elementsToMove = elements.filter(el => ids.includes(el.id));
  const remaining = elements.filter(el => !ids.includes(el.id));
  return [...elementsToMove, ...remaining];
}

// Avançar uma posição (swap com próximo)
bringForward: (ids) => {
  ids.forEach(id => {
    const index = elements.findIndex(el => el.id === id);
    if (index < elements.length - 1) {
      [elements[index], elements[index + 1]] =
      [elements[index + 1], elements[index]];
    }
  });
}
```

### 2. Hit Testing

Detecta se um ponto está dentro de um elemento.

**Para Formas Básicas:**
```typescript
function hitTestBoundingBox(element, point) {
  const bounds = getElementBounds(element);

  if (element.angle !== 0) {
    // Rotaciona ponto inverso para testar
    const rotatedPoint = rotatePoint(point, center, -element.angle);
    return isPointInBounds(rotatedPoint, bounds);
  }

  return isPointInBounds(point, bounds);
}
```

**Para Linhas:**
```typescript
function hitTestLineElement(element, point) {
  const tolerance = Math.max(element.strokeWidth, 5);

  for (let i = 0; i < element.points.length - 1; i++) {
    const p1 = element.points[i];
    const p2 = element.points[i + 1];

    if (distanceToLineSegment(point, p1, p2) <= tolerance) {
      return true;
    }
  }

  return false;
}
```

**Para Pen:**
```typescript
function hitTestPenElement(element, point) {
  const tolerance = Math.max(element.strokeWidth, 8);

  // Testa distância para cada segmento
  for (let i = 0; i < element.points.length - 1; i++) {
    if (distanceToLineSegment(point, points[i], points[i+1]) <= tolerance) {
      return true;
    }
  }

  // Testa se está no bounding box expandido
  return isPointInBounds(point, expandedBounds);
}
```

### 3. Exportação JSON

```typescript
exportAsJSON: () => {
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
}
```

### 4. Importação JSON

```typescript
importFromJSON: (data) => {
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === 'excalidraw' && parsed.elements) {
      set({
        elements: parsed.elements,
        selectedElementIds: []
      });
      get().pushToHistory();
    }
  } catch (error) {
    console.error('Failed to import JSON:', error);
  }
}
```

### 5. Ciclagem de Seleção

Quando múltiplos elementos se sobrepõem, cliques sucessivos ciclan através deles:

```typescript
const elementsAtPoint = elements
  .filter(el => hitTestElement(el, point))
  .sort((a, b) => elements.indexOf(b) - elements.indexOf(a));

if (isSamePosition && elementsAtPoint.length > 1) {
  // Cicla para próximo elemento
  const newIndex = (elementCycleIndex + 1) % elementsAtPoint.length;
  setSelectedElements([elementsAtPoint[newIndex].id]);

  // Mostra indicador visual "2/5"
  showCycleIndicator(newIndex + 1, elementsAtPoint.length);
}
```

### 6. Auto-ajuste de Fonte em Textos

Quando o usuário redimensiona um elemento de texto, a fonte é ajustada automaticamente:

```typescript
// Busca binária para tamanho ideal
let minSize = 8, maxSize = 200;
while (minSize <= maxSize) {
  const midSize = Math.floor((minSize + maxSize) / 2);
  const testWidth = getTextWidth(text, midSize);

  if (testWidth <= maxWidth * 0.95) {
    minSize = midSize + 1;
    calculatedFontSize = midSize;
  } else {
    maxSize = midSize - 1;
  }
}
```

### 7. Suavização de Desenho Livre

O desenho com pen usa curvas quadráticas para suavização:

```typescript
// Durante desenho, filtra pontos muito próximos
const minDistance = 2;
const lastPoint = points[points.length - 1];

if (distance(newPoint, lastPoint) >= minDistance) {
  points.push(newPoint);
} else {
  points[points.length - 1] = newPoint; // Atualiza último
}

// Durante renderização, usa curvas
for (let i = 1; i < points.length - 1; i++) {
  const controlX = (points[i].x + points[i + 1].x) / 2;
  const controlY = (points[i].y + points[i + 1].y) / 2;
  ctx.quadraticCurveTo(points[i].x, points[i].y, controlX, controlY);
}
```

---

## Otimizações e Performance

### 1. Debounce de Renderização

O canvas só re-renderiza quando dependências mudam (via `useEffect`).

### 2. Canvas Device Pixel Ratio

```typescript
canvas.width = rect.width * window.devicePixelRatio;
canvas.height = rect.height * window.devicePixelRatio;
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
```

Garante renderização nítida em displays de alta resolução.

### 3. Histórico Limitado

Limita o histórico a 50 entradas para evitar uso excessivo de memória.

### 4. Filtragem de Pontos em Pen

Durante desenho livre, pontos muito próximos são filtrados para reduzir o número de pontos armazenados.

### 5. Hit Testing Eficiente

- Testa primeiro bounding box (rápido)
- Só então testa geometria detalhada

---

## Limitações Conhecidas

1. **Rough.js não implementado** - O sistema de roughness está definido mas não implementado
2. **Bindings de setas** - As conexões de setas a elementos não estão implementadas
3. **Rotação** - Sistema de rotação definido mas sem UI
4. **Exportação de imagem** - Apenas stub, não gera PNG/SVG real
5. **Colaboração** - Não há suporte a edição colaborativa
6. **Mobile** - Não otimizado para touch events

---

## Possíveis Melhorias Futuras

1. **Rough.js Integration** - Adicionar estilo hand-drawn
2. **Arrow Bindings** - Conectar setas a elementos
3. **Rotation Tool** - UI para rotação de elementos
4. **Image Export** - Implementar exportação real para PNG/SVG
5. **Libraries** - Sistema de bibliotecas de componentes
6. **Themes** - Dark mode
7. **Touch Support** - Gestos multi-touch
8. **Performance** - Virtual rendering para muitos elementos
9. **Accessibility** - Melhorar navegação por teclado
10. **Groups** - Agrupar elementos

---

## Conclusão

Este clone do Excalidraw demonstra uma implementação completa de um editor de canvas usando React e TypeScript, com:

- Arquitetura limpa e modular
- Gerenciamento de estado eficiente com Zustand
- Sistema robusto de coordenadas e transformações
- Interações de usuário completas
- Extensibilidade para futuras features

A base do código está bem estruturada para expansão e manutenção, seguindo boas práticas de desenvolvimento React e TypeScript.
