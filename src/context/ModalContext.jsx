import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmModal, AlertModal, PromptModal } from '../components/modals';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
    // Confirm Modal State
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: 'danger',
        onConfirm: () => {}
    });

    // Alert Modal State
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        buttonText: 'Entendido'
    });

    // Prompt Modal State
    const [promptState, setPromptState] = useState({
        isOpen: false,
        title: '',
        message: '',
        placeholder: '',
        defaultValue: '',
        inputType: 'text',
        confirmText: 'Aceptar',
        cancelText: 'Cancelar',
        onConfirm: () => {}
    });

    // Show Confirm Modal - returns a Promise
    const showConfirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: options.title || 'Confirmar acción',
                message: options.message || '¿Estás seguro de que deseas continuar?',
                confirmText: options.confirmText || 'Confirmar',
                cancelText: options.cancelText || 'Cancelar',
                variant: options.variant || 'danger',
                onConfirm: () => resolve(true)
            });
            
            // Store the reject handler in case user cancels
            const originalOnClose = () => {
                setConfirmState(prev => ({ ...prev, isOpen: false }));
                resolve(false);
            };
            
            // We need to handle the close case differently
            // Store close handler separately
            setConfirmState(prev => ({
                ...prev,
                _onClose: originalOnClose
            }));
        });
    }, []);

    // Show Alert Modal - returns a Promise that resolves when closed
    const showAlert = useCallback((options) => {
        return new Promise((resolve) => {
            setAlertState({
                isOpen: true,
                title: options.title || 'Alerta',
                message: options.message || '',
                type: options.type || 'info',
                buttonText: options.buttonText || 'Entendido',
                _onClose: () => {
                    setAlertState(prev => ({ ...prev, isOpen: false }));
                    resolve();
                }
            });
        });
    }, []);

    // Show Prompt Modal - returns a Promise that resolves with the entered value or null
    const showPrompt = useCallback((options) => {
        return new Promise((resolve) => {
            setPromptState({
                isOpen: true,
                title: options.title || 'Ingrese un valor',
                message: options.message || '',
                placeholder: options.placeholder || '',
                defaultValue: options.defaultValue || '',
                inputType: options.inputType || 'text',
                confirmText: options.confirmText || 'Aceptar',
                cancelText: options.cancelText || 'Cancelar',
                onConfirm: (value) => {
                    setPromptState(prev => ({ ...prev, isOpen: false }));
                    resolve(value);
                },
                _onClose: () => {
                    setPromptState(prev => ({ ...prev, isOpen: false }));
                    resolve(null);
                }
            });
        });
    }, []);

    const closeConfirm = () => {
        if (confirmState._onClose) {
            confirmState._onClose();
        } else {
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
    };

    const closeAlert = () => {
        if (alertState._onClose) {
            alertState._onClose();
        } else {
            setAlertState(prev => ({ ...prev, isOpen: false }));
        }
    };

    const closePrompt = () => {
        if (promptState._onClose) {
            promptState._onClose();
        } else {
            setPromptState(prev => ({ ...prev, isOpen: false }));
        }
    };

    return (
        <ModalContext.Provider value={{ showConfirm, showAlert, showPrompt }}>
            {children}
            
            {/* Render Modals */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                variant={confirmState.variant}
            />
            
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={closeAlert}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                buttonText={alertState.buttonText}
            />
            
            <PromptModal
                isOpen={promptState.isOpen}
                onClose={closePrompt}
                onConfirm={promptState.onConfirm}
                title={promptState.title}
                message={promptState.message}
                placeholder={promptState.placeholder}
                defaultValue={promptState.defaultValue}
                inputType={promptState.inputType}
                confirmText={promptState.confirmText}
                cancelText={promptState.cancelText}
            />
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export default ModalContext;