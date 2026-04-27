import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter } from 'lucide-react';
import api from '../services/api';
import { useCurrency } from '../hooks/useCurrency';
import { useConfig } from '../context/ConfigContext';
import { toast } from 'sonner';

export const ReportsPage: React.FC = () => {
  const { format } = useCurrency();
  const { settings } = useConfig();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalSales: 0,
    topProducts: [] as any[],
    salesByDay: [] as any[]
  });
  const [dateRange, setDateRange] = useState('month');

  const [customRange, setCustomRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        let url = `/reports/stats?range=${dateRange}`;
        if (dateRange === 'custom') {
          url += `&startDate=${customRange.start}&endDate=${customRange.end}`;
        }
        const res = await api.get(url);
        const data = res.data;

        setStats({
          totalRevenue: data.totalRevenue,
          totalProfit: data.totalProfit,
          totalSales: data.totalSales,
          topProducts: data.topProducts,
          salesByDay: data.salesByPeriod.map((s: any) => ({
            day: s.period,
            value: s.value
          }))
        });
      } catch (error) {
        toast.error('Error al cargar reportes');
      }
    };
    fetchReports();
  }, [dateRange, customRange]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    type: 'sales',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeDetails: true
  });

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (exportFilters.type === 'inventory') {
      toast.success('Generando reporte de inventario...');
      try {
        const res = await api.get('/reports/inventory');
        const inventoryData = res.data;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Estado de Inventario - ${settings.business_name}</title>
                <style>
                  body { font-family: 'Inter', sans-serif, system-ui; padding: 40px; color: #1e293b; line-height: 1.5; }
                  .header { border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                  .header h1 { margin: 0; color: #0c4a6e; font-size: 28px; font-weight: 900; }
                  .info { text-align: right; font-size: 14px; color: #64748b; }
                  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; }
                  th { text-align: left; padding: 12px 15px; background: #f8fafc; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
                  td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; }
                  .stock-low { color: #ef4444; font-weight: 800; background: #fef2f2; }
                  .stock-ok { color: #10b981; font-weight: 800; }
                  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
                  .summary-grid { margin-top: 40px; page-break-inside: avoid; }
                  .summary-card { background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 15px; page-break-inside: avoid; display: flex; justify-content: space-between; align-items: center; }
                  .summary-card p { margin: 0; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
                  .summary-card h2 { margin: 0; font-size: 26px; font-weight: 900; color: #0c4a6e; }
                  @media print {
                    .summary-grid { break-inside: avoid; }
                    .summary-card { break-inside: avoid; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <div>
                    <h1>${settings.business_name}</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-weight: 600;">Reporte de Estado y Valorización de Inventario</p>
                  </div>
                  <div class="info">
                    <p>NIT: ${settings.nit}</p>
                    <p>Fecha de Reporte: ${new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style="width: 10%;">Código</th>
                      <th style="width: 25%;">Producto</th>
                      <th style="width: 15%;">Categoría</th>
                      <th style="text-align: center; width: 8%;">Stock</th>
                      <th style="text-align: right; width: 12%;">Costo Unit.</th>
                      <th style="text-align: right; width: 12%;">Venta Unit.</th>
                      <th style="text-align: right; width: 18%;">Valor Inv. (Costo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${inventoryData.map((p: any) => `
                      <tr class="${p.stock <= p.min_stock ? 'stock-low' : ''}">
                        <td>${p.code}</td>
                        <td style="font-weight: 700; color: #1e293b;">${p.name}</td>
                        <td>${p.category_name || 'Sin categoría'}</td>
                        <td style="text-align: center;" class="${p.stock <= p.min_stock ? 'stock-low' : 'stock-ok'}">${p.stock}</td>
                        <td style="text-align: right;">${format(p.price_buy)}</td>
                        <td style="text-align: right;">${format(p.price_sell)}</td>
                        <td style="text-align: right; font-weight: 900; color: #0c4a6e;">${format(p.total_investment)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="summary-grid">
                  <div class="summary-card">
                    <p>Inversión Total en Stock</p>
                    <h2>${format(inventoryData.reduce((acc: number, p: any) => acc + p.total_investment, 0))}</h2>
                  </div>
                  <div class="summary-card" style="border-left: 8px solid #0ea5e9; background: #f0f9ff;">
                    <p>Recaudo Potencial (Venta)</p>
                    <h2>${format(inventoryData.reduce((acc: number, p: any) => acc + p.potential_revenue, 0))}</h2>
                  </div>
                  <div class="summary-card" style="border-left: 8px solid #10b981; background: #f0fdf4;">
                    <p>Ganancia Bruta Estimada</p>
                    <h2 style="color: #10b981;">${format(inventoryData.reduce((acc: number, p: any) => acc + p.potential_profit, 0))}</h2>
                  </div>
                </div>

                <div class="footer">
                  Este reporte muestra la valorización actual del inventario de ${settings.business_name}.
                  Los productos resaltados en rojo requieren atención inmediata por bajo stock.
                </div>
                <script>window.print();</script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
        setIsExportModalOpen(false);
      } catch (error) {
        toast.error('Error al generar reporte de inventario');
      }
      return;
    }

    toast.success('Generando reporte detallado...');
    
    let detailedData: any[] = [];
    try {
      const res = await api.get(`/reports/detailed?startDate=${exportFilters.startDate}&endDate=${exportFilters.endDate}`);
      detailedData = res.data;
    } catch (error) {
      toast.error('Error al obtener datos detallados');
      return;
    }

    // Group items by sale_id
    const groupedSales = detailedData.reduce((acc: any, item: any) => {
      if (!acc[item.sale_id]) {
        acc[item.sale_id] = {
          id: item.sale_id,
          date: item.date,
          customer_name: item.customer_name,
          payment_method: item.payment_method,
          total: item.total,
          items: []
        };
      }
      acc[item.sale_id].items.push(item);
      return acc;
    }, {});

    const salesList = Object.values(groupedSales);

    // Simple print approach
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de ${settings.business_name}</title>
            <style>
              body { font-family: 'Inter', sans-serif, system-ui; padding: 40px; color: #1e293b; line-height: 1.5; }
              .header { border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
              .header h1 { margin: 0; color: #0c4a6e; font-size: 28px; font-weight: 900; }
              .info { text-align: right; font-size: 14px; color: #64748b; }
              .sale-card { border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 25px; overflow: hidden; page-break-inside: avoid; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
              .sale-header { background: #f8fafc; padding: 12px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
              .sale-id { font-weight: 900; color: #0c4a6e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
              .sale-date { color: #64748b; font-size: 11px; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { text-align: left; padding: 10px 20px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
              td { padding: 10px 20px; border-bottom: 1px solid #f1f5f9; }
              .profit { color: #10b981; font-weight: 700; }
              .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
              .summary-box { margin-top: 40px; background: #0c4a6e; color: white; padding: 30px; border-radius: 24px; display: flex; justify-content: flex-end; gap: 60px; }
              .summary-item p { margin: 0; font-size: 11px; font-weight: 700; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em; }
              .summary-item h2 { margin: 5px 0 0 0; font-size: 32px; font-weight: 900; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>${settings.business_name}</h1>
                <p style="margin: 5px 0 0 0; color: #64748b; font-weight: 600;">Análisis Detallado de Transacciones</p>
              </div>
              <div class="info">
                <p>NIT: ${settings.nit}</p>
                <p>Periodo: ${exportFilters.startDate} a ${exportFilters.endDate}</p>
                <p>Generado: ${new Date().toLocaleString()}</p>
              </div>
            </div>

            <div style="margin-bottom: 30px;">
              ${salesList.map((sale: any) => `
                <div class="sale-card">
                  <div class="sale-header">
                    <span class="sale-id">ID: #${sale.id} | Cliente: ${sale.customer_name || 'Venta Mostrador'}</span>
                    <span class="sale-date">${new Date(sale.date).toLocaleString()} | ${sale.payment_method}</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 45%;">Descripción del Producto</th>
                        <th style="text-align: center;">Cant.</th>
                        <th style="text-align: right;">Precio Unit.</th>
                        <th style="text-align: right;">Ganancia</th>
                        <th style="text-align: right;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${sale.items.map((item: any) => `
                        <tr>
                          <td style="font-weight: 700; color: #1e293b;">${item.product_name}</td>
                          <td style="text-align: center; font-weight: 800;">${item.quantity}</td>
                          <td style="text-align: right;">${format(item.sold_price)}</td>
                          <td style="text-align: right;" class="profit">+ ${format(item.profit)}</td>
                          <td style="text-align: right; font-weight: 900; color: #0369a1;">${format(item.quantity * item.sold_price)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot style="background: #fdfdfd;">
                      <tr>
                        <td colspan="4" style="text-align: right; font-weight: 800; color: #64748b; padding: 12px 20px;">TOTAL DE ESTA VENTA:</td>
                        <td style="text-align: right; font-weight: 900; font-size: 13px; color: #0c4a6e; padding: 12px 20px;">${format(sale.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              `).join('')}
            </div>

            <div class="summary-box">
              <div class="summary-item">
                <p>Ingresos Brutos Totales</p>
                <h2>${format(detailedData.reduce((acc, d) => acc + (d.quantity * d.sold_price), 0))}</h2>
              </div>
              <div class="summary-item">
                <p>Ganancia Neta Estimada</p>
                <h2 style="color: #4ade80;">${format(detailedData.reduce((acc, d) => acc + d.profit, 0))}</h2>
              </div>
            </div>

            <div class="footer">
              Este reporte es un documento interno de ${settings.business_name}. 
              Página 1 de 1 | Autenticado por Sistema Henry SAS.
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Reportes y Estadísticas</h2>
          <p className="text-slate-500 font-medium">Analiza el rendimiento de {settings.business_name} de forma visual.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setDateRange('day')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'day' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Día
            </button>
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
            <button 
              onClick={() => setDateRange('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'all' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dateRange === 'custom' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Rango
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
              <input 
                type="date" 
                className="bg-transparent text-xs font-bold text-slate-600 outline-none px-2"
                value={customRange.start}
                onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
              />
              <span className="text-slate-300">/</span>
              <input 
                type="date" 
                className="bg-transparent text-xs font-bold text-slate-600 outline-none px-2"
                value={customRange.end}
                onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
              />
            </div>
          )}

          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="btn btn-ghost bg-white border-slate-100 rounded-2xl gap-2 h-12 shadow-sm"
          >
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ingresos Totales</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{format(stats.totalRevenue)}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ganancia Bruta</span>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{format(stats.totalProfit)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8">
            {dateRange === 'day' ? 'Ventas de Hoy' : dateRange === 'week' ? 'Ventas Semanales' : dateRange === 'month' ? 'Ventas del Mes' : dateRange === 'custom' ? 'Rango Personalizado' : 'Historial de Ventas'}
          </h3>
          <div className="h-64 flex items-end justify-between gap-1 mt-4">
            {stats.salesByDay.length > 0 ? stats.salesByDay.map((item, index) => {
              const values = stats.salesByDay.map(s => s.value);
              const maxVal = Math.max(...values, 1);
              const minVal = Math.min(...values);
              const range = maxVal - minVal || 1;
              const ratio = (item.value - minVal) / range;
              
              // Dynamic color: Red (0) to Green (140)
              const hue = ratio * 140;
              const barColor = `hsl(${hue}, 75%, 60%)`;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
                  <div className="relative w-full">
                    <div 
                      className="w-full rounded-t-lg transition-all duration-700 relative group-hover:brightness-110"
                      style={{ 
                        height: `${(item.value / maxVal) * 200}px`,
                        backgroundColor: barColor,
                        boxShadow: `0 -4px 15px -5px hsl(${hue}, 75%, 60%, 0.3)`
                      }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 shadow-xl z-20 whitespace-nowrap">
                        {format(item.value)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">
                    {dateRange === 'day' ? 'Hoy' : item.day.split('-').length > 2 ? item.day.split('-').slice(1).join('/') : item.day}
                  </span>
                </div>
              );
            }) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium italic">
                Sin datos para este periodo
              </div>
            )}
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
      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Exportar Reporte</h3>
                <p className="text-slate-500 text-sm font-medium">Configura los parámetros de tu informe.</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <form onSubmit={handleExport} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-black text-slate-700 uppercase tracking-wider text-xs">Tipo de Reporte</span></label>
                  <select 
                    className="select select-bordered rounded-2xl h-12 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-brand-500"
                    value={exportFilters.type}
                    onChange={(e) => setExportFilters({...exportFilters, type: e.target.value})}
                  >
                    <option value="sales">Ventas y Ganancias</option>
                    <option value="inventory">Estado de Inventario</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-black text-slate-700 uppercase tracking-wider text-xs">Desde</span></label>
                    <input 
                      type="date" 
                      className="input input-bordered rounded-2xl h-12 bg-slate-50 border-slate-200"
                      value={exportFilters.startDate}
                      onChange={(e) => setExportFilters({...exportFilters, startDate: e.target.value})}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-black text-slate-700 uppercase tracking-wider text-xs">Hasta</span></label>
                    <input 
                      type="date" 
                      className="input input-bordered rounded-2xl h-12 bg-slate-50 border-slate-200"
                      value={exportFilters.endDate}
                      onChange={(e) => setExportFilters({...exportFilters, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-primary rounded-lg" 
                      checked={exportFilters.includeDetails}
                      onChange={(e) => setExportFilters({...exportFilters, includeDetails: e.target.checked})}
                    />
                    <span className="label-text font-bold text-slate-600">Incluir detalles de productos</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsExportModalOpen(false)} 
                  className="btn btn-ghost flex-1 h-14 rounded-2xl font-bold text-slate-500"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 h-14 rounded-2xl font-bold shadow-lg shadow-brand-200 border-none"
                >
                  Generar e Imprimir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
