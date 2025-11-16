'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

const COLORS = ['#12131a', '#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#8338ec'];
const BRUSH_PRESETS = [
  { label: '\u7ec6', value: 6 },
  { label: '\u7c97', value: 14 }
];
const MAX_HISTORY = 20;
const CANVAS_BACKGROUND = '#fffdf4';

export type DrawingCanvasHandle = {
  getImageDataUrl: () => string | null;
  clear: () => void;
};

type Props = {
  width?: number;
  height?: number;
  onDirtyChange?: (dirty: boolean) => void;
};

const DrawingCanvas = forwardRef<DrawingCanvasHandle, Props>(
  ({ width = 640, height = 480, onDirtyChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [color, setColor] = useState(COLORS[0]);
    const [brushSize, setBrushSize] = useState(BRUSH_PRESETS[0].value);
    const [isDrawing, setIsDrawing] = useState(false);
    const dirtyRef = useRef(false);
    const historyRef = useRef<ImageData[]>([]);

    const notifyDirty = useCallback(
      (flag: boolean) => {
        if (dirtyRef.current === flag) return;
        dirtyRef.current = flag;
        onDirtyChange?.(flag);
      },
      [onDirtyChange]
    );

    const paintBackground = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = CANVAS_BACKGROUND;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const clearHistory = useCallback(() => {
      historyRef.current = [];
    }, []);

    const resetCanvas = useCallback(() => {
      paintBackground();
      clearHistory();
      notifyDirty(false);
    }, [clearHistory, notifyDirty, paintBackground]);

    const saveSnapshot = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      try {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyRef.current = [
          ...historyRef.current.slice(-(MAX_HISTORY - 1)),
          snapshot
        ];
      } catch {
        clearHistory();
      }
    }, [clearHistory]);

    const handleUndo = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const snapshot = historyRef.current.pop();
      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
        notifyDirty(true);
      } else {
        resetCanvas();
      }
    }, [notifyDirty, resetCanvas]);

    useEffect(() => {
      resetCanvas();
    }, [resetCanvas]);

    useImperativeHandle(
      ref,
      () => ({
        getImageDataUrl: () => {
          if (!canvasRef.current) return null;
          return canvasRef.current.toDataURL('image/png');
        },
        clear: () => {
          resetCanvas();
        }
      }),
      [resetCanvas]
    );

    const getPosition = (
      event: React.MouseEvent | React.TouchEvent
    ): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const point =
        'touches' in event ? event.touches[0] : (event as React.MouseEvent);
      if (!point) return null;
      return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top
      };
    };

    const drawStroke = (
      event: React.MouseEvent | React.TouchEvent,
      moveOnly = false
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pos = getPosition(event);
      if (!pos) return;
      if (!moveOnly) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      } else {
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    };

    const handlePointerDown = (event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();
      saveSnapshot();
      setIsDrawing(true);
      drawStroke(event, false);
    };

    const handlePointerMove = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      event.preventDefault();
      drawStroke(event, true);
      notifyDirty(true);
    };

    const handlePointerUp = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      event.preventDefault();
      drawStroke(event, true);
      setIsDrawing(false);
    };

    useEffect(() => {
      const stopDrawing = () => setIsDrawing(false);
      window.addEventListener('mouseup', stopDrawing);
      window.addEventListener('touchend', stopDrawing);
      return () => {
        window.removeEventListener('mouseup', stopDrawing);
        window.removeEventListener('touchend', stopDrawing);
      };
    }, []);

    return (
      <div className="board">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="board__canvas"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        <div className="board__toolbar">
          <div className="toolbar__section">
            <span>\u753b\u7b14\u7c97\u7ec6</span>
            <div className="toolbar__sizes">
              {BRUSH_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`size-pill ${
                    preset.value === brushSize ? 'size-pill--active' : ''
                  }`}
                  onClick={() => setBrushSize(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="toolbar__section">
            <span>\u753b\u7b14\u989c\u8272</span>
            <div className="toolbar__swatches">
              {COLORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`swatch ${item === color ? 'swatch--active' : ''}`}
                  style={{ backgroundColor: item }}
                  onClick={() => setColor(item)}
                />
              ))}
            </div>
          </div>
          <div className="toolbar__actions">
            <button type="button" className="toolbar__ghost" onClick={handleUndo}>
              \u64a4\u56de\u4e00\u6b65
            </button>
            <button
              type="button"
              className="toolbar__clear"
              onClick={() => resetCanvas()}
            >
              \u6e05\u7a7a\u753b\u5e03
            </button>
          </div>
        </div>
      </div>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
