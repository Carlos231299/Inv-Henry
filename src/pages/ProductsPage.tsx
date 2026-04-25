import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Barcode } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { formatCurrency } from '../utils/currency';

interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  price_buy: number;
  price_sell: number;
  stock: number;
  min_stock: number;
  category_id: number;
  category_name?: string;
}

interface Category {
  id: number;
  name: string;
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price_buy: 0,
    price_sell: 0,
    stock: 0,
    min_stock: 5,
    category_id: ''
  });

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', formData);
        toast.success('Producto creado');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0369a1',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Producto eliminado');
        fetchData();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
          <p className="text-slate-500">Inventario total de Henry SAS</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              code: '', name: '', description: '',
              price_buy: 0, price_sell: 0, stock: 0, min_stock: 5,
              category_id: ''
            });
            setIsModalOpen(true);
          }}
          className="btn btn-primary gap-2 rounded-xl"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              className="input input-bordered w-full pl-10 rounded-xl focus:ring-2 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="text-slate-500">
                <th className="bg-white">Producto</th>
                <th className="bg-white">Categoría</th>
                <th className="bg-white">Stock</th>
                <th className="bg-white">Precio Venta</th>
                <th className="bg-white text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Barcode size={12} /> {p.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-ghost rounded-lg">{p.category_name || 'Sin categoría'}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${p.stock <= p.min_stock ? 'text-red-500' : 'text-slate-700'}`}>
                        {p.stock}
                      </span>
                      {p.stock <= p.min_stock && (
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      )}
                    </div>
                  </td>
                  <td className="font-semibold text-brand-600">{formatCurrency(p.price_sell)}</td>
                  <td className="text-right space-x-1">
                    <button 
                      onClick={() => {
                        setEditingProduct(p);
                        setFormData({ ...p, category_id: p.category_id?.toString() || '' });
                        setIsModalOpen(true);
                      }}
                      className="btn btn-ghost btn-sm text-brand-600 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-sm text-red-500 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Código</span></label>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Nombre</span></label>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-semibold">Categoría</span></label>
                  <select 
                    className="select select-bordered rounded-xl"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Precio Compra</span></label>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered rounded-xl"
                    value={formData.price_buy}
                    onChange={(e) => setFormData({...formData, price_buy: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Precio Venta</span></label>
                  <input
                    type="number"
                    step="0.01"
                    className="input input-bordered rounded-xl"
                    value={formData.price_sell}
                    onChange={(e) => setFormData({...formData, price_sell: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Stock Inicial</span></label>
                  <input
                    type="number"
                    className="input input-bordered rounded-xl"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Stock Mínimo</span></label>
                  <input
                    type="number"
                    className="input input-bordered rounded-xl"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 rounded-xl">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1 rounded-xl">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
