import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter } from 'lucide-react';
import api from '../services/api';
import { useCurrency } from '../hooks/useCurrency';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const { format } = useCurrency();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    topProducts: [] as any[],
    salesByDay: [] as any[]
  });
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [salesRes, prodRes] = await Promise.all([
          api.get('/sales'),
          api.get('/products')
        ]);

        const sales = salesRes.data;
        const totalRevenue = sales.reduce((acc: number, s: any) => acc + s.total, 0);
        
        // Mocking some daily data for the chart
        const salesByDay = [
          { day: 'Lun', value: 450 },
          { day: 'Mar', value: 600 },
          { day: 'Mie', value: 800 },
          { day: 'Jue', value: 500 },
          { day: 'Vie', value: 900 },
          { day: 'Sab', value: 1200 },
          { day: 'Dom', value: 700 },
        ];

        setStats({
          totalRevenue,
          totalProfit: totalRevenue * 0.35, // Estimated 35% margin
          totalSales: sales.length,
          topProducts: prodRes.data.slice(0, 5).map((p: any) => ({ ...p, sales: Math.floor(Math.random() * 50) + 10 })),
          salesByDay
        });
      } catch (error) {
        toast.error('Error al cargar reportes');
      }
    };
    fetchReports();
  }, [dateRange]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Reportes y Estadísticas</h2>
          <p className="text-slate-500 font-medium">Analiza el rendimiento de Henry SAS de forma visual.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'week' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'month' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Mes
            </button>
          </div>
          <button className="btn btn-ghost bg-white border-slate-100 rounded-2xl gap-2 h-12 shadow-sm">
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ingresos Totales</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{format(stats.totalRevenue)}</h3>
          <p className="text-xs font-bold text-emerald-500 flex items-center mt-2">
            <TrendingUp size={14} className="mr-1" /> +12.5% vs anterior
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ganancia Bruta</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{format(stats.totalProfit)}</h3>
          <p className="text-xs font-bold text-emerald-500 flex items-center mt-2">
            <TrendingUp size={14} className="mr-1" /> +8.3% vs anterior
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Calendar size={24} />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ventas Realizadas</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{stats.totalSales}</h3>
          <p className="text-xs font-bold text-red-500 flex items-center mt-2">
            <TrendingDown size={14} className="mr-1" /> -2.1% vs anterior
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">Ventas Semanales</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.salesByDay.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-brand-100 group-hover:bg-brand-500 rounded-t-xl transition-all duration-500 relative"
                    style={{ height: `${(item.value / 1200) * 200}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.value}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">Productos Más Vendidos</h3>
          <div className="space-y-6">
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-black text-slate-400 text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-slate-800">{p.name}</span>
                    <span className="text-sm font-black text-slate-900">{p.sales} und.</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${(p.sales / 50) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
