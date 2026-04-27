import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  UserSquare2,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { NotificationBell } from '../components/NotificationBell';
import Swal from 'sweetalert2';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Productos', path: '/productos' },
  { icon: Tags, label: 'Categorías', path: '/categorias' },
  { icon: UserSquare2, label: 'Proveedores', path: '/proveedores' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: ShoppingCart, label: 'Ventas', path: '/ventas' },
  { icon: Truck, label: 'Compras', path: '/compras' },
  { icon: BarChart3, label: 'Reportes', path: '/reportes' },
  { icon: Settings, label: 'Configuración', path: '/configuracion' },
];

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default on mobile
  const { user, logout } = useAuth();
  const { settings } = useConfig();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Tendrás que ingresar tus credenciales de nuevo",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0369a1',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-xl px-6 py-2',
        cancelButton: 'rounded-xl px-6 py-2'
      }
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:static bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
          isSidebarOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className={cn("flex items-center gap-3 transition-all", isSidebarOpen ? "opacity-100" : "opacity-100 justify-center")}>
            <img src="/favicon.png" alt="Logo" className="w-8 h-8 rounded-lg" />
            <div className={cn("font-bold text-white transition-opacity", !isSidebarOpen && "opacity-0 w-0 overflow-hidden")}>
              {settings.business_name}
            </div>
          </div>
          <button onClick={toggleSidebar} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} className="hidden lg:block" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center h-12 px-4 rounded-2xl transition-all duration-300 group relative",
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-bold"
                    : "hover:bg-white/5 text-slate-400 hover:text-white"
                )}
              >
                <item.icon size={22} className={cn("transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-brand-400")} />
                <span className={cn(
                  "ml-4 transition-all duration-300 text-sm tracking-wide",
                  (!isSidebarOpen) && "lg:opacity-0 lg:w-0 overflow-hidden ml-0"
                )}>
                  {item.label}
                </span>
                {isActive && (isSidebarOpen || window.innerWidth >= 1024) && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white/50" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors group"
          >
            <LogOut size={20} className="group-hover:text-red-500" />
            <span className={cn(
              "ml-3 transition-opacity duration-300",
              (!isSidebarOpen) && "lg:opacity-0 lg:w-0 overflow-hidden"
            )}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-slate-800">
            {menuItems.find(i => i.path === location.pathname)?.label || 'Sistema'}
          </h1>
          <div className="flex items-center space-x-6">
            <NotificationBell />

            <div className="flex items-center space-x-4">
              <div className="text-right mr-2 hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role || 'Vendedor'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
