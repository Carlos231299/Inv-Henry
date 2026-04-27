import React, { useState } from 'react';
import { Settings, Shield, Bell, Save, User, Key, Mail, AlertTriangle, Coins } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, isLoading } = useConfig();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(settings);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: '¿Guardar configuración?',
      text: '¿Estás seguro de que deseas actualizar la configuración general del sistema?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, aplicar cambios',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      await updateSettings(formData);
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Cargando configuración...</div>;

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Configuración</h2>
        <p className="text-slate-500 font-medium">Administra las preferencias de {settings.business_name}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-72 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-brand-600 text-white shadow-xl shadow-brand-200' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 md:p-12 relative overflow-hidden">
          <form onSubmit={handleSave} className="space-y-8 relative z-10">
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Información del Negocio</h3>
                    <p className="text-sm text-slate-500">Configuración básica que aparecerá en tus facturas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-700">Nombre del Negocio</span></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input name="business_name" value={formData.business_name} onChange={handleChange} className="input input-bordered w-full pl-12 rounded-xl h-12" />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-700">NIT / RUT</span></label>
                    <input name="nit" value={formData.nit} onChange={handleChange} className="input input-bordered w-full rounded-xl h-12" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-700">Moneda</span></label>
                    <div className="relative">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select name="currency" value={formData.currency} onChange={handleChange} className="select select-bordered w-full pl-12 rounded-xl h-12 font-bold">
                        <option value="COP">Peso Colombiano (COP)</option>
                        <option value="USD">Dólar Estadounidense (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="MXN">Peso Mexicano (MXN)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-700">Formato de Región (Locale)</span></label>
                    <select name="currency_locale" value={formData.currency_locale} onChange={handleChange} className="select select-bordered w-full rounded-xl h-12">
                      <option value="es-CO">Colombia (es-CO)</option>
                      <option value="en-US">Estados Unidos (en-US)</option>
                      <option value="es-MX">México (es-MX)</option>
                      <option value="es-ES">España (es-ES)</option>
                    </select>
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label"><span className="label-text font-bold text-slate-700">Dirección</span></label>
                    <input name="address" value={formData.address} onChange={handleChange} className="input input-bordered w-full rounded-xl h-12" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-700">Teléfono</span></label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="input input-bordered w-full rounded-xl h-12" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seguridad' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Seguridad de la Cuenta</h3>
                    <p className="text-sm text-slate-500">Gestiona accesos y contraseñas.</p>
                  </div>
                </div>

                <div className="max-w-md space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 flex gap-3">
                    <AlertTriangle className="shrink-0" />
                    <p className="text-sm">Para cambiar la contraseña del administrador principal, contacte al soporte técnico o use la función de restablecimiento.</p>
                  </div>
                  <button type="button" className="btn btn-outline w-full rounded-xl gap-2 h-12 border-slate-200">
                    <Key size={18} />
                    Cambiar mi Contraseña
                  </button>
                  <button type="button" className="btn btn-ghost w-full rounded-xl gap-2 h-12 text-slate-500">
                    Ver Registro de Actividad
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notificaciones' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <Bell size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Alertas y Notificaciones</h3>
                    <p className="text-sm text-slate-500">Mantente informado sobre el estado de tu inventario.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-700">Stock Mínimo Global (Alerta)</span></label>
                    <input type="number" name="low_stock_alert" value={formData.low_stock_alert} onChange={handleChange} className="input input-bordered w-full rounded-xl h-12" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-slate-700">Email para Reportes Diarios</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="email" name="daily_summary_email" value={formData.daily_summary_email} onChange={handleChange} className="input input-bordered w-full pl-12 rounded-xl h-12" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button type="submit" className="btn btn-primary px-10 h-14 rounded-2xl shadow-xl shadow-brand-100 gap-3 border-none normal-case text-lg">
                <Save size={20} />
                Guardar Cambios
              </button>
            </div>
          </form>

          {/* Decorative Background Element */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-50 rounded-full blur-3xl opacity-50 z-0"></div>
        </div>
      </div>
    </div>
  );
};
