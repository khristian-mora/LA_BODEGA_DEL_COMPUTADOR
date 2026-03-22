import React from 'react';

const CookiePolicy = () => {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Política de Cookies</h1>
            <p className="text-gray-600 mb-6">Última actualización: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4">1. Definición y Función de las Cookies</h2>
                    <p>
                        Las cookies son pequeños archivos de texto que se descargan en su dispositivo (computadora, smartphone o tablet) 
                        al acceder a nuestro sitio web. Permiten almacenar y recuperar información sobre sus hábitos de navegación 
                        o del equipo para mejorar su experiencia y el funcionamiento de la tienda.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">2. Tipos de Cookies que utilizamos</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Cookies Técnicas (Necesarias):</strong> Permiten funciones básicas como la navegación y el acceso a áreas seguras (ej. carrito de compras, sesión de usuario).</li>
                        <li><strong>Cookies de Preferencias:</strong> Permiten recordar información que cambia el comportamiento del sitio, como su idioma preferido o región.</li>
                        <li><strong>Cookies Estadísticas / Analíticas:</strong> Ayudan a entender cómo interactúan los visitantes con el sitio (Google Analytics), recopilando información anónima.</li>
                        <li><strong>Cookies de Marketing:</strong> Se usan para rastrear a los visitantes a través de las webs para mostrar anuncios que sean relevantes y atractivos.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">3. Gestión y Desactivación de Cookies</h2>
                    <p>
                        El usuario puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración 
                        de las opciones del navegador instalado en su computadora:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
                        <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad &amp; Seguridad &gt; Cookies y datos del sitio.</li>
                        <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Cookies y datos de sitios web.</li>
                        <li><strong>Microsoft Edge:</strong> Configuración &gt; Cookies y permisos del sitio.</li>
                    </ul>
                    <p className="mt-4">
                        Tenga en cuenta que la desactivación de cookies puede limitar el uso de ciertas funciones de nuestro sitio web.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">4. Consentimiento</h2>
                    <p>
                        Al navegar y continuar en nuestro sitio web, usted estará consintiendo el uso de las cookies en las condiciones contenidas en la presente Política de Cookies.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default CookiePolicy;
