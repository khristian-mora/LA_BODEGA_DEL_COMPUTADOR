import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check, X } from 'lucide-react';
import Button from './Button';

const SignaturePad = ({ onSave, onClear, title = "Firma aqui" }) => {
    const sigPad = useRef(null);

    const clear = () => {
        sigPad.current.clear();
        if (onClear) onClear();
    };

    // Función manual para recortar el canvas y eliminar espacios en blanco
    const trimCanvas = (canvas) => {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const l = pixels.data.length;
        const bound = { top: null, left: null, right: null, bottom: null };
        const data = pixels.data;

        for (let i = 0; i < l; i += 4) {
            if (data[i + 3] !== 0) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor(i / 4 / canvas.width);

                if (bound.top === null || y < bound.top) bound.top = y;
                if (bound.left === null || x < bound.left) bound.left = x;
                if (bound.right === null || x > bound.right) bound.right = x;
                if (bound.bottom === null || y > bound.bottom) bound.bottom = y;
            }
        }

        if (bound.top === null) return canvas;

        const trimHeight = bound.bottom - bound.top + 1;
        const trimWidth = bound.right - bound.left + 1;
        const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

        const copy = document.createElement('canvas');
        copy.width = trimWidth;
        copy.height = trimHeight;
        copy.getContext('2d', { willReadFrequently: true }).putImageData(trimmed, 0, 0);

        return copy;
    };

    const save = () => {
        if (sigPad.current.isEmpty()) {
            alert('Por favor, proporciona una firma antes de guardar.');
            return;
        }
        
        let dataUrl;
        try {
            // Usamos nuestro propio método de recorte para evitar el bug de la librería
            const canvas = sigPad.current.getCanvas();
            const trimmedCanvas = trimCanvas(canvas);
            dataUrl = trimmedCanvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error al procesar firma:', error);
            // Último recurso: versión original sin recortar
            dataUrl = sigPad.current.getCanvas().toDataURL('image/png');
        }
        
        onSave(dataUrl);
    };

    return (
        <div className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
            <div className="border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 overflow-hidden touch-none" style={{ height: '200px' }}>
                <SignatureCanvas 
                    ref={sigPad}
                    penColor='black'
                    canvasProps={{
                        className: 'signature-canvas w-full h-full cursor-crosshair'
                    }}
                />
            </div>
            <div className="flex gap-2 justify-end">
                <Button 
                    onClick={clear}
                    variant="neutral"
                    className="!py-2 !px-3 text-xs"
                >
                    <Eraser size={14} className="mr-1" /> Limpiar
                </Button>
                <Button 
                    onClick={save}
                    variant="primary"
                    className="!py-2 !px-3 text-xs"
                >
                    <Check size={14} className="mr-1" /> Guardar Firma
                </Button>
            </div>
        </div>
    );
};

export default SignaturePad;
