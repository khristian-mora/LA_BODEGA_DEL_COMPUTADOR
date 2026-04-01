import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { ticketService } from '../../services/ticketService';
import { Plus, Wrench, CheckCircle, Clock, AlertCircle, Search, MessageSquare, DollarSign, PenTool, Camera, Image, ShoppingBag, Eye, X, Send, Upload, Loader, Mail, Edit2, List, LayoutGrid, Filter } from 'lucide-react';
import Button from '../../components/Button';
import PhotoEditor from '../../components/PhotoEditor';
import { useShop } from '../../context/ShopContext';
import { API_CONFIG, buildUploadUrl } from '../../config/config';
import { useAudit } from '../../context/AuditContext';
import { useModal } from '../../context/ModalContext';

// --- Sub-components (kept in file for simplicity during migration) ---

const StatusBadge = ({ status }) => {
    const styles = {
        RECEIVED: 'bg-gray-100 text-gray-700 border-gray-200',
        DIAGNOSED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        REPAIRING: 'bg-blue-50 text-blue-700 border-blue-200',
        READY: 'bg-green-50 text-green-700 border-green-200',
        DELIVERED: 'bg-gray-50 text-gray-400 border-gray-100 italic'
    };
    const labels = {
        RECEIVED: 'Por Diagnosticar',
        DIAGNOSED: 'Esperando Aprobación',
        REPAIRING: 'En Reparación',
        READY: 'Listo para Entrega',
        DELIVERED: 'Entregado'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-xs border font-medium ${styles[status] || styles.RECEIVED}`}>
            {labels[status] || status}
        </span>
    );
};

const DashboardMetrics = ({ tickets }) => {
    const stats = {
        received: tickets.filter(t => t.status === 'RECEIVED').length,
        diagnosed: tickets.filter(t => t.status === 'DIAGNOSED').length,
        repairing: tickets.filter(t => t.status === 'REPAIRING').length,
        ready: tickets.filter(t => t.status === 'READY').length
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold">Por Diagnosticar</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.received}</p>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><AlertCircle className="w-5 h-5" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold">Por Aprobar</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.diagnosed}</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><Clock className="w-5 h-5" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold">En Taller</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.repairing}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Wrench className="w-5 h-5" /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-xs uppercase font-bold">Listos Salida</p>
                    <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg text-green-600"><CheckCircle className="w-5 h-5" /></div>
            </div>
        </div>
    );
};


const AdminTechService = () => {
    const { formatPrice: _formatPrice } = useShop();
    const { logAction } = useAudit();
    const { showConfirm, showAlert, showPrompt } = useModal();
    const [tickets, setTickets] = useState([]);
    const [_loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
    const [selectedTicket, setSelectedTicket] = useState(null); // For diagnosis modal
    const [isAdmin, setIsAdmin] = useState(false); // Track if user is admin
    const [editingPhoto, setEditingPhoto] = useState(null); // URL of photo being edited
    const [searchTerm, setSearchTerm] = useState('');
    const [technicians, setTechnicians] = useState([]);

    // Check user role on mount
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setIsAdmin(payload.role === 'admin');
            } catch (error) {
                console.error('Error parsing token:', error);
                setIsAdmin(false);
            }
        }
    }, []);

    // Intake Form State
    const [formData, setFormData] = useState({
        clientName: '', clientPhone: '', deviceType: 'Laptop',
        brand: '', model: '', serial: '', issueDescription: '', photosIntake: [], assignedTo: ''
    });

    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    // Diagnosis Form State
    const [diagnosisData, setDiagnosisData] = useState({
        diagnosis: '',
        estimatedCost: '',
        technicianNotes: '',
        findings: [], // Array of strings
        recommendations: [] // Array of strings
    });

    const COMMON_FINDINGS = [
        "Pantalla Rota / Rayada", "Teclado Dañado / Teclas Faltantes", "Bisagras Rotas / Flojas",
        "Golpes en Carcasa", "Puertos USB Dañados", "Falta Tornillería", "Suciedad Excesiva",
        "Disco Duro con Sectores Defectuosos", "Batería Inflada / Agotada"
    ];

    const COMMON_RECOMMENDATIONS = [
        "Mantenimiento Preventivo Completo", "Cambio de Pasta Térmica", "Limpieza Interna",
        "Cambio a Unidad de Estado Sólido (SSD)", "Aumento de Memoria RAM", "Reintalación de Sistema Operativo",
        "Licenciamiento de Software", "Backup de Información", "Cambio de Teclado", "Reparación de Bisagras"
    ];

    useEffect(() => {
        fetchTickets();
        fetchTechnicians();
    }, []);

    const fetchTickets = async () => {
        const data = await ticketService.getTickets();
        setTickets(data);
        setLoading(false);
    };

    const fetchTechnicians = async () => {
        const techs = await ticketService.getTechnicians();
        setTechnicians(techs);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newTicket = await ticketService.createTicket(formData);
            logAction('CREATE_TICKET', 'Taller', `Creó ticket #${newTicket.id} para ${formData.clientName} (${formData.deviceType} ${formData.brand})`);

            // Upload Pending Photos to DB
            if (formData.pendingFiles && formData.pendingFiles.length > 0) {
                for (const file of formData.pendingFiles) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('image', file);
                    await fetch(`/api/upload-evidence/${newTicket.id}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                        body: uploadFormData
                    });
                }
            }

            // 1. Send Receipt Email automatically
            try {
                await fetch(`${API_CONFIG.API_URL}/intake-receipts/send/${newTicket.id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
                });
            } catch (err) {
                console.error("Error sending receipt email", err);
            }

            // 2. Offer to Print Receipt
            const shouldPrint = await showConfirm({
                title: 'Imprimir Comprobante',
                message: 'Ticket Creado. ¿Imprimir Comprobante de Ingreso y Responsabilidad?',
                variant: 'info'
            });
            if (shouldPrint) {
                printIntakeReceipt(newTicket.id);
            }

            setFormData({
                clientName: '', clientPhone: '', deviceType: 'Laptop',
                brand: '', model: '', serial: '', issueDescription: '', photosIntake: [], pendingFiles: [], assignedTo: ''
            });
            setShowForm(false);
            await fetchTickets();
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error al crear ticket',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // If not created yet (Intake Mode), just store files in memory to upload AFTER creation
        if (showForm) {
            // Store raw File objects in a separate state designed for pending uploads
            // For now, we reuse photosIntake to store TEMPORARY PREVIEW URLs
            const tempUrls = files.map(file => URL.createObjectURL(file));
            setFormData(prev => ({
                ...prev,
                photosIntake: [...prev.photosIntake, ...tempUrls],
                pendingFiles: [...(prev.pendingFiles || []), ...files]
            }));
            return;
        }

        // Detail Mode (Ticket Exists) - Upload immediately
        setUploading(true);
        try {
            for (const file of files) {
                const uploadFormData = new FormData();
                uploadFormData.append('image', file);

                const response = await fetch(`/api/upload-evidence/${selectedTicket.id}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: uploadFormData
                });

                if (!response.ok) throw new Error(`Upload failed for ${file.name}`);

                // Refresh to see new evidence
                // For immediate feedback, we could append to list, but fetching is safer
            }
            // Add slight delay to allow DB processing
            setTimeout(async () => {
                fetchTickets(); // Refresh lists
                // Re-open detail manually or refresh selectedTicket? 
                // Currently selectedTicket is separate from tickets list. 
                // Ideally we should refetch ticket detail here.
                await showAlert({
                    title: 'Éxito',
                    message: 'Evidencia subida exitosamente',
                    type: 'success'
                });
            }, 500);

        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error al subir evidencia',
                type: 'error'
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleOpenDetail = (ticket) => {
        setSelectedTicket(ticket);

        // Parse findings/recommendations
        let parsedFindings = [];
        let parsedRecommendations = [];
        try {
            parsedFindings = typeof ticket.findings === 'string' ? JSON.parse(ticket.findings) : (ticket.findings || []);
            parsedRecommendations = typeof ticket.recommendations === 'string' ? JSON.parse(ticket.recommendations) : (ticket.recommendations || []);
        } catch (e) {
            console.error("Error parsing findings/recommendations", e);
        }

        setDiagnosisData({
            diagnosis: ticket.diagnosis || '',
            estimatedCost: ticket.estimatedCost || '',
            technicianNotes: ticket.technicianNotes || '',
            findings: parsedFindings,
            recommendations: parsedRecommendations
        });
    };

    const handleUpdateDiagnosis = async () => {
        if (!selectedTicket) return;
        await ticketService.updateTicket(selectedTicket.id, {
            ...diagnosisData,
            status: 'DIAGNOSED',
            findings: JSON.stringify(diagnosisData.findings),
            recommendations: JSON.stringify(diagnosisData.recommendations)
        });

        await ticketService.notifyClient(selectedTicket, 'DIAGNOSIS_READY');
        logAction('DIAGNOSE_TICKET', 'Taller', `Diagnosticó ticket #${selectedTicket.id}. Costo: ${diagnosisData.estimatedCost}`);
        await showAlert({
            title: 'Diagnóstico Guardado',
            message: `Diagnóstico guardado. Se ha notificado al cliente: ${selectedTicket.clientName}`,
            type: 'success'
        });

        setSelectedTicket(null);
        fetchTickets();
    };

    const handleApproveRepair = async () => {
        if (!selectedTicket) return;
        const confirmed = await showConfirm({
            title: 'Autorización de Reparación',
            message: '¿El cliente ha autorizado la reparación y el costo?',
            variant: 'warning'
        });
        if (confirmed) {
            await ticketService.updateTicket(selectedTicket.id, {
                status: 'REPAIRING',
                approvedByClient: true
            });
            logAction('APPROVE_REPAIR', 'Taller', `Aprobó reparación de ticket #${selectedTicket.id}`);
            setSelectedTicket(null);
            fetchTickets();
        }
    };

    const handleFinishRepair = async (ticket) => {
        await ticketService.updateTicket(ticket.id, { status: 'READY' });
        logAction('FINISH_REPAIR', 'Taller', `Marcó ticket #${ticket.id} como LISTO`);
        await ticketService.notifyClient(ticket, 'REPAIR_READY');
        await showAlert({
            title: 'Reparación Completada',
            message: 'Equipo listo para entrega. Notificación enviada.',
            type: 'success'
        });
        fetchTickets();
    };

    const handleDeliver = async (ticket) => {
        const confirmed = await showConfirm({
            title: 'Confirmar Entrega',
            message: '¿Confirmar entrega al cliente y cierre de ticket?',
            variant: 'danger'
        });
        if (confirmed) {
            await ticketService.updateTicket(ticket.id, { status: 'DELIVERED' });
            logAction('DELIVER_TICKET', 'Taller', `Entregó ticket #${ticket.id} al cliente`);
            fetchTickets();
        }
    };

    const sendCustomerReport = async (ticket) => {
        const email = await showPrompt({
            title: 'Email del Cliente',
            message: 'Ingrese el email del cliente:',
            placeholder: 'email@ejemplo.com',
            defaultValue: ''
        });
        if (!email) return;

        try {
            const response = await fetch(`${API_CONFIG.API_URL}/customer-reports/send/${ticket.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) throw new Error('Error al enviar reporte');

            const data = await response.json();
            await showAlert({
                title: 'Reporte Enviado',
                message: `Reporte enviado exitosamente a ${data.sentTo}`,
                type: 'success'
            });
        } catch (error) {
            await showAlert({
                title: 'Error',
                message: `Error al enviar reporte: ${error.message}`,
                type: 'error'
            });
        }
    };

    const previewCustomerReport = (ticketId) => {
        window.open(`${API_CONFIG.BASE_URL}/api/customer-reports/${ticketId}`, '_blank');
    };

    const printIntakeReceipt = (ticketId) => {
        window.open(`${API_CONFIG.BASE_URL}/api/intake-receipts/${ticketId}`, '_blank');
    };

    const handleEditPhoto = (url) => {
        setEditingPhoto(buildUploadUrl(url));
    };

    const handleSaveEditedPhoto = async (blob) => {
        if (!selectedTicket) return;

        const uploadFormData = new FormData();
        uploadFormData.append('image', blob, 'edited_evidence.png');

        try {
            setUploading(true);
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: uploadFormData
            });

            if (!response.ok) throw new Error('Failed to upload edited image');

            const data = await response.json();
            const newUrl = data.url;

            const updatedPhotos = [...(selectedTicket.photosIntake || []), newUrl];

            setSelectedTicket(prev => ({ ...prev, photosIntake: updatedPhotos }));
            await ticketService.updateTicket(selectedTicket.id, { photosIntake: updatedPhotos });

            setEditingPhoto(null);
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'Error al guardar la imagen editada',
                type: 'error'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleAssignTech = async (ticketId, techId) => {
        try {
            await ticketService.updateTicket(ticketId, { assignedTo: techId });
            logAction('ASSIGN_TECH', 'Taller', `Asignó ticket #${ticketId} al técnico ${techId}`);
            setSelectedTicket(prev => ({ ...prev, assignedTo: techId }));
            fetchTickets();
            showAlert({
                title: 'Asignación Actualizada',
                message: 'Técnico asignado exitosamente',
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            showAlert({
                title: 'Error',
                message: 'No se pudo asignar el técnico.',
                type: 'error'
            });
        }
    };

    const toggleItem = (listName, item) => {
        setDiagnosisData(prev => {
            const list = prev[listName];
            if (list.includes(item)) {
                return { ...prev, [listName]: list.filter(i => i !== item) };
            } else {
                return { ...prev, [listName]: [...list, item] };
            }
        });
    };

    // Filter Logic
    const filteredTickets = tickets.filter(ticket =>
        (ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toString().includes(searchTerm)) &&
        (viewMode === 'list' ? true : true) // Can add specific filters for list view if needed
    );

    const receivedTickets = filteredTickets.filter(t => t.status === 'RECEIVED');
    const diagnosedTickets = filteredTickets.filter(t => t.status === 'DIAGNOSED');
    const repairingTickets = filteredTickets.filter(t => t.status === 'REPAIRING');
    const readyTickets = filteredTickets.filter(t => t.status === 'READY');

    return (
        <AdminLayout title="Taller y Servicio Técnico">
            <div className="h-full flex flex-col animate-fade-in-up">

                {/* Photo Editor Modal */}
                {editingPhoto && (
                    <PhotoEditor
                        imageUrl={editingPhoto}
                        onSave={handleSaveEditedPhoto}
                        onCancel={() => setEditingPhoto(null)}
                    />
                )}

                {/* Improvements: Metrics Dashboard */}
                <DashboardMetrics tickets={tickets} />

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o # ticket..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                                title="Vista de Lista (Buzón)"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                                title="Vista de Tablero (Taller)"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <Button variant="outline" onClick={() => fetchTickets()}>Actualizar</Button>
                        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nueva Solicitud
                        </Button>
                    </div>
                </div>

                {/* --- LIST VIEW (INBOX STYLE) --- */}
                {viewMode === 'list' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Buzón de Solicitudes
                            </h3>
                            <span className="text-xs text-gray-500">Mostrando todos los tickets activos</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                        <th className="p-4 font-bold">ID</th>
                                        <th className="p-4 font-bold">Fecha</th>
                                        <th className="p-4 font-bold">Cliente</th>
                                        <th className="p-4 font-bold">Equipo</th>
                                        <th className="p-4 font-bold">Estado</th>
                                        <th className="p-4 font-bold">Acción Rápida</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-gray-50">
                                    {filteredTickets.map(ticket => (
                                        <tr key={ticket.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleOpenDetail(ticket)}>
                                            <td className="p-4 font-mono font-bold text-gray-600">#{ticket.id}</td>
                                            <td className="p-4 text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                            <td className="p-4 font-medium text-gray-900">
                                                {ticket.clientName}
                                                <div className="text-xs text-gray-400 font-normal">{ticket.clientPhone}</div>
                                                {ticket.assignedTo && technicians.length > 0 && (
                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 w-max px-1.5 py-0.5 rounded">
                                                        <PenTool className="w-3 h-3" /> {technicians.find(t => t.id === parseInt(ticket.assignedTo))?.name || 'Técnico'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-600">{ticket.deviceType} {ticket.brand}</td>
                                            <td className="p-4"><StatusBadge status={ticket.status} /></td>
                                            <td className="p-4">
                                                {ticket.status === 'RECEIVED' ? (
                                                    <button className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Diagnosticar
                                                    </button>
                                                ) : <span className="text-gray-300 text-xs opacity-0 group-hover:opacity-100">Ver detalles</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTickets.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-400 italic">No se encontraron tickets con ese criterio.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- KANBAN VIEW (WORKSHOP STYLE) --- */}
                {viewMode === 'kanban' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full items-start overflow-x-auto pb-4">
                        {/* Column 1: Received */}
                        <div className="bg-gray-50/50 p-4 rounded-xl min-h-[500px] flex flex-col border-t-4 border-gray-400">
                            <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                                Por Diagnosticar
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">{receivedTickets.length}</span>
                            </h3>
                            <div className="space-y-3">
                                {receivedTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => handleOpenDetail(ticket)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md cursor-pointer border-l-4 border-l-transparent hover:border-l-gray-400">
                                        <div className="flex justify-between mb-1"><span className="text-xs font-bold text-gray-500">#{ticket.id}</span><span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
                                        <h4 className="font-bold text-sm">{ticket.deviceType} {ticket.brand}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{ticket.clientName}</p>
                                        
                                        {ticket.assignedTo && technicians.length > 0 && (
                                            <div className="mb-2 flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 w-max px-1.5 py-0.5 rounded">
                                                <PenTool className="w-3 h-3" /> {technicians.find(t => t.id === parseInt(ticket.assignedTo))?.name || 'Técnico'}
                                            </div>
                                        )}

                                        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                                            <span className="text-xs font-bold text-blue-600">Diagnosticar →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Diagnosed */}
                        <div className="bg-yellow-50/30 p-4 rounded-xl min-h-[500px] flex flex-col border-t-4 border-yellow-400">
                            <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                                Esperando Aprobación
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">{diagnosedTickets.length}</span>
                            </h3>
                            <div className="space-y-3">
                                {diagnosedTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => handleOpenDetail(ticket)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md cursor-pointer border-l-4 border-l-transparent hover:border-l-yellow-400">
                                        <div className="flex justify-between mb-1"><span className="text-xs font-bold text-gray-500">#{ticket.id}</span><span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
                                        <h4 className="font-bold text-sm">{ticket.deviceType} {ticket.brand}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{ticket.clientName}</p>
                                        
                                        {ticket.assignedTo && technicians.length > 0 && (
                                            <div className="mb-2 flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 w-max px-1.5 py-0.5 rounded">
                                                <PenTool className="w-3 h-3" /> {technicians.find(t => t.id === parseInt(ticket.assignedTo))?.name || 'Técnico'}
                                            </div>
                                        )}

                                        <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mt-2">
                                            <span className="block font-bold">Diagnóstico Enviado</span>
                                            ${ticket.estimatedCost}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 3: Repairing */}
                        <div className="bg-blue-50/30 p-4 rounded-xl min-h-[500px] flex flex-col border-t-4 border-blue-500">
                            <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                                En Reparación
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{repairingTickets.length}</span>
                            </h3>
                            <div className="space-y-3">
                                {repairingTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => handleOpenDetail(ticket)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500">
                                        <div className="flex justify-between mb-1"><span className="text-xs font-bold text-gray-500">#{ticket.id}</span><span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
                                        <h4 className="font-bold text-sm">{ticket.deviceType} {ticket.brand}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{ticket.clientName}</p>

                                        {ticket.assignedTo && technicians.length > 0 && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 w-max px-1.5 py-0.5 rounded border border-indigo-100">
                                                <PenTool className="w-3 h-3" /> Tech: {technicians.find(t => t.id === parseInt(ticket.assignedTo))?.name || 'Cargando...'}
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <button onClick={(e) => { e.stopPropagation(); handleFinishRepair(ticket); }} className="w-full mt-2 py-1 bg-blue-600 text-white text-xs rounded font-bold hover:bg-blue-700 shadow-sm">
                                                Terminar Reparación
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 4: Ready */}
                        <div className="bg-green-50/30 p-4 rounded-xl min-h-[500px] flex flex-col border-t-4 border-green-500">
                            <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                                Listos para Entrega
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">{readyTickets.length}</span>
                            </h3>
                            <div className="space-y-3">
                                {readyTickets.map(ticket => (
                                    <div key={ticket.id} onClick={() => handleOpenDetail(ticket)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md cursor-pointer border-l-4 border-l-transparent hover:border-l-green-500">
                                        <div className="flex justify-between mb-1"><span className="text-xs font-bold text-gray-500">#{ticket.id}</span><span className="text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
                                        <h4 className="font-bold text-sm">{ticket.deviceType} {ticket.brand}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{ticket.clientName}</p>

                                        {ticket.assignedTo && technicians.length > 0 && (
                                            <div className="mt-1 mb-2 px-2 py-1 bg-indigo-50 rounded text-xs text-indigo-700 flex items-center gap-1 border border-indigo-100">
                                                <PenTool className="w-3 h-3" />
                                                <span className="font-medium">
                                                    Tech: {technicians.find(t => t.id === parseInt(ticket.assignedTo))?.name || 'Cargando...'}
                                                </span>
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDeliver(ticket); }} className="w-full mt-2 py-1 bg-green-600 text-white text-xs rounded font-bold hover:bg-green-700 shadow-sm">
                                                Entregar al Cliente
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Intake Modal (Existing) */}
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                                <h3 className="font-bold text-xl flex items-center gap-2"><PenTool className="w-5 h-5" /> Ingreso de Equipo</h3>
                                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-black font-bold text-xl">&times;</button>
                            </div>

                            <div className="overflow-y-auto p-6">
                                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2"><h4 className="font-bold text-sm text-gray-500 uppercase">Datos del Cliente</h4></div>
                                    <input required placeholder="Nombre Cliente" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="p-3 border rounded-lg" />
                                    <input required placeholder="Teléfono / WhatsApp" value={formData.clientPhone} onChange={e => setFormData({ ...formData, clientPhone: e.target.value })} className="p-3 border rounded-lg" />

                                    <div className="col-span-2 mt-2"><h4 className="font-bold text-sm text-gray-500 uppercase">Datos del Equipo</h4></div>
                                    <select className="p-3 border rounded-lg" value={formData.deviceType} onChange={e => setFormData({ ...formData, deviceType: e.target.value })}>
                                        <option>Laptop</option>
                                        <option>PC Escritorio</option>
                                        <option>Impresora</option>
                                        <option>Consola</option>
                                        <option>Otro</option>
                                    </select>
                                    <input required placeholder="Marca" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="p-3 border rounded-lg" />
                                    <input required placeholder="Modelo" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="p-3 border rounded-lg" />
                                    <input required placeholder="Serial / IMEI" value={formData.serial} onChange={e => setFormData({ ...formData, serial: e.target.value })} className="p-3 border rounded-lg" />
                                    
                                    <div className="col-span-2">
                                        <h4 className="font-bold text-sm text-gray-500 uppercase mt-2 mb-2">Asignación Técnica</h4>
                                        <select className="w-full p-3 border rounded-lg bg-gray-50" value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}>
                                            <option value="">-- Sin Asignar (Pendiente) --</option>
                                            {technicians.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <textarea required rows="3" placeholder="Descripción de la Falla (según cliente)" value={formData.issueDescription} onChange={e => setFormData({ ...formData, issueDescription: e.target.value })} className="w-full p-3 border rounded-lg"></textarea>
                                    </div>

                                    <div className="col-span-2 space-y-2 border-t pt-2 border-dashed">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-sm text-gray-500 uppercase flex items-center gap-2">
                                                <Camera className="w-4 h-4" /> Evidencia de Ingreso
                                            </h4>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                accept="image/*"
                                                multiple
                                            />
                                            <button type="button" onClick={triggerFileInput} disabled={uploading} className="text-xs bg-gradient-to-r from-slate-800 to-black text-white px-2 py-1 rounded flex items-center gap-1 hover:from-black hover:to-slate-800 transition-all disabled:opacity-50">
                                                {uploading ? <Loader className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                {uploading ? 'Subiendo...' : 'Adjuntar Foto'}
                                            </button>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto min-h-[60px] p-2 bg-gray-50 rounded border border-gray-200">
                                            {formData.photosIntake.length === 0 ? <p className="text-xs text-gray-400 m-auto">Sin fotos</p> :
                                                formData.photosIntake.map((url, i) => (
                                                    <img key={i} src={buildUploadUrl(url)} className="h-14 w-14 object-cover rounded shadow-sm" />
                                                ))
                                            }
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex justify-end gap-3 mt-4">
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                                        <Button type="submit" variant="primary">Crear BOLETA DE INGRESO</Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Detail / Diagnosis Modal (Refactored) */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-in">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <div>
                                <h3 className="font-bold text-xl flex items-center gap-2">
                                    Ticket #{selectedTicket.id}
                                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {selectedTicket.deviceType}
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Creado: {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => printIntakeReceipt(selectedTicket.id)} className="text-xs flex items-center gap-1 text-gray-600 hover:text-black border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Wrench className="w-3 h-3" /> Imprimir Recibo
                                </button>
                                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Stepper */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center justify-between relative">
                                {['RECEIVED', 'DIAGNOSED', 'REPAIRING', 'READY', 'DELIVERED'].map((step, idx) => {
                                    const statusOrder = ['RECEIVED', 'DIAGNOSED', 'REPAIRING', 'READY', 'DELIVERED'];
                                    const currentIdx = statusOrder.indexOf(selectedTicket.status);
                                    const isCompleted = idx <= currentIdx;
                                    const isCurrent = idx === currentIdx;

                                    const labels = {
                                        'RECEIVED': 'Recibido', 'DIAGNOSED': 'Diagnosticado',
                                        'REPAIRING': 'En Reparación', 'READY': 'Listo', 'DELIVERED': 'Entregado'
                                    };

                                    return (
                                        <div key={step} className="flex flex-col items-center relative z-10">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${isCompleted ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                            </div>
                                            <span className={`text-[10px] mt-1 font-bold ${isCurrent ? 'text-black' : 'text-gray-400'}`}>
                                                {labels[step]}
                                            </span>
                                        </div>
                                    );
                                })}
                                {/* Progress Line */}
                                <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-0">
                                    <div
                                        className="h-full bg-black transition-all duration-500"
                                        style={{ width: `${(['RECEIVED', 'DIAGNOSED', 'REPAIRING', 'READY', 'DELIVERED'].indexOf(selectedTicket.status) / 4) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-gray-50/50">
                            {/* Left Col: Device Info & Evidence (4 cols) */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-yellow-400 rounded-full"></div>
                                        Datos del Cliente
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <label className="text-gray-400 text-xs uppercase font-bold">Cliente</label>
                                            <div className="font-medium text-gray-800">{selectedTicket.clientName}</div>
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs uppercase font-bold">Contacto</label>
                                            <div className="font-medium text-gray-800">{selectedTicket.clientPhone}</div>
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs uppercase font-bold">Equipo</label>
                                            <div className="font-medium text-gray-800">{selectedTicket.brand} {selectedTicket.model}</div>
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-xs uppercase font-bold">Serial</label>
                                            <div className="font-medium text-gray-800">{selectedTicket.serial || 'N/A'}</div>
                                        </div>
                                        <div className="pt-2 border-t mt-2">
                                            <label className="text-xs uppercase font-bold text-indigo-500 mb-1 block">Técnico Asignado</label>
                                            <select 
                                                className="w-full p-2 text-sm border border-indigo-200 rounded-lg bg-indigo-50 font-medium text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={selectedTicket.assignedTo || ""}
                                                onChange={(e) => handleAssignTech(selectedTicket.id, e.target.value)}
                                            >
                                                <option value="">-- Sin Asignar / Pendiente --</option>
                                                {technicians.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                        Problema Reportado
                                    </h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic">
                                        "{selectedTicket.issueDescription}"
                                    </p>
                                </div>

                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                                            Evidencia
                                        </div>
                                        <button onClick={triggerFileInput} className="text-xs bg-gradient-to-r from-slate-800 to-black text-white px-2 py-1 rounded hover:from-black hover:to-slate-800 transition-all">
                                            + Agregar
                                        </button>
                                    </h4>

                                    {/* Hidden Input */}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                    />

                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedTicket.photosIntake && selectedTicket.photosIntake.map((url, idx) => (
                                            <div key={idx} className="relative group aspect-square">
                                                <img src={buildUploadUrl(url)} className="w-full h-full object-cover rounded-lg border border-gray-100" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg gap-3">
                                                    <button onClick={() => window.open(buildUploadUrl(url), '_blank')} className="text-white hover:text-yellow-400 transition-colors" title="Ver original">
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleEditPhoto(url)} className="text-white hover:text-blue-400 transition-colors" title="Editar / Marcar daños">
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!selectedTicket.photosIntake || selectedTicket.photosIntake.length === 0) && (
                                            <div className="col-span-2 text-center py-4 text-gray-400 text-xs italic">
                                                Sin evidencia fotográfica
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Technical Diagnosis (8 cols) */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                        <Wrench className="w-5 h-5 text-gray-700" />
                                        Diagnóstico Técnico
                                    </h4>

                                    {/* Findings */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Hallazgos Visuales</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COMMON_FINDINGS.map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleItem('findings', item)}
                                                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${diagnosisData.findings.includes(item)
                                                        ? 'bg-gray-900 text-white border-black shadow-md'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                            <button
                                                onClick={async () => {
                                                    const val = await showPrompt({
                                                        title: 'Nuevo Hallazgo',
                                                        message: 'Ingrese el nuevo hallazgo:',
                                                        placeholder: 'Descripción del hallazgo'
                                                    });
                                                    if (val) toggleItem('findings', val);
                                                }}
                                                className="text-sm px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-black hover:border-black transition-colors"
                                            >
                                                + Otro
                                            </button>

                                            {/* Show custom findings not in common */}
                                            {diagnosisData.findings.filter(f => !COMMON_FINDINGS.includes(f)).map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleItem('findings', item)}
                                                    className="text-sm px-3 py-1.5 rounded-full border bg-gray-900 text-white border-black shadow-md"
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Recomendaciones</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COMMON_RECOMMENDATIONS.map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleItem('recommendations', item)}
                                                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${diagnosisData.recommendations.includes(item)
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                        }`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                            <button
                                                onClick={async () => {
                                                    const val = await showPrompt({
                                                        title: 'Nueva Recomendación',
                                                        message: 'Ingrese la nueva recomendación:',
                                                        placeholder: 'Descripción de la recomendación'
                                                    });
                                                    if (val) toggleItem('recommendations', val);
                                                }}
                                                className="text-sm px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-colors"
                                            >
                                                + Otro
                                            </button>
                                            {/* Show custom recs */}
                                            {diagnosisData.recommendations.filter(r => !COMMON_RECOMMENDATIONS.includes(r)).map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleItem('recommendations', item)}
                                                    className="text-sm px-3 py-1.5 rounded-full border bg-blue-600 text-white border-blue-600 shadow-md"
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Textarea */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Detalle Técnico</label>
                                        <textarea
                                            value={diagnosisData.diagnosis}
                                            onChange={e => setDiagnosisData({ ...diagnosisData, diagnosis: e.target.value })}
                                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-none bg-gray-50 text-base"
                                            rows="4"
                                            placeholder="Describe el procedimiento técnico, repuestos necesarios y observaciones..."
                                            disabled={!isAdmin}
                                        ></textarea>
                                    </div>

                                    {/* Cost & Actions */}
                                    <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Total Estimado</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={diagnosisData.estimatedCost}
                                                    onChange={e => setDiagnosisData({ ...diagnosisData, estimatedCost: e.target.value })}
                                                    className="w-full pl-8 pr-4 py-3 text-xl font-bold border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                                    placeholder="0.00"
                                                    disabled={!isAdmin}
                                                />
                                            </div>
                                        </div>

                                        {/* Status Actions */}
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                {(selectedTicket.status === 'RECEIVED' || selectedTicket.status === 'DIAGNOSED') && (
                                                    <Button onClick={handleUpdateDiagnosis} className="h-[52px] px-6">
                                                        Guardar Diagnóstico
                                                    </Button>
                                                )}
                                                {selectedTicket.status === 'DIAGNOSED' && (
                                                    <Button onClick={handleApproveRepair} className="bg-green-600 hover:bg-green-700 text-white h-[52px] px-6 rounded-lg font-bold shadow-lg shadow-green-100 flex items-center gap-2">
                                                        <CheckCircle className="w-5 h-5" /> Aprobar Reparación
                                                    </Button>
                                                )}
                                                {selectedTicket.status === 'REPAIRING' && (
                                                    <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-lg font-bold h-[52px] flex items-center">
                                                        En Proceso de Reparación...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Communication Actions */}
                                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-800">Comunicación con Cliente</h4>
                                        <p className="text-xs text-gray-500">Enviar reporte técnico y cotización</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button onClick={() => previewCustomerReport(selectedTicket.id)} variant="outline" className="text-sm">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Vista Previa
                                        </Button>
                                        <Button onClick={() => sendCustomerReport(selectedTicket)} className="bg-purple-600 hover:bg-purple-700 text-white text-sm">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Enviar por Email
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </AdminLayout>
    );
};

export default AdminTechService;
