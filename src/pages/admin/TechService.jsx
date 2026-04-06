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
    Printer, ClipboardCheck, Shield, Truck, MailPlus, Lock as LockIcon
} from 'lucide-react';
import Button from '../../components/Button';
import { API_CONFIG, buildApiUrl } from '../../config/config';
import { useAudit } from '../../context/AuditContext';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import PortalWrapper from '../../components/PortalWrapper';
import SignaturePad from '../../components/SignaturePad';

// --- Sub-components ---

const StatusBadge = ({ status }) => {
    const styles = {
        RECEIVED: 'bg-slate-100 text-slate-700 border-slate-200',
        DIAGNOSED: 'bg-amber-50 text-amber-700 border-amber-200',
        QUOTED: 'bg-blue-50 text-blue-700 border-blue-200',
        AUTHORIZED: 'bg-purple-50 text-purple-700 border-purple-200',
        REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
        REPAIRING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        DELIVERED: 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
    };
    const labels = {
        RECEIVED: 'Recepción',
        DIAGNOSED: 'Diagnosticado',
        QUOTED: 'Cotizado',
        AUTHORIZED: 'Autorizado',
        REJECTED: 'Rechazado',
        REPAIRING: 'En Reparación',
        READY: 'Listo',
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
        quoted: tickets.filter(t => t.status === 'QUOTED').length,
        authorized: tickets.filter(t => t.status === 'AUTHORIZED').length,
        repairing: tickets.filter(t => t.status === 'REPAIRING').length,
        ready: tickets.filter(t => t.status === 'READY').length
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Recepción</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.received}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-2xl text-slate-600 transition-transform group-hover:rotate-12 group-hover:bg-slate-900 group-hover:text-white"><AlertCircle className="w-6 h-6" /></div>
            </motion.div>
            
            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Diagnóstico</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.diagnosed}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 transition-transform group-hover:rotate-12 group-hover:bg-amber-600 group-hover:text-white"><Clock className="w-6 h-6" /></div>
            </motion.div>

            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Cotización</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.quoted}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 transition-transform group-hover:rotate-12 group-hover:bg-blue-600 group-hover:text-white"><DollarSign className="w-6 h-6" /></div>
            </motion.div>

            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-1">Autorización</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.authorized}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 transition-transform group-hover:rotate-12 group-hover:bg-purple-600 group-hover:text-white"><CheckCircle className="w-6 h-6" /></div>
            </motion.div>

            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-sm flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">Reparación</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.repairing}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 transition-transform group-hover:rotate-12 group-hover:bg-indigo-600 group-hover:text-white"><Wrench className="w-6 h-6" /></div>
            </motion.div>

            <motion.div 
                whileHover={{ y: -5 }}
                className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl flex items-center justify-between group"
            >
                <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Listo Entrega</p>
                    <p className="text-3xl font-black text-white tracking-tighter">{stats.ready}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl text-white transition-transform group-hover:rotate-12 group-hover:bg-emerald-500 group-hover:text-white"><Truck className="w-6 h-6" /></div>
            </motion.div>
        </div>
    );
};

const AdminTechService = () => {
    const _statusOrder = ['RECEIVED', 'DIAGNOSED', 'REPAIRING', 'READY', 'DELIVERED'];
    const [searchParams] = useSearchParams();
    // const formatPrice = (p) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p);
    const { showConfirm, showAlert, showPrompt: _showPrompt } = useModal();
    const { logAction } = useAudit();
    const [tickets, setTickets] = useState([]);
    const [_loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isNewCreation, setIsNewCreation] = useState(true);
    const [viewMode, setViewMode] = useState('list');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [_isAdmin, setIsAdmin] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [_customers, _setCustomers] = useState([]);
    
    const [customerSearch, setCustomerSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const [_searching, _setSearching] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // active | history

    // Wizard para crear ticket
    const [createStep, setCreateStep] = useState(1);
    const [savedCreateStep, setSavedCreateStep] = useState(1);
    const [savedFormData, setSavedFormData] = useState(null);
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
        { id: 3, title: 'Cotización', icon: DollarSign, color: 'green' },
        { id: 4, title: 'Autorización', icon: CheckCircle, color: 'purple' },
        { id: 5, title: 'Reparación', icon: Wrench, color: 'indigo' },
        { id: 6, title: 'Entrega', icon: Truck, color: 'emerald' }
    ];
    const STATUS_FLOW = [
        { status: 'RECEIVED', label: 'Recibido', step: 1 },
        { status: 'DIAGNOSED', label: 'Diagnosticado', step: 2 },
        { status: 'QUOTED', label: 'Cotizado', step: 3 },
        { status: 'AUTHORIZED', label: 'Autorizado', step: 4 },
        { status: 'REJECTED', label: 'Rechazado', step: 4 },
        { status: 'REPAIRING', label: 'En Reparación', step: 5 },
        { status: 'READY', label: 'Listo', step: 6 },
        { status: 'DELIVERED', label: 'Entregado', step: 7 }
    ];

    const [diagnosisData, setDiagnosisData] = useState({
        diagnosis: '',
        estimatedCost: 0,
        technicianNotes: '',
        findings: [],
        recommendations: [],
        damagePhotos: [],
        laborItems: [],
        repairNotes: '',
        estimatedDeliveryDate: ''
    });

    const [quoteItems, setQuoteItems] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [prodSearch, setProdSearch] = useState('');
    const [_isSavingQuote, setIsSavingQuote] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [_uploading, _setUploading] = useState(false);
    const fileInputRef = useRef(null);
    
    const [warrantyPreview, setWarrantyPreview] = useState(null);
    const [warrantySettings, setWarrantySettings] = useState({ laborDays: 30, partsDays: 90 });
    const [autoSendIntake, setAutoSendIntake] = useState(false);
    const [autoSendReport, setAutoSendReport] = useState(false);

    const COMMON_FINDINGS = ["Pantalla Rota", "Teclado Dañado", "Bisagras Rotas", "Puertos USB", "Batería Inflada", "Suciedad", "Líquido"];
    const COMMON_RECOMMENDATIONS = ["Mantenimiento Completo", "Pasta Térmica", "Limpieza", "SSD Upgrade", "RAM Upgrade", "Reinstalación OS"];
    const COMMON_CONDITIONS = ["Rayones leves", "Rayones profundos", "Pantalla partida", "Stickers", "Falta tornillería", "Sucio"];
    const [customFinding, setCustomFinding] = useState('');
    const [customRecommendation, setCustomRecommendation] = useState('');
    const [customFindingsList, setCustomFindingsList] = useState([]);
    const [customRecommendationsList, setCustomRecommendationsList] = useState([]);

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
        loadCustomFindings();
    }, []);

    const loadCustomFindings = async () => {
        const findings = await ticketService.getCustomFindings('finding');
        const recommendations = await ticketService.getCustomFindings('recommendation');
        setCustomFindingsList(findings.map(f => f.value));
        setCustomRecommendationsList(recommendations.map(r => r.value));
    };

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

    const sendDocument = async (ticketId, type = 'intake') => {
        setSendingEmail(true);
        try {
            const token = localStorage.getItem('adminToken');
            let endpoint = '';
            if (type === 'intake') endpoint = `/api/intake-receipts/${ticketId}/send-email`;
            else if (type === 'report') endpoint = `/api/customer-reports/${ticketId}/send`;
            else if (type === 'delivery') endpoint = `/api/delivery-receipts/${ticketId}/send-email`;

            const response = await fetch(buildApiUrl(endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({})
            });
            const result = await response.json();
            if (response.ok) {
                showAlert({ title: 'Documento Enviado', message: result.message || 'El documento ha sido enviado correctamente por correo.', type: 'success' });
            } else {
                showAlert({ title: 'Error de Envío', message: result.error || 'No se pudo enviar el documento.', type: 'error' });
            }
        } catch (error) {
            console.error('Error sending document:', error);
            showAlert({ title: 'Error Fatal', message: 'Error de conexión al enviar el documento.', type: 'error' });
        } finally {
            setSendingEmail(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (customerSearch.length >= 2) {
                _setSearching(true);
                const results = await customerService.searchCustomers(customerSearch);
                setSearchResults(results.customers || []);
                _setSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [customerSearch]);

    useEffect(() => {
        if (manageStep === 6 && selectedTicket) {
            loadWarrantyPreview();
        }
    }, [manageStep, selectedTicket]);

    const loadWarrantyPreview = async () => {
        if (!selectedTicket) return;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(buildApiUrl(`/api/tickets/${selectedTicket.id}/warranty-preview`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const preview = await response.json();
                setWarrantyPreview(preview);
                setWarrantySettings({
                    laborDays: preview.laborWarrantyDays || 30,
                    partsDays: preview.partsWarrantyDays || 90
                });
            }
        } catch (error) {
            console.error('Error loading warranty preview:', error);
        }
    };

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

    const _handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { pendingFiles, ...ticketData } = formData;
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
            setSavedFormData(null);
            setSavedCreateStep(1);
            setIsNewCreation(true);
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

    const parseTicketData = (ticket) => {
        let parsedFindings = [];
        let parsedRecommendations = [];
        try {
            parsedFindings = typeof ticket.findings === 'string' ? JSON.parse(ticket.findings) : (ticket.findings || []);
            parsedRecommendations = typeof ticket.recommendations === 'string' ? JSON.parse(ticket.recommendations) : (ticket.recommendations || []);
        } catch (e) { /* error silenciado */ }

        let parsedLaborItems = [];
        if (ticket.laborItems) {
            try {
                parsedLaborItems = typeof ticket.laborItems === 'string' ? JSON.parse(ticket.laborItems) : ticket.laborItems;
            } catch (e) {
                if (ticket.laborCost) {
                    parsedLaborItems = [{ description: ticket.laborDescription || 'Mano de Obra', price: ticket.laborCost }];
                }
            }
        } else if (ticket.laborCost) {
            parsedLaborItems = [{ description: ticket.laborDescription || 'Mano de Obra', price: ticket.laborCost }];
        }

        let parsedQuote = [];
        try {
            parsedQuote = typeof ticket.quoteItems === 'string' ? JSON.parse(ticket.quoteItems) : (ticket.quoteItems || []);
        } catch (e) { /* error silenciado */ }

        return {
            diagnosis: {
                diagnosis: ticket.diagnosis || '',
                estimatedCost: ticket.estimatedCost || 0,
                technicianNotes: ticket.technicianNotes || '',
                findings: parsedFindings,
                recommendations: parsedRecommendations,
                damagePhotos: ticket.damagePhotos ? (typeof ticket.damagePhotos === 'string' ? JSON.parse(ticket.damagePhotos) : ticket.damagePhotos) : [],
                laborItems: parsedLaborItems,
                repairNotes: ticket.repairNotes || '',
                estimatedDeliveryDate: ticket.estimatedDeliveryDate || ''
            },
            quote: parsedQuote
        };
    };

    const handleOpenDetail = async (ticket) => {
        // Carga inicial rápida con datos de la lista
        setSelectedTicket(ticket);
        setManageStep(1);
        
        const data = parseTicketData(ticket);
        setDiagnosisData(data.diagnosis);
        setQuoteItems(data.quote);
        fetchAllProducts();

        // Carga profunda para obtener datos pesados como firmas Base64
        try {
            const fullTicket = await ticketService.getTicket(ticket.id);
            if (fullTicket) {
                setSelectedTicket(fullTicket);
                const fullData = parseTicketData(fullTicket);
                setDiagnosisData(fullData.diagnosis);
                setQuoteItems(fullData.quote);
            }
        } catch (error) {
            console.error('Error al cargar detalle completo:', error);
        }
    };

    const handleUpdateDiagnosis = async (options = {}) => {
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
                    const _uploadResult = await uploadResponse.json();
                    const evidenceResponse = await fetch(buildApiUrl(`/api/tickets/${selectedTicket.id}`), {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const ticketData = await evidenceResponse.json();
                    if (ticketData.damagePhotos) {
                        const photosValue = ticketData.damagePhotos;
                        const savedPhotos = typeof photosValue === 'string' && photosValue.startsWith('[') 
                            ? JSON.parse(photosValue) 
                            : [];
                        finalDamagePhotos = [...finalDamagePhotos, ...savedPhotos];
                    }
                }
            }

            const totalLaborCost = diagnosisData.laborItems.reduce((sum, item) => sum + (item.price || 0), 0);
            const totalQuoteCost = quoteItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const calculatedEstimatedCost = totalLaborCost + totalQuoteCost;
            
            let nextStatus = selectedTicket.status;
            if (selectedTicket.status === 'RECEIVED') {
                nextStatus = quoteItems.length > 0 ? 'QUOTED' : 'DIAGNOSED';
            } else if (selectedTicket.status === 'DIAGNOSED' && quoteItems.length > 0) {
                nextStatus = 'QUOTED';
            }
            
            await ticketService.updateTicket(selectedTicket.id, {
                diagnosis: diagnosisData.diagnosis,
                technicianNotes: diagnosisData.technicianNotes,
                damagePhotos: JSON.stringify(finalDamagePhotos),
                status: nextStatus,
                findings: JSON.stringify(diagnosisData.findings),
                recommendations: JSON.stringify(diagnosisData.recommendations),
                laborItems: JSON.stringify(diagnosisData.laborItems),
                laborCost: totalLaborCost,
                estimatedCost: calculatedEstimatedCost,
                quoteItems: JSON.stringify(quoteItems),
                repairNotes: diagnosisData.repairNotes,
                estimatedDeliveryDate: diagnosisData.estimatedDeliveryDate
            });

            const nextStep = STATUS_FLOW.find(s => s.status === nextStatus)?.step;
            if (nextStep) setManageStep(Math.min(nextStep, 6));
            
            logAction('DIAGNOSE_TICKET', 'Taller', `Diagnóstico Ticket #${selectedTicket.id}`);
            
            if (options.sendIntakeEmail) {
                setSendingEmail(true);
                await sendDocument(selectedTicket.id, 'intake');
                setSendingEmail(false);
            }
            
            if (options.sendReportEmail) {
                setSendingEmail(true);
                await sendDocument(selectedTicket.id, 'report');
                setSendingEmail(false);
            }
            
            showAlert({ title: 'Guardado', message: nextStatus === 'QUOTED' ? 'Presupuesto guardado y enviado a cotización.' : 'Diagnóstico actualizado.', type: 'success' });
            fetchTickets();
        } finally {
            setIsSavingQuote(false);
        }
    };

    const handleSaveSignature = async (type, dataUrl) => {
        if (!selectedTicket) return;
        try {
            const fieldMap = {
                'intakeTech': 'signatureIntakeTech',
                'intakeClient': 'signatureIntakeClient',
                'deliveryTech': 'signatureDeliveryTech',
                'deliveryClient': 'signatureDeliveryClient'
            };
            const field = fieldMap[type];
            if (!field) return;

            await ticketService.updateTicket(selectedTicket.id, { [field]: dataUrl });
            
            // Update local state
            setSelectedTicket(prev => ({ ...prev, [field]: dataUrl }));
            
            // Sync lists
            fetchTickets();
            
            showAlert({ 
                title: 'Firma Registrada', 
                message: 'La firma se ha guardado correctamente en la orden de servicio.', 
                type: 'success' 
            });
        } catch (error) {
            console.error('Error saving signature:', error);
            showAlert({ 
                title: 'Error de Guardado', 
                message: 'No se pudo registrar la firma: ' + error.message, 
                type: 'error' 
            });
        }
    };

    const handleRejectQuote = async () => {
        if (!selectedTicket) return;
        const confirm = await showConfirm({
            title: '¿Rechazar Reparación?',
            message: 'Se marcará el equipo como rechazado por el cliente. Se cobrará únicamente el costo de diagnóstico/mano de obra configurado. ¿Desea continuar?',
            confirmText: 'Sí, Rechazar',
            type: 'warning'
        });

        if (!confirm) return;
        
        setIsSavingQuote(true);
        try {
            const totalLabor = diagnosisData.laborItems.reduce((s, i) => s + (Number(i.price) || 0), 0);
            
            await ticketService.updateTicket(selectedTicket.id, {
                status: 'REJECTED',
                quoteItems: JSON.stringify([]),
                estimatedCost: totalLabor,
                laborCost: totalLabor,
                diagnosis: diagnosisData.diagnosis,
                technicianNotes: diagnosisData.technicianNotes,
                findings: JSON.stringify(diagnosisData.findings),
                recommendations: JSON.stringify(diagnosisData.recommendations),
                laborItems: JSON.stringify(diagnosisData.laborItems),
                estimatedDeliveryDate: diagnosisData.estimatedDeliveryDate
            });

            showAlert({ title: 'Rechazado', message: 'El servicio ha sido marcado como rechazado. Proceda a la entrega.', type: 'info' });
            fetchTickets();
            setManageStep(6);
        } finally {
            setIsSavingQuote(false);
        }
    };

    const updateTicketStatus = async (newStatus, warrantyData = null) => {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'DELIVERED' && warrantyData) {
                updateData.warrantyLaborDays = warrantyData.laborDays;
                updateData.warrantyPartsDays = warrantyData.partsDays;
            }
            await ticketService.updateTicket(selectedTicket.id, updateData);
            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
            
            const nextStep = STATUS_FLOW.find(s => s.status === newStatus)?.step;
            if (nextStep) setManageStep(Math.min(nextStep, 6));
            
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

    const _addProductToQuote = (prod) => {
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

    const _removeProductFromQuote = (prodId) => {
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

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.id.toString().includes(searchTerm) ||
                             (t.serial && t.serial.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const isFinished = t.status === 'DELIVERED' || t.status === 'REJECTED';
        const matchesTab = activeTab === 'active' ? !isFinished : isFinished;
        
        return matchesSearch && matchesTab;
    });

    const columns = activeTab === 'active' ? [
        { id: 'RECEIVED', label: 'Recepción', color: 'slate', tickets: filteredTickets.filter(t => t.status === 'RECEIVED') },
        { id: 'DIAGNOSED', label: 'Diagnosticado', color: 'amber', tickets: filteredTickets.filter(t => t.status === 'DIAGNOSED') },
        { id: 'QUOTED', label: 'Cotizado', color: 'blue', tickets: filteredTickets.filter(t => t.status === 'QUOTED') },
        { id: 'AUTHORIZED', label: 'Autorizado', color: 'purple', tickets: filteredTickets.filter(t => t.status === 'AUTHORIZED') },
        { id: 'REPAIRING', label: 'Reparación', color: 'indigo', tickets: filteredTickets.filter(t => t.status === 'REPAIRING') },
        { id: 'READY', label: 'Listo', color: 'emerald', tickets: filteredTickets.filter(t => t.status === 'READY') }
    ] : [
        { id: 'REJECTED', label: 'Rechazados', color: 'rose', tickets: filteredTickets.filter(t => t.status === 'REJECTED') },
        { id: 'DELIVERED', label: 'Historial / Archivados', color: 'slate', tickets: filteredTickets.filter(t => t.status === 'DELIVERED') }
    ];
    return (
        <AdminLayout title="Centro de Servicios Técnicos" fullWidth>
            <div className="space-y-8 pb-32">
                <DashboardMetrics tickets={tickets} />

                {/* Toolbar */}
                <div className="bg-white/70 backdrop-blur-3xl rounded-[3rem] p-8 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col xl:flex-row items-center gap-6 w-full lg:w-auto">
                        {/* Tab Selector */}
                        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/50 shadow-sm">
                            <button 
                                onClick={() => setActiveTab('active')}
                                className={`px-8 py-3 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Monitor className="w-4 h-4" />
                                Activos ({tickets.filter(t => !['DELIVERED', 'REJECTED'].includes(t.status)).length})
                            </button>
                            <button 
                                onClick={() => {
                                    setActiveTab('history');
                                    setViewMode('list');
                                }}
                                className={`px-8 py-3 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <History className="w-4 h-4" />
                                Historial ({tickets.filter(t => ['DELIVERED', 'REJECTED'].includes(t.status)).length})
                            </button>
                        </div>

                        <div className="h-10 w-[1px] bg-slate-200/50 hidden xl:block" />

                        {/* View Mode Toggle */}
                        <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] border border-white/50 shadow-sm">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-6 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/50'}`}
                            >
                                <List className="w-4 h-4 inline-block mr-2" /> Listado
                            </button>
                            <button 
                                onClick={() => setViewMode('kanban')}
                                className={`px-6 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/50'}`}
                            >
                                <LayoutGrid className="w-4 h-4 inline-block mr-2" /> Kanban
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-1 w-full lg:w-auto items-center gap-4">
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
                            onClick={() => { 
                                if (!isNewCreation && formData.clientName) {
                                    setSavedFormData({...formData});
                                    setSavedCreateStep(createStep);
                                }
                                setIsNewCreation(true); 
                                resetForm(); 
                                setShowForm(true); 
                            }}
                            className="h-16 px-10 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group shrink-0"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="hidden sm:inline">Ingresar Equipo</span>
                        </button>
                        {savedFormData && (
                            <button 
                                onClick={() => { 
                                    setIsNewCreation(false); 
                                    setCreateStep(savedCreateStep);
                                    setFormData(savedFormData);
                                    setCustomerSearch(savedFormData.clientName);
                                    setShowForm(true); 
                                }}
                                className="h-16 px-6 bg-amber-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0"
                            >
                                <History className="w-5 h-5" />
                            </button>
                        )}
                    </div>
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
                                    <button onClick={() => { 
                                        if (isNewCreation && formData.clientName) {
                                            setSavedFormData({...formData});
                                            setSavedCreateStep(createStep);
                                        }
                                        setShowForm(false); 
                                    }} className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-slate-100">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
                                    <form onSubmit={_handleCreate}>
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
                                    </form>
                                </div>
                                </motion.div>
                        </div>
                    )}
                </PortalWrapper>

                <PortalWrapper isOpen={selectedTicket !== null}>
                    {selectedTicket && (() => {
                        const isReadOnly = ['DELIVERED', 'REJECTED'].includes(selectedTicket.status);
                        return (
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
                                                {isReadOnly && (
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100">
                                                        <LockIcon className="w-3 h-3" /> Solo Lectura
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => sendDocument(selectedTicket.id, manageStep === 1 ? 'intake' : manageStep === 6 ? 'delivery' : 'report')} 
                                            disabled={sendingEmail}
                                            className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50" 
                                            title={sendingEmail ? 'Enviando...' : 'Enviar Documento por Email'}
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
                                                emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-100' },
                                                indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', ring: 'ring-indigo-100' },
                                                slate: { bg: 'bg-slate-500', text: 'text-slate-500', ring: 'ring-slate-100' }
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

                                            {/* Asignar Técnico */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Asignar Técnico</h4>
                                                <select 
                                                    value={selectedTicket.assignedTo || ''} 
                                                    disabled={isReadOnly}
                                                    onChange={async (e) => {
                                                        const newTechId = e.target.value;
                                                        try {
                                                            await ticketService.updateTicket(selectedTicket.id, { assignedTo: newTechId });
                                                            setSelectedTicket({ ...selectedTicket, assignedTo: newTechId });
                                                            fetchTickets(); // Sincronizar Kanban/Lista
                                                            showAlert({ title: 'Actualizado', message: 'Técnico asignado', type: 'success' });
                                                        } catch (error) {
                                                            showAlert({ title: 'Error', message: error.message, type: 'error' });
                                                        }
                                                    }}
                                                    className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-bold"
                                                >
                                                    <option value="">Sin asignar</option>
                                                    {technicians.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                                {selectedTicket.assignedTo && (
                                                    <p className="text-xs text-emerald-600 mt-2 font-bold">✓ Asignado a {technicians.find(t => t.id === parseInt(selectedTicket.assignedTo))?.name}</p>
                                                )}
                                            </div>

                                            <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                const token = localStorage.getItem('adminToken');
                                                                window.open(buildApiUrl(`/api/intake-receipts/${selectedTicket.id}/preview?token=${token}`), '_blank');
                                                            }}
                                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200"
                                                        >
                                                            <Eye className="w-4 h-4" /> VER RECIBO DE INGRESO
                                                        </button>
                                                        <button 
                                                            onClick={() => sendDocument(selectedTicket.id, 'intake')}
                                                            disabled={sendingEmail}
                                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 disabled:opacity-50"
                                                        >
                                                            <Mail className="w-4 h-4" /> ENVIAR POR MAIL
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {!isReadOnly && (
                                                            <button onClick={() => handleUpdateDiagnosis({ sendIntakeEmail: autoSendIntake })} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm">
                                                                GUARDAR Y ENVIAR EMAIL
                                                            </button>
                                                        )}
                                                        {selectedTicket.status === 'RECEIVED' && !isReadOnly && (
                                                            <button onClick={() => updateTicketStatus('DIAGNOSED')} className="px-6 py-2 bg-amber-500 text-white rounded-xl font-bold text-sm">
                                                                PASAR A DIAGNÓSTICO →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isReadOnly && (
                                                    <label className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors">
                                                        <input 
                                                            type="checkbox"
                                                            checked={autoSendIntake}
                                                            onChange={(e) => setAutoSendIntake(e.target.checked)}
                                                            className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-emerald-700">Enviar Acta de Ingreso por email automáticamente</p>
                                                            <p className="text-xs text-emerald-600">Se enviará al correo del cliente junto con las firmas</p>
                                                        </div>
                                                    </label>
                                                )}
                                            </div>

                                            {/* Firmas de Ingreso */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Firma Técnico (Recepción)</h4>
                                                    {selectedTicket.signatureIntakeTech ? (
                                                        <div className="border border-slate-100 rounded-xl p-2 bg-slate-50">
                                                            <img src={selectedTicket.signatureIntakeTech} alt="Firma Técnico" className="max-h-24 mx-auto" />
                                                            <p className="text-[10px] text-center text-slate-400 mt-2">Firmado digitalmente</p>
                                                        </div>
                                                    ) : (
                                                        !isReadOnly && (
                                                            <SignaturePad 
                                                                title="Firma del Técnico"
                                                                onSave={(data) => handleSaveSignature('intakeTech', data)}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Firma Cliente (Ingreso)</h4>
                                                    {selectedTicket.signatureIntakeClient ? (
                                                        <div className="border border-slate-100 rounded-xl p-2 bg-slate-50">
                                                            <img src={selectedTicket.signatureIntakeClient} alt="Firma Cliente" className="max-h-24 mx-auto" />
                                                            <p className="text-[10px] text-center text-slate-400 mt-2">Firmado digitalmente</p>
                                                        </div>
                                                    ) : (
                                                        !isReadOnly && (
                                                            <SignaturePad 
                                                                title="Firma del Cliente"
                                                                onSave={(data) => handleSaveSignature('intakeClient', data)}
                                                            />
                                                        )
                                                    )}
                                                </div>
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
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {COMMON_FINDINGS.map(item => (
                                                                <button key={item} onClick={() => !isReadOnly && toggleItem('findings', item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${diagnosisData.findings.includes(item) ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100'} ${isReadOnly ? 'cursor-default' : 'hover:bg-slate-100'}`}>
                                                                    {item}
                                                                    {diagnosisData.findings.includes(item) && (
                                                                        <span className="ml-1 opacity-70">✓</span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                            {customFindingsList.map(item => (
                                                                <button key={item} onClick={() => !isReadOnly && toggleItem('findings', item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${diagnosisData.findings.includes(item) ? 'bg-slate-900 text-white border-slate-900' : 'bg-amber-50 text-amber-600 border-amber-200'} ${isReadOnly ? 'cursor-default' : 'hover:bg-slate-100'}`}>
                                                                    {item}
                                                                    {diagnosisData.findings.includes(item) && (
                                                                        <span className="ml-1 opacity-70">✓</span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {diagnosisData.findings.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3 p-3 bg-slate-100 rounded-lg">
                                                                <span className="text-xs font-bold text-slate-400 w-full">Seleccionados:</span>
                                                                {diagnosisData.findings.map(f => (
                                                                    <span key={f} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white flex items-center gap-2">
                                                                        {f}
                                                                        <button onClick={() => toggleItem('findings', f)} className="ml-1 text-red-300 hover:text-red-100">×</button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2 mt-3">
                                                            <input 
                                                                type="text" 
                                                                value={customFinding}
                                                                disabled={isReadOnly}
                                                                onChange={(e) => setCustomFinding(e.target.value)}
                                                                className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                                                                placeholder="Nuevo hallazgo..."
                                                                onKeyDown={(e) => e.key === 'Enter' && !isReadOnly && customFinding.trim() && (async () => { await ticketService.addCustomFinding('finding', customFinding.trim()); toggleItem('findings', customFinding.trim()); setCustomFinding(''); loadCustomFindings(); })()}
                                                            />
                                                            {!isReadOnly && (
                                                                <button 
                                                                    onClick={async () => { if (customFinding.trim()) { await ticketService.addCustomFinding('finding', customFinding.trim()); toggleItem('findings', customFinding.trim()); setCustomFinding(''); loadCustomFindings(); }}}
                                                                    className="px-4 h-9 bg-slate-900 text-white rounded-lg text-xs font-bold"
                                                                >
                                                                    +
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Recomendaciones</label>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {COMMON_RECOMMENDATIONS.map(item => (
                                                                <button key={item} onClick={() => !isReadOnly && toggleItem('recommendations', item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${diagnosisData.recommendations.includes(item) ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-500 border-slate-100'} ${isReadOnly ? 'cursor-default' : 'hover:bg-slate-100'}`}>
                                                                    {item}
                                                                    {diagnosisData.recommendations.includes(item) && (
                                                                        <span className="ml-1 opacity-70">✓</span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                            {customRecommendationsList.map(item => (
                                                                <button key={item} onClick={() => !isReadOnly && toggleItem('recommendations', item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${diagnosisData.recommendations.includes(item) ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200'} ${isReadOnly ? 'cursor-default' : 'hover:bg-slate-100'}`}>
                                                                    {item}
                                                                    {diagnosisData.recommendations.includes(item) && (
                                                                        <span className="ml-1 opacity-70">✓</span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {diagnosisData.recommendations.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-3 p-3 bg-amber-50 rounded-lg">
                                                                <span className="text-xs font-bold text-amber-400 w-full">Seleccionadas:</span>
                                                                {diagnosisData.recommendations.map(r => (
                                                                    <span key={r} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white flex items-center gap-2">
                                                                        {r}
                                                                        <button onClick={() => toggleItem('recommendations', r)} className="ml-1 text-amber-200 hover:text-white">×</button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2 mt-3">
                                                            <input 
                                                                type="text" 
                                                                value={customRecommendation}
                                                                onChange={(e) => setCustomRecommendation(e.target.value)}
                                                                className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-xs font-bold"
                                                                placeholder="Nueva recomendación..."
                                                                onKeyDown={(e) => e.key === 'Enter' && customRecommendation.trim() && (async () => { await ticketService.addCustomFinding('recommendation', customRecommendation.trim()); toggleItem('recommendations', customRecommendation.trim()); setCustomRecommendation(''); loadCustomFindings(); })()}
                                                            />
                                                            <button 
                                                                onClick={async () => { if (customRecommendation.trim()) { await ticketService.addCustomFinding('recommendation', customRecommendation.trim()); toggleItem('recommendations', customRecommendation.trim()); setCustomRecommendation(''); loadCustomFindings(); }}}
                                                                className="px-4 h-9 bg-slate-900 text-white rounded-lg text-xs font-bold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Notas del Técnico</label>
                                                        <textarea rows={3} disabled={isReadOnly} value={diagnosisData.technicianNotes} onChange={e => setDiagnosisData(prev => ({...prev, technicianNotes: e.target.value}))} className="w-full p-3 border border-slate-100 rounded-xl text-sm disabled:opacity-50" placeholder="Notas privadas..." />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Diagnóstico Oficial</label>
                                                        <textarea rows={2} disabled={isReadOnly} value={diagnosisData.diagnosis} onChange={e => setDiagnosisData(prev => ({...prev, diagnosis: e.target.value}))} className="w-full p-3 border border-slate-100 rounded-xl text-sm disabled:opacity-50" placeholder="Diagnóstico para el cliente..." />
                                                    </div>
                                                </div>

                                                {/* Fotos del Daño */}
                                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                    <h4 className="text-xs font-bold text-red-600 uppercase mb-3 flex items-center gap-2">
                                                        <Camera className="w-4 h-4" /> Fotos del Daño / Falla
                                                    </h4>
                                                    <div className="flex gap-3 mb-3">
                                                        {!isReadOnly && (
                                                            <>
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
                                                            </>
                                                        )}
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
                                                <div className="space-y-3">
                                                    {diagnosisData.laborItems.map((item, idx) => (
                                                        <div key={idx} className="flex gap-2 items-center">
                                                            <input 
                                                                type="text"
                                                                value={item.description}
                                                                onChange={(e) => {
                                                                    const newItems = [...diagnosisData.laborItems];
                                                                    newItems[idx].description = e.target.value;
                                                                    setDiagnosisData(prev => ({...prev, laborItems: newItems}));
                                                                }}
                                                                className="flex-1 h-10 px-3 border border-amber-200 rounded-lg text-sm font-bold"
                                                                placeholder="Descripción"
                                                            />
                                                            <div className="relative w-32">
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                                <input 
                                                                    type="text"
                                                                    value={item.price ? item.price.toLocaleString('es-CO') : ''}
                                                                    onChange={(e) => {
                                                                        const clean = e.target.value.replace(/[^\d]/g, '');
                                                                        const newItems = [...diagnosisData.laborItems];
                                                                        newItems[idx].price = parseInt(clean) || 0;
                                                                        setDiagnosisData(prev => ({...prev, laborItems: newItems}));
                                                                    }}
                                                                    className="w-full h-10 pl-6 pr-2 border border-amber-200 rounded-lg text-sm font-bold"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => setDiagnosisData(prev => ({...prev, laborItems: prev.laborItems.filter((_, i) => i !== idx)}))}
                                                                className="w-8 h-10 bg-red-100 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-200"
                                                            >×</button>
                                                        </div>
                                                    ))}
                                                    {!isReadOnly && (
                                                        <button 
                                                            onClick={() => setDiagnosisData(prev => ({...prev, laborItems: [...prev.laborItems, { description: '', price: 0 }]}))}
                                                            className="w-full py-2 border-2 border-dashed border-amber-200 text-amber-600 rounded-lg text-sm font-bold hover:bg-amber-100"
                                                        >
                                                            + Agregar Mano de Obra
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            </div>

                                            {/* Acciones Step 2 */}
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                const token = localStorage.getItem('adminToken');
                                                                window.open(buildApiUrl(`/api/intake-receipts/${selectedTicket.id}/preview?token=${token}`), '_blank');
                                                            }}
                                                            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200"
                                                        >
                                                            <Eye className="w-4 h-4" /> Acta Ingreso
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const token = localStorage.getItem('adminToken');
                                                                window.open(buildApiUrl(`/api/customer-reports/${selectedTicket.id}/preview?token=${token}`), '_blank');
                                                            }}
                                                            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200"
                                                        >
                                                            <Eye className="w-4 h-4" /> Ver Cotización
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        {!isReadOnly && (
                                                            <button onClick={() => handleUpdateDiagnosis({ sendReportEmail: autoSendReport })} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold text-sm">
                                                                GUARDAR
                                                            </button>
                                                        )}
                                                        {selectedTicket.status === 'DIAGNOSED' && !isReadOnly && (
                                                            <button onClick={() => updateTicketStatus('QUOTED')} className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm">
                                                                PASAR A COTIZACIÓN →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isReadOnly && (
                                                    <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                                                        <input 
                                                            type="checkbox"
                                                            checked={autoSendReport}
                                                            onChange={(e) => setAutoSendReport(e.target.checked)}
                                                            className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm font-bold text-blue-700">Enviar cotización por email al guardar</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 3 && (
                                        <div className="space-y-6">
                                            {/* Cotización */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-green-600 uppercase mb-4 flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" /> Cotización y Repuestos
                                                </h4>
                                                
                                                {/* Buscador de Productos */}
                                                <div className="mb-6">
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Buscar Repuestos</label>
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input 
                                                            type="text" 
                                                            disabled={isReadOnly}
                                                            placeholder={isReadOnly ? "Cotización cerrada" : "Buscar por nombre, SKU o marca..."}
                                                            value={prodSearch}
                                                            onChange={(e) => {
                                                                setProdSearch(e.target.value);
                                                                if (availableProducts.length === 0) fetchAllProducts();
                                                            }}
                                                            className="w-full pl-10 pr-4 py-3 border border-slate-100 rounded-xl text-sm disabled:bg-slate-50"
                                                        />
                                                    </div>
                                                    {prodSearch.length >= 2 && availableProducts.length > 0 && (
                                                        <div className="mt-2 bg-white border border-slate-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                            {availableProducts
                                                                .filter(p => 
                                                                    p.name?.toLowerCase().includes(prodSearch.toLowerCase()) || 
                                                                    p.sku?.toLowerCase().includes(prodSearch.toLowerCase()) ||
                                                                    p.brand?.toLowerCase().includes(prodSearch.toLowerCase())
                                                                )
                                                                .slice(0, 10)
                                                                .map(product => (
                                                                    <button
                                                                        key={product.id}
                                                                        onClick={() => {
                                                                            const exists = quoteItems.find(q => q.id === product.id);
                                                                            if (exists) {
                                                                                setQuoteItems(prev => prev.map(q => 
                                                                                    q.id === product.id ? { ...q, quantity: q.quantity + 1 } : q
                                                                                ));
                                                                            } else {
                                                                                setQuoteItems(prev => [...prev, { 
                                                                                    id: product.id, 
                                                                                    name: product.name, 
                                                                                    price: product.price, 
                                                                                    quantity: 1,
                                                                                    sku: product.sku
                                                                                }]);
                                                                            }
                                                                            setProdSearch('');
                                                                        }}
                                                                        className="w-full p-3 text-left hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-0"
                                                                    >
                                                                        <div>
                                                                            <p className="font-bold text-sm">{product.name}</p>
                                                                            <p className="text-xs text-slate-400">{product.brand} {product.sku ? `- SKU: ${product.sku}` : ''}</p>
                                                                        </div>
                                                                        <span className="font-bold text-green-600">${Number(product.price || 0).toLocaleString()}</span>
                                                                    </button>
                                                                ))
                                                            }
                                                            {availableProducts.filter(p => 
                                                                p.name?.toLowerCase().includes(prodSearch.toLowerCase()) || 
                                                                p.sku?.toLowerCase().includes(prodSearch.toLowerCase())
                                                            ).length === 0 && (
                                                                <p className="p-3 text-center text-slate-400 text-sm">No se encontraron productos</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Lista de Repuestos Agregados */}
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                                        <span className="text-sm font-bold">Total Repuestos</span>
                                                        <span className="text-lg font-bold text-green-600">${quoteItems.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}</span>
                                                    </div>
                                                    {quoteItems.length > 0 ? (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-bold text-slate-400 uppercase">Repuestos Agregados</p>
                                                            {quoteItems.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-sm">{item.name}</p>
                                                                        <p className="text-xs text-slate-400">{item.sku || ''}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button 
                                                                            onClick={() => !isReadOnly && setQuoteItems(prev => prev.map((q, i) => 
                                                                                i === idx ? { ...q, quantity: Math.max(1, q.quantity - 1) } : q
                                                                            ))}
                                                                            disabled={isReadOnly}
                                                                            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center disabled:opacity-30"
                                                                        >-</button>
                                                                        <span className="font-bold w-8 text-center">{item.quantity}</span>
                                                                        <button 
                                                                            onClick={() => !isReadOnly && setQuoteItems(prev => prev.map((q, i) => 
                                                                                i === idx ? { ...q, quantity: q.quantity + 1 } : q
                                                                            ))}
                                                                            disabled={isReadOnly}
                                                                            className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center disabled:opacity-30"
                                                                        >+</button>
                                                                    </div>
                                                                    <div className="text-right w-24">
                                                                        <p className="font-bold">${(item.price * item.quantity).toLocaleString()}</p>
                                                                    </div>
                                                                    {!isReadOnly && (
                                                                        <button 
                                                                            onClick={() => setQuoteItems(prev => prev.filter((_, i) => i !== idx))}
                                                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-center text-slate-400 py-4">No hay repuestos agregados</p>
                                                    )}
                                                    
                                                    {diagnosisData.laborItems.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-bold text-slate-400 uppercase">Mano de Obra</p>
                                                            {diagnosisData.laborItems.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between text-sm items-center p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                                                    <span>{item.description || 'Mano de Obra'}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold">${Number(item.price || 0).toLocaleString()}</span>
                                                                        <button 
                                                                            onClick={() => setDiagnosisData(prev => ({...prev, laborItems: prev.laborItems.filter((_, i) => i !== idx)}))}
                                                                            className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"
                                                                        >×</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-amber-200">
                                                                <span>Total Mano de Obra</span>
                                                                <span>${diagnosisData.laborItems.reduce((sum, i) => sum + Number(i.price || 0), 0).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Total General */}
                                                    <div className="flex justify-between items-center p-4 bg-green-50 border border-green-100 rounded-xl">
                                                        <span className="text-lg font-bold text-green-800">TOTAL PRESUPUESTO</span>
                                                        <span className="text-2xl font-black text-green-700">
                                                            ${(quoteItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) + diagnosisData.laborItems.reduce((sum, i) => sum + Number(i.price || 0), 0)).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones Step 3 */}
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                                {!isReadOnly && (
                                                    <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors mb-4">
                                                        <input 
                                                            type="checkbox"
                                                            checked={autoSendReport}
                                                            onChange={(e) => setAutoSendReport(e.target.checked)}
                                                            className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-bold text-blue-700">Enviar Informe Técnico por email automáticamente</p>
                                                            <p className="text-xs text-blue-600">Se enviará la cotización al correo del cliente</p>
                                                        </div>
                                                    </label>
                                                )}
                                                <div className="flex justify-between gap-3">
                                                    <button onClick={() => setManageStep(2)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                    <div className="flex gap-3">
                                                        {!isReadOnly && (
                                                            <button onClick={() => handleUpdateDiagnosis({ sendReportEmail: autoSendReport })} className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-sm">
                                                                GUARDAR Y ENVIAR COTIZACIÓN
                                                            </button>
                                                        )}
                                                        {selectedTicket.status === 'QUOTED' && !isReadOnly && (
                                                            <button onClick={() => setManageStep(4)} className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm">
                                                                SOLICITAR AUTORIZACIÓN →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 4 && (
                                        <div className="space-y-6">
                                            {/* Autorización */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-purple-600 uppercase mb-4 flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4" /> Autorización del Cliente
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="bg-purple-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-purple-600 uppercase mb-2">Estado</p>
                                                        <p className="text-sm font-medium">{selectedTicket.status === 'AUTHORIZED' ? '✓ Autorizado por el cliente' : 'Esperando autorización del cliente'}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl">
                                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Resumen de Cotización</p>
                                                        <p className="text-lg font-bold text-green-600">${(quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0) + diagnosisData.laborItems.reduce((s, i) => s + Number(i.price || 0), 0)).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button onClick={() => sendDocument(selectedTicket.id, 'report')} disabled={sendingEmail} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                                            <Mail className="w-4 h-4" /> Enviar Informe Técnico
                                                        </button>
                                                        <button onClick={() => {
                                                            const token = localStorage.getItem('adminToken');
                                                            window.open(buildApiUrl(`/api/customer-reports/${selectedTicket.id}/preview?token=${token}`), '_blank');
                                                        }} className="px-4 py-2 bg-slate-500 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                                                            <Eye className="w-4 h-4" /> Ver Informe Técnico
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones Step 4 */}
                                            <div className="flex justify-between gap-3">
                                                <button onClick={() => setManageStep(3)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                <div className="flex gap-3">
                                                    {selectedTicket.status === 'AUTHORIZED' && !isReadOnly && (
                                                        <button onClick={() => { updateTicketStatus('REPAIRING'); setManageStep(5); }} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm">
                                                            INICIAR REPARACIÓN →
                                                        </button>
                                                    )}
                                                    {(selectedTicket.status === 'QUOTED' || selectedTicket.status === 'DIAGNOSED') && !isReadOnly && (
                                                        <div className="flex gap-3 w-full">
                                                            <button onClick={() => { updateTicketStatus('AUTHORIZED'); }} className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm">
                                                                AUTORIZAR ✓
                                                            </button>
                                                            <button onClick={handleRejectQuote} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm">
                                                                RECHAZAR / DEVOLVER
                                                            </button>
                                                        </div>
                                                    )}
                                                    {selectedTicket.status === 'REJECTED' && !isReadOnly && (
                                                        <button onClick={() => { updateTicketStatus('READY'); setManageStep(6); }} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm">
                                                            LISTO PARA DEVOLUCIÓN →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 5 && (
                                        <div className="space-y-6">
                                            {/* Reparación */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                <h4 className="text-xs font-bold text-indigo-600 uppercase mb-4 flex items-center gap-2">
                                                    <Wrench className="w-4 h-4" /> Proceso de Reparación
                                                </h4>
                                                <div className="space-y-4">
                                                    <div className="bg-indigo-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Estado Actual</p>
                                                        <p className="text-sm font-medium">{selectedTicket.status === 'REPAIRING' ? 'Equipo en reparación' : 'Esperando inicio'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Agregar Nota de Reparación</label>
                                                        <textarea 
                                                            rows={3} 
                                                            disabled={isReadOnly}
                                                            className="w-full p-3 border border-slate-100 rounded-xl text-sm disabled:opacity-50"
                                                            placeholder={isReadOnly ? "Reparación finalizada" : "Describir trabajos realizados..."}
                                                            value={diagnosisData.repairNotes || ''}
                                                            onChange={(e) => setDiagnosisData(prev => ({...prev, repairNotes: e.target.value}))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones Step 5 */}
                                            <div className="flex justify-between gap-3">
                                                <button onClick={() => setManageStep(4)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                <div className="flex gap-3">
                                                    {!isReadOnly && (
                                                        <button onClick={async () => {
                                                            await ticketService.updateTicket(selectedTicket.id, { repairNotes: diagnosisData.repairNotes });
                                                            showAlert({ title: 'Guardado', message: 'Notas de reparación actualizadas.', type: 'success' });
                                                        }} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm">
                                                            GUARDAR
                                                        </button>
                                                    )}
                                                    {selectedTicket.status === 'REPAIRING' && !isReadOnly && (
                                                        <button onClick={() => updateTicketStatus('READY')} className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-sm">
                                                            MARCAR LISTO PARA ENTREGA →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {manageStep === 6 && (
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
                                                            <p><span className="text-slate-500">Costo Repuestos:</span> <span className="font-bold">${quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span></p>
                                                            <p><span className="text-slate-500">Costo Mano de Obra:</span> <span className="font-bold">${diagnosisData.laborItems.reduce((s, i) => s + Number(i.price || 0), 0).toLocaleString()}</span></p>
                                                            <p><span className="text-slate-500">Costo Total:</span> <span className="font-bold text-green-600">${(quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0) + diagnosisData.laborItems.reduce((s, i) => s + Number(i.price || 0), 0)).toLocaleString()}</span></p>
                                                            <div className="mt-2 pt-2 border-t border-slate-200">
                                                                <p className="text-xs"><span className="text-slate-500 uppercase font-bold">Fecha Est. Entrega:</span> <span className="font-medium text-slate-700">{selectedTicket.estimatedDeliveryDate ? new Date(selectedTicket.estimatedDeliveryDate).toLocaleDateString('es-CO') : 'No establecida'}</span></p>
                                                                <p className="text-xs"><span className="text-slate-500 uppercase font-bold">Fecha Real Entrega:</span> <span className="font-medium text-emerald-600">{new Date().toLocaleDateString('es-CO')} (Hoy)</span></p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Garantías */}
                                            {warrantyPreview && (
                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-4 flex items-center gap-2">
                                                        <ShieldCheck className="w-4 h-4" /> Certificados de Garantía
                                                    </h4>
                                                    
                                                    <div className="space-y-4">
                                                        <p className="text-xs text-slate-500 mb-3">
                                                            Las garantías se detectan automáticamente según los items de la cotización. 
                                                            Puedes ajustar los días si es necesario.
                                                        </p>
                                                        
                                                        {warrantyPreview.hasLabor && (
                                                            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-green-700">Garantía por Mano de Obra (Servicio Técnico)</p>
                                                                        <p className="text-xs text-green-600 mt-1">Cubre el trabajo de reparación realizado</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input 
                                                                            type="number" 
                                                                            min="0" 
                                                                            max="365"
                                                                            disabled={isReadOnly}
                                                                            value={warrantySettings.laborDays}
                                                                            onChange={(e) => setWarrantySettings(prev => ({ ...prev, laborDays: parseInt(e.target.value) || 0 }))}
                                                                            className="w-20 px-3 py-2 border border-green-300 rounded-lg text-center font-bold text-green-700"
                                                                        />
                                                                        <span className="text-xs text-green-600 font-medium">días</span>
                                                                    </div>
                                                                </div>
                                                                {diagnosisData.laborItems.length > 0 && (
                                                                    <div className="mt-2 pt-2 border-t border-green-200">
                                                                        <p className="text-xs text-green-600">
                                                                            Items de mano de obra: {diagnosisData.laborItems.map(l => l.description).join(', ')}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {warrantyPreview.hasParts && (
                                                            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-purple-700">Garantía por Partes y Accesorios</p>
                                                                        <p className="text-xs text-purple-600 mt-1">Cubre los repuestos y accesorios instalados</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <input 
                                                                            type="number" 
                                                                            min="0" 
                                                                            max="365"
                                                                            disabled={isReadOnly}
                                                                            value={warrantySettings.partsDays}
                                                                            onChange={(e) => setWarrantySettings(prev => ({ ...prev, partsDays: parseInt(e.target.value) || 0 }))}
                                                                            className="w-20 px-3 py-2 border border-purple-300 rounded-lg text-center font-bold text-purple-700"
                                                                        />
                                                                        <span className="text-xs text-purple-600 font-medium">días</span>
                                                                    </div>
                                                                </div>
                                                                {quoteItems.length > 0 && (
                                                                    <div className="mt-2 pt-2 border-t border-purple-200">
                                                                        <p className="text-xs text-purple-600">
                                                                            Repuestos: {quoteItems.map(p => p.name).join(', ')}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {!warrantyPreview.hasLabor && !warrantyPreview.hasParts && (
                                                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                                                <p className="text-sm text-amber-700">
                                                                    <AlertCircle className="w-4 h-4 inline mr-2" />
                                                                    No hay items en la cotización para generar garantías.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Firmas de Entrega */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-4">Firma Técnico (Entrega)</h4>
                                                    {selectedTicket.signatureDeliveryTech ? (
                                                        <div className="border border-slate-100 rounded-xl p-2 bg-slate-50">
                                                            <img src={selectedTicket.signatureDeliveryTech} alt="Firma Técnico" className="max-h-24 mx-auto" />
                                                            <p className="text-[10px] text-center text-slate-400 mt-2">Equipo entregado por técnico</p>
                                                        </div>
                                                    ) : (
                                                        !isReadOnly && (
                                                            <SignaturePad 
                                                                title="Firma del Técnico"
                                                                onSave={(data) => handleSaveSignature('deliveryTech', data)}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-4">Firma Cliente (Recibido conforme)</h4>
                                                    {selectedTicket.signatureDeliveryClient ? (
                                                        <div className="border border-slate-100 rounded-xl p-2 bg-slate-50">
                                                            <img src={selectedTicket.signatureDeliveryClient} alt="Firma Cliente" className="max-h-24 mx-auto" />
                                                            <p className="text-[10px] text-center text-slate-400 mt-2">Equipo recibido por cliente</p>
                                                        </div>
                                                    ) : (
                                                        !isReadOnly && (
                                                            <SignaturePad 
                                                                title="Firma del Cliente"
                                                                onSave={(data) => handleSaveSignature('deliveryClient', data)}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </div>

                                            {/* Acciones Step 6 */}
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 mb-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 mb-1">Acta de Entrega y Garantía</h4>
                                                        <p className="text-xs text-slate-500">Genera el documento final con los términos de garantía y resumen de costos.</p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button 
                                                            onClick={() => {
                                                                const token = localStorage.getItem('adminToken');
                                                                window.open(buildApiUrl(`/api/delivery-receipts/${selectedTicket.id}/preview?token=${token}`), '_blank');
                                                            }}
                                                            className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-green-100"
                                                        >
                                                            <Eye className="w-4 h-4" /> VER ACTA
                                                        </button>
                                                        <button 
                                                            onClick={() => sendDocument(selectedTicket.id, 'delivery')}
                                                            disabled={sendingEmail}
                                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 disabled:opacity-50"
                                                        >
                                                            <Mail className="w-4 h-4" /> ENVIAR POR MAIL
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between gap-3">
                                                <button onClick={() => setManageStep(5)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">← Anterior</button>
                                                {!isReadOnly && (
                                                    <div className="flex gap-3">
                                                        {selectedTicket.status !== 'DELIVERED' && (
                                                            <button 
                                                                onClick={() => {
                                                                    const laborDays = warrantyPreview?.hasLabor ? warrantySettings.laborDays : 0;
                                                                    const partsDays = warrantyPreview?.hasParts ? warrantySettings.partsDays : 0;
                                                                    updateTicketStatus('DELIVERED', { laborDays, partsDays });
                                                                }} 
                                                                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200"
                                                            >
                                                                FINALIZAR Y ENTREGAR EQUIPO ✓
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                        );
                    })()}
                </PortalWrapper>
            </div>
        </AdminLayout>
    );
};

export default AdminTechService;
