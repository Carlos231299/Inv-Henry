import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../hooks/useCurrency';
import { useConfig } from '../context/ConfigContext';

const StatCard = ({ title, value, icon: Icon, trend, trendValue }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
        <Icon size={24} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trendValue}%
        </div>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { format } = useCurrency();
  const { settings } = useConfig();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    netIncome: 0,
    recentSales: [] as any[],
    lowStockProducts: [] as any[]
  });

  const calculateStats = (sales: any[], products: any[], customers: any[], currentFilter: string) => {
    const now = new Date();
    const filteredSales = sales.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      if (currentFilter === 'hoy') {
        return saleDate.toDateString() === now.toDateString();
      } else if (currentFilter === 'semana') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return saleDate >= weekAgo;
      } else if (currentFilter === 'mes') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        return saleDate >= monthAgo;
      }
      return true;
    });

    const totalSalesValue = filteredSales.reduce((acc: number, s: any) => acc + s.total, 0);
    const lowStock = products.filter((p: any) => p.stock <= p.min_stock).slice(0, 4);

    setStats({
      totalSales: totalSalesValue,
      totalProducts: products.reduce((acc: number, p: any) => acc + p.stock, 0),
      totalCustomers: customers.length,
      netIncome: totalSalesValue * 0.3,
      recentSales: filteredSales.slice(0, 4),
      lowStockProducts: lowStock
    });
  };

  const [rawProducts, setRawProducts] = useState([]);
  const [rawCustomers, setRawCustomers] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [salesRes, prodRes, custRes] = await Promise.all([
          api.get('/sales'),
          api.get('/products'),
          api.get('/customers')
        ]);
        setAllSales(salesRes.data);
        setRawProducts(prodRes.data);
        setRawCustomers(custRes.data);
        calculateStats(salesRes.data, prodRes.data, custRes.data, filter);
      } catch (error) {
        console.error('Error fetching dashboard data');
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (allSales.length > 0) {
      calculateStats(allSales, rawProducts, rawCustomers, filter);
    }
  }, [filter]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
          <p className="text-slate-500 font-medium">Bienvenido de nuevo, {user?.name || 'Admin'}. Aquí está el resumen de {settings.business_name}.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          {['hoy', 'semana', 'mes'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize",
                filter === f ? "bg-brand-600 text-white shadow-md shadow-brand-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventas Totales" value={format(stats.totalSales)} icon={ShoppingCart} trend="up" trendValue="12" />
        <StatCard title="Productos en Stock" value={stats.totalProducts.toLocaleString()} icon={Package} />
        <StatCard title="Nuevos Clientes" value={stats.totalCustomers.toString()} icon={Users} trend="up" trendValue="8" />
        <StatCard title="Ingresos Estimados" value={format(stats.netIncome)} icon={TrendingUp} trend="up" trendValue="5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Placeholder */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800">Rendimiento de Ventas</h3>
              <p className="text-slate-400 text-sm font-medium">Visualización de ingresos semanales</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span className="w-3 h-3 rounded-full bg-brand-500"></span> Ventas
              </div>
            </div>
          </div>

          <div className="h-64 w-full relative">
            <svg viewBox="0 0 800 200" className="w-full h-full drop-shadow-2xl">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 150 Q 100 80 200 120 T 400 60 T 600 100 T 800 40"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-dash"
              />
              <path
                d="M 0 150 Q 100 80 200 120 T 400 60 T 600 100 T 800 40 L 800 200 L 0 200 Z"
                fill="url(#gradient)"
              />
              {/* Points */}
              <circle cx="200" cy="120" r="6" fill="white" stroke="#0ea5e9" strokeWidth="3" />
              <circle cx="400" cy="60" r="6" fill="white" stroke="#0ea5e9" strokeWidth="3" />
              <circle cx="600" cy="100" r="6" fill="white" stroke="#0ea5e9" strokeWidth="3" />
            </svg>
          </div>

          <div className="flex justify-between mt-6 px-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-6">Stock Crítico</h3>
          <div className="flex-1 space-y-4">
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group hover:bg-red-50/30 hover:border-red-100 transition-all cursor-default">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 truncate w-32">{product.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Stock: {product.stock}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase">Crítico</div>
              </div>
            ))}
            {stats.lowStockProducts.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-10">
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full">
                  <TrendingUp size={32} />
                </div>
                <p className="text-sm font-bold">Todo el stock está normal</p>
              </div>
            )}
          </div>
          <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            Revisar Inventario
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800">Actividad de Ventas</h3>
          <button className="text-brand-600 text-sm font-bold hover:underline">Ver Historial</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.recentSales.map((sale) => (
            <div key={sale.id} className="p-5 rounded-3xl bg-slate-50/30 border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-600 font-bold group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  {sale.customer_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{sale.customer_name || 'Consumidor Final'}</p>
                  <p className="text-[10px] font-bold text-slate-400">{new Date(sale.date).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</p>
                  <p className="text-lg font-black text-brand-600">{format(sale.total)}</p>
                </div>
                <div className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500 capitalize">
                  {sale.payment_method}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
