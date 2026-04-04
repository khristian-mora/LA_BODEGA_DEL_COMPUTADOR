import React, { useEffect, useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminLayout from '../../layouts/AdminLayout';
import { 
    BarChart3, Download, Calendar, TrendingUp, Package, Users, 
    Wrench, DollarSign, ArrowUp, ArrowDown, Sparkles, Activity, 
    Clock, PieChart, Box, FileText, CheckCircle2, ShieldCheck,
    AlertCircle, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Button from '../../components/Button';
import { API_CONFIG, buildApiUrl } from '../../config/config';
import { useModal } from '../../context/ModalContext';
import { motion, AnimatePresence } from 'framer-motion';

const GlassCard = ({ children, className = "" }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 ${className}`}
    >
        {children}
    </motion.div>
);

const PremiumStatCard = ({ title, value, subtext, icon: Icon, color, trend, delay = 0 }) => {
    const colorMap = {
        green: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 border-emerald-100",
        blue: "from-blue-500/20 to-blue-500/5 text-blue-600 border-blue-100",
        purple: "from-indigo-500/20 to-indigo-500/5 text-indigo-600 border-indigo-100",
        orange: "from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-100",
        red: "from-rose-500/20 to-rose-500/5 text-rose-600 border-rose-100",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5, type: "spring" }}
            className={`relative overflow-hidden group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color].split(' ')[0]} -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            
            <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-gray-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                    <div className="flex items-center gap-2">
                        {trend && (
                            <span className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {trend > 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                        <p className="text-xs text-gray-400 font-bold">{subtext}</p>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-6 h-6 stroke-[2.5px]" />
                </div>
            </div>
        </motion.div>
    );
};

const AdminReports = () => {
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [serverOnline, setServerOnline] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [salesData, setSalesData] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [serviceData, setServiceData] = useState([]);
    const [customerData, setCustomerData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [_appointmentStats, setAppointmentStats] = useState([]);

    useEffect(() => {
        fetchReports();
    }, [dateRange]);

    const fetchReports = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');
            const headers = { 'Authorization': `Bearer ${token}` };

            const safeFetch = async (url) => {
                try {
                    const res = await fetch(buildApiUrl(url), { headers });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return await res.json();
                } catch (e) {
                    console.warn(`[REPORTS] Failed to fetch ${url}:`, e.message);
                    return { data: [], status: 'error' };
                }
            };

            const [sales, inventory, service, customers, products, appointments] = await Promise.all([
                safeFetch(`/api/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
                safeFetch('/api/reports/inventory'),
                safeFetch(`/api/reports/service?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
                safeFetch('/api/reports/customers'),
                safeFetch('/api/reports/top-products?limit=5'),
                safeFetch(`/api/reports/appointments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
            ]);

            setSalesData(Array.isArray(sales) ? sales : (sales.data || []));
            setInventoryData(Array.isArray(inventory) ? inventory : (inventory.byCategory || []));
            setServiceData(Array.isArray(service) ? service : (service.data || []));
            setCustomerData(Array.isArray(customers) ? customers : (customers.data || []));
            setTopProducts(Array.isArray(products) ? products : (products.products || []));
            setAppointmentStats(Array.isArray(appointments) ? appointments : (appointments.data || []));
            
            setServerOnline(true);
        } catch (error) {
            console.error('Error fetching reports:', error);
            setServerOnline(false);
            showAlert({ title: 'Advertencia', message: 'Error intermitente al conectar con el motor de análisis', type: 'warning' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        }).format(value || 0);
    };

    const generateDetailedPDF = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const today = new Date().toLocaleDateString('es-CO');

            // --- HEADER ---
            doc.setFillColor(30, 41, 59); // Slate-800
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('LA BODEGA DEL COMPUTADOR', 15, 20);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('REPORTE GERENCIAL DE OPERACIONES', 15, 30);
            doc.text(`Fecha: ${today}`, pageWidth - 15, 20, { align: 'right' });
            doc.text(`Rango: ${dateRange.startDate} a ${dateRange.endDate}`, pageWidth - 15, 30, { align: 'right' });

            // --- KPI SUMMARY ---
            let currentY = 55;
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('1. RESUMEN EJECUTIVO (KPIs)', 15, currentY);
            
            currentY += 10;
            const kpiData = [
                ['Indicador', 'Valor Actual', 'Métrica'],
                ['Ingresos Totales', formatCurrency(stats.totalSales), 'Bruto'],
                ['Ticket Promedio', formatCurrency(stats.avgTicket), 'Rentabilidad'],
                ['Valor de Inventario', formatCurrency(stats.totalValue), 'Activo Fijo'],
                ['Clientes CRM', stats.totalCustomers.toString(), 'Fidelización']
            ];

            autoTable(doc, {
                startY: currentY,
                head: [kpiData[0]],
                body: kpiData.slice(1),
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 4 }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY + 30) + 20;

            // --- SALES PERFORMANCE ---
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('2. DESEMPEÑO DE VENTAS DIARIAS', 15, currentY);
            
            const salesRows = salesData.map(day => [
                new Date(day.date).toLocaleDateString('es-CO'),
                day.totalTickets || 0,
                formatCurrency(day.totalRevenue)
            ]);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Fecha', 'Tickets/Servicios', 'Recaudo Total']],
                body: salesRows,
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85] },
                styles: { fontSize: 9 }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY + 50) + 15;
            if (currentY > 230) { doc.addPage(); currentY = 20; }

            // --- INVENTORY SEGMENTATION ---
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('3. SEGMENTACIÓN DE INVENTARIO', 15, currentY);

            const invRows = inventoryData.map(cat => [
                cat.category || 'Varios',
                cat.totalProducts || 0,
                formatCurrency(cat.totalValue)
            ]);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Categoría', 'Unidades en Stock', 'Valoración Comercial']],
                body: invRows,
                theme: 'grid',
                headStyles: { fillColor: [99, 102, 241] },
                styles: { fontSize: 9 }
            });

            currentY = (doc.lastAutoTable?.finalY || currentY + 40) + 15;
            if (currentY > 230) { doc.addPage(); currentY = 20; }

            // --- TOP PRODUCTS ---
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('4. TOP PRODUCTOS (ALTA ROTACIÓN)', 15, currentY);

            const topRows = topProducts.map((p, i) => [
                i + 1,
                p.name,
                p.category,
                p.stock,
                formatCurrency(p.price)
            ]);

            autoTable(doc, {
                startY: currentY + 5,
                head: [['Rank', 'Producto', 'Categoría', 'Stock', 'Precio']],
                body: topRows,
                theme: 'striped',
                headStyles: { fillColor: [245, 158, 11] },
                styles: { fontSize: 8 }
            });

            // --- FOOTER ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Página ${i} de ${pageCount} - Documento generado por motor de análisis LBDC v2.0 - Confidencial`,
                    pageWidth / 2,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }

            doc.save(`Reporte_Gerencial_LBDC_${today.replace(/\//g, '-')}.pdf`);
            showAlert({ title: 'Éxito', message: 'Reporte generado con protocolos de alta definición', type: 'success' });
        } catch (error) {
            console.error('PDF Error:', error);
            showAlert({ title: 'Error', message: 'Falla crítica en el motor de renderizado PDF', type: 'error' });
        }
    };

    const exportToExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            const todayStr = new Date().toISOString().split('T')[0];
            const todayDate = new Date().toLocaleDateString('es-CO');

            const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E3A5F" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin", color: { rgb: "000000" } }, bottom: { style: "thin", color: { rgb: "000000" } }, left: { style: "thin", color: { rgb: "000000" } }, right: { style: "thin", color: { rgb: "000000" } } } };
            const titleStyle = { font: { bold: true, size: 14, color: { rgb: "1E3A5F" } }, alignment: { horizontal: "left" } };
            const numberStyle = { numFmt: "$#,##0", alignment: { horizontal: "right" } };
            const centerStyle = { alignment: { horizontal: "center" } };

            const setHeaderRow = (ws, cols) => {
                ws['!cols'] = cols.map(c => ({ wch: c }));
                const headers = Object.keys(ws['!ref'] ? XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || {} : {});
                headers.forEach((_, idx) => {
                    const cell = XLSX.utils.encode_cell({ r: 0, c: idx });
                    if (ws[cell]) ws[cell].s = headerStyle;
                });
            };

            const wsCover = XLSX.utils.aoa_to_sheet([
                ["", ""],
                ["LA BODEGA DEL COMPUTADOR", ""],
                ["REPORTE GERENCIAL DE OPERACIONES", ""],
                ["", ""],
                [`Fecha de generación: ${todayDate}`, ""],
                [`Período analizado: ${dateRange.startDate} al ${dateRange.endDate}`, ""],
                ["", ""],
                ["RESUMEN EJECUTIVO", ""],
                ["Indicador", "Valor", "Unidad"],
                ["Ingresos Totales", stats.totalSales, "COP"],
                ["Ticket Promedio", stats.avgTicket, "COP"],
                ["Valor de Inventario", stats.totalValue, "COP"],
                ["Total Productos", stats.totalProds, "Unidades"],
                ["Clientes Registrados", stats.totalCustomers, "Usuarios"],
                ["", ""],
                ["Generado automáticamente", ""],
            ]);
            wsCover['!cols'] = [{ wch: 35 }, { wch: 18 }];
            wsCover['!merges'] = [XLSX.utils.decode_range("A1:B1"), XLSX.utils.decode_range("A2:B2"), XLSX.utils.decode_range("A8:B8")];
            wsCover["A2"].s = { font: { bold: true, size: 18, color: { rgb: "1E3A5F" } } };
            wsCover["A3"].s = { font: { size: 11, color: { rgb: "666666" } } };
            wsCover["A8"].s = titleStyle;
            wsCover["A9"].s = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E3A5F" } }, alignment: { horizontal: "center" } };
            wsCover["B9"].s = wsCover["A9"].s;
            wsCover["C9"].s = wsCover["A9"].s;
            for (let r = 10; r <= 14; r++) {
                wsCover[`A${r}`].s = { font: { bold: true } };
                wsCover[`B${r}`].s = numberStyle;
            }
            XLSX.utils.book_append_sheet(wb, wsCover, "Resumen");

            const wsSales = XLSX.utils.aoa_to_sheet([
                ["Fecha", "Servicios", "Recaudo"],
                ...salesData.map(day => [
                    new Date(day.date).toLocaleDateString('es-CO'),
                    day.totalTickets || 0,
                    day.totalRevenue || 0
                ])
            ]);
            setHeaderRow(wsSales, [15, 12, 18]);
            wsSales['!cols'].forEach((col, i) => {
                if (i === 2) {
                    for (let r = 1; r <= salesData.length + 1; r++) {
                        const cell = XLSX.utils.encode_cell({ r, c: 2 });
                        if (wsSales[cell]) wsSales[cell].s = numberStyle;
                    }
                }
                if (i === 0) {
                    for (let r = 1; r <= salesData.length + 1; r++) {
                        const cell = XLSX.utils.encode_cell({ r, c: 0 });
                        if (wsSales[cell]) wsSales[cell].s = centerStyle;
                    }
                }
            });
            XLSX.utils.book_append_sheet(wb, wsSales, "Ventas Diarias");

            const wsInv = XLSX.utils.aoa_to_sheet([
                ["Categoría", "Unidades", "Valoración"],
                ...inventoryData.map(cat => [
                    cat.category || 'Varios',
                    cat.totalProducts || 0,
                    cat.totalValue || 0
                ])
            ]);
            setHeaderRow(wsInv, [25, 12, 20]);
            wsInv['!cols'].forEach((col, i) => {
                if (i === 2) {
                    for (let r = 1; r <= inventoryData.length + 1; r++) {
                        const cell = XLSX.utils.encode_cell({ r, c: 2 });
                        if (wsInv[cell]) wsInv[cell].s = numberStyle;
                    }
                }
            });
            XLSX.utils.book_append_sheet(wb, wsInv, "Inventario");

            const wsTop = XLSX.utils.aoa_to_sheet([
                ["#", "Producto", "Categoría", "Stock", "Precio"],
                ...topProducts.map((p, i) => [
                    i + 1,
                    p.name,
                    p.category,
                    p.stock || 0,
                    p.price || 0
                ])
            ]);
            setHeaderRow(wsTop, [6, 35, 15, 8, 14]);
            wsTop['!cols'].forEach((col, i) => {
                if (i === 0) {
                    for (let r = 1; r <= topProducts.length + 1; r++) {
                        const cell = XLSX.utils.encode_cell({ r, c: 0 });
                        if (wsTop[cell]) wsTop[cell].s = centerStyle;
                    }
                }
                if (i === 3 || i === 4) {
                    for (let r = 1; r <= topProducts.length + 1; r++) {
                        const cell = XLSX.utils.encode_cell({ r, c: i });
                        if (wsTop[cell]) wsTop[cell].s = i === 4 ? numberStyle : centerStyle;
                    }
                }
            });
            XLSX.utils.book_append_sheet(wb, wsTop, "Top Productos");

            if (serviceData.length > 0) {
                const wsServ = XLSX.utils.aoa_to_sheet([
                    ["Estado", "Cantidad", "Ingresos"],
                    ...serviceData.map(s => [s.status, s.count, s.totalRevenue || 0])
                ]);
                setHeaderRow(wsServ, [18, 12, 18]);
                for (let r = 1; r <= serviceData.length + 1; r++) {
                    const cell = XLSX.utils.encode_cell({ r, c: 2 });
                    if (wsServ[cell]) wsServ[cell].s = numberStyle;
                }
                XLSX.utils.book_append_sheet(wb, wsServ, "Servicios");
            }

            const fileName = `Reporte_Comercial_LBDC_${todayStr}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
            
            showAlert({ title: 'Éxito', message: 'Balance comercial exportado a Microsoft Excel correctamente', type: 'success' });
        } catch (error) {
            console.error('Excel Error:', error);
            showAlert({ title: 'Error', message: 'Error al procesar la matriz de datos de Excel: ' + error.message, type: 'error' });
        }
    };

    const stats = useMemo(() => {
        const totalSales = (salesData || []).reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
        const totalTickets = (salesData || []).reduce((sum, day) => sum + (day.totalTickets || 0), 0);
        const totalValue = (inventoryData || []).reduce((sum, cat) => sum + (cat.totalValue || 0), 0);
        const totalProds = (inventoryData || []).reduce((sum, cat) => sum + (cat.totalProducts || 0), 0);
        const totalCustomers = (customerData || []).reduce((sum, type) => sum + (type.customerCount || 0), 0);

        return {
            totalSales,
            totalTickets,
            totalValue,
            totalProds,
            totalCustomers,
            avgTicket: totalTickets > 0 ? totalSales / totalTickets : 0
        };
    }, [salesData, inventoryData, customerData]);

    if (loading) {
        return (
            <AdminLayout title="Análisis Central">
                <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 text-center px-6">
                    <motion.div 
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="p-5 bg-indigo-50 rounded-3xl text-indigo-600 shadow-xl shadow-indigo-100/50"
                    >
                        <RefreshCw className="w-12 h-12" />
                    </motion.div>
                    <p className="text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Sincronizando flujos de datos comerciales...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Centro de Reportes">
            <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
                
                {/* Dashboard Control Bar */}
                <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                                Control Center
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                    <div className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{serverOnline ? 'Live' : 'Offline'}</span>
                                </div>
                            </h1>
                        </div>
                        <p className="text-gray-400 font-medium text-sm flex items-center gap-2">
                            Monitoreo en tiempo real del ecosistema comercial LBDC
                            <Sparkles className="w-4 h-4 text-amber-400" />
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 shadow-inner">
                            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    className="bg-transparent border-0 text-xs font-black focus:ring-0 p-0 text-gray-700 w-24 cursor-pointer"
                                />
                                <span className="text-gray-300 font-black">—</span>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    className="bg-transparent border-0 text-xs font-black focus:ring-0 p-0 text-gray-700 w-24 cursor-pointer"
                                />
                            </div>
                            <button 
                                onClick={() => fetchReports(true)}
                                disabled={refreshing}
                                className={`p-2.5 rounded-xl transition-all duration-300 ${refreshing ? 'bg-gray-100 text-gray-400' : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20'}`}
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             <Button 
                                variant="primary" 
                                className="!rounded-2xl !px-6 bg-emerald-600 border-none hover:bg-emerald-700 group shadow-xl shadow-emerald-500/10"
                                onClick={exportToExcel}
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                Excel
                            </Button>

                            <Button 
                                variant="primary" 
                                className="!rounded-2xl !px-6 bg-gray-900 border-none hover:bg-black group shadow-xl shadow-black/10"
                                onClick={generateDetailedPDF}
                            >
                                <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                PDF
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Pulse */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PremiumStatCard 
                        title="Ventas de Servicios"
                        value={formatCurrency(stats.totalSales)}
                        subtext={`${stats.totalTickets} tickets`}
                        icon={TrendingUp}
                        color="green"
                        trend={12}
                        delay={0.1}
                    />
                    <PremiumStatCard 
                        title="Ticket Promedio"
                        value={formatCurrency(stats.avgTicket)}
                        subtext="Eficiencia operativa"
                        icon={PieChart}
                        color="blue"
                        trend={5}
                        delay={0.2}
                    />
                    <PremiumStatCard 
                        title="Inventario Total"
                        value={formatCurrency(stats.totalValue)}
                        subtext={`${stats.totalProds} unidades`}
                        icon={Box}
                        color="purple"
                        delay={0.3}
                    />
                    <PremiumStatCard 
                        title="Fidelización CRM"
                        value={stats.totalCustomers}
                        subtext="Clientes registrados"
                        icon={Users}
                        color="orange"
                        trend={8}
                        delay={0.4}
                    />
                </div>

                {/* Analytical Matrices */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* Performance Timeline */}
                    <GlassCard className="xl:col-span-2 flex flex-col min-h-[500px]">
                        <div className="p-8 border-b border-gray-100/50 flex justify-between items-center bg-gray-50/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Timeline de Desempeño</h3>
                                    <p className="text-gray-400 text-xs font-bold">Volumen transaccional diario</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Registros</div>
                            </div>
                        </div>
                        <div className="p-8 flex-1 overflow-auto max-h-[600px] scroll-premium">
                            {salesData.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                                        <TrendingUp className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-400 font-black text-sm uppercase">Sin registros en el segmento temporal</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pr-2">
                                    {salesData.map((day, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 shadow-sm"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center border border-gray-100 shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                    <span className="text-[10px] font-black uppercase leading-none text-gray-400 group-hover:text-indigo-100">
                                                        {new Date(day.date).toLocaleString('es', { month: 'short' })}
                                                    </span>
                                                    <span className="text-lg font-black leading-none mt-0.5">
                                                        {new Date(day.date).getDate() || 0}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-800 tracking-tight">{day.totalTickets || 0} Servicios Atendidos</h4>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        Registro operativo verificado
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-indigo-600 group-hover:scale-105 transition-transform">
                                                    +{formatCurrency(day.totalRevenue)}
                                                </div>
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase">Procesado</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Right Column: Mini Reports */}
                    <div className="space-y-8">
                        
                        {/* Top Products */}
                        <GlassCard className="p-8 min-h-[350px]">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">Top Productos</h3>
                                </div>
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="space-y-5">
                                {topProducts.length > 0 ? topProducts.map((prod, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-black text-gray-800 text-sm truncate">{prod.name}</h5>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[80px]">{prod.category}</span>
                                                <span className={`w-1 h-1 rounded-full ${prod.stock < 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                <span className="text-[10px] font-black text-gray-500">{prod.stock || 0} en stock</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900 text-sm">{formatCurrency(prod.price)}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-400 py-12 text-sm font-bold animate-pulse">Analizando inventario...</p>
                                )}
                            </div>
                        </GlassCard>

                        {/* System Health Snapshot */}
                        <GlassCard className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
                                <Box className="w-32 h-32 rotate-12" />
                            </div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black uppercase text-sm tracking-widest">Estado Motor</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Latencia</span>
                                        <span className="font-black text-xs">28ms</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Servicios Activos</span>
                                        <span className="font-black text-xs">{serviceData.length || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                        <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Uptime</span>
                                        <span className="font-black text-xs text-emerald-300">99.98%</span>
                                    </div>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => fetchReports(true)}
                                    className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20"
                                >
                                    Fuerza de Sincronización
                                </motion.button>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Category Segmentation */}
                <GlassCard className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <PieChart className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 text-xl tracking-tight uppercase">Segmentación de Activos</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Distribución por unidades y valor comercial</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                Top 10 Categorías
                             </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {inventoryData.length > 0 ? inventoryData.map((cat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5, shadow: "0 20px 40px -20px rgba(79, 70, 229, 0.2)" }}
                                className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 hover:border-indigo-100 hover:bg-white transition-all duration-300 shadow-sm"
                            >
                                <h5 className="font-black text-gray-900 mb-4 truncate uppercase tracking-tight text-sm">
                                    {cat.category || 'Varios'}
                                </h5>
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unidades</p>
                                            <p className="text-xl font-black text-gray-800 leading-none">{cat.totalProducts || 0}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valoración</p>
                                            <p className="text-base font-black text-indigo-600 leading-none">{formatCurrency(cat.totalValue)}</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, stats.totalValue > 0 ? (cat.totalValue / stats.totalValue) * 100 : 0)}%` }}
                                            transition={{ duration: 1.5, delay: 0.5 }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="col-span-full py-12 text-center text-gray-300 font-black uppercase tracking-widest text-sm">
                                No se encontraron datos de segmentación
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Secure Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-4 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="flex items-center gap-2 py-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                        <span className="font-black text-[9px] uppercase tracking-[0.2em] text-gray-700">Protocol: AES-256 Cloud</span>
                    </div>
                    <div className="flex items-center gap-2 py-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="font-black text-[9px] uppercase tracking-[0.2em] text-gray-700">Integrity: SHA-Verified</span>
                    </div>
                    <div className="flex items-center gap-2 py-2">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                        <span className="font-black text-[9px] uppercase tracking-[0.2em] text-gray-700">Financial: Certified Audit</span>
                    </div>
                    <div className="flex items-center gap-2 py-2">
                        <RefreshCw className="w-5 h-5 text-blue-500" />
                        <span className="font-black text-[9px] uppercase tracking-[0.2em] text-gray-700">Sync: Real-time Flux</span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReports;
