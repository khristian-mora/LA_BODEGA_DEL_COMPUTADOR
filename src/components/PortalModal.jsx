import React from 'react';
import { createPortal } from 'react-dom';

const PortalModal = ({ children }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(children, document.body);
};

export default PortalModal;