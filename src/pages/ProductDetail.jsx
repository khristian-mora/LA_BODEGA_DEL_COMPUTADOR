import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';
import { Check, Truck, Shield, Star, ArrowLeft } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import { buildUploadUrl, PLACEHOLDER_IMAGE } from '../config/config';

const BASE_URL = 'https://labodegadelcomputador.com';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products, addToCart, formatPrice } = useShop();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate data fetching
        const found = products.find(p => p.id === parseInt(id));
        setProduct(found);
        setLoading(false);
    }, [id, products]);

    // Build JSON-LD for Product schema
    const productJsonLd = product ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || `${product.name} disponible en La Bodega del Computador.`,
        image: product.image,
        sku: `LBDC-${product.id}`,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'Genérico',
        },
        offers: {
            '@type': 'Offer',
            url: `${BASE_URL}/product/${product.id}`,
            priceCurrency: 'COP',
            price: product.price,
            availability: product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: 'La Bodega del Computador',
            },
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            reviewCount: '24',
        },
    } : null;

    // Breadcrumb JSON-LD
    const breadcrumbJsonLd = product ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${BASE_URL}/catalog` },
            { '@type': 'ListItem', position: 3, name: product.name, item: `${BASE_URL}/product/${product.id}` },
        ],
    } : null;

    // Combine schemas into a @graph
    const combinedJsonLd = product ? {
        '@context': 'https://schema.org',
        '@graph': [productJsonLd, breadcrumbJsonLd],
    } : null;

    useSEO({
        title: product ? product.name : 'Producto',
        description: product
            ? `Compra ${product.name} en La Bodega del Computador. ${formatPrice ? formatPrice(product.price) : ''} con envío gratis y garantía oficial.`
            : 'Detalle de producto en La Bodega del Computador.',
        canonical: product ? `${BASE_URL}/product/${product.id}` : undefined,
        image: product?.image,
        type: 'product',
        jsonLd: combinedJsonLd,
    });

    if (loading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;

    if (!product) return (
        <Layout>
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Producto no encontrado</h2>
                <Button variant="outline" onClick={() => navigate('/products')}>Volver al Catálogo</Button>
            </div>
        </Layout>
    );

    const relatedProducts = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);

    return (
        <Layout>
            <div className="bg-white pt-24 pb-12">
                <div className="container mx-auto px-6">

                    {/* Breadcrumb / Back */}
                    <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-black mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                        {/* Left: Image Gallery */}
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="bg-gray-50 rounded-3xl p-8 lg:p-12 border border-gray-100 relative overflow-hidden group">
                                <img
                                    src={buildUploadUrl(product.image) || PLACEHOLDER_IMAGE}
                                    alt={product.name}
                                    className="w-full h-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {/* Placeholder thumbnails */}
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-2 cursor-pointer hover:border-black border border-transparent transition-all">
                                        <img 
                                            src={buildUploadUrl(product.image) || PLACEHOLDER_IMAGE} 
                                            alt="" 
                                            className="w-full h-full object-contain mix-blend-multiply opacity-70"
                                            onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Info */}
                        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="mb-2">
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {product.category}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{product.name}</h1>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex text-yellow-500">
                                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                                </div>
                                <span className="text-gray-400 text-sm">(24 Reseñas)</span>
                            </div>

                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                {product.description}
                            </p>

                            {/* Price Block */}
                            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-end gap-4 mb-2">
                                    <span className="text-4xl font-bold text-black">{formatPrice(product.price)}</span>
                                    {product.oldPrice && (
                                        <span className="text-xl text-gray-400 line-through mb-1">{formatPrice(product.oldPrice)}</span>
                                    )}
                                </div>
                                <p className="text-green-600 text-sm font-bold flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Disponible en Stock
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <Button
                                    variant="primary"
                                    className="px-8 py-4 text-lg flex-1"
                                    onClick={() => addToCart(product)}
                                >
                                    Añadir al Carrito
                                </Button>
                                {/* Wishlist Button could go here */}
                            </div>

                            {/* Features / Specs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl">
                                    <Truck className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="font-bold">Envío Gratis</p>
                                        <p className="text-gray-500">2-3 Días hábiles</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl">
                                    <Shield className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="font-bold">Garantía Oficial</p>
                                        <p className="text-gray-500">12 Meses directa</p>
                                    </div>
                                </div>
                            </div>

                            {/* Specs Table */}
                            <div className="mt-12">
                                <h3 className="font-bold text-xl mb-6">Especificaciones Técnicas</h3>
                                <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                                    {Object.entries(product.specs || {}).map(([key, value]) => (
                                        <div key={key} className="py-4 grid grid-cols-3">
                                            <span className="text-gray-500 capitalize">{key}</span>
                                            <span className="col-span-2 font-medium">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                        <div className="mt-24">
                            <h2 className="text-2xl font-bold mb-8">Productos Relacionados</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </Layout>
    );
};

export default ProductDetail;
