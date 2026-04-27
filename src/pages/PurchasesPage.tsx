import React, { useState, useEffect } from 'react';
import { Plus, Search, Truck, Trash2, Minus, ShoppingCart, DollarSign, Eye, Calendar, User } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useCurrency } from '../hooks/useCurrency';
import Swal from 'sweetalert2';

interface Product {
  id: number;
  code: string;
  name: string;
  price_buy: number;
  stock: number;
}

interface Supplier {
  id: number;
  name: string;
}

interface PurchaseItem extends Product {
  quantity: number;
  unit_cost: number;
}

interface Purchase {
  id: number;
  supplier_name: string;
  total: number;
  date: string;
  status: 'completed' | 'voided';
  user_name?: string;
}

export const PurchasesPage: React.FC = () => {
  const { format } = useCurrency();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');

  const fetchData = async () => {
    try {
      const [pRes, prodRes, sRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/products'),
        api.get('/suppliers')
      ]);
      setPurchases(pRes.data);
      setProducts(prodRes.data);
      setSuppliers(sRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, unit_cost: 0 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0) return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateCost = (id: number, newCost: number) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, unit_cost: newCost } : item
    ));
  };

  const total = cart.reduce((acc, item) => acc + (item.unit_cost * item.quantity), 0);

  const handleSavePurchase = async () => {
    if (!selectedSupplier) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    const cartDetailsHtml = `
      <div class="mt-4 text-left border-t border-slate-100 pt-4">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resumen de Ingreso:</p>
        <div class="max-h-48 overflow-y-auto space-y-2 pr-2">
          ${cart.map(item => `
            <div class="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div class="flex flex-col">
                <span class="font-black text-slate-800">${item.name}</span>
                <span class="text-[10px] text-slate-500">${item.quantity} unidades x ${format(item.unit_cost)}</span>
              </div>
              <span class="font-bold text-brand-600">${format(item.unit_cost * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
        <div class="mt-4 pt-3 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
          <span class="font-black text-slate-800 text-sm uppercase">Total a Registrar:</span>
          <span class="font-black text-brand-600 text-lg">${format(total)}</span>
        </div>
      </div>
    `;

    const result = await Swal.fire({
      title: '¿Confirmar Ingreso?',
      html: `¿Estás seguro de registrar esta mercancía en el inventario? ${cartDetailsHtml}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, registrar todo',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-[2.5rem]',
        confirmButton: 'rounded-xl px-6 py-3 font-bold',
        cancelButton: 'rounded-xl px-6 py-3 font-bold'
      }
    });

    if (!result.isConfirmed) return;

    try {
      await api.post('/purchases', {
        supplier_id: parseInt(selectedSupplier),
        items: cart,
        total
      });
      toast.success('Compra registrada correctamente');
      setIsModalOpen(false);
      setCart([]);
      setSelectedSupplier('');
      fetchData();
    } catch (error) {
      toast.error('Error al registrar compra');
    }
  };

  const handleVoidPurchase = async (purchase: Purchase) => {
    const result = await Swal.fire({
      title: '¿Anular esta compra?',
      text: `Esta acción restará el stock ingresado y marcará la compra de "${purchase.supplier_name}" como ANULADA. ¿Deseas continuar?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, anular compra',
      cancelButtonText: 'No, mantener',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(`/purchases/${purchase.id}/void`);
      toast.success('Compra anulada correctamente');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular compra');
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const res = await api.get(`/purchases/${id}`);
      setSelectedPurchase(res.data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error('Error al cargar detalles');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p => 
    p.supplier_name.toLowerCase().includes(purchaseSearch.toLowerCase())
  );

  const totalInvestment = purchases.reduce((acc, p) => acc + (p.status === 'completed' ? p.total : 0), 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Registro de Compras</h2>
          <p className="text-slate-500 font-medium">Controla el ingreso de mercancía y costos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary h-14 px-8 gap-3 rounded-2xl shadow-xl shadow-brand-200 border-none normal-case text-lg font-bold"
        >
          <Plus size={24} />
          Registrar Compra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-[1.5rem] flex items-center justify-center">
            <DollarSign size={32} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Inversión Total</p>
            <h3 className="text-3xl font-black text-slate-800">{format(totalInvestment)}</h3>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center">
            <Truck size={32} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Compras</p>
            <h3 className="text-3xl font-black text-slate-800">{purchases.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por proveedor..."
              className="input input-bordered w-full pl-12 rounded-xl"
              value={purchaseSearch}
              onChange={(e) => setPurchaseSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="text-slate-500">
                <th className="bg-white">Proveedor</th>
                <th className="bg-white">Fecha</th>
                <th className="bg-white">Total</th>
                <th className="bg-white text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No hay compras registradas
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                          <Truck size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{p.supplier_name}</span>
                          {p.status === 'voided' && (
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">ANULADA</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-500 font-medium">{new Date(p.date).toLocaleString()}</td>
                    <td className={`font-black ${p.status === 'voided' ? 'text-slate-400 line-through' : 'text-brand-600'}`}>{format(p.total)}</td>
                    <td className="text-right space-x-2">
                      <button 
                        onClick={() => handleViewDetails(p.id)}
                        className="btn btn-ghost btn-sm text-brand-600 gap-2 rounded-xl"
                      >
                        <Eye size={16} /> Detalles
                      </button>
                      {p.status !== 'voided' && (
                        <button 
                          onClick={() => handleVoidPurchase(p)}
                          className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Compra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Registrar Ingreso de Mercancía</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Product Selection */}
              <div className="flex-1 p-6 border-r border-slate-100 overflow-y-auto space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-bold">1. Seleccionar Proveedor</span></label>
                  <select 
                    className="select select-bordered rounded-xl w-full"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">Selecciona un proveedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="label"><span className="label-text font-bold">2. Agregar Productos</span></label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o código..."
                      className="input input-bordered w-full pl-10 rounded-xl"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="flex flex-col p-3 rounded-xl border border-slate-100 hover:bg-brand-50 hover:border-brand-200 text-left transition-all"
                      >
                        <span className="font-bold text-sm text-slate-800">{p.name}</span>
                        <span className="text-xs text-slate-500 font-bold">Costo: {format(p.price_buy)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart */}
              <div className="w-full md:w-80 bg-slate-50/30 p-6 flex flex-col">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-brand-600" /> Resumen
                </h4>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span className="truncate pr-2">{item.name}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="btn btn-xs btn-circle btn-ghost"><Minus size={12} /></button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="btn btn-xs btn-circle btn-ghost"><Plus size={12} /></button>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Costo Unit.</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">$</span>
                            <input 
                              type="number" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-5 pr-2 py-1 text-xs font-bold text-brand-600 focus:ring-1 focus:ring-brand-500 outline-none"
                              value={item.unit_cost === 0 ? '' : item.unit_cost * 1000}
                              placeholder="0"
                              onChange={(e) => updateCost(item.id, (parseFloat(e.target.value) || 0) / 1000)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Subtotal</span>
                          <span className="text-xs font-black text-slate-600">{format(item.unit_cost * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm italic">Carrito vacío</div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex justify-between font-black text-xl">
                    <span>Total:</span>
                    <span className="text-brand-600">{format(total)}</span>
                  </div>

                  {cart.length > 0 && (
                    <div className="space-y-2">
                      {!selectedSupplier && (
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-2 animate-pulse">
                          ⚠️ Falta seleccionar un proveedor
                        </p>
                      )}
                      {cart.some(item => item.unit_cost === 0) && (
                        <p className="text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg flex items-center gap-2">
                          ❌ Hay productos con costo $ 0
                        </p>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={handleSavePurchase}
                    disabled={cart.length === 0 || !selectedSupplier || cart.some(item => item.unit_cost === 0)}
                    className="btn btn-primary w-full h-14 rounded-2xl border-none shadow-xl shadow-brand-200 text-lg font-bold disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    Guardar Compra
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {isDetailsOpen && selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Detalles de la Compra</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <Calendar className="text-slate-400" size={20} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Fecha</p>
                    <p className="text-sm font-bold">{new Date(selectedPurchase.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <User className="text-slate-400" size={20} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Proveedor</p>
                    <p className="text-sm font-bold">{selectedPurchase.supplier_name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Productos Comprados</p>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {selectedPurchase.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity} unidades x {format(item.price)}</p>
                      </div>
                      <p className="font-black text-slate-700">{format(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xl font-black text-slate-800">Total Inversión</span>
                <span className="text-2xl font-black text-brand-600">{format(selectedPurchase.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
