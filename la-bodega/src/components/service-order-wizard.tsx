'use client';

import * as React from 'react';
import { X, ChevronRight, ChevronLeft, Laptop, Monitor, Smartphone, Printer, Watch, Gamepad2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

interface ServiceOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const deviceTypes = [
  { id: 'Laptop', label: 'Laptop', icon: Laptop, fields: ['processor', 'ram', 'storage', 'screenSize'] },
  { id: 'Computadora de escritorio', label: 'PC de Escritorio', icon: Monitor, fields: ['processor', 'ram', 'storage', 'powerSupply', 'graphicsCard'] },
  { id: 'Tablet', label: 'Tablet', icon: Smartphone, fields: ['screenSize', 'storage', 'hasCellular'] },
  { id: 'Celular', label: 'Celular', icon: Smartphone, fields: ['brand', 'model', 'imei', 'carrier'] },
  { id: 'Impresora', label: 'Impresora', icon: Printer, fields: ['printerType', 'connectionType', 'brand'] },
  { id: 'Smartwatch', label: 'Smartwatch', icon: Watch, fields: ['brand', 'model', 'strapType'] },
  { id: 'Consola', label: 'Consola de Videojuegos', icon: Gamepad2, fields: ['brand', 'model', 'storage'] },
  { id: 'Otro', label: 'Otro Equipo', icon: Monitor, fields: [] },
];

const commonBrands = ['Dell', 'HP', 'Lenovo', 'Asus', 'Apple', 'Samsung', 'Acer', 'MSI', 'Toshiba', 'Sony', 'LG', 'Otro'];

const printerTypes = ['Láser', 'Tinta', 'Matricial', 'Plotter', 'Termica', 'Otra'];
const connectionTypes = ['USB', 'WiFi', 'Ethernet', 'Bluetooth', 'USB + WiFi'];

const conditions = [
  { id: 'Bueno', label: 'Bueno - Funciona parcialmente' },
  { id: 'Regular', label: 'Regular - Enciende pero con problemas' },
  { id: 'Malo', label: 'Malo - No enciende' },
  { id: 'No enciende', label: 'No enciende' },
  { id: 'Pantalla rota', label: 'Pantalla rota' },
  { id: 'Bateria dañada', label: 'Batería dañada' },
  { id: 'Liquido', label: 'Daño por líquido' },
];

export function ServiceOrderWizard({ isOpen, onClose }: ServiceOrderWizardProps) {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    deviceType: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
    brand: '',
    model: '',
    serial: '',
    reportedIssue: '',
    physicalCondition: '',
    accessories: '',
    password: '',
    processor: '',
    ram: '',
    storage: '',
    screenSize: '',
    graphicsCard: '',
    printerType: '',
    connectionType: '',
    createAccount: false,
  });

  const totalSteps = 4;

  const currentDevice = deviceTypes.find(d => d.id === formData.deviceType);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/service-orders/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isNewUser) {
          toast(`¡Cuenta creada! Tu orden: ${data.orderNumber}. Te enviamos un correo.`, 'success');
        } else if (data.userLinked) {
          toast(`Orden creada: ${data.orderNumber}. Vinculada a tu cuenta existente.`, 'success');
        } else {
          toast(`Orden creada: ${data.orderNumber}. Te enviaremos un correo con los detalles.`, 'success');
        }
        handleClose();
      } else {
        const error = await res.json();
        toast(error.error || 'Error al crear orden', 'error');
      }
    } catch {
      toast('Error al crear orden de servicio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      deviceType: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerIdNumber: '',
      brand: '',
      model: '',
      serial: '',
      reportedIssue: '',
      physicalCondition: '',
      accessories: '',
      password: '',
      processor: '',
      ram: '',
      storage: '',
      screenSize: '',
      graphicsCard: '',
      printerType: '',
      connectionType: '',
      createAccount: false,
    });
    onClose();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!formData.deviceType;
      case 2:
        return !!formData.customerName && !!formData.customerEmail && !!formData.customerPhone;
      case 3:
        return !!formData.brand && !!formData.model && !!formData.physicalCondition;
      case 4:
        return !!formData.reportedIssue;
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Nueva Orden de Servicio</h2>
            <p className="text-sm text-gray-500">Paso {step} de {totalSteps}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step ? 'bg-blue-600 text-white' :
                  s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 4 && <div className={`w-12 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">¿Qué tipo de equipo necesitas reparar?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {deviceTypes.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setFormData({ ...formData, deviceType: device.id })}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      formData.deviceType === device.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <device.icon className={`w-8 h-8 mx-auto mb-2 ${
                      formData.deviceType === device.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{device.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Información del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Nombre completo *</label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Correo electrónico *</label>
                  <Input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="juan@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono *</label>
                  <Input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="300 123 4567"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cédula (opcional)</label>
                  <Input
                    value={formData.customerIdNumber}
                    onChange={(e) => setFormData({ ...formData, customerIdNumber: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.createAccount || false}
                      onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">
                      <strong>Crear cuenta</strong> - Recibe 10% de descuento en tu primera compra
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Detalles del Equipo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Marca *</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="">Seleccionar marca</option>
                    {commonBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Modelo *</label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Inspiron 15 3501"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Número de serie</label>
                  <Input
                    value={formData.serial}
                    onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                    placeholder="ABC123XYZ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contraseña del equipo</label>
                  <Input
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Si tiene contraseña"
                  />
                </div>

                {currentDevice?.id === 'Laptop' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Procesador</label>
                      <Input
                        value={formData.processor}
                        onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                        placeholder="Intel Core i5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">RAM</label>
                      <Input
                        value={formData.ram}
                        onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                        placeholder="8GB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Almacenamiento</label>
                      <Input
                        value={formData.storage}
                        onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                        placeholder="256GB SSD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tamaño de pantalla</label>
                      <Input
                        value={formData.screenSize}
                        onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                        placeholder='15.6"'
                      />
                    </div>
                  </>
                )}

                {currentDevice?.id === 'Computadora de escritorio' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Procesador</label>
                      <Input
                        value={formData.processor}
                        onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                        placeholder="Intel Core i7"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">RAM</label>
                      <Input
                        value={formData.ram}
                        onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                        placeholder="16GB"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Almacenamiento</label>
                      <Input
                        value={formData.storage}
                        onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                        placeholder="1TB NVMe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tarjeta gráfica</label>
                      <Input
                        value={formData.graphicsCard}
                        onChange={(e) => setFormData({ ...formData, graphicsCard: e.target.value })}
                        placeholder="NVIDIA RTX 3060"
                      />
                    </div>
                  </>
                )}

                {currentDevice?.id === 'Impresora' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo de impresora</label>
                      <select
                        value={formData.printerType}
                        onChange={(e) => setFormData({ ...formData, printerType: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Seleccionar tipo</option>
                        {printerTypes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tipo de conexión</label>
                      <select
                        value={formData.connectionType}
                        onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Seleccionar conexión</option>
                        {connectionTypes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Condición física del equipo *</label>
                  <select
                    value={formData.physicalCondition}
                    onChange={(e) => setFormData({ ...formData, physicalCondition: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="">Seleccionar condición</option>
                    {conditions.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Accesorios incluidos</label>
                  <Input
                    value={formData.accessories}
                    onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
                    placeholder="Cargador, batería, funda..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Describe el Problema</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Problema reportado *</label>
                <textarea
                  value={formData.reportedIssue}
                  onChange={(e) => setFormData({ ...formData, reportedIssue: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  rows={5}
                  placeholder="Describe detalladamente el problema que presenta tu equipo..."
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mt-6">
                <h4 className="font-medium text-blue-900 mb-2">Resumen de tu orden</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Equipo:</strong> {formData.deviceType}</p>
                  <p><strong>Marca:</strong> {formData.brand} {formData.model}</p>
                  <p><strong>Cliente:</strong> {formData.customerName}</p>
                  <p><strong>Contacto:</strong> {formData.customerPhone} - {formData.customerEmail}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Atrás
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || loading}>
              {loading ? 'Enviando...' : 'Crear Orden de Servicio'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
