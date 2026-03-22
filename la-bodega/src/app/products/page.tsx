'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Grid, List, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState(searchParams.get('search') || '');

  const [filters, setFilters] = React.useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') === 'true',
    isNew: searchParams.get('isNew') === 'true',
    onSale: searchParams.get('onSale') === 'true',
    sort: searchParams.get('sort') || 'createdAt_desc',
  });

  const [expandedSections, setExpandedSections] = React.useState({
    category: true,
    brand: true,
    price: true,
    other: true,
  });

  React.useEffect(() => {
    fetchFilters();
    fetchProducts();
  }, [searchParams]);

  const fetchFilters = async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
      ]);
      const [cats, brandsData] = await Promise.all([catsRes.json(), brandsRes.json()]);
      setCategories(cats);
      setBrands(brandsData);
    } catch {
      console.error('Error fetching filters:');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });
      params.set('page', String(pagination.page));

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch {
      console.error('Error fetching products:');
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);
    
    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    router.push(`/products?${params}`);
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      isNew: false,
      onSale: false,
      sort: 'createdAt_desc',
    };
    setFilters(cleared);
    router.push('/products');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = filters.category || filters.brand || filters.minPrice || 
    filters.maxPrice || filters.inStock || filters.isNew || filters.onSale;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Catálogo de productos</h1>
              <p className="text-slate-500">{pagination.total} productos encontrados</p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  className="pl-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateFilters({ search: searchInput });
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                  )}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-blue-50 border-blue-300')}
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className={cn(
            'w-64 flex-shrink-0',
            showFilters ? 'block' : 'hidden md:block'
          )}>
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Filtros</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => toggleSection('category')}
                    className="flex items-center justify-between w-full text-left font-medium text-sm text-slate-700 py-2"
                  >
                    Categorías
                    {expandedSections.category ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.category && (
                    <div className="space-y-2 mt-2">
                      {categories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            checked={filters.category === cat.slug}
                            onChange={() => updateFilters({ category: cat.slug === filters.category ? '' : cat.slug })}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-600">{cat.name}</span>
                          <span className="text-xs text-gray-400">({cat._count.products})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleSection('brand')}
                    className="flex items-center justify-between w-full text-left font-medium text-sm text-slate-700 py-2"
                  >
                    Marcas
                    {expandedSections.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.brand && (
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {brands.map((brand) => (
                        <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="brand"
                            checked={filters.brand === brand.slug}
                            onChange={() => updateFilters({ brand: brand.slug === filters.brand ? '' : brand.slug })}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-600">{brand.name}</span>
                          <span className="text-xs text-gray-400">({brand._count.products})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full text-left font-medium text-sm text-slate-700 py-2"
                  >
                    Precio
                    {expandedSections.price ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.price && (
                    <div className="space-y-2 mt-2">
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.minPrice}
                          onChange={(e) => updateFilters({ minPrice: e.target.value })}
                          className="h-9"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.maxPrice}
                          onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleSection('other')}
                    className="flex items-center justify-between w-full text-left font-medium text-sm text-slate-700 py-2"
                  >
                    Otros
                    {expandedSections.other ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSections.other && (
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.inStock}
                          onChange={() => updateFilters({ inStock: !filters.inStock })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-600">Solo disponibles</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.isNew}
                          onChange={() => updateFilters({ isNew: !filters.isNew })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-600">Solo nuevos</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.onSale}
                          onChange={() => updateFilters({ onSale: !filters.onSale })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-600">Solo en oferta</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center gap-2 mb-6">
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
              >
                <option value="createdAt_desc">Más recientes</option>
                <option value="createdAt_asc">Más antiguos</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_asc">Nombre: A-Z</option>
                <option value="name_desc">Nombre: Z-A</option>
              </select>
            </div>

            {loading ? (
              <div className={cn(
                'grid gap-6',
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="aspect-square skeleton" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 skeleton rounded w-1/3" />
                      <div className="h-5 skeleton rounded w-full" />
                      <div className="h-4 skeleton rounded w-1/2" />
                      <div className="h-10 skeleton rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500 text-lg">No se encontraron productos</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className={cn(
                'grid gap-6',
                viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              )}>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                    updateFilters({});
                  }}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => {
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                    updateFilters({});
                  }}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="h-8 w-48 skeleton rounded mb-2" />
            <div className="h-4 w-32 skeleton rounded" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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
        </div>
      </div>
    }>
      <ProductsContent />
    </React.Suspense>
  );
}
