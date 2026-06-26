import { useState } from "react";
import {
  Building2, Mail, Lock, Eye, EyeOff, ArrowLeft,
  Users, BarChart3, LogOut, Bell, Plus, Search,
  X, Check, AlertTriangle, Wrench, CreditCard,
  MoreHorizontal, CheckCircle2, Clock, Send,
  ChevronDown, Shield, Home, RefreshCw, UserPlus,
  AlertCircle, LogIn,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View = "login" | "reset" | "firstLogin" | "admin" | "owner" | "tenant" | "concierge" | "maintenance";
type Role = "admin" | "owner" | "tenant" | "concierge" | "maintenance";
type TicketStatus = "pending" | "inProcess" | "resolved";
type PaymentStatus = "paid" | "pending" | "overdue";
type AdminTab = "users" | "finances";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  unit?: string;
  phone?: string;
  status: "active" | "inactive";
}

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  unit: string;
  owner: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: TicketStatus;
  createdAt: string;
  assignedTo?: string;
  requiresAuth: boolean;
  authStatus?: "pending" | "approved" | "rejected";
}

interface UnitPayment {
  unit: string;
  owner: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const USERS: User[] = [
  { id: "1", name: "Carmen Rodríguez", email: "carmen.rodriguez@mirador.cl", role: "admin", status: "active" },
  { id: "2", name: "Patricio Vega", email: "patricio.vega@gmail.com", role: "owner", unit: "4B", phone: "+56 9 8812 3456", status: "active" },
  { id: "3", name: "Valentina Torres", email: "valentina.torres@gmail.com", role: "owner", unit: "7A", phone: "+56 9 9234 5678", status: "active" },
  { id: "4", name: "Andrés Muñoz", email: "andres.munoz@gmail.com", role: "tenant", unit: "2C", phone: "+56 9 7654 3210", status: "active" },
  { id: "5", name: "Sofía Herrera", email: "sofia.herrera@gmail.com", role: "tenant", unit: "5D", phone: "+56 9 8765 4321", status: "active" },
  { id: "6", name: "Roberto Méndez", email: "roberto.mendez@mirador.cl", role: "concierge", status: "active" },
  { id: "7", name: "Felipe Castillo", email: "felipe.castillo@mirador.cl", role: "maintenance", phone: "+56 9 6543 2109", status: "active" },
  { id: "8", name: "Jorge Pizarro", email: "jorge.pizarro@mirador.cl", role: "maintenance", phone: "+56 9 5432 1098", status: "inactive" },
];

const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: "TKT-001", title: "Filtración en cielo sala de estar",
    description: "Mancha de humedad visible en el techo de la sala. Posible origen en baño del piso superior.",
    unit: "4B", owner: "Patricio Vega", category: "Plomería", priority: "high",
    status: "inProcess", createdAt: "2026-06-20", assignedTo: "Felipe Castillo",
    requiresAuth: true, authStatus: "pending",
  },
  {
    id: "TKT-002", title: "Cerradura puerta de servicio dañada",
    description: "La cerradura no cierra correctamente desde hace 3 días.",
    unit: "7A", owner: "Valentina Torres", category: "Cerrajería", priority: "medium",
    status: "pending", createdAt: "2026-06-22", requiresAuth: false,
  },
  {
    id: "TKT-003", title: "Falla en calefacción central",
    description: "El sistema no alcanza temperatura adecuada en temporada de frío.",
    unit: "2C", owner: "Andrés Muñoz", category: "Climatización", priority: "high",
    status: "pending", createdAt: "2026-06-23", requiresAuth: false,
  },
  {
    id: "TKT-004", title: "Luminaria cocina quemada",
    description: "El artefacto empotrado de la cocina dejó de funcionar.",
    unit: "5D", owner: "Sofía Herrera", category: "Electricidad", priority: "low",
    status: "resolved", createdAt: "2026-06-18", assignedTo: "Felipe Castillo",
    requiresAuth: false,
  },
  {
    id: "TKT-005", title: "Grieta en muro divisorio principal",
    description: "Grieta horizontal en muro maestro entre living y dormitorio. Requiere evaluación estructural.",
    unit: "4B", owner: "Patricio Vega", category: "Estructural", priority: "high",
    status: "pending", createdAt: "2026-06-24", requiresAuth: true,
  },
  {
    id: "TKT-006", title: "Puerta balcón no cierra herméticamente",
    description: "La puerta corrediza del balcón deja pasar corrientes de aire frío.",
    unit: "7A", owner: "Valentina Torres", category: "Carpintería", priority: "medium",
    status: "inProcess", createdAt: "2026-06-21", assignedTo: "Felipe Castillo",
    requiresAuth: false,
  },
];

const UNIT_PAYMENTS: UnitPayment[] = [
  { unit: "4B", owner: "Patricio Vega", amount: 85000, status: "paid", dueDate: "2026-06-05" },
  { unit: "7A", owner: "Valentina Torres", amount: 85000, status: "pending", dueDate: "2026-06-05" },
  { unit: "2C", owner: "Andrés Muñoz", amount: 78000, status: "overdue", dueDate: "2026-05-05" },
  { unit: "5D", owner: "Sofía Herrera", amount: 78000, status: "paid", dueDate: "2026-06-05" },
  { unit: "3A", owner: "Manuel Soto", amount: 85000, status: "overdue", dueDate: "2026-05-05" },
  { unit: "6B", owner: "Daniela Fuentes", amount: 92000, status: "paid", dueDate: "2026-06-05" },
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  owner: "Propietario",
  tenant: "Arrendatario",
  concierge: "Conserje",
  maintenance: "Personal de Mantención",
};

const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-violet-100 text-violet-800",
  owner: "bg-blue-100 text-blue-800",
  tenant: "bg-sky-100 text-sky-700",
  concierge: "bg-amber-100 text-amber-700",
  maintenance: "bg-orange-100 text-orange-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const PRIORITY_LABELS: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" };

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "Al día",
  pending: "Pendiente",
  overdue: "En mora",
};

const KANBAN_LABELS: Record<TicketStatus, string> = {
  pending: "Pendiente",
  inProcess: "En Proceso",
  resolved: "Resuelto",
};

const formatCLP = (n: number) => `$${n.toLocaleString("es-CL")}`;

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-wide font-[DM_Mono,monospace] ${className}`}>
      {children}
    </span>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

function Btn({
  children, onClick, variant = "primary", size = "md",
  disabled = false, className = "", type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants: Record<BtnVariant, string> = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-500",
    secondary: "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 focus:ring-blue-300",
    ghost: "text-slate-600 hover:bg-slate-100 focus:ring-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-400",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-400",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Field({
  label, type = "text", value, onChange, placeholder, icon, right, rows,
}: {
  label?: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  icon?: React.ReactNode; right?: React.ReactNode; rows?: number;
}) {
  const inputClass = `w-full border border-slate-200 bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${icon ? "pl-9" : ""} ${right ? "pr-10" : ""}`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-slate-400 pointer-events-none">{icon}</span>}
        {rows ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`${inputClass} resize-none`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClass}
          />
        )}
        {right && <span className="absolute right-3 text-slate-400">{right}</span>}
      </div>
    </div>
  );
}

function Modal({
  open, onClose, title, children, width = "max-w-lg",
}: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${width} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── SHARED: BUILDING LOGO ────────────────────────────────────────────────────

function BuildingLogo() {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-700/30">
        <Building2 size={28} className="text-white" />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-[DM_Mono,monospace] tracking-[0.2em] text-blue-500 uppercase mb-0.5">Edificio</p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">El Mirador</h1>
        <p className="text-xs text-slate-500 mt-0.5">Sistema de Gestión Residencial</p>
      </div>
    </div>
  );
}

// ─── AUTH: LOGIN ──────────────────────────────────────────────────────────────

function LoginView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>("admin");
  const [open, setOpen] = useState(false);

  const demoMap: Array<{ role: Role; view: View }> = [
    { role: "admin", view: "admin" },
    { role: "owner", view: "owner" },
    { role: "tenant", view: "tenant" },
    { role: "concierge", view: "concierge" },
    { role: "maintenance", view: "maintenance" },
  ];

  const handleLogin = () => {
    const entry = demoMap.find((d) => d.role === demoRole);
    onNavigate(entry?.view ?? "admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8">
          <BuildingLogo />
          <div className="flex flex-col gap-4">
            <Field
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="tu@correo.cl"
              icon={<Mail size={14} />}
            />
            <Field
              label="Contraseña"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={<Lock size={14} />}
              right={
                <button onClick={() => setShowPwd(!showPwd)} className="cursor-pointer">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50">
              <button
                className="flex items-center justify-between w-full text-xs text-slate-500 font-semibold"
                onClick={() => setOpen(!open)}
              >
                <span>Acceso de demostración</span>
                <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? (
                <div className="mt-2 flex flex-col gap-1">
                  {demoMap.map(({ role }) => (
                    <button
                      key={role}
                      onClick={() => { setDemoRole(role); setOpen(false); }}
                      className={`text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                        demoRole === role ? "bg-blue-700 text-white" : "hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs font-semibold text-blue-600">→ {ROLE_LABELS[demoRole]}</p>
              )}
            </div>

            <Btn size="lg" onClick={handleLogin} className="w-full mt-1">
              <LogIn size={15} />
              Iniciar Sesión
            </Btn>
          </div>
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              onClick={() => onNavigate("reset")}
              className="text-sm text-blue-600 hover:underline transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <button
              onClick={() => onNavigate("firstLogin")}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Primer ingreso — cambiar contraseña temporal
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">© 2026 Administración Edificio El Mirador</p>
      </div>
    </div>
  );
}

// ─── AUTH: RESET PASSWORD ─────────────────────────────────────────────────────

function ResetView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8">
          <BuildingLogo />
          <div className="text-center mb-6">
            <h2 className="text-base font-bold text-slate-900">Restablecer Credenciales</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ingresa tu correo registrado y recibirás un enlace para recuperar el acceso.
            </p>
          </div>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">Enlace enviado</p>
                <p className="text-xs text-slate-500 mt-1">Revisa tu bandeja en <strong>{email}</strong></p>
              </div>
              <Btn variant="ghost" onClick={() => onNavigate("login")} size="sm">
                <ArrowLeft size={13} /> Volver al inicio
              </Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Field
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="tu@correo.cl"
                icon={<Mail size={14} />}
              />
              <Btn size="lg" onClick={() => email && setSent(true)} className="w-full" disabled={!email}>
                <Send size={15} />
                Enviar enlace de recuperación
              </Btn>
              <button
                onClick={() => onNavigate("login")}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft size={13} /> Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AUTH: FIRST LOGIN ────────────────────────────────────────────────────────

function FirstLoginView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showN, setShowN] = useState(false);
  const [showC, setShowC] = useState(false);
  const [done, setDone] = useState(false);

  const strong = newPwd.length >= 8;
  const match = newPwd === confirm && newPwd.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8">
          <BuildingLogo />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex gap-3">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Por razones de seguridad, debes cambiar la contraseña temporal asignada por la administración antes de continuar.
            </p>
          </div>
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 text-sm">Contraseña establecida</p>
                <p className="text-xs text-slate-500 mt-1">Tu acceso ha sido configurado correctamente.</p>
              </div>
              <Btn onClick={() => onNavigate("login")} className="w-full">Ir al inicio de sesión</Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Field
                label="Nueva Contraseña"
                type={showN ? "text" : "password"}
                value={newPwd}
                onChange={setNewPwd}
                placeholder="Mínimo 8 caracteres"
                icon={<Lock size={14} />}
                right={<button onClick={() => setShowN(!showN)} className="cursor-pointer">{showN ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
              />
              {newPwd && !strong && <p className="text-xs text-red-500 -mt-2">Mínimo 8 caracteres requeridos</p>}
              <Field
                label="Confirmar Contraseña"
                type={showC ? "text" : "password"}
                value={confirm}
                onChange={setConfirm}
                placeholder="Repite la contraseña"
                icon={<Lock size={14} />}
                right={<button onClick={() => setShowC(!showC)} className="cursor-pointer">{showC ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
              />
              {confirm && !match && <p className="text-xs text-red-500 -mt-2">Las contraseñas no coinciden</p>}
              <Btn size="lg" onClick={() => match && strong && setDone(true)} disabled={!match || !strong} className="w-full mt-1">
                <Shield size={15} />
                Establecer Nueva Contraseña
              </Btn>
              <button
                onClick={() => onNavigate("login")}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft size={13} /> Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN: SIDEBAR ───────────────────────────────────────────────────────────

function AdminSidebar({ tab, onTab, onLogout }: { tab: AdminTab; onTab: (t: AdminTab) => void; onLogout: () => void }) {
  const items: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: "users", label: "Usuarios", icon: <Users size={17} /> },
    { id: "finances", label: "Finanzas", icon: <BarChart3 size={17} /> },
  ];
  return (
    <aside className="w-60 bg-slate-900 min-h-screen flex flex-col py-6 px-4 flex-shrink-0">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">El Mirador</p>
          <p className="text-slate-500 text-xs">Administración</p>
        </div>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">CR</span>
          </div>
          <div>
            <p className="text-white text-xs font-semibold leading-tight">Carmen Rodríguez</p>
            <p className="text-slate-500 text-xs">Administradora</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
        >
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ─── ADMIN: REGISTER USER MODAL ───────────────────────────────────────────────

function RegisterUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", lastName: "", email: "", phone: "", unit: "",
    role: "owner" as Exclude<Role, "admin">,
    sendPassword: true,
  });
  const [done, setDone] = useState(false);

  const roles: Array<{ value: Exclude<Role, "admin">; label: string }> = [
    { value: "owner", label: "Propietario" },
    { value: "tenant", label: "Arrendatario" },
    { value: "concierge", label: "Conserje" },
    { value: "maintenance", label: "Personal de Mantención" },
  ];

  const reset = () => {
    setDone(false);
    setForm({ name: "", lastName: "", email: "", phone: "", unit: "", role: "owner", sendPassword: true });
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Registrar Nuevo Usuario" width="max-w-xl">
      {done ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={26} className="text-green-600" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800">Usuario registrado</p>
            <p className="text-sm text-slate-500 mt-1">
              {form.name} {form.lastName} fue añadido como <strong>{roles.find((r) => r.value === form.role)?.label}</strong>.
            </p>
            {form.sendPassword && (
              <p className="text-xs text-blue-600 mt-2 flex items-center justify-center gap-1">
                <Send size={11} /> Contraseña temporal enviada a {form.email}
              </p>
            )}
          </div>
          <Btn onClick={() => { reset(); onClose(); }}>Cerrar</Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ej: Valentina" />
            <Field label="Apellido" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} placeholder="Ej: Torres" />
          </div>
          <Field label="Correo electrónico" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="correo@ejemplo.cl" icon={<Mail size={13} />} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+56 9 XXXX XXXX" />
            <Field label="Unidad / Depto." value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="Ej: 4B" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rol del usuario</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Exclude<Role, "admin"> })}
              className="border border-slate-200 bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer hover:bg-blue-100/50 transition-colors">
            <input
              type="checkbox"
              checked={form.sendPassword}
              onChange={(e) => setForm({ ...form, sendPassword: e.target.checked })}
              className="mt-0.5 accent-blue-600 w-4 h-4"
            />
            <div>
              <p className="text-sm font-semibold text-blue-900">Generar y enviar contraseña temporal al correo del usuario</p>
              <p className="text-xs text-blue-700 mt-0.5">El sistema enviará automáticamente las credenciales de acceso por correo electrónico.</p>
            </div>
          </label>
          <div className="flex justify-end gap-2 mt-1">
            <Btn variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Btn>
            <Btn onClick={() => form.name && form.email && setDone(true)} disabled={!form.name || !form.email}>
              <UserPlus size={14} /> Registrar Usuario
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── ADMIN: USERS MODULE ──────────────────────────────────────────────────────

function UsersModule() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = USERS.filter((u) => {
    const q = search.toLowerCase();
    const match = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return match && (roleFilter === "all" || u.role === roleFilter);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm text-slate-500 mt-0.5">{USERS.length} usuarios · 5 roles activos</p>
        </div>
        <Btn onClick={() => setShowModal(true)}>
          <Plus size={14} /> Registrar Nuevo Usuario
        </Btn>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="all">Todos los roles</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Nombre", "Correo", "Rol", "Unidad", "Estado", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((user) => {
              const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-bold">{initials}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-[DM_Mono,monospace] text-xs">{user.email}</td>
                  <td className="px-4 py-3"><Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge></td>
                  <td className="px-4 py-3 font-[DM_Mono,monospace] text-xs text-slate-600">{user.unit ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={user.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">Sin resultados para la búsqueda actual.</div>
        )}
      </div>
      <RegisterUserModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

// ─── ADMIN: FINANCES MODULE ───────────────────────────────────────────────────

function FinancesModule() {
  const [calculated, setCalculated] = useState(false);
  const total = UNIT_PAYMENTS.reduce((s, u) => s + u.amount, 0);
  const paid = UNIT_PAYMENTS.filter((u) => u.status === "paid").reduce((s, u) => s + u.amount, 0);
  const pending = UNIT_PAYMENTS.filter((u) => u.status === "pending").reduce((s, u) => s + u.amount, 0);
  const overdue = UNIT_PAYMENTS.filter((u) => u.status === "overdue").reduce((s, u) => s + u.amount, 0);

  const kpis = [
    { label: "Total a Recaudar", value: total, cls: "text-slate-900", bg: "bg-white border-slate-100" },
    { label: "Recaudado", value: paid, cls: "text-green-700", bg: "bg-green-50 border-green-100" },
    { label: "Pendiente", value: pending, cls: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
    { label: "En Mora", value: overdue, cls: "text-red-700", bg: "bg-red-50 border-red-100" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Finanzas y Recaudación</h2>
          <p className="text-sm text-slate-500 mt-0.5">Período: Junio 2026 · Gastos Comunes</p>
        </div>
        <Btn variant={calculated ? "secondary" : "primary"} onClick={() => setCalculated(true)}>
          <RefreshCw size={14} />
          {calculated ? "Cuotas Calculadas ✓" : "Calcular Cuotas"}
        </Btn>
      </div>
      {calculated && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-600" />
          Cuotas calculadas y notificaciones enviadas a todos los propietarios.
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`border rounded-xl p-4 shadow-sm ${kpi.bg}`}>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">{kpi.label}</p>
            <p className={`text-lg font-extrabold font-[DM_Mono,monospace] ${kpi.cls}`}>{formatCLP(kpi.value)}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Detalle por Unidad — Junio 2026</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              {["Unidad", "Propietario / Arrendatario", "Monto", "Vencimiento", "Estado"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {UNIT_PAYMENTS.map((p) => (
              <tr key={p.unit} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3 font-[DM_Mono,monospace] text-xs font-bold text-slate-800">{p.unit}</td>
                <td className="px-5 py-3 text-slate-700">{p.owner}</td>
                <td className="px-5 py-3 font-[DM_Mono,monospace] font-bold text-slate-900">{formatCLP(p.amount)}</td>
                <td className="px-5 py-3 text-slate-500 font-[DM_Mono,monospace] text-xs">{p.dueDate}</td>
                <td className="px-5 py-3"><Badge className={PAYMENT_COLORS[p.status]}>{PAYMENT_LABELS[p.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD WRAPPER ──────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("users");
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar tab={tab} onTab={setTab} onLogout={onLogout} />
      <main className="flex-1 p-8 overflow-auto min-w-0">
        <div className="max-w-5xl mx-auto">
          {tab === "users" ? <UsersModule /> : <FinancesModule />}
        </div>
      </main>
    </div>
  );
}

// ─── SHARED: MOBILE HEADER ────────────────────────────────────────────────────

function MobileHeader({ name, role, onLogout }: { name: string; role: Role; onLogout: () => void }) {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center">
          <Building2 size={13} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-extrabold text-slate-900 leading-tight">El Mirador</p>
          <Badge className={`${ROLE_COLORS[role]} text-[10px]`}>{ROLE_LABELS[role]}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 hover:bg-slate-100 rounded-lg relative">
          <Bell size={17} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <button onClick={onLogout} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

// ─── OWNER/TENANT: ACCOUNT CARD ───────────────────────────────────────────────

function AccountStatusCard({ unit, balance, status }: { unit: string; balance: number; status: PaymentStatus }) {
  const statusBg: Record<PaymentStatus, string> = {
    paid: "bg-green-400/20 text-green-200 border border-green-400/30",
    pending: "bg-amber-400/20 text-amber-200 border border-amber-400/30",
    overdue: "bg-red-400/20 text-red-200 border border-red-400/30",
  };
  return (
    <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white shadow-xl shadow-blue-800/30">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-blue-300 text-[10px] font-bold tracking-widest uppercase">Unidad</p>
          <p className="text-3xl font-extrabold font-[DM_Mono,monospace] mt-0.5">{unit}</p>
        </div>
        <Badge className={statusBg[status]}>{PAYMENT_LABELS[status]}</Badge>
      </div>
      <div className="mb-5">
        <p className="text-blue-300 text-xs mb-1">Gastos Comunes — Jun 2026</p>
        <p className="text-3xl font-extrabold font-[DM_Mono,monospace]">{formatCLP(balance)}</p>
      </div>
      <button className="w-full bg-white text-blue-800 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-md">
        <CreditCard size={15} /> Pagar en Línea · Webpay / Flow
      </button>
    </div>
  );
}

// ─── OWNER/TENANT: CREATE TICKET ──────────────────────────────────────────────

function CreateTicketSection() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [done, setDone] = useState(false);
  const cats = ["Plomería", "Electricidad", "Cerrajería", "Climatización", "Carpintería", "Estructural", "Otro"];

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={19} className="text-green-600" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-green-800 text-sm">Ticket enviado a conserjería</p>
        <p className="text-xs text-green-700 mt-0.5">Será asignado al personal técnico correspondiente.</p>
      </div>
      <button onClick={() => { setTitle(""); setDesc(""); setCat(""); setDone(false); }} className="text-xs text-green-700 font-semibold hover:underline">Nuevo</button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
        <Wrench size={15} className="text-blue-600" /> Crear Ticket de Mantención
      </h3>
      <div className="flex flex-col gap-3">
        <Field label="Título del problema" value={title} onChange={setTitle} placeholder="Ej: Grieta en pared del baño" />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Categoría</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="border border-slate-200 bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">Seleccionar categoría</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Field label="Descripción" value={desc} onChange={setDesc} placeholder="Describe el problema con detalle…" rows={3} />
        <Btn onClick={() => title && desc && setDone(true)} disabled={!title || !desc} className="w-full">
          <Send size={14} /> Enviar Solicitud
        </Btn>
      </div>
    </div>
  );
}

// ─── OWNER: AUTHORIZATIONS ────────────────────────────────────────────────────

function AuthorizationsSection() {
  const [requests, setRequests] = useState([
    {
      id: "AUTH-001", ticketId: "TKT-001",
      title: "Reparación filtración — requiere perforación de muro",
      desc: "El personal de mantención necesita perforar el muro divisorio entre sala y baño para acceder a la cañería fisurada.",
      by: "Felipe Castillo", date: "2026-06-24",
      status: "pending" as "pending" | "approved" | "rejected",
    },
    {
      id: "AUTH-002", ticketId: "TKT-005",
      title: "Evaluación estructural — grieta muro maestro",
      desc: "Inspección y refuerzo de grieta horizontal en muro maestro. Requiere acceso en horario de jornada laboral.",
      by: "Jorge Pizarro", date: "2026-06-25",
      status: "pending" as "pending" | "approved" | "rejected",
    },
  ]);

  const respond = (id: string, status: "approved" | "rejected") =>
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));

  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Shield size={15} className="text-amber-600" /> Autorizaciones Estructurales
        </h3>
        {pending > 0 && <Badge className="bg-amber-100 text-amber-700">{pending} pendiente{pending > 1 ? "s" : ""}</Badge>}
      </div>
      <div className="flex flex-col gap-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className={`border rounded-xl p-4 ${
              req.status === "pending" ? "border-amber-200 bg-amber-50" :
              req.status === "approved" ? "border-green-200 bg-green-50" :
              "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-bold text-slate-800 leading-snug">{req.title}</p>
              {req.status !== "pending" && (
                <Badge className={req.status === "approved" ? "bg-green-100 text-green-700 flex-shrink-0" : "bg-red-100 text-red-700 flex-shrink-0"}>
                  {req.status === "approved" ? "Autorizado" : "Rechazado"}
                </Badge>
              )}
            </div>
            <p className="text-[10px] font-[DM_Mono,monospace] text-slate-500 mb-2">{req.ticketId} · {req.by} · {req.date}</p>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">{req.desc}</p>
            {req.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => respond(req.id, "approved")}
                  className="flex-1 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check size={12} /> Autorizar
                </button>
                <button
                  onClick={() => respond(req.id, "rejected")}
                  className="flex-1 py-2 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <X size={12} /> Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OWNER DASHBOARD ──────────────────────────────────────────────────────────

function OwnerDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name="Patricio Vega" role="owner" onLogout={onLogout} />
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5">
        <div>
          <p className="text-slate-500 text-sm">Buenos días,</p>
          <h1 className="text-xl font-extrabold text-slate-900">Patricio Vega</h1>
        </div>
        <AccountStatusCard unit="4B" balance={85000} status="paid" />
        <AuthorizationsSection />
        <CreateTicketSection />
      </div>
    </div>
  );
}

// ─── TENANT DASHBOARD ─────────────────────────────────────────────────────────

function TenantDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name="Andrés Muñoz" role="tenant" onLogout={onLogout} />
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5">
        <div>
          <p className="text-slate-500 text-sm">Buenos días,</p>
          <h1 className="text-xl font-extrabold text-slate-900">Andrés Muñoz</h1>
        </div>
        <AccountStatusCard unit="2C" balance={78000} status="overdue" />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Pago vencido — 52 días en mora</p>
            <p className="text-xs text-red-700 mt-0.5">Por favor regularice su cuota de gastos comunes a la brevedad. Se aplican intereses por mora.</p>
          </div>
        </div>
        <CreateTicketSection />
      </div>
    </div>
  );
}

// ─── CONCIERGE VIEW ───────────────────────────────────────────────────────────

function ConciergeView({ onLogout }: { onLogout: () => void }) {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignee, setAssignee] = useState("");
  const staff = USERS.filter((u) => u.role === "maintenance");

  const assign = (id: string) => {
    if (!assignee) return;
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, assignedTo: assignee, status: "inProcess" } : t));
    setAssigning(null);
    setAssignee("");
  };

  const icon = (s: TicketStatus) =>
    s === "resolved" ? <CheckCircle2 size={13} className="text-green-600" /> :
    s === "inProcess" ? <Clock size={13} className="text-amber-600" /> :
    <AlertCircle size={13} className="text-slate-400" />;

  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name="Roberto Méndez" role="concierge" onLogout={onLogout} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-900">Bandeja de Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tickets.length} solicitudes · {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="flex flex-col gap-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-[DM_Mono,monospace] text-slate-400 font-bold">{t.id}</span>
                    <Badge className={PRIORITY_COLORS[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge>
                    <Badge className="bg-slate-100 text-slate-600">{t.category}</Badge>
                  </div>
                  {icon(t.status)}
                </div>
                <p className="font-bold text-slate-800 text-sm">{t.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.description}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Home size={10} /> Unidad {t.unit}</span>
                  <span>·</span>
                  <span>{t.owner}</span>
                  <span>·</span>
                  <span className="font-[DM_Mono,monospace]">{t.createdAt}</span>
                </div>
                {t.assignedTo && (
                  <p className="mt-2 text-xs text-blue-700 flex items-center gap-1.5 font-semibold">
                    <Wrench size={10} /> Asignado a: {t.assignedTo}
                  </p>
                )}
                {t.requiresAuth && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                    <Shield size={10} />
                    <span>Autorización propietario:</span>
                    <Badge className={
                      t.authStatus === "approved" ? "bg-green-100 text-green-700" :
                      t.authStatus === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {t.authStatus === "approved" ? "Aprobada" : t.authStatus === "rejected" ? "Rechazada" : "Pendiente"}
                    </Badge>
                  </div>
                )}
              </div>
              {t.status !== "resolved" && (
                <div className="border-t border-slate-50 bg-slate-50 px-4 py-3">
                  {assigning === t.id ? (
                    <div className="flex gap-2">
                      <select
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      >
                        <option value="">Seleccionar técnico…</option>
                        {staff.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                      <button
                        onClick={() => assign(t.id)}
                        disabled={!assignee}
                        className="px-3 py-1.5 bg-blue-700 text-white text-xs rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors"
                      >
                        Asignar
                      </button>
                      <button
                        onClick={() => { setAssigning(null); setAssignee(""); }}
                        className="px-2 py-1.5 text-slate-500 text-xs hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigning(t.id)}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1.5"
                    >
                      <Wrench size={11} />
                      {t.assignedTo ? "Reasignar técnico" : "Derivar a mantención"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAINTENANCE VIEW (KANBAN) ─────────────────────────────────────────────────

function MaintenanceView({ onLogout }: { onLogout: () => void }) {
  const myTickets = INITIAL_TICKETS.filter(
    (t) => t.assignedTo === "Felipe Castillo" || t.status === "pending"
  );
  const [tickets, setTickets] = useState(myTickets);
  const [authRequested, setAuthRequested] = useState<Set<string>>(new Set());

  const move = (id: string, dir: "forward" | "back") => {
    const order: TicketStatus[] = ["pending", "inProcess", "resolved"];
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const i = order.indexOf(t.status);
        const next = dir === "forward" ? i + 1 : i - 1;
        if (next < 0 || next >= order.length) return t;
        return { ...t, status: order[next] };
      })
    );
  };

  const colStyle: Record<TicketStatus, { wrap: string; header: string }> = {
    pending: { wrap: "bg-slate-100 border border-slate-200", header: "bg-slate-200 text-slate-700" },
    inProcess: { wrap: "bg-amber-50 border border-amber-200", header: "bg-amber-100 text-amber-800" },
    resolved: { wrap: "bg-green-50 border border-green-200", header: "bg-green-100 text-green-800" },
  };

  const cols: TicketStatus[] = ["pending", "inProcess", "resolved"];

  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name="Felipe Castillo" role="maintenance" onLogout={onLogout} />
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-extrabold text-slate-900">Tablero de Tareas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Personal de Mantención · Junio 2026</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {cols.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col);
            const { wrap, header } = colStyle[col];
            return (
              <div key={col} className={`rounded-2xl p-4 ${wrap}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${header}`}>{KANBAN_LABELS[col]}</span>
                  <span className="text-xs font-[DM_Mono,monospace] text-slate-500 font-bold">{colTickets.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {colTickets.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">Sin tareas</div>
                  )}
                  {colTickets.map((t) => (
                    <div key={t.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-[DM_Mono,monospace] text-slate-400 font-bold">{t.id}</span>
                        <Badge className={PRIORITY_COLORS[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-snug">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Home size={10} /> Unidad {t.unit} · {t.category}
                      </p>
                      {t.requiresAuth && (
                        <div className="mt-2.5">
                          {authRequested.has(t.id) ? (
                            <Badge className="bg-amber-100 text-amber-700">
                              <Clock size={9} /> Autorización solicitada
                            </Badge>
                          ) : (
                            <button
                              onClick={() => setAuthRequested((p) => new Set([...p, t.id]))}
                              className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                            >
                              <Shield size={11} /> Solicitar autorización a propietario
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        {col !== "pending" && (
                          <button
                            onClick={() => move(t.id, "back")}
                            className="flex-1 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
                          >
                            ← Anterior
                          </button>
                        )}
                        {col !== "resolved" ? (
                          <button
                            onClick={() => move(t.id, "forward")}
                            className="flex-1 py-1.5 text-xs text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors font-semibold"
                          >
                            Avanzar →
                          </button>
                        ) : (
                          <div className="flex-1 py-1.5 text-xs text-green-600 flex items-center justify-center gap-1 font-semibold">
                            <CheckCircle2 size={11} /> Completado
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("login");
  const go = (v: View) => setView(v);
  const logout = () => setView("login");

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }} className="size-full">
      {view === "login" && <LoginView onNavigate={go} />}
      {view === "reset" && <ResetView onNavigate={go} />}
      {view === "firstLogin" && <FirstLoginView onNavigate={go} />}
      {view === "admin" && <AdminDashboard onLogout={logout} />}
      {view === "owner" && <OwnerDashboard onLogout={logout} />}
      {view === "tenant" && <TenantDashboard onLogout={logout} />}
      {view === "concierge" && <ConciergeView onLogout={logout} />}
      {view === "maintenance" && <MaintenanceView onLogout={logout} />}
    </div>
  );
}
