import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Users, Phone, Mail, IdCard } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface Customer {
  id: number;
  document: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    document: '',
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Cliente actualizado');
      } else {
        await api.post('/customers', formData);
        toast.success('Cliente creado');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0369a1',
      confirmButtonText: 'Sí, eliminar',
      customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl', cancelButton: 'rounded-xl' }
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/customers/${id}`);
        toast.success('Cliente eliminado');
        fetchData();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clientes</h2>
          <p className="text-slate-500">Gestión de clientes de Henry SAS</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ document: '', name: '', email: '', phone: '', address: '' });
            setIsModalOpen(true);
          }}
          className="btn btn-primary gap-2 rounded-xl"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
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
                <th className="bg-white">Cliente</th>
                <th className="bg-white">Documento</th>
                <th className="bg-white">Teléfono</th>
                <th className="bg-white">Email</th>
                <th className="bg-white text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                        <Users size={20} />
                      </div>
                      <div className="font-bold text-slate-800">{c.name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-slate-500">
                      <IdCard size={14} /> {c.document}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone size={14} /> {c.phone}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Mail size={14} /> {c.email}
                    </div>
                  </td>
                  <td className="text-right space-x-1">
                    <button 
                      onClick={() => {
                        setEditingCustomer(c);
                        setFormData({ ...c });
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
                {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Documento / NIT</span></label>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Nombre Completo</span></label>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Email</span></label>
                  <input
                    type="email"
                    className="input input-bordered rounded-xl"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Teléfono</span></label>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text font-semibold">Dirección</span></label>
                  <input
                    type="text"
                    className="input input-bordered rounded-xl"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1 rounded-xl">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1 rounded-xl">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
