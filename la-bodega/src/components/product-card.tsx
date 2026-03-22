'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  saleEndsAt?: Date | null;
  stock: number;
  images: string[];
  brand?: { name: string } | null;
  category?: { name: string } | null;
  isNew?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onToggleFavorite }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discount = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const isSaleActive = product.saleEndsAt && new Date(product.saleEndsAt) > new Date();

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorite(!isFavorite);
    if (onToggleFavorite) {
      onToggleFavorite(product);
    }
    toast(isFavorite ? 'Eliminado de favoritos' : 'Añadido a favoritos', 'success');
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(product);
    }
    
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      if (res.ok) {
        toast('Añadido al carrito', 'success');
      } else {
        toast('Error al añadir al carrito', 'error');
      }
    } catch {
      toast('Error al añadir al carrito', 'error');
    }
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className={cn(
                'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}

          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <Heart
              className={cn(
                'w-5 h-5',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
              )}
            />
          </button>

          {hasDiscount && isSaleActive && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discount}%
            </div>
          )}

          {product.isNew && !hasDiscount && (
            <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Nuevo
            </div>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Agotado</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
          )}
          
          <h3 className="font-medium text-slate-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-gray-500 ml-1">(0)</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-red-600">
                  ${Number(product.salePrice).toLocaleString('es-CO')}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ${Number(product.price).toLocaleString('es-CO')}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-slate-900">
                ${Number(product.price).toLocaleString('es-CO')}
              </span>
            )}
          </div>

          <Button
            className="w-full"
            size="sm"
            disabled={product.stock === 0}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? 'Agotado' : 'Añadir al carrito'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
