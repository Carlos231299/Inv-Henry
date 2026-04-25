import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Tags, Hash } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface Category {
  id: number;
  name: string;
}

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      toast.error('Error al cargar categorías');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast.success('Categoría actualizada');
      } else {
        await api.post('/categories', formData);
        toast.success('Categoría creada');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0369a1',
      confirmButtonText: 'Sí, eliminar',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl' }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success('Categoría eliminada');
        fetchData();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Categorías de Productos</h2>
          <p className="text-slate-500 font-medium">Clasifica tus productos para un mejor control.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '' });
            setIsModalOpen(true);
          }}
          className="btn btn-primary h-14 px-8 gap-3 rounded-2xl shadow-xl shadow-brand-200 border-none normal-case text-lg font-bold"
        >
          <Plus size={24} />
          Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-[1.5rem] flex items-center justify-center">
            <Tags size={32} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Categorías</p>
            <h3 className="text-3xl font-black text-slate-800">{categories.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
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
                <th className="bg-white w-20">ID</th>
                <th className="bg-white">Nombre de Categoría</th>
                <th className="bg-white text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                  <td>
                    <div className="flex items-center gap-2 text-slate-400 font-bold">
                      <Hash size={16} /> {c.id}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-800">{c.name}</div>
                  </td>
                  <td className="text-right space-x-1">
                    <button 
                      onClick={() => {
                        setEditingCategory(c);
                        setFormData({ name: c.name });
                        setIsModalOpen(true);
                      }}
                      className="btn btn-ghost btn-sm text-brand-600 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm text-red-500 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-slate-400 italic">No se encontraron categorías</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Nombre de la Categoría</span></label>
                <input
                  type="text"
                  className="input input-bordered rounded-xl"
                  placeholder="Ejem: Bebidas, Carnes, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 rounded-xl">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1 rounded-xl">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
