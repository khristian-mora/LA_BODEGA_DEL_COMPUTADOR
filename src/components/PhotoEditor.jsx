import React, { useRef, useState, useEffect } from 'react';
import { X, Save, Type, Circle, ArrowRight, RotateCcw, Download } from 'lucide-react';
import Button from './Button';

const PhotoEditor = ({ imageUrl, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const [context, setContext] = useState(null);
    const [_image, setImage] = useState(null);
    const [tool, setTool] = useState('circle'); // circle, arrow, text
    const [color, setColor] = useState('#ff0000');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Initial load
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            setImage(img);
            const canvas = canvasRef.current;
            // Set canvas size to fit window but maintain aspect ratio, max height 600px
            const maxWidth = window.innerWidth * 0.8;
            const maxHeight = 600;

            let w = img.width;
            let h = img.height;

            // Scale down if needed
            const ratio = Math.min(maxWidth / w, maxHeight / h);

            canvas.width = w * ratio;
            canvas.height = h * ratio;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setContext(ctx);
            saveState(); // Initial state
        };
    }, [imageUrl]);

    const saveState = () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL();
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(dataUrl);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const undo = () => {
        if (historyStep > 0) {
            const newStep = historyStep - 1;
            setHistoryStep(newStep);
            const img = new Image();
            img.src = history[newStep];
            img.onload = () => {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(img, 0, 0);
            };
        }
    };

    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        setStartPos(getMousePos(e));
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const pos = getMousePos(e);
        const ctx = context;

        // Restore last state before drawing new shape draft
        const img = new Image();
        img.src = history[historyStep];

        // We need to implement a detailed redraw loop if we want smooth preview
        // For simplicity in this version, we'll clear and redraw the base image + current shape
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        if (tool === 'circle') {
            // Draw ellipse
            const radiusX = Math.abs(pos.x - startPos.x);
            const radiusY = Math.abs(pos.y - startPos.y);
            const centerX = startPos.x + (pos.x - startPos.x) / 2;
            const centerY = startPos.y + (pos.y - startPos.y) / 2;

            ctx.ellipse(centerX, centerY, radiusX / 2, radiusY / 2, 0, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (tool === 'arrow') {
            // Simple line for now
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            // Arrow head
            const headLength = 10;
            const dx = pos.x - startPos.x;
            const dy = pos.y - startPos.y;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x - headLength * Math.cos(angle - Math.PI / 6), pos.y - headLength * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(pos.x - headLength * Math.cos(angle + Math.PI / 6), pos.y - headLength * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(pos.x, pos.y);
            ctx.fillStyle = color;
            ctx.fill();
        }
    };

    const stopDrawing = (e) => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (tool === 'text') {
            const pos = getMousePos(e);
            const text = prompt("Ingrese el texto:", "");
            if (text) {
                const ctx = context;
                ctx.font = "bold 20px Arial";
                ctx.fillStyle = color;
                ctx.fillText(text, pos.x, pos.y);
                saveState();
            }
        } else {
            saveState();
        }
    };

    const handleSave = async () => {
        canvasRef.current.toBlob(async (blob) => {
            onSave(blob);
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] w-full max-w-5xl">
                {/* Header */}
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Type className="w-5 h-5" /> Editor de Evidencia
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-gray-100 p-2 flex gap-4 border-b">
                    <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
                        <button
                            onClick={() => setTool('circle')}
                            className={`p-3 hover:bg-gray-50 ${tool === 'circle' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            title="Círculo (Resaltar daño)"
                        >
                            <Circle className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setTool('arrow')}
                            className={`p-3 hover:bg-gray-50 ${tool === 'arrow' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            title="Flecha (Señalar)"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setTool('text')}
                            className={`p-3 hover:bg-gray-50 ${tool === 'text' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                            title="Texto (Anotación)"
                        >
                            <Type className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex bg-white rounded-lg shadow-sm overflow-hidden px-2 items-center gap-2">
                        <div
                            className={`w-6 h-6 rounded-full cursor-pointer border-2 ${color === '#ff0000' ? 'border-gray-900' : 'border-transparent'}`}
                            style={{ background: '#ff0000' }}
                            onClick={() => setColor('#ff0000')}
                        />
                        <div
                            className={`w-6 h-6 rounded-full cursor-pointer border-2 ${color === '#ffff00' ? 'border-gray-900' : 'border-transparent'}`}
                            style={{ background: '#ffff00' }}
                            onClick={() => setColor('#ffff00')}
                        />
                        <div
                            className={`w-6 h-6 rounded-full cursor-pointer border-2 ${color === '#ffffff' ? 'border-gray-900' : 'border-transparent'}`}
                            style={{ background: '#ffffff' }}
                            onClick={() => setColor('#ffffff')}
                        />
                    </div>

                    <div className="flex-1"></div>

                    <button
                        onClick={undo}
                        disabled={historyStep <= 0}
                        className="p-3 text-gray-600 hover:text-black disabled:opacity-30"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-gray-500 overflow-auto flex items-center justify-center p-4 relative">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        className="shadow-lg cursor-crosshair bg-white"
                    />
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSave} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <Save className="w-4 h-4" /> Guardar Cambios
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PhotoEditor;
