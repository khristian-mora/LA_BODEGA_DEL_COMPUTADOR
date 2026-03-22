'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingCart, ChevronRight, Star, Truck, Shield, Wrench, Minus, Plus, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  saleEndsAt: Date | null;
  stock: number;
  sku: string | null;
  images: string[];
  specsJson: Record<string, string> | null;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  isNew: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [showZoom, setShowZoom] = React.useState(false);

  React.useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      }
    } catch {
      console.error('Error fetching product:');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      if (res.ok) {
        toast(`Añadido ${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} al carrito`, 'success');
      } else {
        toast('Error al añadir al carrito', 'error');
      }
    } catch {
      toast('Error al añadir al carrito', 'error');
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast(isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square skeleton rounded-xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 skeleton rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 skeleton rounded w-1/3" />
              <div className="h-10 skeleton rounded w-2/3" />
              <div className="h-8 skeleton rounded w-1/4" />
              <div className="h-24 skeleton rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Producto no encontrado</h1>
          <Link href="/products">
            <Button>Volver al catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discount = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">Inicio</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/products" className="hover:text-blue-600">Productos</Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Link href={`/products?category=${product.category.slug}`} className="hover:text-blue-600">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden">
              {product.images[selectedImage] ? (
                <>
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setShowZoom(true)}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Sin imagen
                </div>
              )}

              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold">
                  -{discount}% OFF
                </div>
              )}

              {product.isNew && !hasDiscount && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Nuevo
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-colors',
                    selectedImage === i ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            {product.brand && (
              <p className="text-sm text-gray-500 mb-2">{product.brand.name}</p>
            )}
            
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{product.name}</h1>

            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm text-gray-500 ml-2">(0 reseñas)</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {hasDiscount ? (
                <>
                  <span className="text-4xl font-bold text-red-600">
                    ${Number(product.salePrice).toLocaleString('es-CO')}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    ${Number(product.price).toLocaleString('es-CO')}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold text-slate-900">
                  ${Number(product.price).toLocaleString('es-CO')}
                </span>
              )}
            </div>

            {product.saleEndsAt && hasDiscount && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-600">
                  <strong>¡Oferta válida hasta!</strong> {new Date(product.saleEndsAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-0"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <span className="text-sm text-gray-500">
                {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
              </span>
            </div>

            <div className="flex gap-3 mb-8">
              <Button
                size="lg"
                className="flex-1"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Añadir al carrito
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleToggleFavorite}
              >
                <Heart className={cn('w-5 h-5', isFavorite && 'fill-red-500 text-red-500')} />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Envío gratis +$500k</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Garantía 12 meses</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>Soporte técnico</span>
              </div>
            </div>

            {product.sku && (
              <p className="text-sm text-gray-500 mb-4">SKU: {product.sku}</p>
            )}

            {product.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {product.specsJson && Object.keys(product.specsJson).length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Especificaciones técnicas</h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <tbody>
                    {Object.entries(product.specsJson).map(([key, value]) => (
                      <tr key={key} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-slate-700 w-1/3 bg-gray-50">{key}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-sm">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showZoom && product.images[selectedImage] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setShowZoom(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center"
            onClick={() => setShowZoom(false)}
          >
            <span className="text-2xl">&times;</span>
          </button>
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
