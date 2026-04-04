import React from 'react';
import { createPortal } from 'react-dom';

export const PortalWrapper = ({ children, isOpen }) => {
    if (!isOpen) return null;
    
    if (typeof document === 'undefined') return null;
    
    return createPortal(
        <div className="portal-wrapper">
            {children}
        </div>,
        document.body
    );
};

export default PortalWrapper;