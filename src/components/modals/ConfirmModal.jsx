import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../Button';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Confirmar acción',
    message = '¿Estás seguro de que deseas continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger' // 'danger' | 'warning' | 'primary'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-100 text-red-600',
            button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        },
        warning: {
            icon: 'bg-yellow-100 text-yellow-600',
            button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        },
        primary: {
            icon: 'bg-blue-100 text-blue-600',
            button: 'bg-black hover:bg-gray-800 focus:ring-black'
        }
    };

    const currentStyle = variantStyles[variant] || variantStyles.danger;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-6 flex items-start gap-4">
                    <div className={`${currentStyle.icon} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 ${currentStyle.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;