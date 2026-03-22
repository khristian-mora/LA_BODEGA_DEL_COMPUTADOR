import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones - La Bodega del Computador',
  description: 'Términos y condiciones de uso de La Bodega del Computador.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:underline mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Términos y Condiciones</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Última actualización: {new Date().toLocaleDateString('es-CO')}</p>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Aceptación de Términos</h2>
            <p>
              Al acceder y utilizar este sitio web, usted acepta cumplir con los siguientes términos y condiciones 
              de uso. Si no está de acuerdo con alguno de estos términos, por favor no utilice nuestro sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Uso del Sitio Web</h2>
            <p>Usted se compromete a utilizar este sitio web únicamente para fines lícitos y de manera que no infrinja 
            los derechos de terceros o restrinja o inhiba el uso y disfrute del sitio por parte de terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Cuenta de Usuario</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.</li>
              <li>Usted acepta responsabilizarse de todas las actividades que ocurran bajo su cuenta.</li>
              <li>Nos reservamos el derecho de suspender o cancelar cuentas que infrinjan estos términos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Pedidos y Pagos</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Todos los pedidos están sujetos a disponibilidad de inventario.</li>
              <li>Los precios mostrados incluyen IVA y están en pesos colombianos (COP).</li>
              <li>El pago se procesa de forma segura a través de Stripe.</li>
              <li>Nos reservamos el derecho de rechazar cualquier pedido.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Envíos y Entregas</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Los envíos se realizan solo dentro de Colombia.</li>
              <li>El tiempo de entrega estimado es de 3-7 días hábiles.</li>
              <li>Los costos de envío varían según la ubicación y el peso del pedido.</li>
              <li>No nos responsabilizamos por retrasos causados por terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Devoluciones y Reembolsos</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Accept devoluciones dentro de los 30 días siguientes a la compra.</li>
              <li>El producto debe estar en su estado original, sin usar y con empaque.</li>
              <li>Los gastos de envío para devoluciones son responsabilidad del cliente.</li>
              <li>Los reembolsos se procesan dentro de los 10-15 días hábiles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Garantías de Productos</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Todos los productos nuevos incluyen garantía del fabricante.</li>
              <li>La garantía no cubre daños por uso indebido o negligencia.</li>
              <li>Los productos de tecnología tienen garantía de 1 año por defectos de fabricación.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Servicios Técnicos</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Los servicios de reparación tienen garantía de 90 días.</li>
              <li>Nos reservamos el derecho de cobrar diagnóstico si el cliente no autoriza la reparación.</li>
              <li>El cliente debe respaldar sus datos antes de cualquier servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de este sitio web, incluyendo textos, gráficos, logos, imágenes y software, 
              es propiedad de La Bodega del Computador y está protegido por las leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Limitación de Responsabilidad</h2>
            <p>
              La Bodega del Computador no será responsable por daños indirectos, incidentales o consecuenciales 
              derivados del uso de este sitio web o de la compra de productos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. 
              Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Ley Aplicable</h2>
            <p>
              Estos términos y condiciones se rigen por las leyes de Colombia. Cualquier disputa derivada 
              de estos términos será resuelta en los tribunales de Bogotá, Colombia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">13. Contacto</h2>
            <p>Para preguntas sobre estos términos, contactenos:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Email: legal@labodega.com</li>
              <li>Teléfono: (01) 8000 123456</li>
              <li>Dirección: Calle 123, Bogotá, Colombia</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
