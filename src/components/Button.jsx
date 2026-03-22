import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 transform active:scale-95";

    const variants = {
        primary: "bg-gradient-to-r from-slate-800 to-black text-white hover:from-black hover:to-slate-800 shadow-lg hover:shadow-xl",
        secondary: "bg-white text-black border border-gray-200 hover:border-black hover:bg-gray-50 shadow-sm hover:shadow-md",
        outline: "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white",
        ghost: "bg-transparent text-gray-600 hover:text-black hover:bg-gray-100"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
