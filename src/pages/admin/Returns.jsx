import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { returnsService } from '../../services/returnsService';
import { RefreshCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Button from '../../components/Button';

const AdminReturns = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const data = await returnsService.getReturns();
        setReturns(data);
        setLoading(false);
    };

    const handleAction = async (id, status) => {
        setLoading(true);
        await returnsService.updateStatus(id, status);
        await fetchData();
        setLoading(false);
    };

    return (
        <AdminLayout title="Devoluciones y Garantías (RMA)">
            <div className="space-y-6 animate-fade-in-up">

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-orange-900 text-sm">Política de Devoluciones</h4>
                        <p className="text-xs text-orange-700 mt-1">
                            Recuerda verificar el estado físico del producto antes de aprobar.
                            Las devoluciones por "Gusto" tienen 5 días hábiles. Garantías técnicas aplica proceso de taller.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">RMA / Pedido</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Producto / Motivo</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right pr-6">Decisión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando solicitudes...</td></tr>
                            ) : returns.map((rma) => (
                                <tr key={rma.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-2 font-bold text-gray-900">
                                            <RefreshCcw className="w-4 h-4 text-gray-400" />
                                            {rma.id}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{rma.orderId}</p>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-gray-800">
                                        {rma.customer}
                                        <p className="text-xs text-gray-400">{rma.date}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-sm text-gray-900">{rma.product}</p>
                                        <p className="text-xs text-red-500 bg-red-50 inline-block px-1 rounded mt-1">{rma.reason}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${rma.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                (rma.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')
                                            }`}>
                                            {rma.status === 'pending' ? 'Pendiente' : (rma.status === 'approved' ? 'Aprobado' : 'Rechazado')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        {rma.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button onClick={() => handleAction(rma.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs">
                                                    Aprobar
                                                </Button>
                                                <Button onClick={() => handleAction(rma.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs">
                                                    Rechazar
                                                </Button>
                                            </div>
                                        )}
                                        {rma.status !== 'pending' && (
                                            <span className="text-xs text-gray-400 uppercase font-bold">Procesado</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminReturns;
