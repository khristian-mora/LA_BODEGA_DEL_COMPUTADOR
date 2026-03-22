'use client';

import * as React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Tag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  saleEndsAt: Date | null;
  stock: number;
  images: string[];
  brand: { name: string } | null;
  category: { name: string } | null;
  isNew: boolean;
}

function SalesContent() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState('');

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('onSale', 'true');
      params.set('limit', '50');

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = searchInput
    ? products.filter(p => p.name.toLowerCase().includes(searchInput.toLowerCase()))
    : products;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="bg-red-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold">Ofertas Especiales</h1>
          </div>
          <p className="text-red-100 text-lg">¡Aprovecha nuestros descuentos exclusivos!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar en ofertas..."
              className="pl-10"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton rounded w-1/3" />
                  <div className="h-5 skeleton rounded w-full" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No hay ofertas disponibles</h2>
            <p className="text-gray-500 mb-6">Vuelve pronto para nuevas promociones</p>
            <Link href="/products">
              <Button>Ver todos los productos</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">{filteredProducts.length} productos en oferta</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SalesPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="bg-red-600 py-12">
          <div className="container mx-auto px-4">
            <div className="h-10 w-48 skeleton rounded" />
          </div>
        </div>
      </div>
    }>
      <SalesContent />
    </React.Suspense>
  );
}
