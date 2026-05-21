import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  // Inicializar rol simulado según el rol real del usuario
  const [role, setRole] = useState(user?.rol || 'cliente');
  
  const [motos, setMotos] = useState([
    { id: 1, placa: 'XYZ-123', marca: 'Yamaha', modelo: 'MT-09', color: 'Negro Mate', cilindraje: '847cc', anio: 2023, cliente: 'Juan Pérez', estado: 'En Mantenimiento' },
    { id: 2, placa: 'ABC-789', marca: 'Honda', modelo: 'CB650R', color: 'Rojo Neo', cilindraje: '649cc', anio: 2022, cliente: 'María Rodríguez', estado: 'Listo para Entrega' },
    { id: 3, placa: 'MNO-456', marca: 'KTM', modelo: 'Duke 390', color: 'Naranja/Blanco', cilindraje: '373cc', anio: 2024, cliente: 'Carlos Gómez', estado: 'Ingresado' },
    { id: 4, placa: 'JKL-987', marca: 'BMW', modelo: 'F850GS', color: 'Gris/Amarillo', cilindraje: '853cc', anio: 2021, cliente: 'Sofía Martínez', estado: 'En Diagnóstico' },
  ]);

  // Sincronizar el rol si el usuario cambia en caliente
  useEffect(() => {
    if (user) {
      setRole(user.rol);
    }
  }, [user]);

  // Nuevos estados para registrar motos
  const [newPlaca, setNewPlaca] = useState('');
  const [newMarca, setNewMarca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [newCliente, setNewCliente] = useState('');

  const handleAddMoto = (e) => {
    e.preventDefault();
    if (!newPlaca || !newMarca || !newModelo || !newCliente) return;
    const newMoto = {
      id: motos.length + 1,
      placa: newPlaca.toUpperCase(),
      marca: newMarca,
      modelo: newModelo,
      color: 'Gris Oscuro',
      cilindraje: '400cc',
      anio: 2024,
      cliente: newCliente,
      estado: 'Ingresado'
    };
    setMotos([newMoto, ...motos]);
    setNewPlaca('');
    setNewMarca('');
    setNewModelo('');
    setNewCliente('');
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Luces decorativas de fondo */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-brand-secondary/10 blur-[120px] pointer-events-none"></div>

      {/* HEADER DE LA CONSOLA */}
      <header className="glass border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 animate-pulse-subtle">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none">MOTO<span className="text-brand-primary">BOSS</span></h1>
            <span className="text-[10px] uppercase tracking-widest text-brand-text-muted">Enterprise Console</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Switch de roles exclusivo para demostración interactiva en la demo */}
          <div className="hidden lg:flex items-center gap-2 bg-brand-surface border border-white/5 p-1 rounded-lg">
            <span className="text-xs text-brand-text-muted px-2 font-mono">Demo Mode (Simular Rol):</span>
            {['admin', 'empleado', 'cliente'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`text-xs px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer ${
                  role === r 
                    ? 'bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-medium shadow-md' 
                    : 'text-brand-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button 
            onClick={logout}
            className="text-xs bg-white/5 hover:bg-brand-accent-red/20 border border-white/10 hover:border-brand-accent-red/30 px-4 py-2 rounded-lg text-brand-text-muted hover:text-white transition-all cursor-pointer"
          >
            Salir de la Consola
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex items-center justify-center p-6 z-10 w-full">
        <div className="w-full max-w-6xl space-y-6">
          
          {/* Barra superior de estado */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass rounded-2xl p-6 border border-white/5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></span>
                Consola Conectada a la API
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight m-0">Hola, {user?.nombre || 'Usuario'}</h2>
              <p className="text-xs text-brand-text-muted mt-0.5">
                Sesión activa: <span className="text-white font-medium">{user?.correo}</span> | Rol real: <span className="text-brand-secondary font-bold uppercase">{user?.rol}</span> {role !== user?.rol && <span className="text-brand-primary font-bold">(Simulando: {role.toUpperCase()})</span>}
              </p>
            </div>

            {/* Selector de rol en móvil */}
            <div className="flex lg:hidden items-center gap-2 bg-brand-surface border border-white/5 p-1 rounded-lg self-start">
              <span className="text-xs text-brand-text-muted px-2 font-mono">Demo:</span>
              {['admin', 'empleado', 'cliente'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`text-[10px] px-2 py-1 rounded-md capitalize transition-all cursor-pointer ${
                    role === r 
                      ? 'bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-medium' 
                      : 'text-brand-text-muted hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* TARGETAS DE MÉTRICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-brand-primary/20 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-all"></div>
              <span className="text-xs text-brand-text-muted uppercase font-bold tracking-wider">Motos en Taller</span>
              <h3 className="text-3xl font-extrabold text-white mt-2 mb-1">{motos.length} <span className="text-xs font-normal text-brand-accent-green">Activas</span></h3>
              <p className="text-xs text-brand-text-muted">Total de unidades bajo nuestra gestión</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-brand-secondary/20 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl group-hover:bg-brand-secondary/10 transition-all"></div>
              <span className="text-xs text-brand-text-muted uppercase font-bold tracking-wider">Servicios Activos</span>
              <h3 className="text-3xl font-extrabold text-white mt-2 mb-1">
                {motos.filter(m => m.estado === 'En Mantenimiento' || m.estado === 'En Diagnóstico').length}
              </h3>
              <p className="text-xs text-brand-text-muted">Motos actualmente en diagnóstico o reparación</p>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-brand-primary/20 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-all"></div>
              <span className="text-xs text-brand-text-muted uppercase font-bold tracking-wider">Listas para Entrega</span>
              <h3 className="text-3xl font-extrabold text-white mt-2 mb-1 text-brand-accent-green font-mono">
                {motos.filter(m => m.estado === 'Listo para Entrega').length}
              </h3>
              <p className="text-xs text-brand-text-muted">Unidades completadas listas para retiro</p>
            </div>
          </div>

          {/* CUERPO CENTRAL DE LA INTERFAZ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Panel Izquierdo: Formularios según Rol */}
            <div className="lg:col-span-1 glass p-6 rounded-2xl border border-white/5 h-fit">
              <h3 className="text-lg font-bold text-white tracking-tight mb-4">
                {role === 'cliente' ? 'Tu Acceso de Cliente' : 'Registrar Motocicleta'}
              </h3>
              
              {role === 'cliente' ? (
                <div className="space-y-4">
                  <div className="bg-brand-surface/40 p-4 rounded-xl border border-white/5 text-xs text-brand-text-muted leading-relaxed">
                    <p className="font-semibold text-white mb-2">💡 Información de Cliente:</p>
                    Desde esta consola podés monitorear el estado actual de tus motocicletas en mantenimiento, ver el historial de diagnósticos y descargar cotizaciones. 
                    <p className="mt-2">Para agregar vehículos o contratar nuevos servicios, por favor contactanos en la recepción del taller.</p>
                  </div>
                  <div className="p-4 border border-brand-primary/10 bg-brand-primary/5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary">Soporte Técnico</span>
                    <p className="text-xs text-white mt-1">Línea directa: +57 (8) 871-9900</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddMoto} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-text-muted mb-2">Placa (Patente)</label>
                    <input 
                      type="text" 
                      required 
                      value={newPlaca}
                      onChange={(e) => setNewPlaca(e.target.value)}
                      placeholder="XYZ-123"
                      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text-muted mb-2">Marca</label>
                    <input 
                      type="text" 
                      required 
                      value={newMarca}
                      onChange={(e) => setNewMarca(e.target.value)}
                      placeholder="Yamaha"
                      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text-muted mb-2">Modelo</label>
                    <input 
                      type="text" 
                      required 
                      value={newModelo}
                      onChange={(e) => setNewModelo(e.target.value)}
                      placeholder="XTZ 250"
                      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-text-muted mb-2">Cliente Propietario</label>
                    <input 
                      type="text" 
                      required 
                      value={newCliente}
                      onChange={(e) => setNewCliente(e.target.value)}
                      placeholder="Camilo Torres"
                      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-xs mt-2"
                  >
                    Añadir a Taller
                  </button>
                </form>
              )}
            </div>

            {/* Panel Derecho: Tabla de Motocicletas */}
            <div className="lg:col-span-2 glass rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-tight m-0">Motocicletas Ingresadas</h3>
                <div className="bg-brand-surface/60 border border-white/5 rounded-lg px-3 py-1 text-xs text-brand-text-muted">
                  Mostrando <span className="text-white font-medium">{role === 'cliente' ? 1 : motos.length}</span> unidades
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-surface/40 text-[10px] text-brand-text-muted uppercase tracking-wider border-b border-white/5">
                      <th className="px-6 py-4 font-semibold">Placa</th>
                      <th className="px-6 py-4 font-semibold">Vehículo</th>
                      <th className="px-6 py-4 font-semibold">Propietario</th>
                      <th className="px-6 py-4 font-semibold">Estado</th>
                      {role !== 'cliente' && <th className="px-6 py-4 font-semibold text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {(role === 'cliente' ? motos.slice(0, 1) : motos).map((moto) => (
                      <tr key={moto.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-brand-primary">{moto.placa}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{moto.marca}</div>
                          <div className="text-[10px] text-brand-text-muted">{moto.modelo} ({moto.anio})</div>
                        </td>
                        <td className="px-6 py-4 text-brand-text-muted">{moto.cliente}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            moto.estado === 'Listo para Entrega' 
                              ? 'bg-brand-accent-green/10 text-brand-accent-green border border-brand-accent-green/20' 
                              : moto.estado === 'En Mantenimiento'
                              ? 'bg-brand-accent-yellow/10 text-brand-accent-yellow border border-brand-accent-yellow/20'
                              : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              moto.estado === 'Listo para Entrega' 
                                ? 'bg-brand-accent-green' 
                                : moto.estado === 'En Mantenimiento'
                                ? 'bg-brand-accent-yellow'
                                : 'bg-brand-primary'
                            }`}></span>
                            {moto.estado}
                          </span>
                        </td>
                        {role !== 'cliente' && (
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                if (confirm(`¿Eliminar registro de la moto ${moto.placa}?`)) {
                                  setMotos(motos.filter(m => m.id !== moto.id));
                                }
                              }}
                              className="text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 px-2.5 py-1 rounded-lg hover:bg-brand-accent-red/20 transition-all text-[10px] cursor-pointer"
                            >
                              Dar de Baja
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-white/5 bg-brand-surface/20 text-center text-[10px] text-brand-text-muted">
                Desarrollado para MotoBoss S.A. • Sistema de Gestión de Taller Integral • Colombia
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER GENERAL */}
      <footer className="glass border-t border-white/5 py-4 px-6 text-center text-xs text-brand-text-muted z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="m-0">© {new Date().getFullYear()} MotoBoss. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <a href="#terminos" className="hover:text-white transition-colors">Términos</a>
          <a href="#privacidad" className="hover:text-white transition-colors">Privacidad</a>
          <a href="#soporte" className="hover:text-white transition-colors">Soporte</a>
        </div>
      </footer>

    </div>
  );
}
