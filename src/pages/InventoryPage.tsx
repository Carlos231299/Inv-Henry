import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowDown } from 'lucide-react';
import api from '../services/api';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await api.get('/products');
      setProducts(res.data);
    };
    fetchProducts();
  }, []);

  const lowStock = products.filter(p => p.stock <= p.min_stock);
  const outOfStock = products.filter(p => p.stock <= 0);
  const totalValue = products.reduce((acc, p) => acc + (p.stock * p.price_buy), 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl w-fit mb-4">
            <Package size={24} />
          </div>
          <p className="text-slate-500 text-sm">Valor Total Inventario</p>
          <h3 className="text-2xl font-bold text-slate-800">${totalValue.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
            <AlertTriangle size={24} />
          </div>
          <p className="text-slate-500 text-sm">Productos Stock Bajo</p>
          <h3 className="text-2xl font-bold text-slate-800">{lowStock.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl w-fit mb-4">
            <ArrowDown size={24} />
          </div>
          <p className="text-slate-500 text-sm">Sin Existencias</p>
          <h3 className="text-2xl font-bold text-slate-800">{outOfStock.length}</h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Control de Existencias</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="bg-white">Producto</th>
                <th className="bg-white">Categoría</th>
                <th className="bg-white">Stock Actual</th>
                <th className="bg-white">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 border-b border-slate-50">
                  <td className="font-semibold text-slate-800">{p.name}</td>
                  <td><span className="badge badge-ghost">{p.category_name}</span></td>
                  <td className="font-bold text-slate-700">{p.stock}</td>
                  <td>
                    {p.stock <= 0 ? (
                      <span className="badge badge-error text-white rounded-lg px-3">Agotado</span>
                    ) : p.stock <= p.min_stock ? (
                      <span className="badge badge-warning text-white rounded-lg px-3">Stock Bajo</span>
                    ) : (
                      <span className="badge badge-success text-white rounded-lg px-3">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
