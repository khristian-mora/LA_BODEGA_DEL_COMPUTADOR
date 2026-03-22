import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, LogOut, Package, Users, Tag, Wrench, DollarSign, RotateCcw, Menu, X, UserCircle, BarChart3, Shield, Settings, Monitor } from 'lucide-react';
import NotificationCenter from '../components/NotificationCenter';
import { useAudit } from '../context/AuditContext';

const AdminLayout = ({ children, title }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const userRole = user.role || 'técnico'; // Fallback to lowest role if not found
    const { logAction } = useAudit();

    React.useEffect(() => {
        if (user.id) {
            logAction('VIEW_SCREEN', title, `Accedió a la pantalla: ${title} (${location.pathname})`);
        }
    }, [location.pathname, title]);

    const menuItems = [
        { path: '/admin', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'técnico', 'vendedor', 'gerente'] },
        { path: '/admin/users', name: 'Usuarios', icon: Users, roles: ['admin'] },
        { path: '/admin/customers', name: 'Clientes', icon: UserCircle, roles: ['admin', 'vendedor', 'técnico'] },
        { path: '/admin/appointments', name: 'Citas', icon: LayoutDashboard, roles: ['admin', 'vendedor', 'técnico'] },
        { path: '/admin/reports', name: 'Reportes', icon: BarChart3, roles: ['admin', 'gerente'] },
        { path: '/admin/warranties', name: 'Garantías', icon: Shield, roles: ['admin', 'técnico', 'vendedor'] },
        { path: '/admin/orders', name: 'Pedidos', icon: ShoppingCart, roles: ['admin', 'vendedor', 'gerente'] },
        { path: '/admin/inventory', name: 'Inventario', icon: Package, roles: ['admin', 'vendedor', 'gerente', 'técnico'] },
        { path: '/admin/suppliers', name: 'Proveedores', icon: Users, roles: ['admin', 'vendedor'] },
        { path: '/admin/marketing', name: 'Marketing', icon: Tag, roles: ['admin', 'gerente'] },
        { path: '/admin/tech-service', name: 'Servicio Técnico', icon: Wrench, roles: ['admin', 'técnico'] },
        { path: '/admin/hr', name: 'Recursos Humanos', icon: Users, roles: ['admin'] },
        { path: '/admin/finance', name: 'Contabilidad', icon: DollarSign, roles: ['admin', 'gerente'] },
        { path: '/admin/returns', name: 'Devoluciones', icon: RotateCcw, roles: ['admin', 'vendedor', 'técnico'] },
        { path: '/admin/settings', name: 'Configuración', icon: Settings, roles: ['admin'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
    };

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-black text-white flex flex-col fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Monitor className="w-6 h-6 text-white" />
                            <h1 className="text-sm font-bold tracking-tighter leading-tight">LA BODEGA DEL<br />COMPUTADOR</h1>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Panel Administrativo</p>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {filteredMenu.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)} // Close on navigate (mobile)
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Salir
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300 min-h-screen">
                <header className="bg-white h-16 shadow-sm border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 line-clamp-1">{title}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{user.name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">{userRole}</p>
                        </div>
                        <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-xs">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
