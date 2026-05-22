import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motosService } from '../api/motos';
import { usersService } from '../api/users';
import { repuestosService } from '../api/repuestos';
import { ordenesService } from '../api/ordenes';
import { BASE_URL } from '../api/client';

// ── SUB-COMPONENTES DE DISEÑO ────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accentClass, glowClass, loading, icon }) => (
  <div className={`glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] ${glowClass}`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-all ${accentClass}`}></div>
    <div className="flex justify-between items-start z-10 relative">
      <div>
        <span className="text-xs text-brand-text-muted uppercase font-bold tracking-wider">{label}</span>
        {loading ? (
          <div className="mt-3 h-9 w-24 bg-white/5 rounded-lg animate-pulse"></div>
        ) : (
          <h3 className="text-3xl font-extrabold text-white mt-2 mb-1">{value}</h3>
        )}
        <p className="text-xs text-brand-text-muted">{sub}</p>
      </div>
      <div className="p-3 bg-white/5 rounded-xl text-brand-primary group-hover:text-white transition-colors">
        {icon}
      </div>
    </div>
  </div>
);

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Navegación de pestañas
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen', 'clientes', 'usuarios', 'motos', 'repuestos', 'ordenes'

  // Estados globales de datos
  const [motos, setMotos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [ordenes, setOrdenes] = useState([]);
  const [totalMotos, setTotalMotos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalRepuestos, setTotalRepuestos] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [activeServices, setActiveServices] = useState([]);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para refinamiento visual (Toast y Password visibility)
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' }
  const [showClientePassword, setShowClientePassword] = useState(false);
  const [showUsuarioPassword, setShowUsuarioPassword] = useState(false);

  // Estados para cambiar contraseña en Mi Perfil
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Estados para Historial de Moto Real (RF-07)
  const [motoHistoryOrders, setMotoHistoryOrders] = useState([]);
  const [loadingMotoHistory, setLoadingMotoHistory] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Paginación y búsquedas por pestaña
  const [searchPlaca, setSearchPlaca] = useState('');
  const [motosPage, setMotosPage] = useState(1);
  const [motosTotalPages, setMotosTotalPages] = useState(1);
  const [searchCliente, setSearchCliente] = useState('');
  const [clientesPage, setClientesPage] = useState(1);
  const [clientesTotalPages, setClientesTotalPages] = useState(1);

  // Estados de paginación y búsqueda para Usuarios (admin)
  const [searchUsuario, setSearchUsuario] = useState('');
  const [filterUsuarioRol, setFilterUsuarioRol] = useState(''); // '' (Todos), 'admin', 'empleado', 'cliente'
  const [usuariosPage, setUsuariosPage] = useState(1);
  const [usuariosTotalPages, setUsuariosTotalPages] = useState(1);

  const [searchRepuestoType, setSearchRepuestoType] = useState('nombre'); // 'nombre' | 'referencia'
  const [searchRepuestoQuery, setSearchRepuestoQuery] = useState('');
  const [repuestosPage, setRepuestosPage] = useState(1);
  const [repuestosTotalPages, setRepuestosTotalPages] = useState(1);

  // Estados de paginación y búsqueda para Órdenes
  const [searchOrdenPlaca, setSearchOrdenPlaca] = useState('');
  const [searchOrdenId, setSearchOrdenId] = useState('');
  const [searchOrdenMecanico, setSearchOrdenMecanico] = useState('');
  const [filterOrdenEstado, setFilterOrdenEstado] = useState(''); // '' (Todos), 'Recepcion', 'Diagnostico', etc.
  const [ordenesPage, setOrdenesPage] = useState(1);
  const [ordenesTotalPages, setOrdenesTotalPages] = useState(1);

  const LIMIT = 6;

  // Estados de formularios
  const [showMotoForm, setShowMotoForm] = useState(false);
  const [motoFormLoading, setMotoFormLoading] = useState(false);
  const [motoFormError, setMotoFormError] = useState('');
  const [selectedMoto, setSelectedMoto] = useState(null); 
  const [newMoto, setNewMoto] = useState({
    placa: '',
    marca: '',
    modelo: '',
    color: '',
    cilindraje: '',
    anio: new Date().getFullYear(),
    id_propietario: ''
  });

  const [showClienteForm, setShowClienteForm] = useState(false);
  const [clienteFormLoading, setClienteFormLoading] = useState(false);
  const [clienteFormError, setClienteFormError] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null); 
  const [newCliente, setNewCliente] = useState({
    nombre: '',
    correo: '',
    cedula: '',
    telefono: '',
    password: '',
    rol: 'cliente'
  });

  const [showUsuarioForm, setShowUsuarioForm] = useState(false);
  const [usuarioFormLoading, setUsuarioFormLoading] = useState(false);
  const [usuarioFormError, setUsuarioFormError] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState(null); 
  const [newUsuario, setNewUsuario] = useState({
    nombre: '',
    correo: '',
    cedula: '',
    telefono: '',
    password: '',
    rol: 'empleado'
  });

  const [showRepuestoForm, setShowRepuestoForm] = useState(false);
  const [repuestoFormLoading, setRepuestoFormLoading] = useState(false);
  const [repuestoFormError, setRepuestoFormError] = useState('');
  const [selectedRepuesto, setSelectedRepuesto] = useState(null); 
  const [newRepuesto, setNewRepuesto] = useState({
    referencia: '',
    nombre: '',
    stock: 0,
    precio: 0
  });

  const [showOrdenForm, setShowOrdenForm] = useState(false);
  const [ordenFormLoading, setOrdenFormLoading] = useState(false);
  const [ordenFormError, setOrdenFormError] = useState('');
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [newOrden, setNewOrden] = useState({
    id_moto: '',
    id_mecanico: '',
    fecha_ingreso: new Date().toISOString().substring(0, 16),
    diagnostico: '',
    estado: 'Recepcion',
    valor_mano_obra: 0,
    detalleOrden: []
  });
  const [tempRepuesto, setTempRepuesto] = useState({ id_repuesto: '', cantidad: 1 });

  // Modal de Historial de Servicios
  const [serviceHistoryMoto, setServiceHistoryMoto] = useState(null);

  const fetchMotoHistory = useCallback(async (motoId) => {
    setLoadingMotoHistory(true);
    try {
      const res = await ordenesService.getAll({ id_moto: motoId, limit: 100 });
      if (res.success) {
        setMotoHistoryOrders(res.data?.items ?? []);
      } else {
        setMotoHistoryOrders([]);
      }
    } catch (err) {
      console.error('Error al cargar historial de moto', err);
      setMotoHistoryOrders([]);
    } finally {
      setLoadingMotoHistory(false);
    }
  }, []);

  useEffect(() => {
    if (serviceHistoryMoto) {
      fetchMotoHistory(serviceHistoryMoto.id);
    } else {
      setMotoHistoryOrders([]);
    }
  }, [serviceHistoryMoto, fetchMotoHistory]);

  // Permisos según rol
  const isAdmin = user?.rol === 'admin';
  const isEmpleado = user?.rol === 'empleado';
  const isCliente = user?.rol === 'cliente';
  const canEditMotos = isAdmin || isEmpleado;
  const canEditClientes = isAdmin || isEmpleado;
  const canEditUsuarios = isAdmin;
  const canEditRepuestos = isAdmin || isEmpleado;
  const canEditOrdenes = isAdmin || isEmpleado;

  // Umbral de stock mínimo (alertas visuales críticas)
  const STOCK_CRITICO = 3;
  const STOCK_BAJO = 10;

  // Mock de Historial de Servicios (RF-07)
  const getMockServiceHistory = (motoPlaca) => {
    return [
      {
        id: 101,
        fecha: '2026-05-10',
        tipo: 'Mantenimiento Preventivo',
        descripcion: 'Cambio de aceite de motor (Motul 7100 10W40), cambio de filtro de aceite y lubricación de cadena.',
        mecanico: 'Carlos Mendoza',
        costo: 185000,
        estado: 'Entregado'
      },
      {
        id: 102,
        fecha: '2026-04-18',
        tipo: 'Sistema Eléctrico',
        descripcion: 'Diagnóstico y cambio de batería (Yasa 12V), revisión del regulador de voltaje y limpieza de bornes.',
        mecanico: 'Alex Tobón',
        costo: 240000,
        estado: 'Entregado'
      },
      {
        id: 103,
        fecha: '2026-03-05',
        tipo: 'Frenos & Suspensión',
        descripcion: 'Cambio de pastillas de freno delanteras (Brembo sinterizadas) y cambio de retenes de barras con aceite de suspensión.',
        mecanico: 'Carlos Mendoza',
        costo: 320000,
        estado: 'Entregado'
      }
    ];
  };

  // ── CARGA DE DATOS (MÉTODOS CENTRALIZADOS) ──────────────────────────────────

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Obtener todas las motos del taller (sin límite) para mapeos y filtros de clientes
      const allMotosParams = { limit: 500 };
      if (isCliente) allMotosParams.id_propietario = user.id;
      const allMotosRes = await motosService.getAll(allMotosParams);
      const allMotos = allMotosRes.success ? (allMotosRes.data?.items ?? []) : [];

      // Obtener motos paginadas
      const motosParams = { page: motosPage, limit: LIMIT };
      if (searchPlaca) motosParams.placa = searchPlaca;
      if (isCliente) motosParams.id_propietario = user.id;
      const motosRes = await motosService.getAll(motosParams);

      if (motosRes.success) {
        const motosData = motosRes.data;
        setMotos(Array.isArray(motosData) ? motosData : (motosData?.items ?? []));
        setTotalMotos(motosData?.totalItems ?? (Array.isArray(motosData) ? motosData.length : 0));
        setMotosTotalPages(motosData?.totalPages ?? 1);
      } else {
        setError(motosRes.error || 'Error al cargar motos.');
      }

      if (!isCliente) {
        // 2. Obtener clientes (estrictamente rol: 'cliente')
        const clientesParams = { page: clientesPage, limit: LIMIT, rol: 'cliente' };
        const clientesRes = await usersService.getAll(clientesParams);

        if (clientesRes.success) {
          const clientesData = clientesRes.data;
          let items = clientesData?.items ?? [];
          if (searchCliente) {
            items = items.filter(c => 
              c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) || 
              c.correo.toLowerCase().includes(searchCliente.toLowerCase()) ||
              (c.cedula && c.cedula.toLowerCase().includes(searchCliente.toLowerCase()))
            );
          }
          setClientes(items);
          setTotalClientes(clientesData?.totalItems ?? items.length);
          setClientesTotalPages(clientesData?.totalPages ?? 1);
        }

        // 2.5 Obtener todos los usuarios (admins, empleados, clientes) si es Admin
        if (isAdmin) {
          const usuariosParams = { page: usuariosPage, limit: LIMIT };
          if (filterUsuarioRol) {
            usuariosParams.rol = filterUsuarioRol;
          }
          const usuariosRes = await usersService.getAll(usuariosParams);
          if (usuariosRes.success) {
            const usuariosData = usuariosRes.data;
            let items = usuariosData?.items ?? [];
            if (searchUsuario) {
              items = items.filter(u => 
                u.nombre.toLowerCase().includes(searchUsuario.toLowerCase()) || 
                u.correo.toLowerCase().includes(searchUsuario.toLowerCase()) ||
                (u.cedula && u.cedula.toLowerCase().includes(searchUsuario.toLowerCase()))
              );
            }
            setUsuarios(items);
            setTotalUsuarios(usuariosData?.totalItems ?? items.length);
            setUsuariosTotalPages(usuariosData?.totalPages ?? 1);
          }
        }

        // 3. Obtener repuestos (con paginación y filtros si aplica)
        const repuestosParams = { page: repuestosPage, limit: LIMIT };
        if (searchRepuestoQuery) {
          if (searchRepuestoType === 'nombre') {
            repuestosParams.nombre = searchRepuestoQuery;
          } else {
            repuestosParams.referencia = searchRepuestoQuery;
          }
        }
        
        const repuestosRes = await repuestosService.getAll(repuestosParams);
        if (repuestosRes.success) {
          const repData = repuestosRes.data;
          setRepuestos(Array.isArray(repData) ? repData : (repData?.items ?? []));
          setTotalRepuestos(repData?.totalItems ?? (Array.isArray(repData) ? repData.length : 0));
          setRepuestosTotalPages(repData?.totalPages ?? 1);
        }

        // 4. Calcular repuestos con stock crítico/bajo de forma global para los indicadores
        const allRepuestosRes = await repuestosService.getAll({ limit: 500 });
        if (allRepuestosRes.success) {
          const allReps = allRepuestosRes.data?.items ?? [];
          const lowStock = allReps.filter(r => r.stock <= STOCK_BAJO).length;
          setLowStockCount(lowStock);
        }

        // 5. Obtener todos los usuarios del taller (para asignación de motos y cálculos)
        const usersRes = await usersService.getAll({ limit: 500 });
        if (usersRes.success) {
          const uData = usersRes.data?.items ?? [];
          setAllUsers(uData);
          setTotalUsers(usersRes.data?.totalItems ?? uData.length);
        }
      } else {
        // Inicializar estados administrativos vacíos para evitar inconsistencias
        setAllUsers([user]);
        setClientes([]);
        setTotalClientes(0);
        setClientesTotalPages(1);
        setUsuarios([]);
        setTotalUsuarios(0);
        setUsuariosTotalPages(1);
        setRepuestos([]);
        setTotalRepuestos(0);
        setRepuestosTotalPages(1);
        setLowStockCount(0);
      }

      // 6. Obtener órdenes de trabajo
      if (isCliente) {
        const clientMotos = allMotos;
        const clientMotoIds = clientMotos.map(m => m.id);
        
        if (clientMotoIds.length === 0) {
          setOrdenes([]);
          setTotalOrdenes(0);
          setOrdenesTotalPages(1);
          setActiveServices([]);
          setActiveServicesCount(0);
        } else {
          let filteredMotos = clientMotos;
          if (searchOrdenPlaca) {
            filteredMotos = clientMotos.filter(m => m.placa.toLowerCase().includes(searchOrdenPlaca.toLowerCase()));
          }

          if (filteredMotos.length === 0) {
            setOrdenes([]);
            setTotalOrdenes(0);
            setOrdenesTotalPages(1);
            setActiveServices([]);
            setActiveServicesCount(0);
          } else {
            // Consultar concurrentemente por ID de Moto
            const promises = filteredMotos.map(m => 
              ordenesService.getAll({ id_moto: m.id, estado: filterOrdenEstado, limit: 100 })
            );
            const results = await Promise.all(promises);
            let merged = [];
            results.forEach(res => {
              if (res.success) {
                const items = res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
                merged.push(...items);
              }
            });

            // Aplicar filtros adicionales del lado del cliente si están activos
            if (searchOrdenId) {
              merged = merged.filter(o => o.id_orden_trabajo.toString().includes(searchOrdenId));
            }
            if (searchOrdenMecanico) {
              merged = merged.filter(o => o.nombre_mecanico?.toLowerCase().includes(searchOrdenMecanico.toLowerCase()) || o.id_mecanico?.toString().includes(searchOrdenMecanico));
            }

            // Ordenar por ID de orden de forma descendente (más reciente primero), y "Entregado" va al final
            merged.sort((a, b) => {
              const isAEntregado = a.estado === 'Entregado';
              const isBEntregado = b.estado === 'Entregado';
              if (isAEntregado && !isBEntregado) return 1;
              if (!isAEntregado && isBEntregado) return -1;
              return b.id_orden_trabajo - a.id_orden_trabajo;
            });

            // Calcular servicios activos para el cliente (estado !== 'Entregado')
            const activeItems = merged.filter(o => o.estado !== 'Entregado');
            setActiveServices(activeItems);
            setActiveServicesCount(activeItems.length);

            // Paginación local
            const totalItems = merged.length;
            const totalPages = Math.ceil(totalItems / LIMIT) || 1;
            const start = (ordenesPage - 1) * LIMIT;
            const paginatedItems = merged.slice(start, start + LIMIT);

            setOrdenes(paginatedItems);
            setTotalOrdenes(totalItems);
            setOrdenesTotalPages(totalPages);
          }
        }
      } else {
        const ordenesParams = { page: ordenesPage, limit: LIMIT };
        if (filterOrdenEstado) ordenesParams.estado = filterOrdenEstado;
        if (searchOrdenPlaca)  ordenesParams.placa_moto = searchOrdenPlaca;
        if (searchOrdenId)     ordenesParams.id_orden_trabajo = searchOrdenId;
        if (searchOrdenMecanico) ordenesParams.nombre_mecanico = searchOrdenMecanico;

        const ordenesRes = await ordenesService.getAll(ordenesParams);
        if (ordenesRes.success) {
          const items = ordenesRes.data?.items ?? [];
          const totalItems = ordenesRes.data?.totalItems ?? 0;
          const totalPages = ordenesRes.data?.totalPages ?? 1;

          const sortedItems = [...items].sort((a, b) => {
            const isAEntregado = a.estado === 'Entregado';
            const isBEntregado = b.estado === 'Entregado';
            if (isAEntregado && !isBEntregado) return 1;
            if (!isAEntregado && isBEntregado) return -1;
            return b.id_orden_trabajo - a.id_orden_trabajo;
          });

          setOrdenes(sortedItems);
          setTotalOrdenes(totalItems);
          setOrdenesTotalPages(totalPages);
        }
      }

    } catch (err) {
      setError('Error al comunicar con la API. Asegurate de que el backend esté arriba.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [motosPage, searchPlaca, clientesPage, searchCliente, usuariosPage, searchUsuario, filterUsuarioRol, repuestosPage, searchRepuestoType, searchRepuestoQuery, ordenesPage, searchOrdenPlaca, searchOrdenId, searchOrdenMecanico, filterOrdenEstado, user, isAdmin, isCliente]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (isCliente && ['clientes', 'usuarios', 'repuestos'].includes(activeTab)) {
      setActiveTab('resumen');
    }
  }, [activeTab, isCliente]);

  // Manejadores de búsqueda rápida
  const handlePlacaSearch = (e) => {
    setSearchPlaca(e.target.value);
    setMotosPage(1);
  };

  const handleClienteSearch = (e) => {
    setSearchCliente(e.target.value);
    setClientesPage(1);
  };

  const handleUsuarioSearch = (e) => {
    setSearchUsuario(e.target.value);
    setUsuariosPage(1);
  };

  const handleRepuestoSearchQuery = (e) => {
    setSearchRepuestoQuery(e.target.value);
    setRepuestosPage(1);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (newPassword !== confirmPassword) {
      setProfileError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setProfileError('La nueva contraseña debe tener mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial (@$!%*?&).');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await usersService.changePassword({
        currentPassword,
        newPassword
      });

      if (res.success) {
        showToast('Contraseña cambiada exitosamente.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setProfileError(res.error || 'Error al cambiar la contraseña.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Error al comunicar con el servidor.');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── ACCIONES CLIENTES (CRUD) ────────────────────────────────────────────────

  const handleCreateOrUpdateCliente = async (e) => {
    e.preventDefault();
    setClienteFormLoading(true);
    setClienteFormError('');

    // Validar cédula y teléfono antes de enviar
    if (!newCliente.cedula.trim() || !newCliente.telefono.trim()) {
      setClienteFormError('Cédula y Teléfono son obligatorios.');
      setClienteFormLoading(false);
      return;
    }

    try {
      if (selectedCliente) {
        const body = {
          nombre: newCliente.nombre.trim(),
          correo: newCliente.correo.trim(),
          cedula: newCliente.cedula.trim(),
          telefono: newCliente.telefono.trim()
        };
        const res = await usersService.update(selectedCliente.id, body);
        if (res.success) {
          if (newCliente.password) {
            await usersService.resetPassword(selectedCliente.id, { newPassword: newCliente.password });
          }
          showToast(`Cliente "${body.nombre}" actualizado con éxito.`, 'success');
          setShowClienteForm(false);
          setSelectedCliente(null);
          setNewCliente({ nombre: '', correo: '', cedula: '', telefono: '', password: '', rol: 'cliente' });
          fetchAllData();
        } else {
          setClienteFormError(res.error || 'No se pudo actualizar el cliente.');
        }
      } else {
        if (!newCliente.password) {
          setClienteFormError('La contraseña es obligatoria para nuevos clientes.');
          setClienteFormLoading(false);
          return;
        }
        const body = {
          nombre: newCliente.nombre.trim(),
          correo: newCliente.correo.trim(),
          cedula: newCliente.cedula.trim(),
          telefono: newCliente.telefono.trim(),
          password: newCliente.password,
          rol: 'cliente' // Forzado en vista de Clientes
        };
        const res = await usersService.create(body);
        if (res.success) {
          showToast(`Cliente "${body.nombre}" registrado con éxito.`, 'success');
          setShowClienteForm(false);
          setNewCliente({ nombre: '', correo: '', cedula: '', telefono: '', password: '', rol: 'cliente' });
          fetchAllData();
        } else {
          setClienteFormError(res.error || 'No se pudo registrar el cliente.');
        }
      }
    } catch (err) {
      setClienteFormError('Error en la solicitud.');
    } finally {
      setClienteFormLoading(false);
    }
  };

  const handleEditClienteClick = (cliente) => {
    setSelectedCliente(cliente);
    setNewCliente({
      nombre: cliente.nombre,
      correo: cliente.correo,
      cedula: cliente.cedula || '',
      telefono: cliente.telefono || '',
      password: '', 
      rol: 'cliente'
    });
    setShowClienteForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCliente = async (cliente) => {
    if (!confirm(`¿Eliminar al cliente ${cliente.nombre}? Esto podría dejar sin dueño a sus motos asignadas.`)) return;
    const res = await usersService.remove(cliente.id);
    if (res.success) {
      showToast(`Cliente "${cliente.nombre}" eliminado con éxito.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo eliminar el cliente.', 'error');
    }
  };

  const handleToggleClienteActive = async (cliente) => {
    const res = await usersService.toggleActive(cliente.id);
    if (res.success) {
      showToast(`Estado del cliente "${cliente.nombre}" actualizado con éxito.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo cambiar el estado del cliente.', 'error');
    }
  };

  // ── ACCIONES USUARIOS (CRUD EXCLUSIVO ADMIN) ─────────────────────────────────

  const handleCreateOrUpdateUsuario = async (e) => {
    e.preventDefault();
    setUsuarioFormLoading(true);
    setUsuarioFormError('');

    if (!newUsuario.cedula.trim() || !newUsuario.telefono.trim()) {
      setUsuarioFormError('Cédula y Teléfono son obligatorios.');
      setUsuarioFormLoading(false);
      return;
    }

    try {
      if (selectedUsuario) {
        // En edición, no enviamos el rol debido a las restricciones del backend
        const body = {
          nombre: newUsuario.nombre.trim(),
          correo: newUsuario.correo.trim(),
          cedula: newUsuario.cedula.trim(),
          telefono: newUsuario.telefono.trim()
        };
        const res = await usersService.update(selectedUsuario.id, body);
        if (res.success) {
          if (newUsuario.password) {
            await usersService.resetPassword(selectedUsuario.id, { newPassword: newUsuario.password });
          }
          showToast(`Usuario "${body.nombre}" actualizado con éxito.`, 'success');
          setShowUsuarioForm(false);
          setSelectedUsuario(null);
          setNewUsuario({ nombre: '', correo: '', cedula: '', telefono: '', password: '', rol: 'empleado' });
          fetchAllData();
        } else {
          setUsuarioFormError(res.error || 'No se pudo actualizar the usuario.');
        }
      } else {
        if (!newUsuario.password) {
          setUsuarioFormError('La contraseña es obligatoria para nuevos usuarios.');
          setUsuarioFormLoading(false);
          return;
        }
        const body = {
          nombre: newUsuario.nombre.trim(),
          correo: newUsuario.correo.trim(),
          cedula: newUsuario.cedula.trim(),
          telefono: newUsuario.telefono.trim(),
          password: newUsuario.password,
          rol: newUsuario.rol
        };
        const res = await usersService.create(body);
        if (res.success) {
          showToast(`Usuario "${body.nombre}" registrado con éxito.`, 'success');
          setShowUsuarioForm(false);
          setNewUsuario({ nombre: '', correo: '', cedula: '', telefono: '', password: '', rol: 'empleado' });
          fetchAllData();
        } else {
          setUsuarioFormError(res.error || 'No se pudo registrar el usuario.');
        }
      }
    } catch (err) {
      setUsuarioFormError('Error en la solicitud.');
    } finally {
      setUsuarioFormLoading(false);
    }
  };

  const handleEditUsuarioClick = (usuario) => {
    setSelectedUsuario(usuario);
    setNewUsuario({
      nombre: usuario.nombre,
      correo: usuario.correo,
      cedula: usuario.cedula || '',
      telefono: usuario.telefono || '',
      password: '', 
      rol: usuario.rol
    });
    setShowUsuarioForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUsuario = async (usuario) => {
    if (usuario.id === user.id) {
      showToast('No podés eliminar tu propia cuenta de administrador.', 'error');
      return;
    }
    if (!confirm(`¿Eliminar al usuario ${usuario.nombre}? Esta acción es irreversible.`)) return;
    const res = await usersService.remove(usuario.id);
    if (res.success) {
      showToast(`Usuario "${usuario.nombre}" eliminado con éxito.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo eliminar el usuario.', 'error');
    }
  };

  const handleToggleUsuarioActive = async (usuario) => {
    if (usuario.id === user.id) {
      showToast('No podés desactivar tu propia cuenta de administrador.', 'error');
      return;
    }
    if (usuario.rol === 'admin') {
      showToast('No se puede activar/desactivar un administrador.', 'error');
      return;
    }
    const res = await usersService.toggleActive(usuario.id);
    if (res.success) {
      showToast(`Estado del usuario "${usuario.nombre}" actualizado con éxito.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo cambiar el estado del usuario.', 'error');
    }
  };

  // ── ACCIONES MOTOCICLETAS (CRUD) ────────────────────────────────────────────

  const handleCreateOrUpdateMoto = async (e) => {
    e.preventDefault();
    setMotoFormLoading(true);
    setMotoFormError('');

    const body = {
      placa: newMoto.placa.toUpperCase(),
      marca: newMoto.marca,
      modelo: newMoto.modelo,
      color: newMoto.color,
      cilindraje: newMoto.cilindraje,
      anio: parseInt(newMoto.anio),
      id_propietario: parseInt(newMoto.id_propietario),
    };

    try {
      if (selectedMoto) {
        const res = await motosService.update(selectedMoto.id, body);
        if (res.success) {
          showToast(`Motocicleta "${body.placa}" actualizada con éxito.`, 'success');
          setShowMotoForm(false);
          setSelectedMoto(null);
          setNewMoto({ placa: '', marca: '', modelo: '', color: '', cilindraje: '', anio: new Date().getFullYear(), id_propietario: '' });
          fetchAllData();
        } else {
          setMotoFormError(res.error || 'No se pudo actualizar la motocicleta.');
        }
      } else {
        const res = await motosService.create(body);
        if (res.success) {
          showToast(`Motocicleta "${body.placa}" registrada con éxito.`, 'success');
          setShowMotoForm(false);
          setNewMoto({ placa: '', marca: '', modelo: '', color: '', cilindraje: '', anio: new Date().getFullYear(), id_propietario: '' });
          fetchAllData();
        } else {
          setMotoFormError(res.error || 'No se pudo registrar la motocicleta.');
        }
      }
    } catch (err) {
      setMotoFormError('Error en la solicitud.');
    } finally {
      setMotoFormLoading(false);
    }
  };

  const handleEditMotoClick = (moto) => {
    setSelectedMoto(moto);
    setNewMoto({
      placa: moto.placa,
      marca: moto.marca,
      modelo: moto.modelo,
      color: moto.color,
      cilindraje: moto.cilindraje,
      anio: moto.anio,
      id_propietario: moto.id_propietario || ''
    });
    setShowMotoForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMoto = async (moto) => {
    if (!confirm(`¿Eliminar la motocicleta con placa ${moto.placa}? Esta acción es irreversible.`)) return;
    const res = await motosService.remove(moto.id);
    if (res.success) {
      showToast(`Motocicleta "${moto.placa}" eliminada con éxito.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo eliminar la moto.', 'error');
    }
  };

  const getPropietarioName = (idPropietario) => {
    const p = allUsers.find(u => u.id === idPropietario);
    return p ? p.nombre : 'No asignado';
  };

  // ── ACCIONES REPUESTOS (CRUD & STOCK) ───────────────────────────────────────────

  const handleCreateOrUpdateRepuesto = async (e) => {
    e.preventDefault();
    setRepuestoFormLoading(true);
    setRepuestoFormError('');

    const body = {
      referencia: newRepuesto.referencia.trim().toUpperCase(),
      nombre: newRepuesto.nombre.trim(),
      stock: parseInt(newRepuesto.stock),
      precio: parseFloat(newRepuesto.precio),
    };

    if (body.stock < 0) {
      setRepuestoFormError('El stock no puede ser negativo.');
      setRepuestoFormLoading(false);
      return;
    }
    if (body.precio < 0) {
      setRepuestoFormError('El precio no puede ser negativo.');
      setRepuestoFormLoading(false);
      return;
    }

    try {
      if (selectedRepuesto) {
        // ACTUALIZACIÓN
        const res = await repuestosService.update(selectedRepuesto.id_repuesto, body);
        if (res.success) {
          showToast(`Repuesto "${body.nombre}" actualizado con éxito.`, 'success');
          setShowRepuestoForm(false);
          setSelectedRepuesto(null);
          setNewRepuesto({ referencia: '', nombre: '', stock: 0, precio: 0 });
          fetchAllData();
        } else {
          setRepuestoFormError(res.error || 'No se pudo actualizar el repuesto.');
        }
      } else {
        // CREACIÓN
        const res = await repuestosService.create(body);
        if (res.success) {
          showToast(`Repuesto "${body.nombre}" registrado con éxito.`, 'success');
          setShowRepuestoForm(false);
          setNewRepuesto({ referencia: '', nombre: '', stock: 0, precio: 0 });
          fetchAllData();
        } else {
          setRepuestoFormError(res.error || 'No se pudo registrar el repuesto.');
        }
      }
    } catch (err) {
      setRepuestoFormError('Error en la solicitud.');
    } finally {
      setRepuestoFormLoading(false);
    }
  };

  const handleEditRepuestoClick = (rep) => {
    setSelectedRepuesto(rep);
    setNewRepuesto({
      referencia: rep.referencia,
      nombre: rep.nombre,
      stock: rep.stock,
      precio: rep.precio
    });
    setShowRepuestoForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRepuesto = async (rep) => {
    if (!confirm(`¿Eliminar el repuesto "${rep.nombre}" (${rep.referencia})?`)) return;
    const res = await repuestosService.remove(rep.id_repuesto);
    if (res.success) {
      showToast(`Repuesto "${rep.nombre}" eliminado con éxito.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo eliminar el repuesto.', 'error');
    }
  };

  const handleQuickAddStock = async (rep, amount) => {
    const newStock = rep.stock + amount;
    if (newStock < 0) {
      showToast('El stock no puede quedar negativo.', 'error');
      return;
    }
    const body = {
      referencia: rep.referencia,
      nombre: rep.nombre,
      stock: newStock,
      precio: rep.precio
    };
    const res = await repuestosService.update(rep.id_repuesto, body);
    if (res.success) {
      showToast(`Stock de "${rep.nombre}" ajustado a ${newStock} unidades.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo ajustar el stock.', 'error');
    }
  };

  // ── ACCIONES ÓRDENES DE TRABAJO (CRUD & TRANSACCIONAL) ─────────────────────

  const handleCreateOrUpdateOrden = async (e) => {
    e.preventDefault();
    setOrdenFormLoading(true);
    setOrdenFormError('');

    if (!newOrden.id_moto) {
      setOrdenFormError('La motocicleta es obligatoria.');
      setOrdenFormLoading(false);
      return;
    }
    if (!newOrden.id_mecanico) {
      setOrdenFormError('El mecánico asignado es obligatorio.');
      setOrdenFormLoading(false);
      return;
    }
    if (!newOrden.diagnostico.trim()) {
      setOrdenFormError('El diagnóstico técnico no puede estar vacío.');
      setOrdenFormLoading(false);
      return;
    }
    if (parseFloat(newOrden.valor_mano_obra) < 0) {
      setOrdenFormError('El valor de la mano de obra no puede ser negativo.');
      setOrdenFormLoading(false);
      return;
    }

    const body = {
      id_moto: parseInt(newOrden.id_moto),
      id_mecanico: parseInt(newOrden.id_mecanico),
      fecha_ingreso: newOrden.fecha_ingreso,
      diagnostico: newOrden.diagnostico.trim(),
      valor_mano_obra: parseFloat(newOrden.valor_mano_obra),
      detalleOrden: newOrden.detalleOrden.map(d => ({
        id_repuesto: parseInt(d.id_repuesto),
        cantidad: parseInt(d.cantidad)
      }))
    };

    try {
      if (selectedOrden) {
        const putBody = {
          id_mecanico: body.id_mecanico,
          fecha_ingreso: body.fecha_ingreso,
          diagnostico: body.diagnostico,
          estado: newOrden.estado,
          valor_mano_obra: body.valor_mano_obra,
          detalleOrden: body.detalleOrden
        };
        const res = await ordenesService.update(selectedOrden.id_orden_trabajo, putBody);
        if (res.success) {
          showToast(`Orden #${selectedOrden.id_orden_trabajo} actualizada con éxito.`, 'success');
          setShowOrdenForm(false);
          setSelectedOrden(null);
          setNewOrden({
            id_moto: '',
            id_mecanico: '',
            fecha_ingreso: new Date().toISOString().substring(0, 16),
            diagnostico: '',
            estado: 'Recepcion',
            valor_mano_obra: 0,
            detalleOrden: []
          });
          fetchAllData();
        } else {
          setOrdenFormError(res.error || 'No se pudo actualizar la orden de trabajo.');
        }
      } else {
        const res = await ordenesService.create(body);
        if (res.success) {
          showToast(`Orden de trabajo registrada con éxito.`, 'success');
          setShowOrdenForm(false);
          setNewOrden({
            id_moto: '',
            id_mecanico: '',
            fecha_ingreso: new Date().toISOString().substring(0, 16),
            diagnostico: '',
            estado: 'Recepcion',
            valor_mano_obra: 0,
            detalleOrden: []
          });
          fetchAllData();
        } else {
          setOrdenFormError(res.error || 'No se pudo registrar la orden de trabajo.');
        }
      }
    } catch (err) {
      setOrdenFormError('Error de red al procesar la orden.');
    } finally {
      setOrdenFormLoading(false);
    }
  };

  const handleEditOrdenClick = async (orden) => {
    setSelectedOrden(orden);
    setOrdenFormLoading(true);
    setOrdenFormError('');
    setShowOrdenForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await ordenesService.getById(orden.id_orden_trabajo);
      if (res.success) {
        const full = res.data;
        
        // Mapear detalles agregando los precios locales del stock
        const mappedDetails = (full.detalleOrden || []).map(d => {
          const matched = repuestos.find(r => r.id_repuesto === d.id_repuesto);
          const precio = matched ? matched.precio : 0;
          return {
            id_repuesto: d.id_repuesto,
            nombre_Respuesto: d.nombre_Respuesto || (matched ? matched.nombre : `ID ${d.id_repuesto}`),
            cantidad: d.cantidad,
            precio: precio,
            subtotal: d.subtotal
          };
        });

        setNewOrden({
          id_moto: full.id_moto,
          id_mecanico: full.id_mecanico,
          fecha_ingreso: new Date(full.fecha_ingreso).toISOString().substring(0, 16),
          diagnostico: full.diagnostico,
          estado: full.estado,
          valor_mano_obra: full.valor_mano_obra,
          detalleOrden: mappedDetails
        });
      } else {
        setOrdenFormError(res.error || 'Error al recuperar la información detallada.');
      }
    } catch (err) {
      setOrdenFormError('Error al procesar la información de la orden.');
    } finally {
      setOrdenFormLoading(false);
    }
  };

  const handleDeleteOrden = async (orden) => {
    if (orden.estado === 'Entregado') {
      showToast('No se puede eliminar una orden de trabajo que ya ha sido entregada por auditoría.', 'error');
      return;
    }
    if (!confirm(`¿Eliminar la orden de trabajo #${orden.id_orden_trabajo}? Se devolverán los repuestos asignados al inventario.`)) return;
    const res = await ordenesService.remove(orden.id_orden_trabajo);
    if (res.success) {
      showToast(`Orden #${orden.id_orden_trabajo} eliminada con éxito.`, 'success');
      fetchAllData();
    } else {
      showToast(res.error || 'No se pudo eliminar la orden de trabajo.', 'error');
    }
  };

  const handleUpdateOrdenEstado = async (orden, nuevoEstado) => {
    try {
      const getRes = await ordenesService.getById(orden.id_orden_trabajo);
      if (!getRes.success) {
        showToast(getRes.error || 'No se pudo consultar el estado actual.', 'error');
        return;
      }
      const full = getRes.data;

      const body = {
        id_mecanico: full.id_mecanico,
        fecha_ingreso: full.fecha_ingreso,
        diagnostico: full.diagnostico,
        estado: nuevoEstado,
        valor_mano_obra: full.valor_mano_obra,
        detalleOrden: (full.detalleOrden || []).map(d => ({
          id_repuesto: d.id_repuesto,
          cantidad: d.cantidad
        }))
      };

      const res = await ordenesService.update(orden.id_orden_trabajo, body);
      if (res.success) {
        showToast(`Estado de la orden #${orden.id_orden_trabajo} actualizado a "${nuevoEstado}".`, 'success');
        fetchAllData();
      } else {
        showToast(res.error || 'No se pudo actualizar el estado.', 'error');
      }
    } catch (err) {
      showToast('Error al intentar actualizar el estado.', 'error');
    }
  };

  const handleDownloadPdf = async (orden) => {
    try {
      const token = localStorage.getItem('motoboss_token');
      const response = await fetch(`${BASE_URL}/ordenes/${orden.id_orden_trabajo}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al descargar el PDF.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Orden_${orden.id_orden_trabajo}_Placa_${orden.placa_moto || 'Taller'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF comercial descargado con éxito.', 'success');
    } catch (err) {
      showToast(err.message || 'Error al generar la descarga del PDF.', 'error');
    }
  };

  const handleAddRepuestoToOrden = () => {
    const idRep = parseInt(tempRepuesto.id_repuesto);
    const cant = parseInt(tempRepuesto.cantidad);

    if (!idRep || cant <= 0) {
      showToast('Selecciona un repuesto e introduce una cantidad válida.', 'error');
      return;
    }

    const rep = repuestos.find(r => r.id_repuesto === idRep);
    if (!rep) return;

    if (cant > rep.stock) {
      showToast(`Stock insuficiente en inventario. Stock real disponible: ${rep.stock}`, 'error');
      return;
    }

    const exists = newOrden.detalleOrden.find(d => d.id_repuesto === idRep);
    if (exists) {
      showToast('Este repuesto ya se encuentra agregado en la lista.', 'error');
      return;
    }

    const sub = rep.precio * cant;
    const newItem = {
      id_repuesto: idRep,
      nombre_Respuesto: rep.nombre,
      cantidad: cant,
      precio: rep.precio,
      subtotal: sub
    };

    setNewOrden(prev => ({
      ...prev,
      detalleOrden: [...prev.detalleOrden, newItem]
    }));

    setTempRepuesto({ id_repuesto: '', cantidad: 1 });
  };

  const handleRemoveRepuestoFromOrden = (idRep) => {
    setNewOrden(prev => ({
      ...prev,
      detalleOrden: prev.detalleOrden.filter(d => d.id_repuesto !== idRep)
    }));
  };

  const handleOrdenSearchPlaca = (e) => {
    setSearchOrdenPlaca(e.target.value);
    setOrdenesPage(1);
  };

  const handleOrdenSearchId = (e) => {
    setSearchOrdenId(e.target.value);
    setOrdenesPage(1);
  };

  const handleOrdenSearchMecanico = (e) => {
    setSearchOrdenMecanico(e.target.value);
    setOrdenesPage(1);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex font-sans relative overflow-hidden">
      
      {/* Luces de fondo premium */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* ── SIDEBAR ADAPTATIVO POR ROL ── */}
      <aside className="w-64 bg-brand-surface border-r border-white/5 flex flex-col z-20 shrink-0 hidden md:flex">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 animate-pulse-subtle">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-white leading-none">MOTO<span className="text-brand-primary">BOSS</span></p>
            <span className="text-[10px] uppercase tracking-widest text-brand-text-muted">Enterprise Console</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'resumen' 
                ? 'bg-gradient-to-r from-brand-secondary/20 to-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                : 'text-brand-text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Resumen
          </button>

          {!isCliente && (
            <button
              onClick={() => setActiveTab('clientes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'clientes' 
                  ? 'bg-gradient-to-r from-brand-secondary/20 to-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Gestión de Clientes
            </button>
          )}

          {isAdmin && !isCliente && (
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'usuarios' 
                  ? 'bg-gradient-to-r from-brand-secondary/20 to-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0-.001h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Gestión de Usuarios
            </button>
          )}

          <button
            onClick={() => setActiveTab('motos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'motos' 
                ? 'bg-gradient-to-r from-brand-secondary/20 to-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                : 'text-brand-text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16V10a2 2 0 00-2-2h-3V5a1 1 0 00-1-1H9" />
            </svg>
            {isCliente ? 'Mis Motocicletas' : 'Motocicletas'}
          </button>

          {!isCliente && (
            <button
              onClick={() => setActiveTab('repuestos')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'repuestos' 
                  ? 'bg-gradient-to-r from-brand-secondary/20 to-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Repuestos</span>
              </div>
              {lowStockCount > 0 && (
                <span className="text-[9px] font-bold bg-brand-accent-red/20 border border-brand-accent-red/30 px-1.5 py-0.5 rounded-full text-brand-accent-red animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('ordenes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'ordenes' 
                ? 'bg-gradient-to-r from-brand-secondary/20 to-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                : 'text-brand-text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            {isCliente ? 'Mis Órdenes' : 'Órdenes de Trabajo'}
          </button>

          <button
            onClick={() => setActiveTab('perfil')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'perfil' 
                ? 'bg-gradient-to-r from-brand-secondary/20 to-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-md shadow-brand-primary/5' 
                : 'text-brand-text-muted hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi Perfil
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center font-bold text-brand-primary uppercase text-xs">
              {user?.nombre?.substring(0,2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate leading-none mb-0.5">{user?.nombre}</p>
              <span className="text-[9px] uppercase font-bold text-brand-primary">{user?.rol}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-center text-xs bg-white/5 hover:bg-brand-accent-red/20 border border-white/10 hover:border-brand-accent-red/30 px-3 py-2 rounded-xl text-brand-text-muted hover:text-white transition-all cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* HEADER */}
        <header className="glass border-b border-white/5 py-4 px-6 md:px-10 flex items-center justify-between z-10 sticky top-0 md:bg-brand-bg/80 md:backdrop-blur-md">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center animate-pulse-subtle">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-base font-bold tracking-tight text-white leading-none">MOTO<span className="text-brand-primary">BOSS</span></p>
          </div>

          <h1 className="text-lg font-bold text-white tracking-tight hidden md:block">
            {activeTab === 'resumen' && (isCliente ? 'Portal del Cliente' : 'Consola Principal')}
            {activeTab === 'clientes' && 'Gestión de Clientes'}
            {activeTab === 'usuarios' && 'Gestión de Usuarios'}
            {activeTab === 'motos' && (isCliente ? 'Mis Motocicletas' : 'Gestión de Motocicletas')}
            {activeTab === 'repuestos' && 'Inventario de Repuestos'}
            {activeTab === 'ordenes' && (isCliente ? 'Mis Órdenes de Trabajo' : 'Órdenes de Trabajo')}
            {activeTab === 'perfil' && 'Mi Perfil de Usuario'}
          </h1>

          {/* Menú móvil rápido */}
          <div className="flex flex-wrap items-center gap-1.5 md:hidden">
            <button 
              onClick={() => setActiveTab('resumen')} 
              className={`p-1.5 rounded-lg text-[11px] font-semibold ${activeTab === 'resumen' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-muted'}`}
            >
              Resumen
            </button>
            {!isCliente && (
              <button 
                onClick={() => setActiveTab('clientes')} 
                className={`p-1.5 rounded-lg text-[11px] font-semibold ${activeTab === 'clientes' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-muted'}`}
              >
                Clientes
              </button>
            )}
            {isAdmin && !isCliente && (
              <button 
                onClick={() => setActiveTab('usuarios')} 
                className={`p-1.5 rounded-lg text-[11px] font-semibold ${activeTab === 'usuarios' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-muted'}`}
              >
                Usuarios
              </button>
            )}
            <button 
              onClick={() => setActiveTab('motos')} 
              className={`p-1.5 rounded-lg text-[11px] font-semibold ${activeTab === 'motos' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-muted'}`}
            >
              {isCliente ? 'Mis Motos' : 'Motos'}
            </button>
            {!isCliente && (
              <button 
                onClick={() => setActiveTab('repuestos')} 
                className={`p-1.5 rounded-lg text-[11px] font-semibold ${activeTab === 'repuestos' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-muted'} relative`}
              >
                Repuestos
                {lowStockCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-brand-accent-red text-[8px] font-extrabold flex items-center justify-center rounded-full text-white animate-pulse">
                    !
                  </span>
                )}
              </button>
            )}
            <button 
              onClick={() => setActiveTab('ordenes')} 
              className={`p-1.5 rounded-lg text-[11px] font-semibold ${activeTab === 'ordenes' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-muted'}`}
            >
              {isCliente ? 'Mis Órdenes' : 'Órdenes'}
            </button>
            <button 
              onClick={() => setActiveTab('perfil')} 
              className={`p-1.5 rounded-lg text-[11px] font-semibold ${activeTab === 'perfil' ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-muted'}`}
            >
              Perfil
            </button>
            <button
              onClick={logout}
              className="p-1.5 ml-1 text-brand-accent-red bg-brand-accent-red/10 rounded-lg"
              title="Salir"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {lowStockCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent-red/10 border border-brand-accent-red/20 text-brand-accent-red rounded-xl text-xs font-semibold animate-pulse">
                <span>Alerta Stock Bajo ({lowStockCount})</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-brand-surface border border-white/5 px-3 py-1.5 rounded-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent-green"></span>
              </span>
              <span className="text-xs text-white font-medium">{user?.nombre}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-primary font-bold uppercase">{user?.rol}</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-6 md:p-10 z-10 space-y-6 max-w-7xl w-full mx-auto">
          
          {error && (
            <div className="p-4 bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-2xl text-brand-accent-red text-xs flex items-center gap-2 animate-pulse-subtle">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error} — Asegurate que la conexión a la base de datos esté activa.</span>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 1: RESUMEN / DASHBOARD
              ────────────────────────────────────────────────────────────────── */}
          {/* ──────────────────────────────────────────────────────────────────
              TAB 1: RESUMEN / DASHBOARD (CLIENTE VS PERSONAL)
              ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'resumen' && isCliente && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary tracking-wider uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-brand-accent-green animate-pulse"></span>
                  Portal del Cliente Activo
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">¡Bienvenido de vuelta a tu portal, {user?.nombre}! 🏍️</h2>
                <p className="text-xs text-brand-text-muted mt-0.5">Monitoreá el estado de tus motos y cotizaciones en tiempo real.</p>
              </div>

              {/* Métricas Personales */}
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
                <StatCard
                  label="Mis Motocicletas"
                  value={totalMotos}
                  sub="Motos registradas a tu nombre"
                  accentClass="bg-brand-primary/5 group-hover:bg-brand-primary/10"
                  glowClass="hover:border-brand-primary/20"
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16V10a2 2 0 00-2-2h-3V5a1 1 0 00-1-1H9" />
                    </svg>
                  }
                />
                <StatCard
                  label="Servicios Activos"
                  value={activeServicesCount}
                  sub="Motos actualmente en taller"
                  accentClass="bg-brand-secondary/5 group-hover:bg-brand-secondary/10"
                  glowClass="hover:border-brand-secondary/20"
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Historial de Servicios"
                  value={totalOrdenes}
                  sub="Total histórico de órdenes"
                  accentClass="bg-brand-accent-green/5 group-hover:bg-brand-accent-green/10"
                  glowClass="hover:border-brand-accent-green/20"
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                />
              </div>

              {/* Cuerpo del Resumen de Cliente */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Accesos directos del cliente */}
                <div className="glass p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-2">Accesos Directos</h3>
                    <p className="text-xs text-brand-text-muted">Navegá de forma rápida por tus secciones asignadas.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActiveTab('motos')} 
                      className="p-5 bg-white/5 hover:bg-brand-primary/20 border border-white/5 hover:border-brand-primary/40 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <p className="text-sm font-bold text-white group-hover:text-brand-primary font-semibold">Mis Motocicletas →</p>
                      <p className="text-[10px] text-brand-text-muted mt-2">Consultá las especificaciones y el historial completo de tus vehículos.</p>
                    </button>
                    <button 
                      onClick={() => setActiveTab('ordenes')} 
                      className="p-5 bg-white/5 hover:bg-brand-secondary/20 border border-white/5 hover:border-brand-secondary/40 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <p className="text-sm font-bold text-white group-hover:text-brand-primary font-semibold">Mis Órdenes →</p>
                      <p className="text-[10px] text-brand-text-muted mt-2">Monitoreá el avance técnico y descargá tus cotizaciones en PDF.</p>
                    </button>
                  </div>
                </div>

                {/* Tus Servicios en Curso (Timeline Compacto) */}
                <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-base font-bold text-white">Tus Servicios en Curso</h3>
                  <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
                    {loading ? (
                      <div className="py-4 text-xs text-brand-text-muted">Cargando...</div>
                    ) : activeServices.length === 0 ? (
                      <div className="py-8 text-center text-xs text-brand-accent-green font-semibold bg-brand-accent-green/5 rounded-xl border border-brand-accent-green/10">
                        ✨ Tus motocicletas están al día y listas para rodar. ¡Buen viaje!
                      </div>
                    ) : (
                      activeServices.map(serv => {
                        const motoObj = motos.find(m => m.id === serv.id_moto);
                        return (
                          <div key={serv.id_orden_trabajo} className="py-3 flex items-center justify-between text-xs gap-3">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-0.5 font-mono font-bold text-[10px] rounded border bg-brand-primary/10 border-brand-primary/20 text-brand-primary">
                                {motoObj ? motoObj.placa : (serv.placa_moto || 'Moto')}
                              </span>
                              <div>
                                <p className="font-semibold text-white">Orden #{serv.id_orden_trabajo}</p>
                                <p className="text-[10px] text-brand-text-muted">
                                  {motoObj ? `${motoObj.marca} ${motoObj.modelo}` : 'Vehículo'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                  serv.estado === 'Recepcion'
                                    ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                                    : serv.estado === 'Diagnostico'
                                      ? 'bg-brand-accent-yellow/10 text-brand-accent-yellow border-brand-accent-yellow/20'
                                      : serv.estado === 'Cotizacion'
                                        ? 'bg-brand-accent-purple/10 text-brand-accent-purple border-brand-accent-purple/20'
                                        : 'bg-brand-accent-blue/10 text-brand-accent-blue border-brand-accent-blue/20'
                                }`}>
                                  {serv.estado}
                                </span>
                              </div>
                              <button 
                                onClick={() => setActiveTab('ordenes')}
                                className="text-[10px] text-brand-primary hover:underline font-semibold"
                              >
                                Detalles
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resumen' && !isCliente && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary tracking-wider uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></span>
                  Conexión API: OK
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Bienvenido de vuelta, {user?.nombre} 👋</h2>
                <p className="text-xs text-brand-text-muted mt-0.5">Métricas de control del taller a la fecha.</p>
              </div>

              {/* Stat Cards */}
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-4">
                <StatCard
                  label="Motos Registradas"
                  value={totalMotos}
                  sub="Total en base de datos"
                  accentClass="bg-brand-primary/5 group-hover:bg-brand-primary/10"
                  glowClass="hover:border-brand-primary/20"
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16V10a2 2 0 00-2-2h-3V5a1 1 0 00-1-1H9" />
                    </svg>
                  }
                />
                <StatCard
                  label="Clientes Activos"
                  value={totalClientes}
                  sub="Usuarios registrados"
                  accentClass="bg-brand-secondary/5 group-hover:bg-brand-secondary/10"
                  glowClass="hover:border-brand-secondary/20"
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Repuestos Totales"
                  value={totalRepuestos}
                  sub="Referencias cargadas"
                  accentClass="bg-brand-accent-green/5 group-hover:bg-brand-accent-green/10"
                  glowClass="hover:border-brand-accent-green/20"
                  loading={loading}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  }
                />
                <div className={`glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] ${lowStockCount > 0 ? 'hover:border-brand-accent-red/30' : ''}`}>
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-all ${lowStockCount > 0 ? 'bg-brand-accent-red/10' : 'bg-brand-accent-green/5'}`}></div>
                  <div className="flex justify-between items-start z-10 relative">
                    <div>
                      <span className="text-xs text-brand-text-muted uppercase font-bold tracking-wider">Alertas Stock</span>
                      <h3 className={`text-3xl font-extrabold mt-2 mb-1 ${lowStockCount > 0 ? 'text-brand-accent-red animate-pulse' : 'text-brand-accent-green'}`}>
                        {lowStockCount}
                      </h3>
                      <p className="text-xs text-brand-text-muted">{lowStockCount > 0 ? 'Repuestos bajo stock mínimo' : 'Inventario al día'}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-brand-accent-red/15 text-brand-accent-red' : 'bg-brand-accent-green/15 text-brand-accent-green'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accesos directos rápidos */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-base font-bold text-white">Navegación Rápida</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveTab('clientes')} 
                      className="p-4 bg-white/5 hover:bg-brand-secondary/20 border border-white/5 hover:border-brand-secondary/40 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <p className="text-sm font-bold text-white group-hover:text-brand-primary font-semibold">Clientes →</p>
                      <p className="text-[11px] text-brand-text-muted mt-1">Registrar clientes, modificar accesos y asignar motos.</p>
                    </button>
                    <button 
                      onClick={() => setActiveTab('repuestos')} 
                      className="p-4 bg-white/5 hover:bg-brand-primary/20 border border-white/5 hover:border-brand-primary/40 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <p className="text-sm font-bold text-white group-hover:text-brand-primary font-semibold">Repuestos →</p>
                      <p className="text-[11px] text-brand-text-muted mt-1">Control de inventario, stock crítico y alertas visuales.</p>
                    </button>
                  </div>
                </div>

                {/* Repuestos críticos en la pantalla principal */}
                <div className="glass p-6 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-white">Alertas de Repuestos Críticos</h3>
                    <button onClick={() => setActiveTab('repuestos')} className="text-xs text-brand-primary hover:underline">Ver todo el stock</button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {loading ? (
                      <div className="py-3 text-xs text-brand-text-muted">Cargando...</div>
                    ) : repuestos.filter(r => r.stock <= STOCK_BAJO).length === 0 ? (
                      <div className="py-6 text-center text-xs text-brand-accent-green font-semibold bg-brand-accent-green/5 rounded-xl border border-brand-accent-green/10">
                        ✨ ¡Todos los repuestos tienen niveles óptimos de stock!
                      </div>
                    ) : (
                      repuestos.filter(r => r.stock <= STOCK_BAJO).slice(0, 3).map(r => (
                        <div key={r.id_repuesto} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 font-mono font-bold text-[10px] rounded border ${
                              r.stock <= STOCK_CRITICO 
                                ? 'bg-brand-accent-red/20 border-brand-accent-red/30 text-brand-accent-red animate-pulse' 
                                : 'bg-brand-accent-yellow/20 border-brand-accent-yellow/30 text-brand-accent-yellow'
                            }`}>
                              Ref: {r.referencia}
                            </span>
                            <div>
                              <p className="font-semibold text-white">{r.nombre}</p>
                              <p className="text-[10px] text-brand-text-muted">Unitario: {r.precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} COP</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-extrabold ${r.stock <= STOCK_CRITICO ? 'text-brand-accent-red animate-pulse' : 'text-brand-accent-yellow'}`}>
                              {r.stock} u.
                            </span>
                            <span className="block text-[8px] text-brand-text-muted">
                              {r.stock <= STOCK_CRITICO ? 'Reabastecer Ya' : 'Bajo Stock'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 2: GESTIÓN DE CLIENTES
              ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'clientes' && (
            <div className="space-y-6">


              {/* Listado con filtros y buscador */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Listado de Clientes</h3>
                    <p className="text-[11px] text-brand-text-muted">Usuarios que acceden al sistema para ver sus motos.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchCliente}
                        onChange={handleClienteSearch}
                        className="bg-brand-bg border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-all w-full sm:w-64"
                      />
                      <svg className="w-3.5 h-3.5 text-brand-text-muted absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {canEditClientes && (
                      <button
                        onClick={() => { setSelectedCliente(null); setNewCliente({ nombre: '', correo: '', cedula: '', telefono: '', password: '', rol: 'cliente' }); setShowClienteForm(true); }}
                        className="bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-semibold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Cliente
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-surface/40 text-[10px] text-brand-text-muted uppercase tracking-wider border-b border-white/5">
                        <th className="px-5 py-3.5 font-semibold">Nombre</th>
                        <th className="px-5 py-3.5 font-semibold">Cédula</th>
                        <th className="px-5 py-3.5 font-semibold">Correo</th>
                        <th className="px-5 py-3.5 font-semibold">Teléfono</th>
                        <th className="px-5 py-3.5 font-semibold">Motos Propias</th>
                        <th className="px-5 py-3.5 font-semibold">Estado</th>
                        {canEditClientes && <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: canEditClientes ? 7 : 6 }).map((__, j) => (
                              <td key={j} className="px-5 py-4">
                                <div className="h-3 bg-white/5 rounded animate-pulse"></div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : clientes.length === 0 ? (
                        <tr>
                          <td colSpan={canEditClientes ? 7 : 6} className="px-5 py-12 text-center text-brand-text-muted">
                            No se encontraron clientes registrados en el sistema.
                          </td>
                        </tr>
                      ) : (
                        clientes.map((c) => {
                          const ownedMotos = motos.filter(m => m.id_propietario === c.id);
                          return (
                            <tr key={c.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-5 py-4 font-semibold text-white">{c.nombre}</td>
                              <td className="px-5 py-4 text-brand-text-muted font-mono">{c.cedula || '-'}</td>
                              <td className="px-5 py-4 text-brand-text-muted">{c.correo}</td>
                              <td className="px-5 py-4 text-brand-text-muted font-mono">{c.telefono || '-'}</td>
                              <td className="px-5 py-4">
                                {ownedMotos.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {ownedMotos.map(m => (
                                      <span key={m.id} className="px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-mono font-bold">
                                        {m.placa}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-brand-text-muted italic">Ninguna</span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  c.is_active 
                                    ? 'bg-brand-accent-green/10 text-brand-accent-green border-brand-accent-green/20' 
                                    : 'bg-brand-accent-red/10 text-brand-accent-red border-brand-accent-red/20'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-brand-accent-green' : 'bg-brand-accent-red'}`}></span>
                                  {c.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              {canEditClientes && (
                                <td className="px-5 py-4 text-right flex justify-end gap-2">
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleToggleClienteActive(c)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                        c.is_active 
                                          ? 'text-brand-accent-yellow border-brand-accent-yellow/20 bg-brand-accent-yellow/5 hover:bg-brand-accent-yellow/20' 
                                          : 'text-brand-accent-green border-brand-accent-green/20 bg-brand-accent-green/5 hover:bg-brand-accent-green/20'
                                      }`}
                                    >
                                      {c.is_active ? 'Desactivar' : 'Activar'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleEditClienteClick(c)}
                                    className="text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-1 rounded-lg hover:bg-brand-primary/20 transition-all text-[10px] cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeleteCliente(c)}
                                      className="text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 px-2 py-1 rounded-lg hover:bg-brand-accent-red/20 transition-all text-[10px] cursor-pointer"
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de Clientes */}
                {clientesTotalPages > 1 && (
                  <div className="glass rounded-2xl border border-white/5 p-4 flex items-center justify-between text-xs m-4">
                    <span className="text-brand-text-muted">
                      Página <strong className="text-white font-mono">{clientesPage}</strong> de <strong className="text-white font-mono">{clientesTotalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={clientesPage === 1}
                        onClick={() => { setClientesPage(prev => Math.max(prev - 1, 1)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={clientesPage === clientesTotalPages}
                        onClick={() => { setClientesPage(prev => Math.min(prev + 1, clientesTotalPages)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 2.5: GESTIÓN DE USUARIOS (EXCLUSIVO ADMINISTRADOR)
              ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'usuarios' && isAdmin && (
            <div className="space-y-6">
              
              {/* Listado con filtros y buscador */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Gestión de Usuarios</h3>
                    <p className="text-[11px] text-brand-text-muted">Administración global de accesos para mecánicos, administradores y clientes.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div>
                      <select
                        value={filterUsuarioRol}
                        onChange={e => { setFilterUsuarioRol(e.target.value); setUsuariosPage(1); }}
                        className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary transition-all w-full"
                      >
                        <option value="">Todos los Roles</option>
                        <option value="admin">Administradores</option>
                        <option value="empleado">Mecánicos (Empleados)</option>
                        <option value="cliente">Clientes</option>
                      </select>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={searchUsuario}
                        onChange={handleUsuarioSearch}
                        className="bg-brand-bg border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-all w-full sm:w-48"
                      />
                      <svg className="w-3.5 h-3.5 text-brand-text-muted absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {canEditUsuarios && (
                      <button
                        onClick={() => { setSelectedUsuario(null); setNewUsuario({ nombre: '', correo: '', cedula: '', telefono: '', password: '', rol: 'empleado' }); setShowUsuarioForm(true); }}
                        className="bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-semibold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Usuario
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-surface/40 text-[10px] text-brand-text-muted uppercase tracking-wider border-b border-white/5">
                        <th className="px-5 py-3.5 font-semibold">Nombre</th>
                        <th className="px-5 py-3.5 font-semibold">Rol</th>
                        <th className="px-5 py-3.5 font-semibold">Cédula</th>
                        <th className="px-5 py-3.5 font-semibold">Correo</th>
                        <th className="px-5 py-3.5 font-semibold">Teléfono</th>
                        <th className="px-5 py-3.5 font-semibold">Estado</th>
                        {canEditUsuarios && <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: canEditUsuarios ? 7 : 6 }).map((__, j) => (
                              <td key={j} className="px-5 py-4">
                                <div className="h-3 bg-white/5 rounded animate-pulse"></div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : usuarios.length === 0 ? (
                        <tr>
                          <td colSpan={canEditUsuarios ? 7 : 6} className="px-5 py-12 text-center text-brand-text-muted">
                            No se encontraron usuarios en el sistema.
                          </td>
                        </tr>
                      ) : (
                        usuarios.map((u) => {
                          return (
                            <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-5 py-4 font-semibold text-white">{u.nombre}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                  u.rol === 'admin' 
                                    ? 'bg-brand-accent-red/10 text-brand-accent-red border-brand-accent-red/20'
                                    : u.rol === 'empleado'
                                      ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                                      : 'bg-brand-accent-green/10 text-brand-accent-green border-brand-accent-green/20'
                                }`}>
                                  {u.rol}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-brand-text-muted font-mono">{u.cedula || '-'}</td>
                              <td className="px-5 py-4 text-brand-text-muted">{u.correo}</td>
                              <td className="px-5 py-4 text-brand-text-muted font-mono">{u.telefono || '-'}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  u.is_active 
                                    ? 'bg-brand-accent-green/10 text-brand-accent-green border-brand-accent-green/20' 
                                    : 'bg-brand-accent-red/10 text-brand-accent-red border-brand-accent-red/20'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-brand-accent-green' : 'bg-brand-accent-red'}`}></span>
                                  {u.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              {canEditUsuarios && (
                                <td className="px-5 py-4 text-right flex justify-end gap-2">
                                  <button
                                    onClick={() => handleToggleUsuarioActive(u)}
                                    disabled={u.id === user.id || u.rol === 'admin'}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                      u.is_active 
                                        ? 'text-brand-accent-yellow border-brand-accent-yellow/20 bg-brand-accent-yellow/5 hover:bg-brand-accent-yellow/20' 
                                        : 'text-brand-accent-green border-brand-accent-green/20 bg-brand-accent-green/5 hover:bg-brand-accent-green/20'
                                    }`}
                                  >
                                    {u.is_active ? 'Desactivar' : 'Activar'}
                                  </button>
                                  <button
                                    onClick={() => handleEditUsuarioClick(u)}
                                    className="text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-1 rounded-lg hover:bg-brand-primary/20 transition-all text-[10px] cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUsuario(u)}
                                    disabled={u.id === user.id}
                                    className="text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 px-2 py-1 rounded-lg hover:bg-brand-accent-red/20 transition-all text-[10px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de Usuarios */}
                {usuariosTotalPages > 1 && (
                  <div className="glass rounded-2xl border border-white/5 p-4 flex items-center justify-between text-xs m-4">
                    <span className="text-brand-text-muted">
                      Página <strong className="text-white font-mono">{usuariosPage}</strong> de <strong className="text-white font-mono">{usuariosTotalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={usuariosPage === 1}
                        onClick={() => { setUsuariosPage(prev => Math.max(prev - 1, 1)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={usuariosPage === usuariosTotalPages}
                        onClick={() => { setUsuariosPage(prev => Math.min(prev + 1, usuariosTotalPages)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 3: GESTIÓN DE MOTOCICLETAS
              ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'motos' && (
            <div className="space-y-6">


              {/* Tabla de motos */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Motocicletas Registradas</h3>
                    <p className="text-[11px] text-brand-text-muted">Lista total de placas activas y sus especificaciones técnicas.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar por placa..."
                        value={searchPlaca}
                        onChange={handlePlacaSearch}
                        className="bg-brand-bg border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-all w-full sm:w-48"
                      />
                      <svg className="w-3.5 h-3.5 text-brand-text-muted absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {canEditMotos && (
                      <button
                        onClick={() => { setSelectedMoto(null); setNewMoto({ placa: '', marca: '', modelo: '', color: '', cilindraje: '', anio: new Date().getFullYear(), id_propietario: '' }); setShowMotoForm(true); }}
                        className="bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-semibold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Moto
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-surface/40 text-[10px] text-brand-text-muted uppercase tracking-wider border-b border-white/5">
                        <th className="px-5 py-3.5 font-semibold">Placa</th>
                        <th className="px-5 py-3.5 font-semibold">Vehículo</th>
                        <th className="px-5 py-3.5 font-semibold">Año / Color</th>
                        <th className="px-5 py-3.5 font-semibold">Cilindraje</th>
                        <th className="px-5 py-3.5 font-semibold">Dueño</th>
                        <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 6 }).map((__, j) => (
                              <td key={j} className="px-5 py-4">
                                <div className="h-3 bg-white/5 rounded animate-pulse"></div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : motos.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-5 py-12 text-center text-brand-text-muted">
                            No se encontraron motos en la base de datos.
                          </td>
                        </tr>
                      ) : (
                        motos.map((m) => (
                          <tr key={m.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-5 py-4 font-mono font-bold text-brand-primary text-sm">{m.placa}</td>
                            <td className="px-5 py-4">
                              <span className="font-bold text-white block">{m.marca}</span>
                              <span className="text-[10px] text-brand-text-muted">{m.modelo}</span>
                            </td>
                            <td className="px-5 py-4 text-brand-text-muted">
                              <span>{m.anio}</span> · <span className="text-[10px]">{m.color}</span>
                            </td>
                            <td className="px-5 py-4 text-brand-text-muted font-mono">{m.cilindraje}</td>
                            <td className="px-5 py-4 font-semibold text-white">
                              {getPropietarioName(m.id_propietario)}
                            </td>
                            <td className="px-5 py-4 text-right flex justify-end gap-2">
                              <button
                                onClick={() => setServiceHistoryMoto(m)}
                                className="text-brand-accent-green bg-brand-accent-green/10 border border-brand-accent-green/20 px-2 py-1 rounded-lg hover:bg-brand-accent-green/20 transition-all text-[10px] cursor-pointer"
                              >
                                Historial
                              </button>
                              {canEditMotos && (
                                <>
                                  <button
                                    onClick={() => handleEditMotoClick(m)}
                                    className="text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-1 rounded-lg hover:bg-brand-primary/20 transition-all text-[10px] cursor-pointer"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMoto(m)}
                                    className="text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 px-2 py-1 rounded-lg hover:bg-brand-accent-red/20 transition-all text-[10px] cursor-pointer"
                                  >
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de Motos */}
                {motosTotalPages > 1 && (
                  <div className="glass rounded-2xl border border-white/5 p-4 flex items-center justify-between text-xs m-4">
                    <span className="text-brand-text-muted">
                      Página <strong className="text-white font-mono">{motosPage}</strong> de <strong className="text-white font-mono">{motosTotalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={motosPage === 1}
                        onClick={() => { setMotosPage(prev => Math.max(prev - 1, 1)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={motosPage === motosTotalPages}
                        onClick={() => { setMotosPage(prev => Math.min(prev + 1, motosTotalPages)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 4: INVENTARIO DE REPUESTOS (PUNTO 4)
              ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'repuestos' && (
            <div className="space-y-6">

              {/* Formulario Repuesto */}


              {/* Tabla de repuestos */}
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Control de Inventario</h3>
                    <p className="text-[11px] text-brand-text-muted">Lista y auditoría en tiempo real de repuestos e insumos del taller.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex gap-2 bg-brand-bg border border-white/10 rounded-xl px-3 py-2 items-center">
                      <select
                        value={searchRepuestoType}
                        onChange={e => {
                          setSearchRepuestoType(e.target.value);
                          setRepuestosPage(1);
                        }}
                        className="bg-transparent text-xs text-brand-primary border-none outline-none cursor-pointer font-semibold pr-2 focus:ring-0 focus:outline-none"
                      >
                        <option value="nombre" className="bg-brand-bg text-white">Nombre</option>
                        <option value="referencia" className="bg-brand-bg text-white">Referencia</option>
                      </select>
                      <div className="w-px h-4 bg-white/10"></div>
                      <input
                        type="text"
                        placeholder={`Buscar por ${searchRepuestoType === 'nombre' ? 'nombre' : 'referencia'}...`}
                        value={searchRepuestoQuery}
                        onChange={handleRepuestoSearchQuery}
                        className="bg-transparent border-none text-xs text-white placeholder-white/30 focus:outline-none w-28 sm:w-36 font-mono"
                      />
                    </div>

                    {canEditRepuestos && (
                      <button
                        onClick={() => { setSelectedRepuesto(null); setNewRepuesto({ referencia: '', nombre: '', stock: 0, precio: 0 }); setShowRepuestoForm(true); }}
                        className="bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-semibold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Cargar Repuesto
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-brand-surface/40 text-[10px] text-brand-text-muted uppercase tracking-wider border-b border-white/5">
                        <th className="px-5 py-3.5 font-semibold">Ref. única</th>
                        <th className="px-5 py-3.5 font-semibold">Nombre del repuesto</th>
                        <th className="px-5 py-3.5 font-semibold">Precio Unitario</th>
                        <th className="px-5 py-3.5 font-semibold">Stock</th>
                        <th className="px-5 py-3.5 font-semibold">Nivel Stock</th>
                        {canEditRepuestos && <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: canEditRepuestos ? 6 : 5 }).map((__, j) => (
                              <td key={j} className="px-5 py-4">
                                <div className="h-3 bg-white/5 rounded animate-pulse"></div>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : repuestos.length === 0 ? (
                        <tr>
                          <td colSpan={canEditRepuestos ? 6 : 5} className="px-5 py-12 text-center text-brand-text-muted">
                            No se encontraron repuestos registrados.
                          </td>
                        </tr>
                      ) : (
                        repuestos.map((r) => {
                          const isCritico = r.stock <= STOCK_CRITICO;
                          const isBajo = r.stock <= STOCK_BAJO && r.stock > STOCK_CRITICO;
                          return (
                            <tr key={r.id_repuesto} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-5 py-4 font-mono font-bold text-brand-primary">{r.referencia}</td>
                              <td className="px-5 py-4 font-medium text-white">{r.nombre}</td>
                              <td className="px-5 py-4 font-mono text-brand-text-muted">
                                {r.precio.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} COP
                              </td>
                              <td className="px-5 py-4">
                                <span className={`font-bold font-mono text-sm ${isCritico ? 'text-brand-accent-red' : isBajo ? 'text-brand-accent-yellow' : 'text-brand-accent-green'}`}>
                                  {r.stock} u.
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {isCritico ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-brand-accent-red/10 text-brand-accent-red border-brand-accent-red/20 animate-pulse">
                                    🚨 CRÍTICO
                                  </span>
                                ) : isBajo ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-brand-accent-yellow/10 text-brand-accent-yellow border-brand-accent-yellow/20">
                                    ⚠️ BAJO
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-brand-accent-green/10 text-brand-accent-green border-brand-accent-green/20">
                                    ✓ ÓPTIMO
                                  </span>
                                )}
                              </td>
                              {canEditRepuestos && (
                                <td className="px-5 py-4 text-right flex justify-end gap-2 items-center">
                                  <button
                                    onClick={() => handleEditRepuestoClick(r)}
                                    className="text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-1 rounded-lg hover:bg-brand-primary/20 transition-all text-[10px] cursor-pointer font-bold uppercase tracking-wider"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRepuesto(r)}
                                    className="text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 px-2 py-1 rounded-lg hover:bg-brand-accent-red/20 transition-all text-[10px] cursor-pointer font-bold uppercase tracking-wider"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginación de Repuestos */}
                {repuestosTotalPages > 1 && (
                  <div className="glass rounded-2xl border border-white/5 p-4 flex items-center justify-between text-xs m-4">
                    <span className="text-brand-text-muted">
                      Página <strong className="text-white font-mono">{repuestosPage}</strong> de <strong className="text-white font-mono">{repuestosTotalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={repuestosPage === 1}
                        onClick={() => { setRepuestosPage(prev => Math.max(prev - 1, 1)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={repuestosPage === repuestosTotalPages}
                        onClick={() => { setRepuestosPage(prev => Math.min(prev + 1, repuestosTotalPages)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TAB 5: ÓRDENES DE TRABAJO (PUNTO 3 & 4 FASE 3)
              ────────────────────────────────────────────────────────────────── */}
          {activeTab === 'ordenes' && (
            <div className="space-y-6">

              {/* Buscador y Control de Órdenes */}
              <div className="glass rounded-2xl border border-white/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Órdenes de Trabajo & Cotizaciones</h3>
                  <p className="text-[11px] text-brand-text-muted">
                    {user?.rol === 'cliente' 
                      ? 'Monitorea en tiempo real el estado técnico de tus motos y descarga cotizaciones oficiales.'
                      : 'Registro, cotización, diagnóstico técnico y trazabilidad de servicios del taller.'}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="N° Orden..."
                      value={searchOrdenId}
                      onChange={handleOrdenSearchId}
                      className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-all w-20 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Placa..."
                      value={searchOrdenPlaca}
                      onChange={handleOrdenSearchPlaca}
                      className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-all w-24 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Mecánico..."
                      value={searchOrdenMecanico}
                      onChange={handleOrdenSearchMecanico}
                      className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-primary transition-all w-28 sm:w-32"
                    />
                    <select
                      value={filterOrdenEstado}
                      onChange={e => { setFilterOrdenEstado(e.target.value); setOrdenesPage(1); }}
                      className="bg-brand-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary transition-all w-28 sm:w-32"
                    >
                      <option value="">Todos los estados</option>
                      <option value="Recepcion">Recepción</option>
                      <option value="Diagnostico">Diagnóstico</option>
                      <option value="Cotizacion">Cotización</option>
                      <option value="Reparacion">Reparación</option>
                      <option value="Entregado">Entregado</option>
                    </select>
                  </div>

                  {canEditOrdenes && (
                    <button
                      onClick={() => {
                        setSelectedOrden(null);
                        setNewOrden({
                          id_moto: '',
                          id_mecanico: '',
                          fecha_ingreso: new Date().toISOString().substring(0, 16),
                          diagnostico: '',
                          estado: 'Recepcion',
                          valor_mano_obra: 0,
                          detalleOrden: []
                        });
                        setShowOrdenForm(true);
                      }}
                      className="bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-semibold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Nueva Orden
                    </button>
                  )}
                </div>
              </div>

              {/* Listado de Órdenes de Trabajo Separadas */}
              <div className="space-y-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="glass rounded-2xl border border-white/5 p-6 space-y-4 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-1/4"></div>
                      <div className="h-10 bg-white/5 rounded w-full"></div>
                    </div>
                  ))
                ) : ordenes.length === 0 ? (
                  <div className="glass rounded-2xl border border-white/5 px-5 py-12 text-center text-brand-text-muted text-xs">
                    No se encontraron órdenes de trabajo registradas.
                  </div>
                ) : (
                  ordenes.map((o) => {
                    const totalEstimado = Number(o.total) || 0;
                    const isEntregado = o.estado === 'Entregado';
                    const currentMoto = motos.find(m => m.id === o.id_moto);
                    const matchedMecanico = allUsers.find(u => u.id === o.id_mecanico);

                    // Definición de estados del Timeline
                    const ESTADOS_TIMELINE = [
                      { clave: 'Recepcion', label: 'Recepción', color: 'text-brand-primary border-brand-primary bg-brand-primary/10' },
                      { clave: 'Diagnostico', label: 'Diagnóstico', color: 'text-brand-accent-yellow border-brand-accent-yellow bg-brand-accent-yellow/10' },
                      { clave: 'Cotizacion', label: 'Cotización', color: 'text-brand-accent-purple border-brand-accent-purple bg-brand-accent-purple/10' },
                      { clave: 'Reparacion', label: 'Reparación', color: 'text-brand-accent-blue border-brand-accent-blue bg-brand-accent-blue/10' },
                      { clave: 'Entregado', label: 'Entregado', color: 'text-brand-accent-green border-brand-accent-green bg-brand-accent-green/10' }
                    ];

                    return (
                      <div key={o.id_orden_trabajo} className="glass rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all duration-300 shadow-lg relative overflow-hidden space-y-5">
                        
                        {/* Cabecera Premium de la Orden con Efecto de Resplandor en el Fondo */}
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none"></div>
                        
                        {/* Grid de 2 Columnas Principal */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Columna Izquierda (8/12) - Info, Diagnóstico y Progreso */}
                          <div className="lg:col-span-8 space-y-5">
                            
                            {/* Fila de Datos Básicos de la Moto y Orden */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col gap-1.5">
                                  <span className="self-start px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-mono font-black rounded-lg text-xs tracking-wider shadow-sm">
                                    PLACA: {currentMoto ? currentMoto.placa : (o.placa_moto || 'TALLER')}
                                  </span>
                                  <span className="text-[10px] text-brand-text-muted mt-1 block">
                                    {new Date(o.fecha_ingreso).toLocaleString('es-CO')}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                                    Orden de Trabajo #{o.id_orden_trabajo}
                                  </h4>
                                  <p className="text-xs text-brand-text-muted mt-1">
                                    Moto: <span className="text-white font-semibold">{currentMoto ? `${currentMoto.marca} ${currentMoto.modelo}` : (o.marca_modelo || 'Vehículo registrado')}</span>
                                    <span className="mx-2 text-white/10">|</span>
                                    Mecánico: <span className="text-white font-semibold">{matchedMecanico ? matchedMecanico.nombre : (o.nombre_mecanico || 'No asignado')}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Contenedor de Diagnóstico Técnico */}
                            <div className="bg-white/[0.02] p-4.5 rounded-xl border border-white/5 relative group hover:border-white/10 transition-colors">
                              <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider block mb-2 font-mono">Diagnóstico & Tareas Realizadas</span>
                              <p className="text-xs text-white/90 leading-relaxed m-0 font-medium">
                                {o.diagnostico}
                              </p>
                            </div>

                            {/* TIMELINE PREMIUM DE 5 ESTADOS */}
                            <div className="bg-white/[0.01] p-4.5 rounded-xl border border-white/5">
                              <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider block mb-4 font-mono">Fase del Servicio (Progreso en Vivo)</span>
                              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 px-1">
                                {/* Línea conectora de fondo */}
                                <div className="absolute left-1/2 md:left-0 md:top-1/2 w-0.5 md:w-full h-full md:h-0.5 bg-white/5 -translate-x-1/2 md:translate-x-0 md:-translate-y-1/2 z-0 pointer-events-none"></div>

                                {ESTADOS_TIMELINE.map((item, index) => {
                                  const currentStatesIndex = ESTADOS_TIMELINE.findIndex(s => s.clave === o.estado);
                                  const isCompleted = index <= currentStatesIndex;
                                  const isActive = o.estado === item.clave;
                                  
                                  return (
                                    <button
                                      key={item.clave}
                                      type="button"
                                      disabled={!canEditOrdenes || isEntregado}
                                      onClick={() => handleUpdateOrdenEstado(o, item.clave)}
                                      className={`relative z-10 flex flex-row md:flex-col items-center gap-3 md:gap-2 w-full md:w-auto bg-brand-bg/80 md:bg-transparent p-2.5 md:p-0 rounded-xl md:rounded-none border md:border-none border-white/5 transition-all text-left md:text-center select-none ${
                                        !canEditOrdenes || isEntregado 
                                          ? 'cursor-default' 
                                          : 'cursor-pointer group hover:scale-[1.02] md:hover:scale-100'
                                      }`}
                                    >
                                      {/* Indicador en el Hilo */}
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 shrink-0 transition-all duration-300 ${
                                        isActive 
                                          ? `${item.color} shadow-[0_0_15px_rgba(255,255,255,0.08)] scale-110` 
                                          : isCompleted 
                                            ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/30' 
                                            : 'bg-brand-surface text-brand-text-muted border-white/5'
                                      }`}>
                                        {index + 1}
                                      </div>
                                      
                                      {/* Etiqueta */}
                                      <div>
                                        <span className={`text-[10px] font-extrabold tracking-tight block transition-colors ${
                                          isActive 
                                            ? 'text-brand-primary' 
                                            : isCompleted 
                                              ? 'text-white/80' 
                                              : 'text-brand-text-muted'
                                        }`}>
                                          {item.label}
                                        </span>
                                        <span className="text-[8px] text-brand-text-muted uppercase block font-mono">
                                          {isActive ? '✓ Activo' : isCompleted ? 'Listo' : 'Pendiente'}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                          </div>

                          {/* Columna Derecha (4/12) - Scoreboard y Repuestos Consumidos */}
                          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                            
                            {/* Scoreboard COP Financial Block */}
                            <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[105px]">
                              <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-brand-primary/10 blur-xl pointer-events-none"></div>
                              <span className="text-[9px] text-brand-primary uppercase font-black tracking-widest block font-mono">Total Liquidación</span>
                              <div>
                                <h3 className="text-2xl font-black text-white tracking-tight leading-none font-mono">
                                  {totalEstimado.toLocaleString('es-CO')}
                                </h3>
                                <span className="text-[10px] text-brand-text-muted font-bold font-mono">COP · Mano de Obra + Repuestos</span>
                              </div>
                            </div>

                            {/* Desglose de Insumos & Repuestos Consumidos */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 flex-1 flex flex-col min-h-[160px] max-h-[180px]">
                              <span className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider block mb-2 font-mono">Repuestos Utilizados</span>
                              <div className="overflow-y-auto flex-1 pr-1 space-y-2 custom-scrollbar">
                                {o.detalleOrden && o.detalleOrden.length > 0 ? (
                                  o.detalleOrden.map((d, dIdx) => {
                                    const precioUnitario = d.cantidad > 0 ? (d.subtotal / d.cantidad) : 0;
                                    return (
                                      <div key={d.id_detallerOrden || dIdx} className="flex justify-between items-center bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-lg p-2 transition-colors">
                                        <div className="min-w-0 flex-1 pr-2">
                                          <p className="text-[11px] font-bold text-white truncate m-0">
                                            {d.nombre_Respuesto || `Insumo #${d.id_repuesto}`}
                                          </p>
                                          <span className="text-[9px] text-brand-text-muted font-mono block">
                                            {d.cantidad} ud x {precioUnitario.toLocaleString('es-CO')} COP
                                          </span>
                                        </div>
                                        <span className="text-[11px] font-bold font-mono text-brand-primary shrink-0">
                                          +{d.subtotal.toLocaleString('es-CO')}
                                        </span>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-center py-4">
                                    <span className="text-[10px] text-brand-text-muted italic">Sin repuestos asignados</span>
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Acciones de la Orden en el pie del card */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 z-10 relative">
                          <span className="text-[10px] text-brand-text-muted">
                            Servicio administrado bajo protocolos de seguridad e inventario MotoBoss.
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {/* Descarga de PDF Cotización */}
                            <button
                              onClick={() => handleDownloadPdf(o)}
                              className="inline-flex items-center gap-1.5 text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-3.5 py-1.5 rounded-xl hover:bg-brand-primary/20 transition-all text-[11px] cursor-pointer font-bold uppercase tracking-wider"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Exportar PDF
                            </button>

                            {/* Editar Orden */}
                            {canEditOrdenes && !isEntregado && (
                              <button
                                onClick={() => handleEditOrdenClick(o)}
                                className="inline-flex items-center gap-1.5 text-brand-accent-blue bg-brand-accent-blue/10 border border-brand-accent-blue/20 px-3.5 py-1.5 rounded-xl hover:bg-brand-accent-blue/20 transition-all text-[11px] cursor-pointer font-bold uppercase tracking-wider"
                              >
                                Editar
                              </button>
                            )}

                            {/* Eliminar Orden */}
                            {isAdmin && !isEntregado && (
                              <button
                                onClick={() => handleDeleteOrden(o)}
                                className="inline-flex items-center gap-1.5 text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 px-3.5 py-1.5 rounded-xl hover:bg-brand-accent-red/20 transition-all text-[11px] cursor-pointer font-bold uppercase tracking-wider"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Paginación de Órdenes */}
                {ordenesTotalPages > 1 && (
                  <div className="glass rounded-2xl border border-white/5 p-4 flex items-center justify-between text-xs mt-4">
                    <span className="text-brand-text-muted">
                      Página <strong className="text-white font-mono">{ordenesPage}</strong> de <strong className="text-white font-mono">{ordenesTotalPages}</strong>
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={ordenesPage === 1}
                        onClick={() => { setOrdenesPage(prev => Math.max(prev - 1, 1)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Anterior
                      </button>
                      <button
                        disabled={ordenesPage === ordenesTotalPages}
                        onClick={() => { setOrdenesPage(prev => Math.min(prev + 1, ordenesTotalPages)); }}
                        className="bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-modal-in">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Mi Perfil</h2>
                <p className="text-xs text-brand-text-muted mt-0.5">Gestioná tus datos personales y cambiá tu contraseña de acceso.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta de Información General */}
                <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-between text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl bg-brand-primary/5 transition-all"></div>
                  
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-secondary/30 to-brand-primary/20 border border-brand-primary/30 flex items-center justify-center font-black text-brand-primary text-3xl shadow-xl mt-4 mb-4 select-none animate-pulse-subtle">
                    {user?.nombre?.substring(0,2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-white">{user?.nombre}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-brand-primary/10 border-brand-primary/20 text-brand-primary">
                      {user?.rol}
                    </span>
                  </div>

                  <div className="w-full border-t border-white/5 my-6 pt-6 space-y-3.5 text-left text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text-muted">Correo Electrónico:</span>
                      <span className="text-white font-medium truncate max-w-[150px]">{user?.correo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text-muted">Documento (Cédula):</span>
                      <span className="text-white font-mono font-medium">{user?.cedula || 'No registrado'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text-muted">Teléfono de contacto:</span>
                      <span className="text-white font-mono font-medium">{user?.telefono || 'No registrado'}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-brand-text-muted mb-2">Para cambiar tus datos de contacto o cédula, comunicate con un Administrador.</p>
                </div>

                {/* Formulario de Cambio de Clave */}
                <div className="md:col-span-2 glass p-6 rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cambiar Contraseña</h3>
                    <p className="text-[11px] text-brand-text-muted">Actualizá tu clave de acceso. Asegurate de cumplir con las políticas de complejidad.</p>
                  </div>

                  {profileError && (
                    <div className="text-xs text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-xl px-4 py-3">
                      {profileError}
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    {/* Contraseña Actual */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Contraseña Actual</label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          required
                          placeholder="Ingresá tu contraseña actual"
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="w-full bg-brand-bg border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-3 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                        >
                          {showCurrentPass ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nueva Contraseña */}
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Nueva Contraseña</label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            required
                            placeholder="Mínimo 8 caracteres"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full bg-brand-bg border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-3 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            {showNewPass ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirmar Nueva Contraseña */}
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Confirmar Contraseña</label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            required
                            placeholder="Repetir nueva contraseña"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full bg-brand-bg border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-3 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                          >
                            {showConfirmPass ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reglas de Complejidad */}
                    <div className="p-4 bg-brand-surface/20 rounded-xl border border-white/5 text-[10px] text-brand-text-muted space-y-1">
                      <span className="font-bold text-white uppercase block mb-1">Políticas de Seguridad:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-brand-accent-green' : 'bg-brand-accent-red'}`}></span>
                        <span>Mínimo 8 caracteres.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-brand-accent-green' : 'bg-brand-accent-red'}`}></span>
                        <span>Al menos una letra MAYÚSCULA.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/\d/.test(newPassword) ? 'bg-brand-accent-green' : 'bg-brand-accent-red'}`}></span>
                        <span>Al menos un número (0-9).</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${/[@$!%*?&]/.test(newPassword) ? 'bg-brand-accent-green' : 'bg-brand-accent-red'}`}></span>
                        <span>Al menos un carácter especial (@$!%*?&).</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                      >
                        {profileLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ── FOOTER PREMIUM ── */}
        <footer className="glass border-t border-white/5 py-4 px-6 md:px-10 text-center text-[10px] text-brand-text-muted flex flex-col sm:flex-row justify-between items-center gap-2 mt-auto">
          <p className="m-0">© {new Date().getFullYear()} MotoBoss Enterprise · Colombia. Innovasoft VIII</p>
          <p className="m-0 font-mono text-[9px] bg-white/5 px-2 py-1 rounded border border-white/5">
            Database: <span className="text-brand-primary">PostgreSQL</span> · Backend: <span className="text-brand-primary">{BASE_URL}</span>
          </p>
        </footer>
      </div>

      {/* ── FORMULARIOS MODALES CRUD GLOBALMENTE FLOTANTES ── */}

      {/* 1. Modal Registro/Edición Cliente */}
      {showClienteForm && canEditClientes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 p-6 shadow-2xl relative my-8 animate-modal-in">
            <button 
              onClick={() => { setShowClienteForm(false); setSelectedCliente(null); }} 
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">
                {selectedCliente ? `Editar Cliente: ${selectedCliente.nombre}` : 'Registrar Nuevo Cliente'}
              </h3>
            </div>

            {clienteFormError && (
              <div className="mb-4 text-xs text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-xl px-4 py-3">
                {clienteFormError}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateCliente} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={newCliente.nombre}
                  onChange={e => setNewCliente(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. juan@correo.com"
                  value={newCliente.correo}
                  onChange={e => setNewCliente(prev => ({ ...prev, correo: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Cédula de Ciudadanía</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1020304050"
                  value={newCliente.cedula}
                  onChange={e => setNewCliente(prev => ({ ...prev, cedula: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Teléfono de Contacto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 3123456789"
                  value={newCliente.telefono}
                  onChange={e => setNewCliente(prev => ({ ...prev, telefono: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">
                  {selectedCliente ? 'Nueva Contraseña (Dejar vacío para mantener)' : 'Contraseña de Acceso'}
                </label>
                <div className="relative">
                  <input
                    type={showClientePassword ? "text" : "password"}
                    required={!selectedCliente}
                    placeholder="Mínimo 8 car., Mayúscula, Número y Especial"
                    value={newCliente.password}
                    onChange={e => setNewCliente(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientePassword(!showClientePassword)}
                    className="absolute right-4 top-3 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showClientePassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <span className="text-[9px] text-brand-text-muted block mt-1">Requisitos: Mínimo 8 caracteres, 1 Mayúscula, 1 Número y 1 Carácter Especial.</span>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowClienteForm(false); setSelectedCliente(null); }}
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clienteFormLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                >
                  {clienteFormLoading ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Registro/Edición Usuario */}
      {showUsuarioForm && canEditUsuarios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 p-6 shadow-2xl relative my-8 animate-modal-in">
            <button 
              onClick={() => { setShowUsuarioForm(false); setSelectedUsuario(null); }} 
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">
                {selectedUsuario ? `Editar Usuario: ${selectedUsuario.nombre}` : 'Registrar Nuevo Usuario del Sistema'}
              </h3>
            </div>

            {usuarioFormError && (
              <div className="mb-4 text-xs text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-xl px-4 py-3">
                {usuarioFormError}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateUsuario} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pedro Gómez"
                  value={newUsuario.nombre}
                  onChange={e => setNewUsuario(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="Ej. pedro@correo.com"
                  value={newUsuario.correo}
                  onChange={e => setNewUsuario(prev => ({ ...prev, correo: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Cédula de Ciudadanía</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1020304050"
                  value={newUsuario.cedula}
                  onChange={e => setNewUsuario(prev => ({ ...prev, cedula: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Teléfono de Contacto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 3123456789"
                  value={newUsuario.telefono}
                  onChange={e => setNewUsuario(prev => ({ ...prev, telefono: e.target.value.replace(/\D/g, '') }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              
              {/* Selección de Rol en Creación */}
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Rol de Usuario</label>
                <select
                  required
                  disabled={!!selectedUsuario}
                  value={newUsuario.rol}
                  onChange={e => setNewUsuario(prev => ({ ...prev, rol: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-40"
                >
                  <option value="empleado">Mecánico (Empleado)</option>
                  <option value="admin">Administrador</option>
                  <option value="cliente">Cliente (Rol Acceso)</option>
                </select>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">
                  {selectedUsuario ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
                </label>
                <div className="relative">
                  <input
                    type={showUsuarioPassword ? "text" : "password"}
                    required={!selectedUsuario}
                    placeholder="Mínimo 8 car., Mayúscula, Número y Especial"
                    value={newUsuario.password}
                    onChange={e => setNewUsuario(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUsuarioPassword(!showUsuarioPassword)}
                    className="absolute right-4 top-3 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showUsuarioPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <span className="text-[9px] text-brand-text-muted block mt-1">Requisitos: Mínimo 8 caracteres, 1 Mayúscula, 1 Número y 1 Carácter Especial.</span>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUsuarioForm(false); setSelectedUsuario(null); }}
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={usuarioFormLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                >
                  {usuarioFormLoading ? 'Guardando...' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Registro/Edición Motocicleta */}
      {showMotoForm && canEditMotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 p-6 shadow-2xl relative my-8 animate-modal-in">
            <button 
              onClick={() => { setShowMotoForm(false); setSelectedMoto(null); }} 
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">
                {selectedMoto ? `Editar Motocicleta: ${selectedMoto.placa}` : 'Registrar Nueva Motocicleta'}
              </h3>
            </div>

            {motoFormError && (
              <div className="mb-4 text-xs text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-xl px-4 py-3">
                {motoFormError}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateMoto} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Placa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ABC-123"
                  disabled={!!selectedMoto}
                  value={newMoto.placa}
                  onChange={e => setNewMoto(prev => ({ ...prev, placa: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-40"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Marca</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Yamaha"
                  value={newMoto.marca}
                  onChange={e => setNewMoto(prev => ({ ...prev, marca: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Modelo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. MT-09"
                  value={newMoto.modelo}
                  onChange={e => setNewMoto(prev => ({ ...prev, modelo: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Color</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Negro Mate"
                  value={newMoto.color}
                  onChange={e => setNewMoto(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Cilindraje</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 847cc"
                  value={newMoto.cilindraje}
                  onChange={e => setNewMoto(prev => ({ ...prev, cilindraje: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Año Modelo</label>
                <input
                  type="number"
                  required
                  min="1901"
                  placeholder="Ej. 2024"
                  value={newMoto.anio}
                  onChange={e => setNewMoto(prev => ({ ...prev, anio: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Propietario / Cliente</label>
                <select
                  required
                  value={newMoto.id_propietario}
                  onChange={e => setNewMoto(prev => ({ ...prev, id_propietario: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                >
                  <option value="">-- Seleccionar Propietario --</option>
                  {allUsers.filter(u => u.rol === 'cliente').map(u => (
                    <option key={u.id} value={u.id} className="bg-brand-surface text-white">
                      {u.nombre} ({u.correo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowMotoForm(false); setSelectedMoto(null); }}
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={motoFormLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                >
                  {motoFormLoading ? 'Guardando...' : 'Guardar Motocicleta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Registro/Edición Repuesto */}
      {showRepuestoForm && canEditRepuestos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 p-6 shadow-2xl relative my-8 animate-modal-in">
            <button 
              onClick={() => { setShowRepuestoForm(false); setSelectedRepuesto(null); }} 
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">
                {selectedRepuesto ? `Modificar Repuesto: ${selectedRepuesto.referencia}` : 'Cargar Nuevo Repuesto al Inventario'}
              </h3>
            </div>

            {repuestoFormError && (
              <div className="mb-4 text-xs text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-xl px-4 py-3">
                {repuestoFormError}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateRepuesto} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider font-mono">Referencia Única</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. REF-50023"
                  disabled={!!selectedRepuesto}
                  value={newRepuesto.referencia}
                  onChange={e => setNewRepuesto(prev => ({ ...prev, referencia: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-40 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Nombre del Repuesto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pastillas Brembo Delanteras"
                  value={newRepuesto.nombre}
                  onChange={e => setNewRepuesto(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Cantidad en Stock</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Ej. 15"
                  value={newRepuesto.stock}
                  onChange={e => setNewRepuesto(prev => ({ ...prev, stock: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Precio Unitario (COP)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="Ej. 120000"
                  value={newRepuesto.precio}
                  onChange={e => setNewRepuesto(prev => ({ ...prev, precio: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
              </div>

              <div className="lg:col-span-4 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRepuestoForm(false); setSelectedRepuesto(null); }}
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={repuestoFormLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                >
                  {repuestoFormLoading ? 'Guardando...' : 'Guardar Repuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Registro/Edición Orden de Trabajo */}
      {showOrdenForm && canEditOrdenes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="glass w-full max-w-4xl rounded-2xl border border-white/10 p-6 shadow-2xl relative my-8 animate-modal-in">
            <button 
              onClick={() => { setShowOrdenForm(false); setSelectedOrden(null); }} 
              className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">
                {selectedOrden ? `Modificar Orden de Trabajo: #${selectedOrden.id_orden_trabajo}` : 'Registrar Nueva Orden de Trabajo'}
              </h3>
            </div>

            {ordenFormError && (
              <div className="mb-4 text-xs text-brand-accent-red bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-xl px-4 py-3">
                {ordenFormError}
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateOrden} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Selección de Motocicleta */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Motocicleta (Placa)</label>
                  <select
                    required
                    disabled={!!selectedOrden}
                    value={newOrden.id_moto}
                    onChange={e => setNewOrden(prev => ({ ...prev, id_moto: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all disabled:opacity-40"
                  >
                    <option value="">-- Seleccionar Moto --</option>
                    {motos.map(m => (
                      <option key={m.id} value={m.id} className="bg-brand-surface text-white">
                        {m.placa} - {m.marca} {m.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selección de Mecánico */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Mecánico Asignado</label>
                  <select
                    required
                    value={newOrden.id_mecanico}
                    onChange={e => setNewOrden(prev => ({ ...prev, id_mecanico: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  >
                    <option value="">-- Seleccionar Mecánico --</option>
                    {allUsers.filter(u => u.rol === 'empleado' || u.rol === 'admin').map(u => (
                      <option key={u.id} value={u.id} className="bg-brand-surface text-white">
                        {u.nombre} ({u.rol === 'admin' ? 'Admin' : 'Mecánico'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha de Ingreso */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Fecha Ingreso</label>
                  <input
                    type="datetime-local"
                    required
                    value={newOrden.fecha_ingreso}
                    onChange={e => setNewOrden(prev => ({ ...prev, fecha_ingreso: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                  />
                </div>

                {/* Estado de la orden (sólo visible en modificación) */}
                {selectedOrden && (
                  <div>
                    <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Estado Técnico</label>
                    <select
                      required
                      value={newOrden.estado}
                      onChange={e => setNewOrden(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    >
                      <option value="Recepcion">Recepción (Ingreso)</option>
                      <option value="Diagnostico">Diagnóstico (Evaluación)</option>
                      <option value="Cotizacion">Cotización (Presupuesto)</option>
                      <option value="Aprobacion_Cotizacion">Aprobación (Espera de Cliente)</option>
                      <option value="Reparacion">Reparación (Trabajo de Mecánico)</option>
                      <option value="Entregado">Listo / Entregado (Trabajo Terminado)</option>
                    </select>
                  </div>
                )}

                {/* Mano de Obra (COP) */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Valor Mano de Obra (COP)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newOrden.valor_mano_obra}
                    onChange={e => setNewOrden(prev => ({ ...prev, valor_mano_obra: e.target.value }))}
                    className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-mono"
                  />
                </div>
              </div>

              {/* Diagnóstico técnico */}
              <div>
                <label className="block text-[10px] font-bold text-brand-text-muted mb-1.5 uppercase tracking-wider">Diagnóstico Técnico & Comentarios</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Ej. Ruido extraño en motor, requiere cambio de empaquetadura de culata y ajuste general de válvulas."
                  value={newOrden.diagnostico}
                  onChange={e => setNewOrden(prev => ({ ...prev, diagnostico: e.target.value }))}
                  className="w-full bg-brand-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all leading-relaxed"
                />
              </div>

              {/* Carrito de Repuestos */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Repuestos & Consumibles Asociados</h4>
                    <p className="text-[10px] text-brand-text-muted">Añada consumibles directamente del inventario. El stock se recalculará dinámicamente.</p>
                  </div>
                  
                  {/* Selector de repuesto express */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={tempRepuesto.id_repuesto}
                      onChange={e => setTempRepuesto(prev => ({ ...prev, id_repuesto: e.target.value }))}
                      className="bg-brand-bg border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary transition-all w-full sm:w-56"
                    >
                      <option value="">-- Añadir Repuesto --</option>
                      {repuestos.map(r => (
                        <option key={r.id_repuesto} value={r.id_repuesto}>
                          {r.nombre} (Dispo: {r.stock} u.)
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={tempRepuesto.cantidad}
                      onChange={e => setTempRepuesto(prev => ({ ...prev, cantidad: e.target.value }))}
                      className="bg-brand-bg border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white text-center focus:outline-none focus:border-brand-primary transition-all w-16"
                    />
                    <button
                      type="button"
                      onClick={handleAddRepuestoToOrden}
                      className="bg-brand-primary hover:brightness-110 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Lista de repuestos cargados a la orden */}
                <div className="overflow-x-auto border border-white/5 rounded-xl bg-brand-surface/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-brand-surface/40 text-[10px] text-brand-text-muted uppercase font-bold tracking-wider border-b border-white/5">
                        <th className="px-4 py-2">Detalle de Repuesto</th>
                        <th className="px-4 py-2 text-right">Precio Unitario</th>
                        <th className="px-4 py-2 text-center">Cantidad</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                        <th className="px-4 py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {newOrden.detalleOrden.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-brand-text-muted italic">
                            No hay repuestos agregados a esta orden.
                          </td>
                        </tr>
                      ) : (
                        newOrden.detalleOrden.map((d) => (
                          <tr key={d.id_repuesto} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-4 py-2 font-medium text-white">
                              {d.nombre_Respuesto}
                            </td>
                            <td className="px-4 py-2 text-right text-brand-text-muted font-mono">
                              {d.precio.toLocaleString('es-CO')} COP
                            </td>
                            <td className="px-4 py-2 text-center text-white font-mono">
                              {d.cantidad} u.
                            </td>
                            <td className="px-4 py-2 text-right text-brand-primary font-bold font-mono">
                              {d.subtotal.toLocaleString('es-CO')} COP
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveRepuestoFromOrden(d.id_repuesto)}
                                className="text-brand-accent-red hover:text-brand-accent-red/80 font-bold font-mono cursor-pointer"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totales de la orden */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-brand-surface/10 p-4 rounded-xl border border-white/5">
                  <div className="text-[11px] text-brand-text-muted">
                    Mano de obra: <strong className="text-white font-mono">{parseFloat(newOrden.valor_mano_obra || 0).toLocaleString('es-CO')} COP</strong><br />
                    Repuestos: <strong className="text-white font-mono">
                      {newOrden.detalleOrden.reduce((acc, curr) => acc + curr.subtotal, 0).toLocaleString('es-CO')} COP
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider block">Total General Estimado</span>
                    <h3 className="text-2xl font-black text-brand-primary font-mono mt-1">
                      {(
                        parseFloat(newOrden.valor_mano_obra || 0) + 
                        newOrden.detalleOrden.reduce((acc, curr) => acc + curr.subtotal, 0)
                      ).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} COP
                    </h3>
                  </div>
                </div>
              </div>

              {/* Botones de Envío */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowOrdenForm(false); setSelectedOrden(null); }}
                  className="bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ordenFormLoading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                >
                  {ordenFormLoading ? 'Procesando...' : (selectedOrden ? 'Guardar Cambios' : 'Registrar Orden')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE HISTORIAL DE SERVICIOS (RF-07) ── */}
      {serviceHistoryMoto && (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative animate-float-subtle">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-brand-surface">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-mono font-bold rounded text-xs">
                  {serviceHistoryMoto.placa}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">{serviceHistoryMoto.marca} {serviceHistoryMoto.modelo}</h3>
                  <span className="text-[10px] text-brand-text-muted">Propietario: {getPropietarioName(serviceHistoryMoto.id_propietario)}</span>
                </div>
              </div>
              <button 
                onClick={() => setServiceHistoryMoto(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[450px] overflow-y-auto space-y-6">
              <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Historial de Ordenes & Servicios (RF-07)</h4>
              
              <div className="relative border-l-2 border-white/5 ml-3 pl-6 space-y-6">
                {loadingMotoHistory ? (
                  <div className="text-center py-8 text-brand-text-muted text-xs">
                    <div className="inline-block w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Consultando historial en tiempo real...</p>
                  </div>
                ) : motoHistoryOrders.length === 0 ? (
                  <div className="text-center py-8 text-brand-text-muted text-xs italic">
                    Esta motocicleta no tiene registros de servicios u órdenes de trabajo en el sistema.
                  </div>
                ) : (
                  motoHistoryOrders.map((hist) => {
                    const totalCosto = Number(hist.total) || parseFloat(hist.valor_mano_obra || 0) + (hist.detalleOrden ? hist.detalleOrden.reduce((acc, curr) => acc + (curr.precio * curr.cantidad), 0) : 0);
                    const matchedMecanico = allUsers.find(u => u.id === hist.id_mecanico);
                    return (
                      <div key={hist.id_orden_trabajo} className="relative">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-bg border-2 border-brand-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse"></span>
                        </span>

                        <div className="glass p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                            <div>
                              <span className="text-[10px] text-brand-text-muted block">{new Date(hist.fecha_ingreso).toLocaleString('es-CO')}</span>
                              <span className="text-xs font-bold text-white">Servicio Técnico</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-brand-primary font-mono bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded">
                                {totalCosto.toLocaleString('es-CO')} COP
                              </span>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                hist.estado === 'Entregado'
                                  ? 'bg-brand-accent-green/20 border-brand-accent-green/30 text-brand-accent-green'
                                  : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                              }`}>
                                {hist.estado}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-brand-text-muted leading-relaxed">{hist.diagnostico || 'Sin diagnóstico registrado.'}</p>
                          <div className="mt-3 flex items-center justify-between text-[10px] border-t border-white/5 pt-2">
                            <span className="text-brand-text-muted">Mecánico Asignado: <strong className="text-white">{matchedMecanico ? matchedMecanico.nombre : (hist.nombre_mecanico || 'No asignado')}</strong></span>
                            <span className="text-white/40">Orden #{hist.id_orden_trabajo}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/5 bg-brand-surface/30 flex justify-end">
              <button 
                onClick={() => setServiceHistoryMoto(null)}
                className="bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 text-white font-semibold px-6 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sistema global de notificaciones Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-bounce-subtle pointer-events-none">
          <div className={`glass px-5 py-4 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'border-brand-accent-green/20 bg-brand-accent-green/10 text-brand-accent-green shadow-brand-accent-green/10' 
              : 'border-brand-accent-red/20 bg-brand-accent-red/10 text-brand-accent-red shadow-brand-accent-red/10'
          }`}>
            <div className={`p-2 rounded-xl ${
              toast.type === 'success' ? 'bg-brand-accent-green/20' : 'bg-brand-accent-red/20'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-brand-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-brand-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">{toast.type === 'success' ? 'Éxito' : 'Error'}</p>
              <p className="text-[11px] text-brand-text-muted mt-0.5">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
