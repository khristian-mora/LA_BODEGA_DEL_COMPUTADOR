import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { hrService } from '../../services/hrService';
import { Plus, Users, Calculator, Banknote, RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { useModal } from '../../context/ModalContext';

const AdminHR = () => {
    const { formatPrice } = useShop();
    const { showAlert } = useModal();
    const [employees, setEmployees] = useState([]);
    const [payroll, setPayroll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', role: '', salary: '' });

    const resetForm = () => {
        setFormData({ name: '', role: '', salary: '' });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await hrService.getEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
            showAlert({ title: 'Error', message: 'Error al cargar empleados', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleHire = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await hrService.hireEmployee({
                ...formData,
                salary: Number(formData.salary)
            });
            showAlert({ title: 'Éxito', message: 'Empleado contratado correctamente', type: 'success' });
            resetForm();
            setShowForm(false);
            await fetchData();
        } catch (error) {
            showAlert({ title: 'Error', message: error.message || 'Error al contratar empleado', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSimulatePayroll = async () => {
        setLoading(true);
        try {
            const data = await hrService.calculatePayroll();
            setPayroll(data);
        } catch (error) {
            showAlert({ title: 'Error', message: error.message || 'Error al calcular nómina', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const data = await hrService.exportEmployees({ format: 'json' });
            
            if (!data || data.length === 0) {
                showAlert({ title: 'Sin Datos', message: 'No hay empleados para exportar', type: 'info' });
                return;
            }

            const exportData = data.map(emp => ({
                'ID': emp.id,
                'Nombre Completo': emp.name,
                'Cargo / Puesto': emp.role,
                'Salario Base': emp.salary,
                'Estado Contrato': emp.status === 'active' ? 'ACTIVO' : 'INACTIVO',
                'Fecha Ingreso': new Date(emp.createdAt || emp.hiredAt).toLocaleDateString(),
                'Departamento': emp.department || 'N/A',
                'Email': emp.email || 'N/A',
                'Teléfono': emp.phone || 'N/A'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Empleados');

            const wscols = [
                { wch: 10 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, 
                { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, 
                { wch: 15 }
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `Nomina_Empleados_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Export error:', error);
            showAlert({ title: 'Error Exportación', message: 'No se pudo generar el reporte de personal', type: 'error' });
        }
    };

    return (
        <AdminLayout title="Recursos Humanos y Nómina">
            <div className="space-y-8 animate-fade-in-up">

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">Gestión de talento humano.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            <Download className="w-4 h-4" /> Exportar Excel
                        </Button>
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
