'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Eye, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  sku: string;
  status: string;
  isNew: boolean;
  category: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  images: string[];
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [showModal, setShowModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    salePrice: null as number | null,
    stock: 0,
    sku: '',
    status: 'ACTIVO',
    isNew: false,
    categoryId: '',
    brandId: '',
    images: [] as string[],
    newImageUrl: '',
  });
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    fetchProducts();
  }, [page, statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      
      if (data.products) {
        setProducts(data.products);
        setCategories(data.categories || []);
        setBrands(data.brands || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? '/api/admin/products' : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const body = editingProduct 
        ? { id: editingProduct.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const productImages = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: Number(product.price),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      stock: product.stock,
      sku: product.sku || '',
      status: product.status,
      isNew: product.isNew,
      categoryId: product.category?.id || '',
      brandId: product.brand?.id || '',
      images: productImages,
      newImageUrl: '',
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.url],
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddImage = () => {
    if (formData.newImageUrl.trim()) {
      const url = formData.newImageUrl.trim();
      setFormData({
        ...formData,
        images: [...formData.images, url],
        newImageUrl: '',
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    const removedUrl = newImages[index];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      salePrice: null,
      stock: 0,
      sku: '',
      status: 'ACTIVO',
      isNew: false,
      categoryId: '',
      brandId: '',
      images: [],
      newImageUrl: '',
    });
  };

  const statusColors: Record<string, string> = {
    ACTIVO: 'bg-green-100 text-green-700',
    INACTIVO: 'bg-gray-100 text-gray-700',
    BORRADOR: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
                ← Volver al dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Gestión de Productos</h1>
              <p className="text-gray-500">Administra el catálogo de productos</p>
            </div>
            <Button onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="BORRADOR">Borrador</option>
              </select>
              <Button type="submit">Buscar</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 skeleton rounded" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron productos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Producto</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Categoría</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Marca</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Precio</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Stock</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Estado</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{product.category?.name || '-'}</td>
                        <td className="p-4 text-sm">{product.brand?.name || '-'}</td>
                        <td className="p-4">
                          <p className="font-medium">${Number(product.price).toLocaleString('es-CO')}</p>
                          {product.salePrice && (
                            <p className="text-xs text-green-600">Oferta: ${Number(product.salePrice).toLocaleString('es-CO')}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={product.stock <= 5 ? 'text-red-600 font-medium' : ''}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${statusColors[product.status] || 'bg-gray-100'}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link href={`/products/${product.slug}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">Página {page} de {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Imágenes del producto</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-center">
                      <label className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Haz clic para subir imagen</span>
                        <span className="text-xs text-gray-400">JPG, PNG, WebP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    {uploading && (
                      <p className="text-center text-sm text-blue-600 mt-2">Subiendo...</p>
                    )}
                  </div>
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'; }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Agrega las URLs de las imágenes del producto
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio oferta</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.salePrice || ''}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock</label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Marca</label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Seleccionar...</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                      <option value="BORRADOR">Borrador</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isNew"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isNew" className="text-sm">Producto nuevo</label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setShowModal(false); setEditingProduct(null); }}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
