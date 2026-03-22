import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad - La Bodega del Computador',
  description: 'Política de privacidad y protección de datos personales de La Bodega del Computador.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:underline mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Política de Privacidad</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
          <p className="text-sm text-gray-500">Última actualización: {new Date().toLocaleDateString('es-CO')}</p>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Introducción</h2>
            <p>
              La Bodega del Computador respects your privacy and is committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our 
              website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Identity Data:</strong> Includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> Includes email address, telephone numbers, and delivery address.</li>
              <li><strong>Financial Data:</strong> Includes payment card details (processed securely through Stripe).</li>
              <li><strong>Transaction Data:</strong> Includes details about payments to and from you.</li>
              <li><strong>Technical Data:</strong> Includes internet protocol (IP) address, browser type, time zone setting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To register you as a new customer</li>
              <li>To process and deliver your order</li>
              <li>To manage payments, fees and charges</li>
              <li>To collect and recover money owed to us</li>
              <li>To use data analytics to improve our website, products, and marketing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being 
              accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, 
              we limit access to your personal data to those employees, agents, contractors who have a 
              business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Your Legal Rights</h2>
            <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Request access to your personal data</li>
              <li>Request correction or erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Email: privacidad@labodega.com</li>
              <li>Teléfono: (01) 8000 123456</li>
              <li>Dirección: Calle 123, Bogotá, Colombia</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
