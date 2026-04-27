import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Eye, Calendar, User, Printer } from 'lucide-react';
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
  const { settings: globalSettings } = useConfig();
  const [activeTab, setActiveTab] = useState<'history'>('history');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isPOSOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isPOSOpen]);

  const addToCart = (product: Product, qty: number = 1) => {
    if (product.stock <= 0) {
      toast.error('Sin existencias');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity + qty > product.stock) {
        toast.error('No hay más stock disponible');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: qty }]);
    }
    setPosSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const found = products.find(p => p.code === posSearchTerm || p.name.toLowerCase() === posSearchTerm.toLowerCase());
      if (found) {
        addToCart(found);
      }
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
    // Crear un iframe oculto para impresión silenciosa
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

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
            <img src="/logo.jpg" class="logo" style="width: 40mm; height: auto; margin: 0 auto 5px; display: block; border-radius: 5px;" />
            <h2 class="uppercase" style="margin: 0;">${globalSettings.business_name}</h2>
            <p style="margin: 2px 0;">NIT: ${globalSettings.nit}</p>
            <p style="margin: 2px 0;">${globalSettings.address}</p>
            <p style="margin: 2px 0;">Tel: ${globalSettings.phone}</p>
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
          <div style="margin-top: 5px;">${itemsHtml}</div>
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
          ${sale.payment_method === 'efectivo' ? `
            <div class="flex-between">
              <span>Recibido:</span>
              <span>${format(sale.cash_received || 0)}</span>
            </div>
            <div class="flex-between font-bold">
              <span>Cambio:</span>
              <span>${format(sale.change_given || 0)}</span>
            </div>
          ` : ''}
          <div class="text-center" style="margin-top: 30px;">
            <p class="font-bold">¡GRACIAS POR SU COMPRA!</p>
            <div style="font-size: 8pt; margin-top: 15px; color: #666;">
              <p>Sistema desarrollado por Carlos Bastidas Ramos</p>
              <p>Tel: 304 218 9080</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.write(html);
      doc.close();
      
      // Pequeño delay para asegurar que el navegador cargue el contenido del iframe
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Limpiar el iframe después de un momento
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 100);
    }
  };

  const handleSaveSale = async () => {
    if (cart.length === 0) return;

    const cashVal = parseFloat(cashReceived) || 0;
    const totalReal = globalSettings.currency === 'COP' ? total * 1000 : total;
    
    if (paymentMethod === 'efectivo' && cashVal < totalReal) {
      toast.error('Monto recibido insuficiente');
      return;
    }

    try {
      const dbCashReceived = globalSettings.currency === 'COP' ? cashVal / 1000 : cashVal;
      
      const saleData = {
        items: cart,
        total,
        payment_method: paymentMethod,
        customer_id: selectedCustomer ? parseInt(selectedCustomer) : null,
        cash_received: paymentMethod === 'efectivo' ? dbCashReceived : total,
        change_given: paymentMethod === 'efectivo' ? dbCashReceived - total : 0,
        date: new Date().toISOString(),
        invoice_number: 'INV-' + Date.now().toString().slice(-6)
      };

      await api.post('/sales', saleData);
      
      const customerName = customers.find(c => c.id === parseInt(selectedCustomer))?.name || 'Consumidor Final';
      
      printReceipt({ ...saleData, customer_name: customerName });

      // MODAL ELEGANTE DE RESUMEN
      await Swal.fire({
        title: '<span class="text-2xl font-black uppercase italic tracking-tighter">Venta Exitosa</span>',
        html: `
          <div class="p-4 bg-slate-50 rounded-3xl border border-slate-100 mt-4">
            <div class="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
              <span class="text-slate-400 font-bold uppercase text-[10px]">Total Venta</span>
              <span class="text-xl font-black text-slate-800">${format(saleData.total)}</span>
            </div>
            ${paymentMethod === 'efectivo' ? `
              <div class="flex justify-between items-center mb-6">
                <span class="text-slate-400 font-bold uppercase text-[10px]">Recibido</span>
                <span class="text-xl font-bold text-slate-600">${format(saleData.cash_received)}</span>
              </div>
              <div class="bg-brand-500 p-6 rounded-2xl text-white shadow-xl shadow-brand-100">
                <p class="text-[10px] font-black uppercase opacity-80 mb-1">Cambio a Entregar</p>
                <h3 class="text-4xl font-black tracking-tighter">${format(saleData.change_given)}</h3>
              </div>
            ` : `
              <div class="bg-slate-800 p-6 rounded-2xl text-white">
                <p class="text-[10px] font-black uppercase opacity-60 mb-1">Método de Pago</p>
                <h3 class="text-2xl font-black uppercase">Tarjeta de Crédito/Débito</h3>
              </div>
            `}
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'LISTO (ENTER)',
        confirmButtonColor: '#0ea5e9',
        focusConfirm: true,
        allowEnterKey: true,
        allowOutsideClick: false,
        didOpen: () => {
          // Forzar el foco en el botón después de un instante
          setTimeout(() => {
            Swal.getConfirmButton()?.focus();
          }, 100);
        },
        customClass: {
          popup: 'rounded-[2.5rem] border-none shadow-2xl',
          confirmButton: 'rounded-2xl px-10 py-4 font-black uppercase tracking-widest text-sm'
        }
      });
      
      // RESET PARA SIGUIENTE VENTA
      setCart([]);
      setSelectedCustomer('');
      setCashReceived('');
      fetchData();
      
      // Auto-enfoque en el buscador para el siguiente cliente
      setTimeout(() => searchInputRef.current?.focus(), 500);

    } catch (error) {
      toast.error('Error al procesar venta');
    }
  };

  const handleViewDetails = async (saleId: number) => {
    try {
      const res = await api.get(`/sales/${saleId}`);
      setSelectedSale(res.data);
      setIsDetailsOpen(true);
    } catch (error) {
      toast.error('Error al recuperar detalles de la venta');
    }
  };

  const handleVoidSale = async (sale: any) => {
    const result = await Swal.fire({
      title: '¿Anular esta venta?',
      text: `Esta acción devolverá los productos al stock y marcará la factura #${sale.invoice_number} como ANULADA.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, anular venta',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      await api.post(`/sales/${sale.id}/void`);
      toast.success('Venta anulada correctamente');
      fetchData();
      setIsDetailsOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al anular venta');
    }
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/sales/${selectedSale.id}`, {
        customer_id: selectedSale.customer_id,
        payment_method: selectedSale.payment_method
      });
      toast.success('Venta actualizada');
      fetchData();
      setIsDetailsOpen(false);
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

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
            onClick={() => {
              setCart([]);
              setIsPOSOpen(true);
            }}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-brand-600 text-white shadow-lg shadow-brand-200"
          >
            Abrir Punto de Venta
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Historial de Ventas
          </button>
        </div>
      </div>

      {activeTab === 'history' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en historial..."
                className="input input-bordered w-full pl-12 rounded-xl h-12"
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
                  <th className="bg-white">Cliente</th>
                  <th className="bg-white">Fecha</th>
                  <th className="bg-white">Total</th>
                  <th className="bg-white text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-brand-600">#{sale.invoice_number}</span>
                        {sale.status === 'voided' && (
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">ANULADA</span>
                        )}
                      </div>
                    </td>
                    <td className="font-medium text-slate-700">{sale.customer_name || 'Consumidor Final'}</td>
                    <td className="text-slate-500 text-sm">{new Date(sale.date).toLocaleString()}</td>
                    <td className={`font-black ${sale.status === 'voided' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{format(sale.total)}</td>
                    <td className="text-right">
                      <button onClick={() => handleViewDetails(sale.id)} className="btn btn-ghost btn-sm text-brand-600 rounded-xl gap-2">
                        <Eye size={18} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POS MODAL - FULL SCREEN RESPONSIVE */}
      {isPOSOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="h-16 md:h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3 md:gap-6">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-500 rounded-lg md:rounded-xl flex items-center justify-center text-white font-black italic text-sm md:text-base">H</div>
              <h1 className="text-white font-black text-sm md:text-xl tracking-tight uppercase italic hidden sm:block">{globalSettings.business_name} <span className="text-brand-400">POS</span></h1>
            </div>
            
            <div className="flex-1 max-w-2xl mx-4 md:mx-12 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escanea o busca..."
                className="w-full bg-slate-800 border-none rounded-xl md:rounded-2xl h-10 md:h-14 pl-10 md:pl-12 pr-4 md:pr-6 text-white text-sm md:text-lg font-bold focus:ring-2 focus:ring-brand-500 transition-all outline-none placeholder:text-slate-600"
                value={posSearchTerm}
                onChange={(e) => setPosSearchTerm(e.target.value)}
                onKeyDown={handleBarcodeSearch}
              />
              
              {posSearchTerm.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden z-50 border border-slate-100 animate-in slide-in-from-top-2">
                  {products.filter(p => p.name.toLowerCase().includes(posSearchTerm.toLowerCase()) || p.code.includes(posSearchTerm)).slice(0, 5).map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-slate-800 text-sm md:text-base">{p.name}</span>
                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Code: {p.code} | Stock: {p.stock}</span>
                      </div>
                      <span className="font-black text-brand-600 text-sm md:text-base">{format(p.price_sell)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsPOSOpen(false)}
              className="bg-slate-800 hover:bg-red-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all group"
            >
              <Trash2 className="group-hover:scale-110 transition-transform w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
            {/* Left Area: Cart */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
              <div className="max-w-4xl mx-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 md:py-40">
                    <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="text-lg font-bold uppercase tracking-widest opacity-20 text-center px-4">El carrito está vacío<br/><span className="text-sm font-medium">Escanea un producto para empezar</span></p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 animate-in slide-in-from-left-4">
                      <div className="flex-1 min-w-[150px]">
                        <h3 className="text-lg md:text-xl font-black text-slate-800 line-clamp-1">{item.name}</h3>
                        <p className="text-xs md:text-sm font-bold text-slate-400">{format(item.price_sell)} c/u</p>
                      </div>
                      
                      <div className="flex items-center gap-2 md:gap-4 bg-slate-50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-slate-100 order-3 md:order-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl shadow-sm flex items-center justify-center hover:text-brand-600 transition-colors"><Minus size={18} /></button>
                        <span className="text-lg md:text-xl font-black w-8 md:w-12 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg md:rounded-xl shadow-sm flex items-center justify-center hover:text-brand-600 transition-colors"><Plus size={18} /></button>
                      </div>

                      <div className="w-auto md:w-40 text-right order-2 md:order-3">
                        <p className="text-xl md:text-2xl font-black text-brand-600 tracking-tight">{format(item.price_sell * item.quantity)}</p>
                      </div>

                      <button onClick={() => removeFromCart(item.id)} className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all order-4">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Area: Checkout Panel */}
            <div className="w-full lg:w-[400px] xl:w-[450px] bg-white border-t lg:border-t-0 lg:border-l border-slate-100 shadow-2xl p-4 md:p-8 flex flex-col shrink-0 overflow-y-auto max-h-[40vh] lg:max-h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mb-6 md:mb-8">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cliente</label>
                  <select 
                    className="select select-bordered w-full h-9 rounded-xl font-bold text-xs bg-slate-50 border-slate-200"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">Consumidor Final</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Pago</label>
                  <div className="flex gap-2">
                    <button onClick={() => setPaymentMethod('efectivo')} className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 border-2 transition-all ${paymentMethod === 'efectivo' ? 'bg-brand-500 border-brand-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      <Banknote size={16} /> <span className="font-bold text-[9px] uppercase">Efectivo</span>
                    </button>
                    <button onClick={() => setPaymentMethod('tarjeta')} className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 border-2 transition-all ${paymentMethod === 'tarjeta' ? 'bg-brand-500 border-brand-500 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      <CreditCard size={16} /> <span className="font-bold text-[9px] uppercase">Tarjeta</span>
                    </button>
                  </div>
                </div>
              </div>

              {paymentMethod === 'efectivo' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recibido</label>
                  </div>
                  <input 
                    type="number"
                    placeholder="$ 0"
                    className="w-full bg-white border-2 border-slate-200 rounded-lg h-9 px-3 text-lg font-black text-slate-800 focus:border-brand-500 outline-none transition-all"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveSale();
                      }
                    }}
                  />
                  {parseFloat(cashReceived) >= (globalSettings.currency === 'COP' ? total * 1000 : total) && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Cambio:</span>
                      <span className="text-lg font-black text-emerald-700 leading-none">
                        {format((parseFloat(cashReceived) - (globalSettings.currency === 'COP' ? total * 1000 : total)) / (globalSettings.currency === 'COP' ? 1000 : 1))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto space-y-3">
                <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                  <div className="relative z-10 flex flex-row lg:flex-col justify-between items-center lg:items-start">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total a Pagar</p>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-brand-400 leading-none">{format(total)}</h2>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSale}
                  disabled={cart.length === 0}
                  className="w-full h-14 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 text-white rounded-2xl text-xl font-black shadow-lg shadow-brand-200 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 uppercase"
                >
                  <ShoppingCart size={20} />
                  Finalizar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Detalles de Venta */}
      {isDetailsOpen && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Factura #{selectedSale.invoice_number}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedSale.status === 'voided' ? 'Esta venta fue anulada' : 'Venta completada'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => printReceipt(selectedSale)}
                  className="btn btn-ghost btn-sm text-brand-600 gap-2 rounded-xl"
                >
                  <Printer size={16} /> Imprimir
                </button>
                <button onClick={() => setIsDetailsOpen(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateSale} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <Calendar className="text-slate-400" size={20} />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Fecha y Hora</p>
                      <p className="text-sm font-bold">{new Date(selectedSale.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-brand-300 transition-all">
                    <User className="text-slate-400" size={20} />
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Cliente (Editable)</p>
                      <select 
                        className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none"
                        value={selectedSale.customer_id || ''}
                        onChange={(e) => setSelectedSale({...selectedSale, customer_id: e.target.value ? parseInt(e.target.value) : null})}
                        disabled={selectedSale.status === 'voided'}
                      >
                        <option value="">Consumidor Final</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Productos Vendidos</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {selectedSale.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl group hover:border-brand-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                            <ShoppingCart size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{item.quantity} unidades x {format(item.price)}</p>
                          </div>
                        </div>
                        <p className="font-black text-brand-600">{format(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                      <span className="text-3xl font-black text-slate-800">{format(selectedSale.total)}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</p>
                      <select 
                        className="bg-slate-100 rounded-lg px-2 py-1 text-xs font-bold border-none outline-none"
                        value={selectedSale.payment_method}
                        onChange={(e) => setSelectedSale({...selectedSale, payment_method: e.target.value})}
                        disabled={selectedSale.status === 'voided'}
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                  </div>
                  
                  {selectedSale.status !== 'voided' && (
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={() => handleVoidSale(selectedSale)}
                        className="btn btn-ghost text-red-500 font-bold px-6 h-12 rounded-xl hover:bg-red-50"
                      >
                        Anular Factura
                      </button>
                      <button 
                        type="submit"
                        className="btn btn-primary bg-brand-600 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-brand-100 border-none uppercase tracking-widest text-xs"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

