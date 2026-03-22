import React, { useState, useEffect } from 'react';
import { Mail, X } from 'lucide-react';
import Button from '../Button';

const PromptModal = ({ 
    isOpen, 
    onClose, 
    onConfirm,
    title = 'Ingrese un valor',
    message = '',
    placeholder = '',
    defaultValue = '',
    inputType = 'text',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
}) => {
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(value);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-6 flex items-start gap-4">
                    <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                        {message && <p className="text-gray-600 text-sm leading-relaxed">{message}</p>}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit}>
                    <div className="px-6 pb-4">
                        <input
                            type={inputType}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            autoFocus
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5 transition-all outline-none text-gray-900"
                        />
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            {confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromptModal;