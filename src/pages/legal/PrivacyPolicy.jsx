import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="container mx-auto px-6 py-20 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Política de Tratamiento de Datos Personales</h1>
            <p className="text-gray-600 mb-6">Última actualización: {new Date().toLocaleDateString()}</p>

            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-4">1. Identificación del Responsable</h2>
                    <p>
                        <strong>LA BODEGA DEL COMPUTADOR</strong>, identificada con el NIT correspondiente, con domicilio en Colombia, 
                        es responsable del tratamiento de sus datos personales conforme a lo dispuesto en la 
                        <strong> Ley 1581 de 2012</strong> (Habeas Data) y el Decreto 1377 de 2013.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">2. Finalidad del Tratamiento</h2>
                    <p>Los datos personales recolectados serán tratados para las siguientes finalidades:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Gestión de pedidos, facturación y envíos de productos.</li>
                        <li>Prestación de servicios técnicos, diagnóstico y garantía.</li>
                        <li>Comunicación de novedades, ofertas y promociones (siempre que se autorice).</li>
                        <li>Atención de solicitudes, quejas y reclamos (PQR).</li>
                        <li>Cumplimiento de obligaciones legales y contables.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">3. Derechos de los Titulares</h2>
                    <p>De acuerdo con la legislación colombiana, usted tiene derecho a:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Conocer, actualizar y rectificar sus datos personales.</li>
                        <li>Solicitar prueba de la autorización otorgada.</li>
                        <li>Ser informado sobre el uso que se le ha dado a sus datos.</li>
                        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
                        <li>Revocar la autorización o solicitar la supresión del dato cuando no se respeten los principios legales.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">4. Procedimiento para el Ejercicio de Derechos</h2>
                    <p>
                        Para ejercer sus derechos de Habeas Data, puede enviar una solicitud al correo electrónico: 
                        <strong> admin@labodegadelcomputador.com</strong> o dirigirse a nuestra sede física.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">5. Seguridad de la Información</h2>
                    <p>
                        Implementamos medidas técnicas y administrativas razonables para proteger su información contra pérdida, 
                        acceso no autorizado o alteración, cumpliendo con los estándares de seguridad exigidos por la ley.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">6. Vigencia de la Política</h2>
                    <p>
                        Esta política rige a partir de su publicación y los datos permanecerán en nuestra base de datos por el 
                        tiempo necesario para cumplir con las finalidades descritas o el tiempo que exija la ley comercial y tributaria.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
