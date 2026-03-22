import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import laptopImg from '../assets/hero_laptop.png';
import pcImg from '../assets/hero_gaming_pc.png';
import accImg from '../assets/hero_kb_mouse.png';

const categories = [
    { id: 1, name: 'Portátiles', image: laptopImg, items: '120+ Modelos' },
    { id: 2, name: 'PCs Gamer', image: pcImg, items: 'Armados a medida' },
    { id: 3, name: 'Accesorios', image: accImg, items: 'Teclados y más' },
];

const CategoryGrid = () => {
    const containerVariants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.2 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
        }
    };

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
                <motion.div
                    className="flex justify-between items-end mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Compra por Categoría</h2>
                        <p className="text-gray-500">Encuentra exactamente lo que necesitas.</p>
                    </div>
                    <Link to="/catalog" className="text-black font-semibold underline underline-offset-4 hover:text-gray-600">Ver todo</Link>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    {categories.map((cat) => (
                        <motion.div
                            key={cat.id}
                            className="group relative h-[400px] bg-gray-50 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-gray-100"
                            variants={cardVariants}
                            whileHover={{ y: -10, boxShadow: "0 25px 50px rgba(0,0,0,0.12)" }}
                        >
                            {/* Text Content - Top Left */}
                            <div className="absolute top-0 left-0 p-8 flex flex-col z-20">
                                <motion.h3
                                    className="text-2xl font-bold"
                                    whileHover={{ color: "#2563eb" }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {cat.name}
                                </motion.h3>
                                <p className="text-gray-400 text-sm mt-1">{cat.items}</p>
                            </div>

                            {/* Image - Centered and lower */}
                            <motion.div
                                className="absolute inset-0 flex items-center justify-center pt-16"
                                whileHover={{ scale: 1.08 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            >
                                <img src={cat.image} alt={cat.name} className="w-3/4 object-contain drop-shadow-lg" />
                            </motion.div>

                            {/* Explore Button - Bottom */}
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 p-8 z-20"
                                initial={{ opacity: 0, y: 10 }}
                                whileHover={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <span className="font-medium flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full w-fit">Explorar →</span>
                            </motion.div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default CategoryGrid;
