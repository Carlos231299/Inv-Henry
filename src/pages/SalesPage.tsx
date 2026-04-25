import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Printer } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

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

export const SalesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [cashReceived, setCashReceived] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          api.get('/products'),
          api.get('/customers')
        ]);
        setProducts(pRes.data);
        setCustomers(cRes.data);
      } catch (error) {
        toast.error('Error al cargar datos');
      }
    };
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
        <div style="text-transform: uppercase;">${item.name}</div>
        <div style="display: flex; justify-content: space-between;">
          <span>${item.quantity} unit x $${item.price_sell.toLocaleString()}</span>
          <span>$${(item.price_sell * item.quantity).toLocaleString()}</span>
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
            <h2 class="uppercase" style="margin: 0;">Carnicería Salomé</h2>
            <p style="margin: 2px 0;">NIT: 9015980377</p>
            <p style="margin: 2px 0;">Calle 10 15 56 ZN MDO</p>
            <p style="margin: 2px 0;">BRR CENTRO</p>
            <p style="margin: 2px 0;">Cel: 300 877 6325</p>
          </div>
          
          <div class="border-dashed"></div>
          <div class="text-center font-bold">FACTURA DE VENTA #${sale.invoice_number}</div>
          <p style="margin: 5px 0;">Fecha: ${new Date(sale.date).toLocaleString('es-CO')}</p>
          <p style="margin: 5px 0;">Cliente: ${sale.customerName}</p>
          
          <div class="border-dashed"></div>
          <div class="flex-between font-bold">
            <span>Desc.</span>
            <span>Total</span>
          </div>
          <div style="margin-top: 5px;">
            ${itemsHtml}
          </div>

          <div class="border-dashed"></div>
          <div class="flex-between">
            <span>Subtotal:</span>
            <span>$${sale.total.toLocaleString()}</span>
          </div>
          <div class="flex-between font-bold" style="font-size: 1.2em; margin-top: 5px;">
            <span>TOTAL A PAGAR:</span>
            <span>$${sale.total.toLocaleString()}</span>
          </div>

          <div class="border-dashed"></div>
          <div class="flex-between">
            <span>Método Pago:</span>
            <span class="uppercase">${sale.payment_method}</span>
          </div>
          <div class="flex-between">
            <span>Recibido:</span>
            <span>$${sale.cash_received?.toLocaleString()}</span>
          </div>
          <div class="flex-between">
            <span>Cambio:</span>
            <span>$${(sale.change || 0).toLocaleString()}</span>
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const result = await Swal.fire({
      title: 'Confirmar Venta',
      html: `
        <div class="text-left space-y-2">
          <p>Total a cobrar: <b>$${total.toLocaleString()}</b></p>
          <div class="form-control">
            <label class="label"><span class="label-text">Efectivo Recibido</span></label>
            <input type="number" id="swal-cash" class="input input-bordered w-full" value="${cashReceived || total}">
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
          invoice_number: '00' + Math.floor(Math.random() * 10000)
        };

        await api.post('/sales', saleData);
        
        const customerName = customers.find(c => c.id === parseInt(selectedCustomer))?.name || 'Consumidor Final';
        
        printReceipt({ ...saleData, customerName });

        toast.success('Venta realizada con éxito');
        setCart([]);
        setSelectedCustomer('');

        // Refetch products to update stock
        const pRes = await api.get('/products');
        setProducts(pRes.data);

      } catch (error) {
        toast.error('Error al procesar venta');
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="input input-bordered w-full pl-12 rounded-2xl h-14 text-lg shadow-sm focus:ring-2 focus:ring-brand-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-64">
            <select 
              className="select select-bordered w-full h-14 rounded-2xl"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">Consumidor Final</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 flex-1 overflow-auto p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="flex flex-col p-4 rounded-2xl border border-slate-50 hover:border-brand-200 hover:bg-brand-50/30 transition-all text-left group disabled:opacity-50"
              >
                <div className="font-bold text-slate-800 line-clamp-1">{product.name}</div>
                <div className="text-xs text-slate-500 mb-2">Stock: {product.stock}</div>
                <div className="mt-auto flex justify-between items-center w-full">
                  <span className="text-brand-600 font-bold">${product.price_sell.toLocaleString()}</span>
                  <div className="p-2 bg-slate-100 group-hover:bg-brand-500 group-hover:text-white rounded-xl transition-colors">
                    <Plus size={16} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart / Checkout */}
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
                <span className="font-bold text-slate-700">${(item.price_sell * item.quantity).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setPaymentMethod('efectivo')} className={`flex-1 flex flex-col items-center p-3 rounded-2xl border ${paymentMethod === 'efectivo' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}>
              <Banknote size={20} /> <span className="text-xs mt-1">Efectivo</span>
            </button>
            <button onClick={() => setPaymentMethod('tarjeta')} className={`flex-1 flex flex-col items-center p-3 rounded-2xl border ${paymentMethod === 'tarjeta' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'}`}>
              <CreditCard size={20} /> <span className="text-xs mt-1">Tarjeta</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-2xl font-black text-slate-900">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full btn btn-primary h-14 rounded-2xl text-lg shadow-xl shadow-brand-900/20">
            <Printer size={20} className="mr-2" /> Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  );
};
