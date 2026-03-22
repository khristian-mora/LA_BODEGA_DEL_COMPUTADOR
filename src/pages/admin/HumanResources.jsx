import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { hrService } from '../../services/hrService';
import { Plus, Users, Calculator, Banknote } from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';

const AdminHR = () => {
    const { formatPrice } = useShop();
    const [employees, setEmployees] = useState([]);
    const [payroll, setPayroll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', role: '', salary: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const data = await hrService.getEmployees();
        setEmployees(data);
        setLoading(false);
    };

    const handleHire = async (e) => {
        e.preventDefault();
        setLoading(true);
        await hrService.hireEmployee({
            ...formData,
            salary: Number(formData.salary)
        });
        setFormData({ name: '', role: '', salary: '' });
        setShowForm(false);
        await fetchData();
        setLoading(false);
    };

    const handleSimulatePayroll = async () => {
        setLoading(true);
        const data = await hrService.calculatePayroll();
        setPayroll(data);
        setLoading(false);
    };

    return (
        <AdminLayout title="Recursos Humanos y Nómina">
            <div className="space-y-8 animate-fade-in-up">

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Gestión de talento humano.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleSimulatePayroll} className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Simular Nómina
                        </Button>
                        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Contratar
                        </Button>
                    </div>
                </div>

                {/* Payroll Summary Card */}
                {payroll && (
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg border border-gray-700 animate-fade-in">
                        <div className="flex items-center gap-2 mb-6">
                            <Banknote className="w-6 h-6 text-green-400" />
                            <h3 className="font-bold text-lg">Resumen de Nómina Mensual</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Salarios Base</p>
                                <p className="text-2xl font-mono">{formatPrice(payroll.totalBase)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Auxilio Transporte</p>
                                <p className="text-xl font-mono text-blue-300">+{formatPrice(payroll.transportAid)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Aportes (4%)</p>
                                <p className="text-xl font-mono text-red-300">-{formatPrice(payroll.healthDeductions)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase font-bold mb-1">Total a Pagar</p>
                                <p className="text-2xl font-bold font-mono text-green-400">{formatPrice(payroll.totalCost)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hire Form */}
                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 animate-fade-in">
                        <h3 className="font-bold mb-4">Registro de Funcionario</h3>
                        <form onSubmit={handleHire} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <input required placeholder="Nombre Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="p-3 border rounded-lg" />
                            <input required placeholder="Cargo" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="p-3 border rounded-lg" />
                            <input required type="number" placeholder="Salario Base (COP)" value={formData.salary} onChange={e => setFormData({ ...formData, salary: e.target.value })} className="p-3 border rounded-lg" />
                            <Button type="submit" variant="primary">Contratar</Button>
                        </form>
                    </div>
                )}

                {/* Employee Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 pl-6">ID</th>
                                <th className="p-4">Funcionario</th>
                                <th className="p-4">Cargo</th>
                                <th className="p-4">Salario</th>
                                <th className="p-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && !payroll && !showForm ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Cargando personal...</td></tr>
                            ) : employees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 pl-6 text-sm font-mono text-gray-500">
                                        {emp.id}
                                    </td>
                                    <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                            {emp.name.charAt(0)}
                                        </div>
                                        {emp.name}
                                    </td>
                                    <td className="p-4 text-gray-600 font-medium badge">
                                        {emp.role}
                                    </td>
                                    <td className="p-4 font-mono text-sm font-bold text-gray-900">
                                        {formatPrice(emp.salary)}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                            {emp.status}
                                        </span>
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

export default AdminHR;
