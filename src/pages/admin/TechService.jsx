import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { ticketService } from '../../services/ticketService';
import { customerService } from '../../services/customerService';
import { 
    Plus, Wrench, CheckCircle, Clock, AlertCircle, Search, MessageSquare, 
    DollarSign, PenTool, Camera, Image, ShoppingBag, Eye, X, Send, 
    Upload, Loader, Mail, Edit2, List, LayoutGrid, Filter, Timer, 
    History, ShoppingCart, PlusCircle, Users, Trash2, ChevronRight, 
    Monitor, Smartphone, Tablet, Cpu, HardDrive, ShieldCheck, Zap,
    Printer, ClipboardCheck, Shield, Truck, MailPlus
} from 'lucide-react';
import Button from '../../components/Button';
import { useShop } from '../../context/ShopContext';
import { API_CONFIG, buildApiUrl, buildUploadUrl } from '../../config/config';
import { useAudit } from '../../context/AuditContext';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import PortalWrapper from '../../components/PortalWrapper';

// --- Sub-components ---

const StatusBadge = ({ status }) => {
    const styles = {
        RECEIVED: 'bg-slate-100 text-slate-700 border-slate-200',
        DIAGNOSED: 'bg-amber-50 text-amber-700 border-amber-200',
        REPAIRING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        DELIVERED: 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
    };
    const labels = {
        RECEIVED: 'Recepción',
        DIAGNOSED: 'Por Autorizar',
        REPAIRING: 'Operativo',
        READY: 'Control Calidad',
        DELIVERED: 'Archivado'
    };
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] border font-black uppercase tracking-widest ${styles[status] || styles.RECEIVED}`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Entrada / Pendiente</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.received}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-600 transition-transform group-hover:rotate-12 group-hover:bg-slate-900 group-hover:text-white"><AlertCircle className="w-6 h-6" /></div>
            </motion.div>
            
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Por Autorizar</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.diagnosed}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 transition-transform group-hover:rotate-12 group-hover:bg-amber-600 group-hover:text-white"><Clock className="w-6 h-6" /></div>
            </motion.div>

            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">En Operación</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.repairing}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform group-hover:rotate-12 group-hover:bg-indigo-600 group-hover:text-white"><Wrench className="w-6 h-6" /></div>
            </motion.div>

            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Control Calidad</p>
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.ready}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl text-white transition-transform group-hover:rotate-12 group-hover:bg-emerald-500 group-hover:text-white"><CheckCircle className="w-6 h-6" /></div>
            </motion.div>
        </div>
    );
};

const AdminTechService = () => {
    const statusOrder = ['RECEIVED', 'DIAGNOSED', 'REPAIRING', 'READY', 'DELIVERED'];
    const [searchParams] = useSearchParams();
    const { formatPrice: _formatPrice } = useShop();
    const { logAction } = useAudit();
    const { showConfirm, showAlert, showPrompt } = useModal();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [customers, setCustomers] = useState([]);
    
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const [searching, setSearching] = useState(false);

    // Wizard para crear ticket
    const [createStep, setCreateStep] = useState(1);
    const STEPS_MANAGE_CREATE = [
        { id: 1, title: 'Cliente', icon: Users, color: 'indigo' },
        { id: 2, title: 'Dispositivo', icon: HardDrive, color: 'amber' },
        { id: 3, title: 'Falla', icon: AlertCircle, color: 'rose' },
        { id: 4, title: 'Fotos', icon: Camera, color: 'emerald' },
        { id: 5, title: 'Confirmar', icon: CheckCircle, color: 'slate' }
    ];

    // Wizard para gestionar ticket (ciclo de vida)
    const [manageStep, setManageStep] = useState(1);
    const STEPS_MANAGE_MANAGE = [
        { id: 1, title: 'Detalles', icon: Eye, color: 'blue' },
        { id: 2, title: 'Diagnóstico', icon: Search, color: 'amber' },
        { id: 3, title: 'Reparación', icon: Wrench, color: 'purple' },
        { id: 4, title: 'Cotización', icon: DollarSign, color: 'green' },
        { id: 5, title: 'Entrega', icon: Truck, color: 'emerald' }
    ];
    const STATUS_FLOW = [
        { status: 'RECEIVED', label: 'Recibido', step: 1 },
        { status: 'DIAGNOSED', label: 'Diagnosticado', step: 2 },
        { status: 'REPAIRING', label: 'En Reparación', step: 3 },
        { status: 'READY', label: 'Listo', step: 4 },
        { status: 'DELIVERED', label: 'Entregado', step: 5 }
    ];

    const [diagnosisData, setDiagnosisData] = useState({
        diagnosis: '',
        estimatedCost: 0,
        technicianNotes: '',
        findings: [],
        recommendations: [],
        damagePhotos: [],
        laborCost: 0
    });

    const [quoteItems, setQuoteItems] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [prodSearch, setProdSearch] = useState('');
    const [isSavingQuote, setIsSavingQuote] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const COMMON_FINDINGS = ["Pantalla Rota", "Teclado Dañado", "Bisagras Rotas", "Puertos USB", "Batería Inflada", "Suciedad", "Líquido"];
    const COMMON_RECOMMENDATIONS = ["Mantenimiento Completo", "Pasta Térmica", "Limpieza", "SSD Upgrade", "RAM Upgrade", "Reinstalación OS"];
    const COMMON_CONDITIONS = ["Rayones leves", "Rayones profundos", "Pantalla partida", "Stickers", "Falta tornillería", "Sucio"];

    const [formData, setFormData] = useState({
        clientName: '', clientPhone: '', clientEmail: '', clientAddress: '', clientIdNumber: '',
        deviceType: 'Laptop', brand: '', model: '', serial: '', issueDescription: '', 
        deviceConditions: '', photosIntake: [], assignedTo: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setIsAdmin(payload.role === 'admin');
            } catch (error) {
                setIsAdmin(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchTickets();
        fetchTechnicians();
    }, []);

    useEffect(() => {
        const ticketId = searchParams.get('ticket');
        if (ticketId) {
            const ticket = tickets.find(t => t.id === parseInt(ticketId));
            if (ticket) {
                setSelectedTicket(ticket);
                setManageStep(1);
            } else {
                ticketService.getTicket(ticketId).then(ticket => {
                    if (ticket) {
                        setSelectedTicket(ticket);
                        setManageStep(1);
                    }
                });
            }
        }
    }, [searchParams, tickets]);

    const fetchTickets = async () => {
        try {
            const data = await ticketService.getTickets();
            setTickets(data);
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        const techs = await ticketService.getTechnicians();
        setTechnicians(techs);
    };

    const fetchAllProducts = async () => {
        try {
            const response = await fetch(buildApiUrl('/api/products'));
            if (response.ok) {
                const data = await response.json();
                setAvailableProducts(Array.isArray(data) ? data : (data.products || []));
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const sendReceiptEmail = async (ticketId) => {
        if (!ticketId) return;
        setSendingEmail(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/intake-receipts/${ticketId}/send-email`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            const result = await response.json();
            if (response.ok) {
                showAlert({ title: 'Enviado', message: result.message || 'Comprobante enviado por correo', type: 'success' });
            } else {
                showAlert({ title: 'Error', message: result.error || 'No se pudo enviar el correo', type: 'error' });
            }
        } catch (error) {
            console.error('Error sending email:', error);
            showAlert({ title: 'Error', message: 'Error al enviar el correo', type: 'error' });
        } finally {
            setSendingEmail(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (customerSearch.length >= 2) {
                setSearching(true);
                const results = await customerService.searchCustomers(customerSearch);
                setSearchResults(results.customers || []);
                setSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [customerSearch]);

    const handleSelectCustomer = (customer) => {
        setFormData(prev => ({
            ...prev,
            clientName: customer.name,
            clientPhone: customer.phone,
            clientEmail: customer.email || '',
            clientAddress: customer.address || '',
            clientIdNumber: customer.idNumber || ''
        }));
        setCustomerSearch(customer.name);
        setShowCustomerResults(false);
    };

    const resetForm = () => {
        setFormData({
            clientName: '', clientPhone: '', clientEmail: '', clientAddress: '', clientIdNumber: '',
            deviceType: 'Laptop', brand: '', model: '', serial: '', issueDescription: '', 
            deviceConditions: '', photosIntake: [], assignedTo: ''
        });
        setCreateStep(1);
        setCustomerSearch('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { photosIntake, pendingFiles, ...ticketData } = formData;
            const newTicket = await ticketService.createTicket(ticketData);
            logAction('CREATE_TICKET', 'Taller', `Ticket #${newTicket.id} - ${formData.clientName}`);

            if (pendingFiles && pendingFiles.length > 0) {
                const uploadFormData = new FormData();
                pendingFiles.forEach(file => uploadFormData.append('photos', file));
                await fetch(`/api/upload-evidence/${newTicket.id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                    body: uploadFormData
                });
            }

            resetForm();
            setShowForm(false);
            await fetchTickets();
            showAlert({ title: 'Ticket Creado', message: 'Orden generada exitosamente.', type: 'success' });
        } catch (error) {
            showAlert({ title: 'Error', message: error.message || 'Error al crear ticket', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const tempUrls = files.map(file => URL.createObjectURL(file));
        setFormData(prev => ({
            ...prev,
            photosIntake: [...prev.photosIntake, ...tempUrls],
            pendingFiles: [...(prev.pendingFiles || []), ...files]
        }));
    };

    const handleOpenDetail = (ticket) => {
        setSelectedTicket(ticket);
        setManageStep(1);
        let parsedFindings = [];
        let parsedRecommendations = [];
        try {
            parsedFindings = typeof ticket.findings === 'string' ? JSON.parse(ticket.findings) : (ticket.findings || []);
            parsedRecommendations = typeof ticket.recommendations === 'string' ? JSON.parse(ticket.recommendations) : (ticket.recommendations || []);
        } catch (e) {}

        setDiagnosisData({
            diagnosis: ticket.diagnosis || '',
            estimatedCost: ticket.estimatedCost || 0,
            technicianNotes: ticket.technicianNotes || '',
            findings: parsedFindings,
            recommendations: parsedRecommendations,
            damagePhotos: ticket.damagePhotos ? (typeof ticket.damagePhotos === 'string' ? JSON.parse(ticket.damagePhotos) : ticket.damagePhotos) : [],
            laborCost: ticket.laborCost || 0
        });

        let parsedQuote = [];
        try {
            parsedQuote = typeof ticket.quoteItems === 'string' ? JSON.parse(ticket.quoteItems) : (ticket.quoteItems || []);
        } catch (e) {}
        setQuoteItems(parsedQuote);
        fetchAllProducts();
    };

    const handleUpdateDiagnosis = async () => {
        if (!selectedTicket) return;
        setIsSavingQuote(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            const newDamagePhotos = diagnosisData.damagePhotos.filter(p => p.startsWith('blob:'));
            let finalDamagePhotos = diagnosisData.damagePhotos.filter(p => !p.startsWith('blob:'));
            
            if (newDamagePhotos.length > 0) {
                const formDataPhotos = new FormData();
                for (const url of newDamagePhotos) {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    formDataPhotos.append('photos', blob, `damage_${Date.now()}.jpg`);
                }
                
                const uploadResponse = await fetch(`/api/upload-damage-photos/${selectedTicket.id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formDataPhotos
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    const evidenceResponse = await fetch(buildApiUrl(`/api/tickets/${selectedTicket.id}`), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const ticketData = await evidenceResponse.json();
                    if (ticketData.damagePhotos) {
                        const savedPhotos = JSON.parse(ticketData.damagePhotos);
                        finalDamagePhotos = [...finalDamagePhotos, ...savedPhotos];
                    }
                }
            }

            const totalCost = diagnosisData.laborCost + quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0);
            
            await ticketService.updateTicket(selectedTicket.id, {
                ...diagnosisData,
                damagePhotos: JSON.stringify(finalDamagePhotos),
                status: 'DIAGNOSED',
                findings: JSON.stringify(diagnosisData.findings),
                recommendations: JSON.stringify(diagnosisData.recommendations),
                laborCost: diagnosisData.laborCost,
                estimatedCost: totalCost,
                quoteItems: quoteItems
            });
            logAction('DIAGNOSE_TICKET', 'Taller', `Diagnóstico Ticket #${selectedTicket.id}`);
            showAlert({ title: 'Guardado', message: 'Diagnóstico actualizado.', type: 'success' });
            setSelectedTicket(null);
            fetchTickets();
        } finally {
            setIsSavingQuote(false);
        }
    };

    const updateTicketStatus = async (newStatus) => {
        try {
            await ticketService.updateTicket(selectedTicket.id, { status: newStatus });
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
            fetchTickets();
            showAlert({ title: 'Estado actualizado', message: `Ticket ahora está en: ${newStatus}`, type: 'success' });
        } catch (error) {
            showAlert({ title: 'Error', message: 'No se pudo actualizar el estado', type: 'error' });
        }
    };

    const toggleItem = (listName, item) => {
        setDiagnosisData(prev => {
            const list = prev[listName];
            return {
                ...prev,
                [listName]: list.includes(item) ? list.filter(i => i !== item) : [...list, item]
            };
        });
    };

    const addProductToQuote = (prod) => {
        setQuoteItems(prev => {
            const existing = prev.find(item => item.id === prod.id);
            const next = existing 
                ? prev.map(item => item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item)
                : [...prev, { id: prod.id, name: prod.name, price: prod.price, quantity: 1 }];
            
            const total = next.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            setDiagnosisData(d => ({ ...d, estimatedCost: total }));
            return next;
        });
    };

    const removeProductFromQuote = (prodId) => {
        setQuoteItems(prev => {
            const next = prev.filter(item => item.id !== prodId);
            const total = next.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            setDiagnosisData(d => ({ ...d, estimatedCost: total }));
            return next;
        });
    };

    const getSLAStatus = (createdAt, assignedTo) => {
        if (assignedTo) return { color: 'text-emerald-500', label: 'Asignado', icon: 'check' };
        const hrs = (new Date() - new Date(createdAt)) / 36e5;
        if (hrs >= 24) return { color: 'text-red-500', label: 'Vencido', icon: 'alert' };
        if (hrs >= 20) return { color: 'text-amber-500', label: 'Urgente', icon: 'clock' };
        return { color: 'text-indigo-500', label: `ANS: ${Math.ceil(24 - hrs)}h`, icon: 'timer' };
    };

    const filteredTickets = tickets.filter(t => 
        t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id.toString().includes(searchTerm)
    );

    const columns = [
        { id: 'RECEIVED', label: 'Recepción', color: 'slate', tickets: filteredTickets.filter(t => t.status === 'RECEIVED') },
        { id: 'DIAGNOSED', label: 'Por Autorizar', color: 'amber', tickets: filteredTickets.filter(t => t.status === 'DIAGNOSED') },
        { id: 'REPAIRING', label: 'En Operación', color: 'indigo', tickets: filteredTickets.filter(t => t.status === 'REPAIRING') },
        { id: 'READY', label: 'Listo para Entrega', color: 'emerald', tickets: filteredTickets.filter(t => t.status === 'READY') }
    ];

    return (
        <AdminLayout title="Centro de Servicios Técnicos">
            <div className="space-y-8 pb-32">
                <DashboardMetrics tickets={tickets} />

                {/* Toolbar */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] p-8 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex bg-slate-100/50 p-2 rounded-2xl border border-slate-100">
                        <button onClick={() => setViewMode('list')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                            <List className="w-4 h-4 inline-block mr-2" /> Listado
                        </button>
                        <button onClick={() => setViewMode('kanban')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                            <LayoutGrid className="w-4 h-4 inline-block mr-2" /> Kanban
                        </button>
                    </div>

                    <div className="flex-1 max-w-2xl relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar por ID, Cliente o Serial..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-16 bg-slate-50 border border-slate-100 rounded-[2rem] pl-16 pr-8 text-sm font-bold text-slate-900 focus:ring-[12px] focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all outline-none"
                        />
                    </div>

                    <button 
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="h-16 px-10 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        Ingresar Equipo
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="relative min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {viewMode === 'list' ? (
                            <motion.div 
                                key="list"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="bg-white/70 backdrop-blur-2xl rounded-[3.5rem] border border-white shadow-2xl overflow-hidden"
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 border-b border-slate-100">
                                                <th className="p-8">Identificador</th>
                                                <th className="p-8">Estado SLA</th>
                                                <th className="p-8">Cliente & OEM</th>
                                                <th className="p-8">Fase Operativa</th>
                                                <th className="p-8 text-right">Comandos</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredTickets.map((t, i) => {
                                                const sla = getSLAStatus(t.createdAt, t.assignedTo);
                                                return (
                                                    <motion.tr 
                                                        key={t.id} 
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        onClick={() => handleOpenDetail(t)}
                                                        className="hover:bg-indigo-50/10 cursor-pointer group transition-all"
                                                    >
                                                        <td className="p-8 font-mono font-black text-slate-400 group-hover:text-slate-900">
                                                            #{t.id.toString().padStart(5, '0')}
                                                        </td>
                                                        <td className="p-8">
                                                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${sla.color}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(0,0,0,0.2)]`}></div>
                                                                {sla.label}
                                                            </div>
                                                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{new Date(t.createdAt).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="p-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                                    {t.deviceType === 'Smartphone' ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-slate-900 tracking-tight text-sm leading-none mb-1">{t.clientName}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.brand} {t.model}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <StatusBadge status={t.status} />
                                                        </td>
                                                        <td className="p-8 text-right">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all ml-auto shadow-sm">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="kanban"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-8 overflow-x-auto pb-12 custom-scrollbar h-full items-start"
                            >
                                {columns.map(col => (
                                    <div key={col.id} className="flex-1 min-w-[340px] flex flex-col h-full bg-slate-50/50 p-6 rounded-[3rem] border border-slate-100/50">
                                        <div className="flex items-center justify-between mb-8 px-2">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full bg-${col.color}-500 shadow-xl`}></div>
                                                {col.label}
                                            </h3>
                                            <span className="text-[10px] font-black bg-white text-slate-900 px-3 py-1 rounded-xl shadow-sm border border-slate-100">
                                                {col.tickets.length}
                                            </span>
                                        </div>

                                        <div className="space-y-6">
                                            {col.tickets.map(t => (
                                                <motion.div
                                                    layout
                                                    key={t.id}
                                                    onClick={() => handleOpenDetail(t)}
                                                    className="bg-white p-6 rounded-[2.5rem] border border-white shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all cursor-pointer group relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-black text-slate-300 group-hover:text-slate-900 transition-colors uppercase tracking-widest">#{t.id}</span>
                                                        <Zap className={`w-4 h-4 ${getSLAStatus(t.createdAt, t.assignedTo).color}`} />
                                                    </div>
                                                    <h4 className="font-black text-slate-900 text-sm tracking-tight mb-1 truncate">{t.clientName}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{t.brand} • {t.model}</p>
                                                    
                                                    <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                                        <div className="flex -space-x-3">
                                                            {t.assignedTo ? (
                                                                <div className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                                                    {technicians.find(tech => tech.id === parseInt(t.assignedTo))?.name.substring(0, 2).toUpperCase()}
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center text-slate-300">
                                                                    <PenTool className="w-4 h-4" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                                            <ChevronRight className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Modals */}
                <PortalWrapper isOpen={showForm}>
                    {showForm && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-xl">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                className="bg-white/90 backdrop-blur-2xl rounded-[3.5rem] w-full max-w-6xl shadow-[0_32px_128px_rgba(0,0,0,0.3)] overflow-hidden max-h-[95vh] flex flex-col relative border border-white"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-[0_12px_24px_rgba(79,70,229,0.4)]">
                                            <PenTool className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Command: Intake</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">Industrial Device Reception Terminal</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowForm(false)} className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-slate-100">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
                                    {/* Step Indicator */}
                                    <div className="flex items-center justify-center mb-12">
                                        {STEPS_MANAGE_CREATE.map((step, idx) => {
                                            const isActive = createStep === step.id;
                                            const isCompleted = createStep > step.id;
                                            const colors = {
                                                indigo: { bg: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-100' },
                                                amber: { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-100' },
                                                rose: { bg: 'bg-rose-500', text: 'text-rose-500', ring: 'ring-rose-100' },
                                                emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-100' },
                                                slate: { bg: 'bg-slate-600', text: 'text-slate-600', ring: 'ring-slate-100' }
                                            };
                                            const c = colors[step.color];
                                            return (
                                                <div key={step.id} className="flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreateStep(step.id)}
                                                        className={`relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all ${isActive ? `${c.bg} text-white shadow-lg shadow-${step.color}-500/30` : isCompleted ? `${c.bg} text-white` : 'bg-slate-100 text-slate-400'}`}
                                                    >
                                                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                                                    </button>
                                                    {idx < STEPS_MANAGE_CREATE.length - 1 && (
                                                        <div className={`w-16 h-1 mx-2 rounded-full ${isCompleted ? c.bg : 'bg-slate-100'}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Step Content */}
                                    <div className="max-w-4xl mx-auto">
                                        {createStep === 1 && (
                                            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                                                <h4 className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                    <Users className="w-5 h-5" /> Paso 1: Datos del Cliente
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="relative">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Buscar Cliente</label>
                                                        <input 
                                                            value={customerSearch} 
                                                            onChange={e => {setCustomerSearch(e.target.value); setFormData({...formData, clientName: e.target.value}); setShowCustomerResults(true);}}
                                                            onFocus={() => setShowCustomerResults(true)}
                                                            placeholder="Nombre o teléfono..."
                                                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-indigo-600 outline-none"
                                                        />
                                                        <Search className="absolute right-4 top-10 w-4 h-4 text-slate-300" />
                                                        {showCustomerResults && customerSearch.length >= 2 && (
                                                            <div className="absolute z-[100] w-full bg-white rounded-xl shadow-lg mt-1 border border-slate-100 max-h-48 overflow-y-auto">
                                                                {searchResults.map(c => (
                                                                    <button key={c.id} onClick={() => {handleSelectCustomer(c); setCustomerSearch(c.name);}} type="button" className="w-full p-3 text-left hover:bg-slate-50 text-sm">
                                                                        <div className="font-bold">{c.name}</div>
                                                                        <div className="text-xs text-slate-400">{c.phone}</div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Teléfono</label>
                                                        <input 
                                                            value={formData.clientPhone} 
                                                            onChange={e => setFormData({...formData, clientPhone: e.target.value})}
                                                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold focus:border-indigo-600 outline-none"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email (opcional)</label>
                                                        <input 
                                                            value={formData.clientEmail} 
                                                            onChange={e => setFormData({...formData, clientEmail: e.target.value})}
                                                            placeholder="email@ejemplo.com"
                                                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm focus:border-indigo-600 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-6">
                                                    <button type="button" onClick={() => { if(formData.clientName && formData.clientPhone) setCreateStep(2); }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Siguiente: Dispositivo →</button>
                                                </div>
                                            </div>
                                        )}

                                        {createStep === 2 && (
                                            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                                                <h4 className="text-[12px] font-black text-amber-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                    <HardDrive className="w-5 h-5" /> Paso 2: Datos del Dispositivo
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Tipo de Dispositivo</label>
                                                        <select className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold" value={formData.deviceType} onChange={e => setFormData({...formData, deviceType: e.target.value})}>
                                                            <option>Laptop</option>
                                                            <option>Desktop</option>
                                                            <option>Smartphone</option>
                                                            <option>Tablet</option>
                                                            <option>Consola</option>
                                                            <option>Monitor</option>
                                                            <option>Impresora</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Marca</label>
                                                        <input placeholder="Ej: Dell, HP, Lenovo..." value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Modelo</label>
                                                        <input placeholder="Modelo específico..." value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Número de Serie</label>
                                                        <input placeholder="Serial del equipo..." value={formData.serial} onChange={e => setFormData({...formData, serial: e.target.value})} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Condición Visual</label>
                                                        <select className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm" value={formData.deviceConditions} onChange={e => setFormData({...formData, deviceConditions: e.target.value})}>
                                                            <option value="">Seleccionar condición...</option>
                                                            <option>Nuevo / Sin uso</option>
                                                            <option>Bueno - Rayones leves</option>
                                                            <option>Regular - Rayones profundos</option>
                                                            <option>Dañado - Golpes visibles</option>
                                                            <option>Para reparación</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between mt-6">
                                                    <button type="button" onClick={() => setCreateStep(1)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                    <button type="button" onClick={() => { if(formData.deviceType && formData.brand) setCreateStep(3); }} className="px-8 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm">Siguiente: Falla →</button>
                                                </div>
                                            </div>
                                        )}

                                        {createStep === 3 && (
                                            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                                                <h4 className="text-[12px] font-black text-rose-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                    <AlertCircle className="w-5 h-5" /> Paso 3: Reporte de Falla
                                                </h4>
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Describe el problema reportado por el cliente</label>
                                                        <textarea 
                                                            rows={4}
                                                            placeholder="El cliente reporta que el equipo no enciende, pantalla azul, lento, etc..."
                                                            value={formData.issueDescription} 
                                                            onChange={e => setFormData({...formData, issueDescription: e.target.value})}
                                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold focus:border-rose-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Técnico Asignado</label>
                                                        <select className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                                                            <option value="">Sin asignar</option>
                                                            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between mt-6">
                                                    <button type="button" onClick={() => setCreateStep(2)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                    <button type="button" onClick={() => { if(formData.issueDescription) setCreateStep(4); }} className="px-8 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm">Siguiente: Fotos →</button>
                                                </div>
                                            </div>
                                        )}

                                        {createStep === 4 && (
                                            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                                                <h4 className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                    <Camera className="w-5 h-5" /> Paso 4: Fotos de Evidencia
                                                </h4>
                                                <p className="text-sm text-slate-500 mb-6">Sube fotos del estado actual del equipo (opcional pero recomendado)</p>
                                                <div className="grid grid-cols-4 gap-4 mb-6">
                                                    <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all">
                                                        <Camera className="w-8 h-8" />
                                                        <span className="text-[10px] font-bold mt-2">Agregar</span>
                                                    </button>
                                                    {formData.photosIntake.map((url, i) => (
                                                        <div key={i} className="aspect-square rounded-xl overflow-hidden relative">
                                                            <img src={url} className="w-full h-full object-cover" />
                                                            <button onClick={() => setFormData(prev => ({...prev, photosIntake: prev.photosIntake.filter((_,idx) => idx !== i)}))} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                                                        </div>
                                                    ))}
                                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*" />
                                                </div>
                                                <div className="flex justify-between mt-6">
                                                    <button type="button" onClick={() => setCreateStep(3)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                    <button type="button" onClick={() => setCreateStep(5)} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm">Siguiente: Confirmar →</button>
                                                </div>
                                            </div>
                                        )}

                                        {createStep === 5 && (
                                            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                                                <h4 className="text-[12px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                    <CheckCircle className="w-5 h-5" /> Paso 5: Confirmar Información
                                                </h4>
                                                <div className="bg-slate-50 p-6 rounded-xl space-y-4 text-sm">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div><span className="text-slate-400 font-bold">Cliente:</span> <span className="font-bold">{formData.clientName}</span></div>
                                                        <div><span className="text-slate-400 font-bold">Teléfono:</span> <span className="font-bold">{formData.clientPhone}</span></div>
                                                        <div><span className="text-slate-400 font-bold">Dispositivo:</span> <span className="font-bold">{formData.deviceType} {formData.brand}</span></div>
                                                        <div><span className="text-slate-400 font-bold">Modelo:</span> <span className="font-bold">{formData.model || 'N/A'}</span></div>
                                                    </div>
                                                    <div><span className="text-slate-400 font-bold">Falla:</span> <span className="font-bold">{formData.issueDescription}</span></div>
                                                    <div><span className="text-slate-400 font-bold">Fotos:</span> <span className="font-bold">{formData.photosIntake.length} imágenes</span></div>
                                                </div>
                                                <div className="flex justify-between mt-6">
                                                    <button type="button" onClick={() => setCreateStep(4)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                    <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black">CREAR TICKET</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                </motion.div>
                        </div>
                    )}
                </PortalWrapper>

                <PortalWrapper isOpen={selectedTicket !== null}>
                    {selectedTicket && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-slate-900/80 backdrop-blur-xl">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 50 }}
                                className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative border border-slate-200"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                                            <HardDrive className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-900">Ticket #{selectedTicket.id}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusBadge status={selectedTicket.status} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => sendReceiptEmail(selectedTicket.id)} 
                                            disabled={sendingEmail}
                                            className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50" 
                                            title={sendingEmail ? 'Enviando...' : 'Enviar por email'}
                                        >
                                            {sendingEmail ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                                        </button>
                                        <button onClick={() => {
                                            const token = localStorage.getItem('adminToken');
                                            window.open(buildApiUrl(`/api/intake-receipts/${selectedTicket.id}/preview?token=${token}`), '_blank');
                                        }} className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all" title="Vista previa">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => {
                                            const token = localStorage.getItem('adminToken');
                                            window.open(buildApiUrl(`/api/customer-reports/${selectedTicket.id}/preview?token=${token}`), '_blank');
                                        }} className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white transition-all" title="Reporte Técnico HTML">
                                            <Image className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => {
                                            const token = localStorage.getItem('adminToken');
                                            window.open(buildApiUrl(`/api/intake-receipts/${selectedTicket.id}/pdf?token=${token}`), '_blank');
                                        }} className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all" title="Imprimir">
                                            <Printer className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setSelectedTicket(null)} className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Wizard Step Indicator */}
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center justify-between max-w-3xl mx-auto">
                                        {STEPS_MANAGE_MANAGE.map((step, idx) => {
                                            const currentStatusStep = STATUS_FLOW.find(s => s.status === selectedTicket.status)?.step || 1;
                                            const isActive = manageStep === step.id;
                                            const isCompleted = currentStatusStep > step.id;
                                            const isCurrentStep = currentStatusStep === step.id;
                                            
                                            const colors = {
                                                blue: { bg: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-100' },
                                                amber: { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-100' },
                                                purple: { bg: 'bg-purple-500', text: 'text-purple-500', ring: 'ring-purple-100' },
                                                green: { bg: 'bg-green-500', text: 'text-green-500', ring: 'ring-green-100' },
                                                emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-100' }
                                            };
                                            const c = colors[step.color];
                                            
                                            return (
                                                <div key={step.id} className="flex items-center flex-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setManageStep(step.id)}
                                                        className={`flex flex-col items-center gap-1 ${isCurrentStep ? 'flex-1' : ''}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${isActive ? `${c.bg} text-white shadow-lg` : isCompleted ? `${c.bg} text-white` : 'bg-slate-200 text-slate-400'}`}>
                                                            {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</span>
                                                    </button>
                                                    {idx < STEPS_MANAGE_MANAGE.length - 1 && (
                                                        <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? c.bg : 'bg-slate-200'}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                                    {manageStep === 1 && (
                                        <div className="space-y-6">
                                            {/* Info Cliente y Dispositivo */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Cliente</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-xs text-slate-500">Nombre</span>
                                                            <span className="text-sm font-bold">{selectedTicket.clientName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-xs text-slate-500">Teléfono</span>
                                                            <span className="text-sm font-bold">{selectedTicket.clientPhone}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-xs text-slate-500">Email</span>
                                                            <span className="text-sm font-bold">{selectedTicket.clientEmail || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Dispositivo</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between">
                                                            <span className="text-xs text-slate-500">Tipo</span>
                                                            <span className="text-sm font-bold">{selectedTicket.deviceType}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-xs text-slate-500">Marca</span>
                                                            <span className="text-sm font-bold">{selectedTicket.brand}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-xs text-slate-500">Modelo</span>
                                                            <span className="text-sm font-bold">{selectedTicket.model || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-xs text-slate-500">Serial</span>
                                                            <span className="text-sm font-bold">{selectedTicket.serial || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Reporte Falla */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Falla Reportada</h4>
                                                <p className="text-sm font-medium text-slate-700">{selectedTicket.issueDescription}</p>
                                            </div>

                                            {/* Acciones Step 1 */}
                                            <div className="flex justify-end gap-3">
                                                {selectedTicket.status === 'RECEIVED' && (
                                                    <button onClick={() => updateTicketStatus('DIAGNOSED')} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm">
                                                        PasAR A DIAGNÓSTICO →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 2 && (
                                        <div className="space-y-6">
                                            {/* Diagnóstico */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-amber-600 uppercase mb-4 flex items-center gap-2">
                                                    <Search className="w-4 h-4" /> Diagnóstico Técnico
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hallazgos</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {COMMON_FINDINGS.map(item => (
                                                                <button key={item} onClick={() => toggleItem('findings', item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${diagnosisData.findings.includes(item) ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                                    {item}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Recomendaciones</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {COMMON_RECOMMENDATIONS.map(item => (
                                                                <button key={item} onClick={() => toggleItem('recommendations', item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${diagnosisData.recommendations.includes(item) ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                                    {item}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Notas del Técnico</label>
                                                        <textarea rows={3} value={diagnosisData.technicianNotes} onChange={e => setDiagnosisData(prev => ({...prev, technicianNotes: e.target.value}))} className="w-full p-3 border border-slate-100 rounded-xl text-sm" placeholder="Notas privadas..." />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Diagnóstico Oficial</label>
                                                        <textarea rows={2} value={diagnosisData.diagnosis} onChange={e => setDiagnosisData(prev => ({...prev, diagnosis: e.target.value}))} className="w-full p-3 border border-slate-100 rounded-xl text-sm" placeholder="Diagnóstico para el cliente..." />
                                                    </div>
                                                </div>

                                                {/* Fotos del Daño */}
                                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                    <h4 className="text-xs font-bold text-red-600 uppercase mb-3 flex items-center gap-2">
                                                        <Camera className="w-4 h-4" /> Fotos del Daño / Falla
                                                    </h4>
                                                    <div className="flex gap-3 mb-3">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            multiple
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files);
                                                                const newPhotos = files.map(f => URL.createObjectURL(f));
                                                                setDiagnosisData(prev => ({...prev, damagePhotos: [...prev.damagePhotos, ...newPhotos]}));
                                                            }}
                                                            className="hidden"
                                                            id="damage-photos"
                                                        />
                                                        <label htmlFor="damage-photos" className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-red-600">
                                                            + Agregar Fotos
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {diagnosisData.damagePhotos.map((url, i) => (
                                                            <div key={i} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                                                <img src={url} alt="Daño" className="w-full h-full object-cover" />
                                                                <button 
                                                                    onClick={() => setDiagnosisData(prev => ({...prev, damagePhotos: prev.damagePhotos.filter((_, idx) => idx !== i)}))}
                                                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                                                                >×</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {diagnosisData.damagePhotos.length === 0 && (
                                                        <p className="text-xs text-slate-400">Adjunte fotos del daño o falla encontrada</p>
                                                    )}
                                                </div>

                                                {/* Mano de Obra */}
                                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                    <h4 className="text-xs font-bold text-amber-600 uppercase mb-3 flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4" /> Mano de Obra
                                                    </h4>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-slate-600">Valor:</span>
                                                        <input 
                                                            type="number" 
                                                            value={diagnosisData.laborCost}
                                                            onChange={(e) => setDiagnosisData(prev => ({...prev, laborCost: parseInt(e.target.value) || 0}))}
                                                            className="flex-1 h-10 px-3 border border-amber-200 rounded-lg text-sm font-bold"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones Step 2 */}
                                            <div className="flex justify-between gap-3">
                                                <button onClick={() => setManageStep(1)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                {selectedTicket.status === 'DIAGNOSED' && (
                                                    <button onClick={() => { handleUpdateDiagnosis(); updateTicketStatus('REPAIRING'); }} className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm">
                                                        PASAR A REPARACIÓN →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 3 && (
                                        <div className="space-y-6">
                                            {/* Reparación */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-purple-600 uppercase mb-4 flex items-center gap-2">
                                                    <Wrench className="w-4 h-4" /> Proceso de Reparación
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="bg-purple-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-purple-600 uppercase mb-2">Estado Actual</p>
                                                        <p className="text-sm font-medium">{selectedTicket.status === 'REPAIRING' ? 'Equipo en reparación' : 'Esperando inicio'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Agregar Nota de Reparación</label>
                                                        <textarea rows={3} className="w-full p-3 border border-slate-100 rounded-xl text-sm" placeholder="Describir trabajos realizados..." />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones Step 3 */}
                                            <div className="flex justify-between gap-3">
                                                <button onClick={() => setManageStep(2)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                {selectedTicket.status === 'REPAIRING' && (
                                                    <button onClick={() => updateTicketStatus('READY')} className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-sm">
                                                        MARCAR LISTO PARA ENTREGA →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 4 && (
                                        <div className="space-y-6">
                                            {/* Cotización */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-green-600 uppercase mb-4 flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" /> Cotización y Repuestos
                                                </h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Costo Estimado</label>
                                                        <input 
                                                            type="number" 
                                                            value={diagnosisData.estimatedCost}
                                                            onChange={e => setDiagnosisData(prev => ({...prev, estimatedCost: Number(e.target.value)}))}
                                                            className="w-full p-3 border border-slate-100 rounded-xl text-lg font-bold"
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                                        <span className="text-sm font-bold">Total Repuestos</span>
                                                        <span className="text-lg font-bold text-green-600">${quoteItems.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}</span>
                                                    </div>
                                                    {quoteItems.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-bold text-slate-400 uppercase">Repuestos</p>
                                                            {quoteItems.map(item => (
                                                                <div key={item.id} className="flex justify-between text-sm">
                                                                    <span>{item.name} x{item.quantity}</span>
                                                                    <span className="font-bold">${(item.price * item.quantity).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Acciones Step 4 */}
                                            <div className="flex justify-between gap-3">
                                                <button onClick={() => setManageStep(3)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                <button onClick={handleUpdateDiagnosis} className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-sm">
                                                    GUARDAR COTIZACIÓN
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 5 && (
                                        <div className="space-y-6">
                                            {/* Entrega */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-emerald-600 uppercase mb-4 flex items-center gap-2">
                                                    <Truck className="w-4 h-4" /> Entrega del Equipo
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="bg-emerald-50 p-4 rounded-xl">
                                                        <p className="text-sm font-bold text-emerald-700">Resumen del Servicio</p>
                                                        <div className="mt-2 space-y-1 text-sm">
                                                            <p><span className="text-slate-500">Diagnóstico:</span> {diagnosisData.diagnosis || 'N/A'}</p>
                                                            <p><span className="text-slate-500">Costo Total:</span> <span className="font-bold">${(diagnosisData.estimatedCost + quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0)).toLocaleString()}</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones Step 5 */}
                                            <div className="flex justify-between gap-3">
                                                <button onClick={() => setManageStep(4)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                <div className="flex gap-3">
                                                    <button onClick={() => showConfirm({ title: 'WhatsApp', message: 'Enviar notificación al cliente', variant: 'info' })} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center gap-2">
                                                        <MessageSquare className="w-4 h-4" /> Notificar
                                                    </button>
                                                    {selectedTicket.status !== 'DELIVERED' && (
                                                        <button onClick={() => updateTicketStatus('DELIVERED')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">
                                                            FINALIZAR Y ENTREGAR ✓
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </PortalWrapper>
            </div>
        </AdminLayout>
    );
};

export default AdminTechService;
