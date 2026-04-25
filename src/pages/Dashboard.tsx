import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

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
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProducts: 0,
    totalCustomers: 0,
    netIncome: 0,
    recentSales: [] as any[],
    lowStockProducts: [] as any[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [salesRes, prodRes, custRes] = await Promise.all([
          api.get('/sales'),
          api.get('/products'),
          api.get('/customers')
        ]);

        const sales = salesRes.data;
        const products = prodRes.data;
        const customers = custRes.data;

        const totalSalesValue = sales.reduce((acc: number, s: any) => acc + s.total, 0);
        const lowStock = products.filter((p: any) => p.stock <= p.min_stock).slice(0, 4);

        setStats({
          totalSales: totalSalesValue,
          totalProducts: products.reduce((acc: number, p: any) => acc + p.stock, 0),
          totalCustomers: customers.length,
          netIncome: totalSalesValue * 0.3, // Example margin
          recentSales: sales.slice(0, 4),
          lowStockProducts: lowStock
        });
      } catch (error) {
        console.error('Error fetching dashboard data');
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Bienvenido, {user?.name || 'Admin'}</h2>
        <p className="text-slate-500">Aquí tienes un resumen de lo que sucede hoy en Henry SAS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ventas Totales" value={formatCurrency(stats.totalSales)} icon={ShoppingCart} trend="up" trendValue="12" />
        <StatCard title="Productos en Stock" value={stats.totalProducts.toString()} icon={Package} />
        <StatCard title="Nuevos Clientes" value={stats.totalCustomers.toString()} icon={Users} trend="up" trendValue="8" />
        <StatCard title="Ingresos Estimados" value={formatCurrency(stats.netIncome)} icon={TrendingUp} trend="up" trendValue="5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Ventas Recientes</h3>
          <div className="space-y-4">
            {stats.recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {sale.customer_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{sale.customer_name || 'Venta General'}</p>
                    <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-brand-600">+{formatCurrency(sale.total)}</p>
                  <p className="text-xs text-slate-400 capitalize">{sale.payment_method}</p>
                </div>
              </div>
            ))}
            {stats.recentSales.length === 0 && <p className="text-center py-4 text-slate-400">No hay ventas recientes</p>}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
            Ver todas las ventas
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Stock Bajo</h3>
          <div className="space-y-4">
            {stats.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-500">SKU: {product.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">{product.stock} unid.</p>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${Math.min(100, (product.stock / product.min_stock) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {stats.lowStockProducts.length === 0 && <p className="text-center py-4 text-slate-400">Todo el stock está normal</p>}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl transition-colors">
            Gestionar inventario
          </button>
        </div>
      </div>
    </div>
  );
};
