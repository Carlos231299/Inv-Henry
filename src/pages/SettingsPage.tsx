import React from 'react';
import { Settings, Shield, Bell, Database, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const sections = [
    { 
      title: 'General', 
      icon: Settings, 
      desc: 'Configuración básica del sistema y empresa',
      items: ['Nombre del negocio', 'NIT / RUT', 'Moneda', 'Zona horaria']
    },
    { 
      title: 'Seguridad', 
      icon: Shield, 
      desc: 'Roles, permisos y contraseñas',
      items: ['Gestión de usuarios', 'Cambiar contraseña', 'Registro de actividad']
    },
    { 
      title: 'Notificaciones', 
      icon: Bell, 
      desc: 'Alertas de stock y ventas',
      items: ['Alertas de stock bajo', 'Resumen diario', 'Email de reportes']
    },
    { 
      title: 'Base de Datos', 
      icon: Database, 
      desc: 'Respaldos y mantenimiento',
      items: ['Backup manual', 'Restaurar datos', 'Limpiar temporales']
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configuración</h2>
        <p className="text-slate-500">Administra las preferencias de Henry SAS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                <section.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{section.title}</h3>
                <p className="text-sm text-slate-500">{section.desc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <span className="text-slate-700 font-medium group-hover:text-brand-600">{item}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    →
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-brand-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white/10 rounded-full">
            <Globe size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Estado del Sistema</h3>
            <p className="text-brand-200">Versión 1.0.0 - Todos los servicios operativos</p>
          </div>
        </div>
        <button className="btn bg-white text-brand-900 hover:bg-brand-50 border-none px-8 rounded-xl font-bold">
          Buscar Actualizaciones
        </button>
      </div>
    </div>
  );
};
