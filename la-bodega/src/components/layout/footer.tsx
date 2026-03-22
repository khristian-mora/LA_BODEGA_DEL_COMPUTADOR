import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LB</span>
              </div>
              <span className="font-bold text-lg">La Bodega del Computador</span>
            </div>
            <p className="text-slate-400 text-sm">
              Tu tienda de confianza paraComputadores, periféricos y servicios técnicos.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Productos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/products?category=laptops" className="hover:text-white">Laptops</Link></li>
              <li><Link href="/products?category=desktops" className="hover:text-white">Desktops</Link></li>
              <li><Link href="/products?category=monitores" className="hover:text-white">Monitores</Link></li>
              <li><Link href="/products?category=accesorios" className="hover:text-white">Accesorios</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/services" className="hover:text-white">Servicio Técnico</Link></li>
              <li><Link href="/services" className="hover:text-white">Reparación de equipos</Link></li>
              <li><Link href="/services" className="hover:text-white">Mantenimiento</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>📍 Calle 123, Bogotá</li>
              <li>📞 (1) 123-4567</li>
              <li>✉️ info@labodega.com</li>
              <li>🕐 Lun-Sáb: 9am-7pm</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
          <div className="flex justify-center gap-4 mb-2">
            <Link href="/legal/privacy" className="hover:text-white">Política de Privacidad</Link>
            <Link href="/legal/terms" className="hover:text-white">Términos y Condiciones</Link>
          </div>
          © {new Date().getFullYear()} La Bodega del Computador. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
