import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { ChevronRight, CheckCircle, Smartphone, Cpu, CircuitBoard, HardDrive, Box, Zap } from 'lucide-react';
import { buildUploadUrl, PLACEHOLDER_IMAGE } from '../config/config';

const Builder = () => {
    const { products, addToCart, formatPrice } = useShop();
    const navigate = useNavigate();

    // Updated step definitions with icon mappings
    const steps = [
        { id: 'processor', name: 'Procesador', builderCategory: 'processor', icon: Cpu },
        { id: 'motherboard', name: 'Board', builderCategory: 'motherboard', icon: CircuitBoard },
        { id: 'ram', name: 'Memoria RAM', builderCategory: 'ram', icon: HardDrive },
        { id: 'gpu', name: 'Tarjeta Gráfica', builderCategory: 'gpu', icon: Box },
        { id: 'storage', name: 'Almacenamiento', builderCategory: 'storage', icon: HardDrive },
        { id: 'psu', name: 'Fuente', builderCategory: 'psu', icon: Zap },
        { id: 'case', name: 'Chasis', builderCategory: 'case', icon: Box },
        { id: 'monitor', name: 'Monitor', builderCategory: 'monitor', icon: Box }
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const [build, setBuild] = useState({});
    const [currentTotal, setCurrentTotal] = useState(0);

    // Calculate total on build change
    useEffect(() => {
        const total = Object.values(build).reduce((sum, item) => sum + item.price, 0);
        setCurrentTotal(total);
    }, [build]);

    // Handle selection
    const handleSelect = (product) => {
        const stepId = steps[currentStep].id;
        setBuild(prev => ({ ...prev, [stepId]: product }));
        // Auto advance after short delay
        setTimeout(() => {
            if (currentStep < steps.length) {
                setCurrentStep(prev => prev + 1);
            }
        }, 300);
    };

    // Filter products for current step using builderCategory
    const stepProducts = useMemo(() => {
        const step = steps[currentStep];
        if (!step) return [];
        return products.filter(p => p.builderCategory === step.builderCategory);
    }, [products, currentStep]);

    // Finalize Build
    const handleAddBuildToCart = () => {
        Object.values(build).forEach(item => {
            addToCart(item);
        });
        navigate('/cart');
    };

    // View Summary
    if (currentStep === steps.length) {
        return (
            <Layout>
                <div className="bg-gray-50 min-h-screen pt-24 pb-12">
                    <div className="container mx-auto px-6">
                        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Resumen de tu Build</h1>

                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-4xl mx-auto">
                            <div className="bg-black text-white p-8 text-center">
                                <h2 className="text-4xl font-bold mb-2">{formatPrice(currentTotal)}</h2>
                                <p className="text-gray-400">Precio Total Estimado</p>
                            </div>

                            <div className="p-8 space-y-4">
                                {steps.map((step) => {
                                    const item = build[step.id];
                                    return (
                                        <div key={step.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                                    <step.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{step.name}</p>
                                                    <p className="text-sm text-gray-600">{item ? item.name : <span className="text-red-400 italic">No seleccionado</span>}</p>
                                                </div>
                                            </div>
                                            <p className="font-bold">{item ? formatPrice(item.price) : '-'}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                                <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(0)}>
                                    Modificar
                                </Button>
                                <Button variant="primary" className="flex-1" onClick={handleAddBuildToCart}>
                                    Añadir todo al Carrito
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen pt-24 pb-12">
                <div className="container mx-auto px-6">

                    {/* Header & Progress */}
                    <div className="text-center mb-12 animate-fade-in-up">
                        <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">Beta</span>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Arma tu PC Ideal</h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Selecciona tus componentes paso a paso. Nosotros verificamos la compatibilidad básica.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Progress (Desktop) */}
                        <div className="lg:w-1/4 hidden lg:block sticky top-24 h-fit">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-6">Tu Configuración</h3>
                                <div className="space-y-4">
                                    {steps.map((step, index) => {
                                        const isCompleted = index < currentStep;
                                        const isCurrent = index === currentStep;
                                        const selectedItem = build[step.id];

                                        return (
                                            <div
                                                key={step.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isCurrent ? 'bg-black text-white shadow-lg scale-105' : 'text-gray-500'} ${isCompleted ? 'text-green-600' : ''}`}
                                            >
                                                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold ${isCurrent ? 'text-white' : ''} ${isCompleted ? 'text-gray-900' : ''}`}>{step.name}</p>
                                                    {selectedItem && <p className="text-xs truncate opacity-80">{selectedItem.name}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 mb-1">Total Estimado</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatPrice(currentTotal)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Selection Area */}
                        <div className="lg:w-3/4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm">{currentStep + 1}</span>
                                    Selecciona tu {steps[currentStep].name}
                                </h2>
                                <div className="lg:hidden text-lg font-bold">{formatPrice(currentTotal)}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {stepProducts.map((product, _index) => (
                                    <div
                                        key={product.id}
                                        onClick={() => handleSelect(product)}
                                        className={`cursor-pointer group relative bg-white rounded-2xl p-4 shadow-sm border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${build[steps[currentStep].id]?.id === product.id ? 'border-green-500 ring-2 ring-green-100' : 'border-transparent hover:border-black'}`}
                                    >
                                        <div className="aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden p-4">
                                            <img 
                                                src={buildUploadUrl(product.image) || PLACEHOLDER_IMAGE} 
                                                alt={product.name} 
                                                className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" 
                                                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-gray-900 leading-tight">{product.name}</h3>
                                            <p className="text-lg font-bold text-black">{formatPrice(product.price)}</p>
                                            <ul className="text-xs text-gray-500 space-y-1">
                                                {Object.entries(product.specs || {}).slice(0, 3).map(([key, value]) => (
                                                    <li key={key} className="flex justify-between">
                                                        <span className="capitalize opacity-70">{key}:</span>
                                                        <span className="font-medium">{value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                                {getStepProducts().length === 0 && (
                                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                                        <p className="text-gray-500">No encontramos componentes disponibles para esta categoría.</p>
                                        <Button variant="outline" className="mt-4" onClick={() => setCurrentStep(prev => prev + 1)}>
                                            Saltar este paso
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Builder;
