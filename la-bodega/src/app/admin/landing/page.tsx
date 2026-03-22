'use client';

import * as React from 'react';
import Link from 'next/link';
import { Settings, Image, Save, Upload, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

interface LandingSettings {
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  banner1_title?: string;
  banner1_image?: string;
  banner1_link?: string;
  banner2_title?: string;
  banner2_image?: string;
  banner2_link?: string;
  banner3_title?: string;
  banner3_image?: string;
  banner3_link?: string;
  feature_1_icon?: string;
  feature_1_title?: string;
  feature_1_desc?: string;
  feature_2_icon?: string;
  feature_2_title?: string;
  feature_2_desc?: string;
  feature_3_icon?: string;
  feature_3_title?: string;
  feature_3_desc?: string;
  feature_4_icon?: string;
  feature_4_title?: string;
  feature_4_desc?: string;
}

export default function AdminLandingPage() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<LandingSettings>({});

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
      }
      toast('Configuración guardada correctamente', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast('Error al guardar configuración', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(key);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSettings({ ...settings, [key]: data.url });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="container mx-auto">
          <div className="h-8 w-48 skeleton rounded mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
                ← Volver al dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Configuración del Landing Page</h1>
              <p className="text-gray-500">Personaliza las imágenes y textos de la página principal</p>
            </div>
            <div className="flex gap-2">
              <Link href="/" target="_blank">
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver página
                </Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Sección Hero (Banner principal)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Imagen principal</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading === 'hero_image' ? 'Subiendo...' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload('hero_image', e)}
                    disabled={uploading !== null}
                  />
                </label>
                {settings.hero_image && (
                  <span className="text-sm text-gray-500 truncate max-w-[200px]">
                    {settings.hero_image}
                  </span>
                )}
              </div>
              {settings.hero_image && (
                <img
                  src={settings.hero_image}
                  alt="Hero preview"
                  className="mt-2 w-full max-h-48 object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título principal</label>
                <Input
                  value={settings.hero_title || ''}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  placeholder="Tecnología de última generación"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <Input
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  placeholder="a los mejores precios"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Texto del botón</label>
                <Input
                  value={settings.hero_cta_text || ''}
                  onChange={(e) => handleChange('hero_cta_text', e.target.value)}
                  placeholder="Ver Productos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Enlace del botón</label>
                <Input
                  value={settings.hero_cta_link || ''}
                  onChange={(e) => handleChange('hero_cta_link', e.target.value)}
                  placeholder="/products"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Banner {i}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Imagen</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm">
                      <Upload className="w-3 h-3" />
                      {uploading === `banner${i}_image` ? 'Subiendo...' : 'Subir'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(`banner${i}_image`, e)}
                        disabled={uploading !== null}
                      />
                    </label>
                    {settings[`banner${i}_image` as keyof LandingSettings] && (
                      <span className="text-xs text-gray-500 truncate max-w-[120px]">
                        {settings[`banner${i}_image` as keyof LandingSettings] as string}
                      </span>
                    )}
                  </div>
                  {settings[`banner${i}_image` as keyof LandingSettings] && (
                    <img
                      src={settings[`banner${i}_image` as keyof LandingSettings] as string}
                      alt={`Banner ${i}`}
                      className="mt-2 w-full h-24 object-cover rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <Input
                    value={settings[`banner${i}_title` as keyof LandingSettings] as string || ''}
                    onChange={(e) => handleChange(`banner${i}_title`, e.target.value)}
                    placeholder={`Banner ${i} título`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Enlace</label>
                  <Input
                    value={settings[`banner${i}_link` as keyof LandingSettings] as string || ''}
                    onChange={(e) => handleChange(`banner${i}_link`, e.target.value)}
                    placeholder="/sales"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Características / Iconos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3 p-4 border rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Icono (nombre)</label>
                    <Input
                      value={settings[`feature_${i}_icon` as keyof LandingSettings] as string || ''}
                      onChange={(e) => handleChange(`feature_${i}_icon`, e.target.value)}
                      placeholder="Truck"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <Input
                      value={settings[`feature_${i}_title` as keyof LandingSettings] as string || ''}
                      onChange={(e) => handleChange(`feature_${i}_title`, e.target.value)}
                      placeholder={`Característica ${i}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <Input
                      value={settings[`feature_${i}_desc` as keyof LandingSettings] as string || ''}
                      onChange={(e) => handleChange(`feature_${i}_desc`, e.target.value)}
                      placeholder={`Descripción ${i}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
