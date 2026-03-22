import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../layouts/Layout';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { Filter, SlidersHorizontal, ChevronDown, Grid, List, ArrowUpDown } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import { buildUploadUrl, PLACEHOLDER_IMAGE } from '../config/config';

const BASE_URL = 'https://labodegadelcomputador.com';

const ROUTE_TO_CATEGORIES = {
    '/laptops': ['LAPTOPS', 'TABLETS'],
    '/components': ['PROCESADORES', 'PLACAS BASE', 'MEMORIAS RAM', 'DISCOS DUROS', 'GABINETES', 'FUENTES DE PODER'],
    '/accessories': [
        'MOUSE', 'TECLADOS', 'AUDIO', 'AUDIO/PARLANTES',
        'CABLES', 'CABLES/HDMI', 'CABLES/USB', 'CABLES/VGA', 'CABLES/RED',
        'ADAPTADORES/CARGADORES', 'MONITORES',
        'REDES/ROUTER', 'REDES/SWITCH',
        'SEGURIDAD', 'UPS', 'BATERIAS',
        'PERIFERICOS/LECTORES',
        'ACCESORIOS/FUNDAS',
        'OTROS'
    ],
    '/printers': ['IMPRESORAS', 'ESCANERS', 'CONSUMIBLES/TINTAS', 'CONSUMIBLES/PAPEL'],
    '/furniture': ['MUEBLES', 'MUEBLES/BASES', 'MUEBLES/VENTILADORES'],
    '/gaming': ['MOUSE', 'TECLADOS', 'AUDIO', 'MONITORES'],
};

const CATEGORY_META = {
    LAPTOPS:     { title: 'Portátiles y Laptops',         description: 'Encuentra los mejores portátiles y laptops en La Bodega del Computador. Marcas líderes, garantía oficial y envío gratis.', path: '/laptops' },
    PROCESADORES:  { title: 'Componentes PC',               description: 'CPUs, GPUs, RAM, SSD y más componentes para armar o mejorar tu PC. Los mejores precios en La Bodega del Computador.', path: '/components' },
    MOUSE: { title: 'Accesorios y Periféricos',     description: 'Teclados, ratones, auriculares y todo tipo de periféricos y accesorios tecnológicos con envío gratis.', path: '/accessories' },
    IMPRESORAS:    { title: 'Impresoras y Escáneres',        description: 'Impresoras de tinta, láser y multifuncionales. Encuentra la impresora ideal para hogar u oficina.', path: '/printers' },
    MUEBLES:   { title: 'Mobiliario para Oficina',       description: 'Escritorios ergonómicos, sillas de oficina y mobiliario tecnológico para optimizar tu espacio de trabajo.', path: '/furniture' },
    MONITORES:      { title: 'Zona Gaming',                  description: 'PC gaming, periféricos, sillas gamer y todo lo que necesitas para tu setup. La mejor experiencia gaming.', path: '/gaming' },
    All:         { title: 'Catálogo Completo',            description: 'Explora el catálogo completo de La Bodega del Computador: portátiles, componentes, accesorios, impresoras y más.', path: '/catalog' },
    // Ruta específica para la página de catálogo general
    '/catalog':  { title: 'Catálogo Completo',            description: 'Explora el catálogo completo de La Bodega del Computador: portátiles, componentes, accesorios, impresoras y más.', path: '/catalog' },
};

const Catalog = () => {
    const { products } = useShop();
    const location = useLocation();
    const [filteredProducts, setFilteredProducts] = useState(products);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [priceRange, setPriceRange] = useState(20000000);
    const [showFilters, setShowFilters] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedBrand, _setSelectedBrand] = useState('Todas');
    const [stockFilter, _setStockFilter] = useState('all'); // 'all', 'inStock', 'outOfStock'

    // Categories derived from products
    const categories = ['All', ...new Set(products.map(p => p.category))];
    // Categories to show in sidebar based on current route
    const categoriesToShow = ROUTE_TO_CATEGORIES[location.pathname] || categories.filter(c => c !== 'All');
    
    // Available brands for current category selection (before other filters)
    const _availableBrands = useMemo(() => {
        let filteredByCategory = products;
        if (selectedCategory !== 'ALL') {
            filteredByCategory = products.filter(p => p.category === selectedCategory);
        } else {
            filteredByCategory = products.filter(p => categoriesToShow.includes(p.category));
        }
        const brands = new Set();
        filteredByCategory.forEach(p => {
            if (p.specs?.marca) {
                brands.add(p.specs.marca);
            }
        });
        return ['Todas', ...Array.from(brands).sort()];
    }, [products, selectedCategory, categoriesToShow]);

    // Handle URL path changes to auto-select categories
    useEffect(() => {
        // Reset to show all categories of the current route
        setSelectedCategory('ALL');
    }, [location.pathname]);

    useEffect(() => {
        let result = products;

        // Filter by category
        if (selectedCategory === 'ALL') {
            result = result.filter(p => categoriesToShow.includes(p.category));
        } else {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Filter by price
        result = result.filter(p => p.price <= priceRange);

        // Filter by brand
        if (selectedBrand !== 'Todas') {
            result = result.filter(p => p.specs?.marca === selectedBrand);
        }

        // Filter by stock
        if (stockFilter === 'inStock') {
            result = result.filter(p => p.stock > 0);
        } else if (stockFilter === 'outOfStock') {
            result = result.filter(p => p.stock === 0);
        }

        // Apply sorting
        switch (sortBy) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                // default order (by id or featured)
                break;
        }

        setFilteredProducts(result);
    }, [selectedCategory, categoriesToShow, priceRange, selectedBrand, stockFilter, sortBy, products]);

    // Determine which category to use for meta information
    let metaKey = 'All';
    if (CATEGORY_META[location.pathname]) {
        metaKey = location.pathname;
    } else {
        const primaryCategory = selectedCategory === 'ALL' ? (categoriesToShow[0] || 'All') : selectedCategory;
        metaKey = primaryCategory;
    }
    const meta = CATEGORY_META[metaKey] || CATEGORY_META['All'];

    // JSON-LD: ItemList of visible products
    const itemListJsonLd = useMemo(() => ({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: meta.title,
        numberOfItems: filteredProducts.length,
        itemListElement: filteredProducts.slice(0, 20).map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${BASE_URL}/product/${p.id}`,
            name: p.name,
        })),
    }), [filteredProducts, meta.title]);

    useSEO({
        title: meta.title,
        description: meta.description,
        canonical: `${BASE_URL}${meta.path}`,
        jsonLd: itemListJsonLd,
    });

    return (
        <Layout>
            <div className="bg-gray-50 min-h-screen pt-24 pb-12">
                <div className="container mx-auto px-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 animate-fade-in-up">
                        <div>
                            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Explora nuestro catálogo</p>
                            <h1 className="text-4xl font-bold text-gray-900">Nuestros Productos</h1>
                        </div>
                        <p className="text-gray-600 mt-4 md:mt-0">
                            Mostrando {filteredProducts.length} resultados
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Mobile Filter Toggle */}
                        <button
                            className="lg:hidden flex items-center justify-between w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <span className="font-bold flex items-center gap-2"><SlidersHorizontal className="w-5 h-5" /> Filtros</span>
                            <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Sidebar Filters */}
                        <aside className={`lg:w-1/4 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>

                            {/* Category Filter */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Categorías
                                </h3>
                                <div className="space-y-2">
                                    {/* Ver Todo option */}
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={selectedCategory === 'ALL'}
                                            onChange={() => setSelectedCategory('ALL')}
                                            className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                                        />
                                        <span className={`text-gray-600 group-hover:text-black transition-colors ${selectedCategory === 'ALL' ? 'font-bold text-black' : ''}`}>
                                            Ver Todo
                                        </span>
                                    </label>
                                    {/* Individual categories */}
                                    {categoriesToShow.map(cat => (
                                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={selectedCategory === cat}
                                                onChange={() => setSelectedCategory(cat)}
                                                className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                                            />
                                            <span className={`text-gray-600 group-hover:text-black transition-colors ${selectedCategory === cat ? 'font-bold text-black' : ''}`}>
                                                {cat}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Filter */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                <h3 className="font-bold text-lg mb-4">Precio Máximo</h3>
                                <div className="space-y-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="20000000"
                                        step="100000"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                    />
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-gray-500">$0</span>
                                        <span className="text-black bg-gray-100 px-3 py-1 rounded-full">
                                            $ {new Intl.NumberFormat('es-CO').format(priceRange)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </aside>

                        {/* Main Content Area */}
                        <div className="lg:w-3/4 space-y-6">
                            {/* Controls: Sort and View */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-fade-in-up">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className="w-4 h-4 text-gray-500" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="text-sm border-none bg-transparent font-medium focus:ring-0 cursor-pointer"
                                        >
                                            <option value="default">Relevancia</option>
                                            <option value="price-asc">Precio: Menor a Mayor</option>
                                            <option value="price-desc">Precio: Mayor a Menor</option>
                                            <option value="name">Nombre A-Z</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            aria-label="Vista cuadrícula"
                                        >
                                            <Grid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            aria-label="Vista lista"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Product Grid */}
                            {filteredProducts.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredProducts.map((product, index) => (
                                            <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05 + 0.3}s` }}>
                                                <ProductCard product={product} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredProducts.map((product, index) => (
                                            <div key={product.id} className="animate-fade-in-up bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-6" style={{ animationDelay: `${index * 0.05 + 0.3}s` }}>
                                                <div className="w-32 h-32 flex-shrink-0">
                                                    <img 
                                                        src={buildUploadUrl(product.image) || PLACEHOLDER_IMAGE} 
                                                        alt={product.name} 
                                                        className="w-full h-full object-cover rounded-lg"
                                                        onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                                                    <p className="text-gray-500 text-sm mb-2 line-clamp-2">{product.description}</p>
                                                    <p className="font-bold text-xl">$ {new Intl.NumberFormat('es-CO').format(product.price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <p className="text-2xl font-bold text-gray-300 mb-2">Sin resultados</p>
                                    <p className="text-gray-500">Intenta ajustar tus filtros de búsqueda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Catalog;
