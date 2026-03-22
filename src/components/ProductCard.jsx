import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import Button from './Button';
import { buildUploadUrl, PLACEHOLDER_IMAGE } from '../config/config';

const ProductCard = ({ product }) => {
    const { addToCart, formatPrice } = useShop();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [imgError, setImgError] = useState(false);

    const discount = product.oldPrice
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;

    const handleNavigate = () => {
        navigate(`/product/${product.id}`);
    };

    return (
        <motion.div
            className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 h-full"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <div className="relative h-[300px] flex items-center justify-center p-8 bg-gray-50 overflow-hidden cursor-pointer" onClick={handleNavigate}>
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {product.featured && (
                        <motion.span
                            className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                            HOT
                        </motion.span>
                    )}
                    {discount > 0 && (
                        <motion.span
                            className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
                        >
                            -{discount}%
                        </motion.span>
                    )}
                </div>

                {/* Quick Actions */}
                <AnimatePresence>
                    <motion.div
                        className="absolute top-4 right-4 flex flex-col gap-2"
                        initial={{ x: 50, opacity: 0 }}
                        animate={isHovered ? { x: 0, opacity: 1 } : { x: 50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <motion.button
                            className="p-2 bg-white rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
                            title="Ver Detalles"
                            onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                            className="p-2 bg-white rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
                            title="Añadir a Deseos"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Star className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                </AnimatePresence>

                {/* Image */}
                {imgError || !product.image ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 select-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400 text-center px-2 line-clamp-2">{product.name}</span>
                    </div>
                ) : (
                    <motion.img
                        src={buildUploadUrl(product.image) || PLACEHOLDER_IMAGE}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        onError={(e) => {
                            // Si la imagen externa falla, usar placeholder
                            e.target.src = PLACEHOLDER_IMAGE;
                            setImgError(true);
                        }}
                        whileHover={{ scale: 1.12 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    />
                )}

                {/* Quick Add Button */}
                <AnimatePresence>
                    <motion.div
                        className="absolute bottom-4 left-0 w-full px-4"
                        initial={{ y: 30, opacity: 0 }}
                        animate={isHovered ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <Button
                            variant="primary"
                            className="w-full shadow-lg flex items-center justify-center gap-2"
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Añadir
                        </Button>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{product.category}</p>
                <motion.h3
                    onClick={handleNavigate}
                    className="font-bold text-lg mb-2 leading-tight cursor-pointer line-clamp-2"
                    whileHover={{ color: "#2563eb" }}
                    transition={{ duration: 0.2 }}
                >
                    {product.name}
                </motion.h3>

                <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-4">
                    <div className="flex flex-col">
                        {product.oldPrice && (
                            <span className="text-sm text-gray-400 line-through">
                                {formatPrice(product.oldPrice)}
                            </span>
                        )}
                        <motion.span
                            className="text-xl font-bold text-gray-900"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                            {formatPrice(product.price)}
                        </motion.span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
