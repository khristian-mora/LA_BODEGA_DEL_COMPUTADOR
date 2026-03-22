import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const AlertModal = ({ 
    isOpen, 
    onClose, 
    title = 'Alerta',
    message = '',
    type = 'info', // 'success' | 'error' | 'warning' | 'info'
    buttonText = 'Entendido'
}) => {
    if (!isOpen) return null;

    const typeConfig = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
            buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        },
        error: {
            icon: XCircle,
            bgColor: 'bg-red-100',
            textColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
            buttonBg: 'bg-black hover:bg-gray-800 focus:ring-black'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-6 flex items-start gap-4">
                    <div className={`${config.bgColor} ${config.textColor} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
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

                {/* Action */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className={`w-full px-4 py-3 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 ${config.buttonBg}`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;