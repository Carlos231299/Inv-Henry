import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Printer, History, Eye } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { useCurrency } from '../hooks/useCurrency';
import { useConfig } from '../context/ConfigContext';

interface Product {
  id: number;
  code: string;
  name: string;
  price_sell: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
}

interface Sale {
  id: number;
  date: string;
  customer_name: string;
  total: number;
  payment_method: string;
  invoice_number: string;
}

export const SalesPage: React.FC = () => {
  const { format } = useCurrency();
  const { settings } = useConfig();
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const fetchData = async () => {
    try {
      const [pRes, cRes, sRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
        api.get('/sales')
      ]);
      setProducts(pRes.data);
      setCustomers(cRes.data);
      setSales(sRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Sin existencias');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('No hay más stock disponible');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price_sell * item.quantity), 0);

  const printReceipt = (sale: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = sale.items.map((item: any) => `
      <div style="margin-bottom: 5px;">
        <div style="text-transform: uppercase; font-weight: bold;">${item.name}</div>
        <div style="display: flex; justify-content: space-between;">
          <span>${item.quantity} x ${format(item.price || item.price_sell)}</span>
          <span>${format((item.price || item.price_sell) * item.quantity)}</span>
        </div>
      </div>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Factura ${sale.invoice_number}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 10pt; 
              width: 80mm; 
              margin: 0; 
              padding: 5mm;
              color: black;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .border-dashed { border-top: 1px dashed black; margin: 10px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            .uppercase { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 class="uppercase" style="margin: 0;">${settings.business_name}</h2>
            <p style="margin: 2px 0;">NIT: ${settings.nit}</p>
            <p style="margin: 2px 0;">${settings.address}</p>
            <p style="margin: 2px 0;">Tel: ${settings.phone}</p>
          </div>
          
          <div class="border-dashed"></div>
          <div class="text-center font-bold">FACTURA DE VENTA #${sale.invoice_number}</div>
          <p style="margin: 5px 0;">Fecha: ${new Date(sale.date).toLocaleString('es-CO')}</p>
          <p style="margin: 5px 0;">Cliente: ${sale.customer_name || 'Consumidor Final'}</p>
          
          <div class="border-dashed"></div>
          <div class="flex-between font-bold">
            <span>Descripción</span>
            <span>Total</span>
          </div>
          <div style="margin-top: 5px;">
            ${itemsHtml}
          </div>
 
          <div class="border-dashed"></div>
          <div class="flex-between font-bold" style="font-size: 1.2em;">
            <span>TOTAL:</span>
            <span>${format(sale.total)}</span>
          </div>
 
          <div class="border-dashed"></div>
          <div class="flex-between">
            <span>Método Pago:</span>
            <span class="uppercase">${sale.payment_method}</span>
          </div>
 
          <div class="text-center" style="margin-top: 30px;">
            <p class="font-bold">¡GRACIAS POR SU COMPRA!</p>
            <div style="font-size: 8pt; margin-top: 15px; color: #666;">
              <p>Sistema desarrollado por Carlos Bastidas Ramos</p>
              <p>Tel: 304 218 9080</p>
            </div>
          </div>
          
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleReprint = async (saleId: number) => {
    try {
      const res = await api.get(`/sales/${saleId}`);
      printReceipt(res.data);
    } catch (error) {
      toast.error('Error al recuperar detalles de la venta');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const result = await Swal.fire({
      title: 'Confirmar Venta',
      html: `
        <div class="text-left space-y-2">
          <p>Total a cobrar: <b>${format(total)}</b></p>
          <div class="form-control">
            <label class="label"><span class="label-text">Efectivo Recibido</span></label>
            <input type="number" id="swal-cash" class="input input-bordered w-full" value="${total}">
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Procesar e Imprimir',
      confirmButtonColor: '#0369a1',
      preConfirm: () => {
        const cashValue = (document.getElementById('swal-cash') as HTMLInputElement).value;
        return parseFloat(cashValue);
      }
    });

    if (result.isConfirmed) {
      try {
        const cashVal = result.value;
        const saleData = {
          items: cart,
          total,
          payment_method: paymentMethod,
          customer_id: selectedCustomer ? parseInt(selectedCustomer) : null,
          cash_received: cashVal,
          change: cashVal - total,
          date: new Date().toISOString(),
          invoice_number: 'INV-' + Date.now().toString().slice(-6)
        };

        await api.post('/sales', saleData);
        
        const customerName = customers.find(c => c.id === parseInt(selectedCustomer))?.name || 'Consumidor Final';
        
        printReceipt({ ...saleData, customer_name: customerName });

        toast.success('Venta realizada con éxito');
        setCart([]);
        setSelectedCustomer('');
        fetchData();

      } catch (error) {
        toast.error('Error al procesar venta');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSales = sales.filter(s => 
    (s.customer_name || 'Consumidor Final').toLowerCase().includes(historySearch.toLowerCase()) ||
    (s.invoice_number || '').toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Ventas</h2>
          <p className="text-slate-500 font-medium">Gestiona tu punto de venta e historial.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pos' ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Punto de Venta
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Historial
          </button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="lg:col-span-2 flex flex-col space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  className="input input-bordered w-full pl-12 rounded-2xl h-14 text-lg shadow-sm focus:ring-4 focus:ring-brand-500/10 border-slate-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-64">
                <select 
                  className="select select-bordered w-full h-14 rounded-2xl border-slate-100 shadow-sm font-bold text-slate-700"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Consumidor Final</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 flex-1 overflow-hidden flex flex-col shadow-sm">
              <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Catálogo</h3>
                <span className="badge badge-ghost font-bold rounded-lg">{filteredProducts.length} items</span>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="flex flex-col p-4 rounded-3xl border border-slate-50 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-left group disabled:opacity-50 bg-white shadow-sm hover:shadow-md"
                    >
                      <div className="font-black text-slate-800 line-clamp-1 mb-1">{product.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-4">Stock: {product.stock}</div>
                      <div className="mt-auto flex justify-between items-center w-full">
                        <span className="text-brand-600 font-black text-lg">{format(product.price_sell)}</span>
                        <div className="p-2 bg-slate-100 group-hover:bg-brand-500 group-hover:text-white rounded-xl transition-colors">
                          <Plus size={18} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-brand-600" />
                <h3 className="font-bold text-slate-800">Carrito</h3>
              </div>
              <span className="badge badge-primary rounded-lg">{cart.length} items</span>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex flex-col p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-brand-600"><Minus size={14} /></button>
                      <span className="px-3 font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-brand-600"><Plus size={14} /></button>
                    </div>
                    <span className="font-bold text-slate-700">{format(item.price_sell * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setPaymentMethod('efectivo')} className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition-all ${paymentMethod === 'efectivo' ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <Banknote size={20} /> <span className="text-xs mt-1 font-bold">Efectivo</span>
                </button>
                <button onClick={() => setPaymentMethod('tarjeta')} className={`flex-1 flex flex-col items-center p-3 rounded-2xl border transition-all ${paymentMethod === 'tarjeta' ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  <CreditCard size={20} /> <span className="text-xs mt-1 font-bold">Tarjeta</span>
                </button>
              </div>
              <div className="flex justify-between text-2xl font-black text-slate-900">
                <span>Total</span>
                <span>{format(total)}</span>
              </div>
              <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full btn btn-primary h-14 rounded-2xl text-lg shadow-xl shadow-brand-200 border-none">
                <Printer size={20} className="mr-2" /> Finalizar Venta
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por factura o cliente..."
                className="input input-bordered w-full pl-12 rounded-xl"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="text-slate-500">
                  <th className="bg-white">Factura</th>
                  <th className="bg-white">Fecha</th>
                  <th className="bg-white">Cliente</th>
                  <th className="bg-white">Método</th>
                  <th className="bg-white">Total</th>
                  <th className="bg-white text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <td className="font-bold text-slate-800">{sale.invoice_number || `#${sale.id}`}</td>
                    <td>{new Date(sale.date).toLocaleString()}</td>
                    <td>{sale.customer_name || 'Consumidor Final'}</td>
                    <td>
                      <span className="badge badge-ghost capitalize rounded-lg">{sale.payment_method}</span>
                    </td>
                    <td className="font-black text-brand-600">{format(sale.total)}</td>
                    <td className="text-right space-x-2">
                      <button 
                        onClick={() => handleReprint(sale.id)}
                        className="btn btn-ghost btn-sm text-brand-600 gap-2 rounded-xl"
                      >
                        <Printer size={16} /> Reimprimir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
