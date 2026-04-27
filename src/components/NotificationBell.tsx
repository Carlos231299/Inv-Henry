import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';
import { useConfig } from '../context/ConfigContext';

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const { settings } = useConfig();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchLowStock = async () => {
    try {
      const res = await api.get('/products');
      const globalMin = Number(settings.low_stock_alert) || 5;
      
      const lowStock = res.data.filter((p: any) => {
        const threshold = p.min_stock > 0 ? p.min_stock : globalMin;
        return p.stock <= threshold;
      });
      
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  useEffect(() => {
    fetchLowStock();
    // Poll every 30 seconds for stock changes
    const interval = setInterval(fetchLowStock, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2.5 rounded-2xl transition-all relative group",
          isOpen ? "bg-brand-50 text-brand-600 ring-2 ring-brand-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
        )}
      >
        <Bell size={22} className={cn(lowStockProducts.length > 0 && "animate-bounce")} />
        
        {lowStockProducts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
            {lowStockProducts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Alertas de Inventario</h3>
            <span className="badge badge-error badge-sm text-[10px] font-black rounded-lg">
              {lowStockProducts.length} PENDIENTES
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {lowStockProducts.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4 hover:bg-red-50/30 transition-colors flex gap-4 items-start group">
                    <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-red-700 transition-colors">{product.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                        Existencia: <span className="text-red-600">{product.stock}</span> 
                        <span className="mx-2">|</span> 
                        Límite: {product.min_stock || settings.low_stock_alert}
                      </p>
                      <button 
                        onClick={() => {
                          window.location.href = '/productos';
                        }}
                        className="mt-3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all shadow-sm"
                      >
                        Abastecer Inventario
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full mb-4">
                  <Package size={32} />
                </div>
                <p className="text-sm font-bold text-slate-800">¡Todo en orden!</p>
                <p className="text-xs text-slate-400 mt-1">No hay productos con stock bajo.</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cerrar Notificaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
