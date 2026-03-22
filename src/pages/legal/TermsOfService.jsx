import React from 'react';

const TermsOfService = () => {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Términos de Servicio</h1>
            <p className="text-gray-600 mb-6">Última actualización: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4">1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder a este sitio web y a nuestros servicios, usted acepta estar sujeto a estos Términos y Condiciones, 
                        a todas las leyes y regulaciones aplicables en el territorio de la República de Colombia, 
                        y acepta que es responsable del cumplimiento de las mismas.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">2. Licencia de Uso</h2>
                    <p>
                        Se concede permiso para descargar temporalmente una copia de los materiales suministrados (información o software) 
                        en el sitio web de LA BODEGA DEL COMPUTADOR para visualización transitoria personal y no comercial solamente.
                    </p>
                    <p className="mt-2 text-gray-500 font-medium">Esta licencia no es una transferencia de título y usted no puede:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Modificar o copiar los materiales.</li>
                        <li>Utilizar los materiales para cualquier propósito comercial o visualización pública.</li>
                        <li>Quitar cualquier derecho de autor u otras notaciones de propiedad de los materiales.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">3. Limitación de Responsabilidad</h2>
                    <p>
                        En ningún caso LA BODEGA DEL COMPUTADOR ni sus proveedores serán responsables por daños (incluyendo, sin limitación, 
                        daños por pérdida de datos o beneficios, o debido a la interrupción del negocio) que surjan del uso o la incapacidad 
                        de utilizar los materiales en el sitio web de LA BODEGA DEL COMPUTADOR.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">4. Exactitud de los Materiales</h2>
                    <p>
                        Los materiales que aparecen en el sitio web de LA BODEGA DEL COMPUTADOR pueden incluir errores técnicos, 
                        tipográficos o fotográficos. No garantizamos que ninguno de los materiales en su sitio web sea preciso, completo o actual. 
                        Nos reservamos el derecho a realizar cambios en los materiales en cualquier momento sin previo aviso.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">5. Enlaces</h2>
                    <p>
                        LA BODEGA DEL COMPUTADOR no ha revisado todos los sitios vinculados a su sitio web y no es responsable de los contenidos 
                        de ninguno de estos sitios vinculados. La inclusión de cualquier enlace no implica el respaldo por nuestra parte. 
                        El uso de cualquier sitio web vinculado es bajo el propio riesgo del usuario.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">6. Ley Aplicable</h2>
                    <p>
                        Cualquier reclamo relacionado con el sitio web de LA BODEGA DEL COMPUTADOR se regirá por las leyes de la 
                        jurisdicción de Colombia, sin consideración a sus disposiciones sobre conflictos de leyes.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
