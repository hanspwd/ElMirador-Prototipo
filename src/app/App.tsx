import {
  useState, useRef, useCallback, useReducer,
  createContext, useContext, useEffect,
} from "react";
import {
  Building2, Mail, Lock, Eye, EyeOff, ArrowLeft,
  Users, BarChart3, LogOut, Bell, Plus, Search,
  X, Check, AlertTriangle, Wrench, CreditCard,
  MoreHorizontal, CheckCircle2, Clock, Send,
  ChevronDown, Shield, Home, RefreshCw, UserPlus,
  LogIn, ChevronRight, ChevronLeft, MessageSquareWarning,
  DollarSign, Trash2, AlertCircle, Receipt, Zap,
  Droplets, Flame, Sparkles, CheckCheck,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View = "login" | "reset" | "firstLogin" | "admin" | "owner" | "tenant" | "concierge" | "maintenance";
type Role = "admin" | "owner" | "tenant" | "concierge" | "maintenance";
type TicketStatus = "pending" | "inProcess" | "resolved";
type PaymentStatus = "paid" | "pending" | "overdue";
type AdminTab = "users" | "finances" | "complaints";
type TicketCategory = "Queja" | "Mantención" | "Conserjería";
type NotifType = "info" | "success" | "warning" | "error";

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
  category: TicketCategory;
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

interface AuthRequest {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  requestedBy: string;
  unit: string;
  owner: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  targetRoles: Role[];
  targetUnits: string[];
  read: boolean;
  createdAt: string;
}

interface Expense {
  id: string;
  service: string;
  amount: number;
  period: string;
}

interface AppState {
  tickets: MaintenanceTicket[];
  users: User[];
  unitPayments: UnitPayment[];
  authRequests: AuthRequest[];
  notifications: AppNotification[];
  expenses: Expense[];
  nextId: number;
}

type AppAction =
  | { type: "ADD_TICKET"; ticket: Omit<MaintenanceTicket, "id">; }
  | { type: "UPDATE_TICKET_STATUS"; id: string; newStatus: TicketStatus }
  | { type: "ADD_USER"; user: Omit<User, "id"> }
  | { type: "PAY_UNIT"; unit: string }
  | { type: "ADD_AUTH_REQUEST"; ticketId: string; unit: string; owner: string; title: string; description: string; requestedBy: string }
  | { type: "RESPOND_AUTH_REQUEST"; id: string; status: "approved" | "rejected" }
  | { type: "ADD_EXPENSE"; service: string; amount: number }
  | { type: "REMOVE_EXPENSE"; id: string }
  | { type: "CALCULATE_CUOTAS" }
  | { type: "MARK_READ"; ids: string[] };

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────

const INIT_USERS: User[] = [
  { id: "u1", name: "Carmen Rodríguez", email: "carmen.rodriguez@mirador.cl", role: "admin", status: "active" },
  { id: "u2", name: "Patricio Vega", email: "patricio.vega@gmail.com", role: "owner", unit: "4B", phone: "+56 9 8812 3456", status: "active" },
  { id: "u3", name: "Valentina Torres", email: "valentina.torres@gmail.com", role: "owner", unit: "7A", phone: "+56 9 9234 5678", status: "active" },
  { id: "u4", name: "Andrés Muñoz", email: "andres.munoz@gmail.com", role: "tenant", unit: "2C", phone: "+56 9 7654 3210", status: "active" },
  { id: "u5", name: "Sofía Herrera", email: "sofia.herrera@gmail.com", role: "tenant", unit: "5D", phone: "+56 9 8765 4321", status: "active" },
  { id: "u6", name: "Roberto Méndez", email: "roberto.mendez@mirador.cl", role: "concierge", status: "active" },
  { id: "u7", name: "Felipe Castillo", email: "felipe.castillo@mirador.cl", role: "maintenance", phone: "+56 9 6543 2109", status: "active" },
  { id: "u8", name: "Jorge Pizarro", email: "jorge.pizarro@mirador.cl", role: "maintenance", phone: "+56 9 5432 1098", status: "inactive" },
];

const INIT_TICKETS: MaintenanceTicket[] = [
  { id: "TKT-001", title: "Filtración en cielo sala de estar", description: "Mancha de humedad visible en el techo de la sala. Posible origen en baño del piso superior.", unit: "4B", owner: "Patricio Vega", category: "Mantención", priority: "high", status: "inProcess", createdAt: "2026-06-20", assignedTo: "Felipe Castillo", requiresAuth: true, authStatus: "pending" },
  { id: "TKT-002", title: "Portón de estacionamiento no abre", description: "El portón eléctrico del subterráneo no responde al control remoto desde ayer.", unit: "7A", owner: "Valentina Torres", category: "Conserjería", priority: "high", status: "pending", createdAt: "2026-06-22", requiresAuth: false },
  { id: "TKT-003", title: "Falla en calefacción central", description: "El sistema no alcanza temperatura adecuada en temporada de frío.", unit: "2C", owner: "Andrés Muñoz", category: "Mantención", priority: "high", status: "pending", createdAt: "2026-06-23", requiresAuth: false },
  { id: "TKT-004", title: "Luminaria cocina quemada", description: "El artefacto empotrado de la cocina dejó de funcionar.", unit: "5D", owner: "Sofía Herrera", category: "Mantención", priority: "low", status: "resolved", createdAt: "2026-06-18", assignedTo: "Felipe Castillo", requiresAuth: false },
  { id: "TKT-005", title: "Grieta en muro divisorio principal", description: "Grieta horizontal en muro maestro entre living y dormitorio. Requiere evaluación estructural.", unit: "4B", owner: "Patricio Vega", category: "Mantención", priority: "high", status: "pending", createdAt: "2026-06-24", requiresAuth: true },
  { id: "TKT-006", title: "Paquete retirado sin autorización", description: "Un vecino retiró un encargo que no era suyo desde la recepción sin presentar identificación.", unit: "7A", owner: "Valentina Torres", category: "Conserjería", priority: "medium", status: "inProcess", createdAt: "2026-06-21", requiresAuth: false },
  { id: "TKT-007", title: "Ruidos molestos recurrentes", description: "Música a alto volumen desde las 23:00 hrs los días de semana. Solicito intervención confidencial.", unit: "2C", owner: "Andrés Muñoz", category: "Queja", priority: "medium", status: "pending", createdAt: "2026-06-23", requiresAuth: false },
  { id: "TKT-008", title: "Mascota en área común sin correa", description: "Propietario del piso 5 deja perro suelto en el hall de acceso reiteradamente.", unit: "5D", owner: "Sofía Herrera", category: "Queja", priority: "low", status: "inProcess", createdAt: "2026-06-25", requiresAuth: false },
];

const INIT_PAYMENTS: UnitPayment[] = [
  { unit: "4B", owner: "Patricio Vega", amount: 85000, status: "paid", dueDate: "2026-06-05" },
  { unit: "7A", owner: "Valentina Torres", amount: 85000, status: "pending", dueDate: "2026-06-05" },
  { unit: "2C", owner: "Andrés Muñoz", amount: 78000, status: "overdue", dueDate: "2026-05-05" },
  { unit: "5D", owner: "Sofía Herrera", amount: 78000, status: "paid", dueDate: "2026-06-05" },
  { unit: "3A", owner: "Manuel Soto", amount: 85000, status: "overdue", dueDate: "2026-05-05" },
  { unit: "6B", owner: "Daniela Fuentes", amount: 92000, status: "paid", dueDate: "2026-06-05" },
];

const INIT_AUTH_REQUESTS: AuthRequest[] = [
  { id: "AUTH-001", ticketId: "TKT-001", title: "Reparación filtración — requiere perforación de muro", description: "El personal de mantención necesita perforar el muro divisorio entre sala y baño para acceder a la cañería fisurada.", requestedBy: "Felipe Castillo", unit: "4B", owner: "Patricio Vega", date: "2026-06-24", status: "pending" },
];

const INIT_EXPENSES: Expense[] = [
  { id: "exp-1", service: "Agua", amount: 180000, period: "2026-06" },
  { id: "exp-2", service: "Gas", amount: 95000, period: "2026-06" },
  { id: "exp-3", service: "Electricidad", amount: 210000, period: "2026-06" },
];

const now = new Date().toISOString().split("T")[0];
const INIT_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", title: "Pago vencido", body: "Tu cuota de gastos comunes lleva más de 30 días sin pagar. Regulariza a la brevedad.", type: "warning", targetRoles: [], targetUnits: ["2C"], read: false, createdAt: "2026-06-01" },
  { id: "n2", title: "Pago vencido", body: "Tu cuota de gastos comunes lleva más de 30 días sin pagar.", type: "warning", targetRoles: [], targetUnits: ["3A"], read: false, createdAt: "2026-06-01" },
  { id: "n3", title: "Ticket asignado", body: "TKT-001: Filtración en cielo sala de estar — en proceso.", type: "info", targetRoles: ["maintenance"], targetUnits: [], read: false, createdAt: "2026-06-20" },
  { id: "n4", title: "Nueva solicitud de conserjería", body: "TKT-002: Portón de estacionamiento no abre.", type: "info", targetRoles: ["concierge"], targetUnits: [], read: false, createdAt: "2026-06-22" },
  { id: "n5", title: "Nueva queja recibida", body: "TKT-007: Ruidos molestos recurrentes (confidencial).", type: "info", targetRoles: ["admin"], targetUnits: [], read: false, createdAt: "2026-06-23" },
  { id: "n6", title: "Solicitud de autorización estructural", body: "El personal requiere autorización para reparación en tu departamento 4B.", type: "warning", targetRoles: [], targetUnits: ["4B"], read: false, createdAt: "2026-06-24" },
  { id: "n7", title: "Tu ticket fue actualizado", body: "TKT-001: Filtración en cielo sala de estar → En proceso.", type: "info", targetRoles: [], targetUnits: ["4B"], read: false, createdAt: "2026-06-20" },
];

const INITIAL_STATE: AppState = {
  tickets: INIT_TICKETS,
  users: INIT_USERS,
  unitPayments: INIT_PAYMENTS,
  authRequests: INIT_AUTH_REQUESTS,
  notifications: INIT_NOTIFICATIONS,
  expenses: INIT_EXPENSES,
  nextId: 100,
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador", owner: "Propietario", tenant: "Arrendatario",
  concierge: "Conserje", maintenance: "Personal de Mantención",
};
const ROLE_COLORS: Record<Role, string> = {
  admin: "bg-violet-100 text-violet-800", owner: "bg-blue-100 text-blue-800",
  tenant: "bg-sky-100 text-sky-700", concierge: "bg-amber-100 text-amber-700",
  maintenance: "bg-orange-100 text-orange-700",
};
const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", low: "bg-green-100 text-green-700",
};
const PRIORITY_LABELS: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" };
const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-700", pending: "bg-amber-100 text-amber-700", overdue: "bg-red-100 text-red-700",
};
const PAYMENT_LABELS: Record<PaymentStatus, string> = { paid: "Al día", pending: "Pendiente", overdue: "Pago vencido" };
const KANBAN_LABELS: Record<TicketStatus, string> = { pending: "Pendiente", inProcess: "En Proceso", resolved: "Resuelto" };
const STATUS_ORDER: TicketStatus[] = ["pending", "inProcess", "resolved"];
const STATUS_TRACK: Record<TicketStatus, { label: string; dot: string; text: string }> = {
  pending:   { label: "Pendiente",  dot: "bg-slate-400", text: "text-slate-500" },
  inProcess: { label: "En proceso", dot: "bg-amber-400", text: "text-amber-600" },
  resolved:  { label: "Resuelto",   dot: "bg-green-500", text: "text-green-600" },
};
const TICKET_CATEGORY_INFO: Record<TicketCategory, { desc: string; recipient: string; color: string }> = {
  "Queja":       { desc: "Confidencial — solo visible para la administración", recipient: "Administración", color: "text-violet-700" },
  "Mantención":  { desc: "Enviado al personal de mantención", recipient: "Personal de Mantención", color: "text-orange-700" },
  "Conserjería": { desc: "Enviado a conserjería del edificio", recipient: "Conserje", color: "text-amber-700" },
};
const EXPENSE_SERVICES = ["Agua", "Gas", "Electricidad", "Limpieza", "Seguro Edificio", "Administración", "Ascensores", "Jardinería"];
const formatCLP = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

// ─── REDUCER ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: AppAction): AppState {
  const notif = (n: Omit<AppNotification, "id" | "read" | "createdAt">): AppNotification => ({
    ...n, id: `n${state.nextId + Math.random()}`, read: false, createdAt: now,
  });

  switch (action.type) {
    case "ADD_TICKET": {
      const id = `TKT-${String(state.nextId).padStart(3, "0")}`;
      const ticket: MaintenanceTicket = { ...action.ticket, id };
      const targetRoles: Role[] =
        ticket.category === "Mantención" ? ["maintenance"] :
        ticket.category === "Conserjería" ? ["concierge"] : ["admin"];
      return {
        ...state,
        nextId: state.nextId + 1,
        tickets: [...state.tickets, ticket],
        notifications: [
          ...state.notifications,
          notif({ title: `Nuevo ticket: ${ticket.category}`, body: ticket.title, type: "info", targetRoles, targetUnits: [] }),
        ],
      };
    }

    case "UPDATE_TICKET_STATUS": {
      const t = state.tickets.find((x) => x.id === action.id);
      const updated = state.tickets.map((x) => x.id === action.id ? { ...x, status: action.newStatus } : x);
      const extra: AppNotification[] = t ? [
        notif({ title: "Tu ticket fue actualizado", body: `${t.title} → ${KANBAN_LABELS[action.newStatus]}`, type: action.newStatus === "resolved" ? "success" : "info", targetRoles: [], targetUnits: [t.unit] }),
      ] : [];
      return { ...state, tickets: updated, notifications: [...state.notifications, ...extra] };
    }

    case "ADD_USER": {
      const id = `u${state.nextId}`;
      const user: User = { ...action.user, id };
      const extra: UnitPayment[] = user.unit
        ? [{ unit: user.unit, owner: `${user.name}`, amount: 85000, status: "pending", dueDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 2).padStart(2, "0")}-05` }]
        : [];
      return { ...state, nextId: state.nextId + 1, users: [...state.users, user], unitPayments: [...state.unitPayments, ...extra] };
    }

    case "PAY_UNIT": {
      return {
        ...state,
        unitPayments: state.unitPayments.map((p) => p.unit === action.unit ? { ...p, status: "paid" } : p),
        notifications: [
          ...state.notifications,
          notif({ title: "Pago registrado exitosamente", body: "Tu cuota de gastos comunes fue procesada. ¡Gracias!", type: "success", targetRoles: [], targetUnits: [action.unit] }),
        ],
      };
    }

    case "ADD_AUTH_REQUEST": {
      const id = `AUTH-${String(state.nextId).padStart(3, "0")}`;
      const req: AuthRequest = { id, ticketId: action.ticketId, title: action.title, description: action.description, requestedBy: action.requestedBy, unit: action.unit, owner: action.owner, date: now, status: "pending" };
      const ticketsUpdated = state.tickets.map((t) => t.id === action.ticketId ? { ...t, authStatus: "pending" as const } : t);
      return {
        ...state,
        nextId: state.nextId + 1,
        authRequests: [...state.authRequests, req],
        tickets: ticketsUpdated,
        notifications: [
          ...state.notifications,
          notif({ title: "Solicitud de autorización estructural", body: `${action.title} — para tu departamento ${action.unit}`, type: "warning", targetRoles: [], targetUnits: [action.unit] }),
        ],
      };
    }

    case "RESPOND_AUTH_REQUEST": {
      const req = state.authRequests.find((r) => r.id === action.id);
      const label = action.status === "approved" ? "aprobada" : "rechazada";
      return {
        ...state,
        authRequests: state.authRequests.map((r) => r.id === action.id ? { ...r, status: action.status } : r),
        tickets: state.tickets.map((t) => t.id === req?.ticketId ? { ...t, authStatus: action.status } : t),
        notifications: req ? [
          ...state.notifications,
          notif({ title: `Autorización ${label}`, body: `${req.title} fue ${label} por ${req.owner}.`, type: action.status === "approved" ? "success" : "error", targetRoles: ["maintenance"], targetUnits: [] }),
        ] : state.notifications,
      };
    }

    case "ADD_EXPENSE": {
      const id = `exp-${state.nextId}`;
      return { ...state, nextId: state.nextId + 1, expenses: [...state.expenses, { id, service: action.service, amount: action.amount, period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}` }] };
    }

    case "REMOVE_EXPENSE":
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) };

    case "CALCULATE_CUOTAS": {
      const total = state.expenses.reduce((s, e) => s + e.amount, 0);
      const numUnits = state.unitPayments.length || 1;
      const cuota = Math.round(total / numUnits);
      const dueDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(5); return d.toISOString().split("T")[0]; })();
      const newPayments = state.unitPayments.map((p) => ({ ...p, amount: cuota, dueDate, status: p.status === "paid" ? "pending" as PaymentStatus : p.status }));
      const notifs: AppNotification[] = newPayments.map((p) =>
        notif({ title: "Nueva cuota de gastos comunes", body: `Cuota calculada: ${formatCLP(cuota)}. Vence el ${dueDate}.`, type: "info", targetRoles: [], targetUnits: [p.unit] })
      );
      return { ...state, unitPayments: newPayments, notifications: [...state.notifications, ...notifs] };
    }

    case "MARK_READ":
      return { ...state, notifications: state.notifications.map((n) => action.ids.includes(n.id) ? { ...n, read: true } : n) };

    default: return state;
  }
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface CtxType { state: AppState; dispatch: React.Dispatch<AppAction>; }
const AppCtx = createContext<CtxType>({ state: INITIAL_STATE, dispatch: () => {} });
const useApp = () => useContext(AppCtx);

function notificationsFor(notifications: AppNotification[], role?: Role, unit?: string) {
  return notifications.filter((n) =>
    (role && n.targetRoles.includes(role)) || (unit && n.targetUnits.includes(unit))
  );
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-wide font-[DM_Mono,monospace] ${className}`}>{children}</span>;
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, className = "", type = "button" }: {
  children: React.ReactNode; onClick?: () => void; variant?: BtnVariant;
  size?: "sm" | "md" | "lg"; disabled?: boolean; className?: string; type?: "button" | "submit";
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
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
}

function Field({ label, type = "text", value, onChange, placeholder, icon, right, rows }: {
  label?: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ReactNode; right?: React.ReactNode; rows?: number;
}) {
  const cls = `w-full border border-slate-200 bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${icon ? "pl-9" : ""} ${right ? "pr-10" : ""}`;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>}
      <div className="relative flex items-center">
        {icon && <span className="absolute left-3 text-slate-400 pointer-events-none">{icon}</span>}
        {rows ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${cls} resize-none`} />
               : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
        {right && <span className="absolute right-3 text-slate-400">{right}</span>}
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children, width = "max-w-lg" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${width} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={15} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────

const NOTIF_ICONS: Record<NotifType, React.ReactNode> = {
  info:    <AlertCircle size={14} className="text-blue-500" />,
  success: <CheckCircle2 size={14} className="text-green-500" />,
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  error:   <X size={14} className="text-red-500" />,
};
const NOTIF_BG: Record<NotifType, string> = {
  info: "bg-blue-50 border-blue-100", success: "bg-green-50 border-green-100",
  warning: "bg-amber-50 border-amber-100", error: "bg-red-50 border-red-100",
};

function NotificationsPanel({ role, unit }: { role?: Role; unit?: string }) {
  const { state, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mine = notificationsFor(state.notifications, role, unit);
  const unread = mine.filter((n) => !n.read);

  useEffect(() => {
    if (!open) return;
    const ids = mine.filter((n) => !n.read).map((n) => n.id);
    if (ids.length) dispatch({ type: "MARK_READ", ids });
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 hover:bg-slate-100 rounded-lg relative">
        <Bell size={17} className="text-slate-600" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center px-0.5">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-800">Notificaciones</span>
            {mine.length > 0 && (
              <button onClick={() => dispatch({ type: "MARK_READ", ids: mine.map((n) => n.id) })} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <CheckCheck size={12} /> Marcar leídas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {mine.length === 0 && <p className="text-center text-sm text-slate-400 py-10">Sin notificaciones</p>}
            {mine.slice().reverse().map((n) => (
              <div key={n.id} className={`px-4 py-3 flex gap-3 ${!n.read ? "bg-blue-50/30" : ""}`}>
                <div className="mt-0.5 flex-shrink-0">{NOTIF_ICONS[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold text-slate-800 ${!n.read ? "" : "font-semibold"}`}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-[DM_Mono,monospace]">{n.createdAt}</p>
                </div>
                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
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

// ─── AUTH VIEWS ───────────────────────────────────────────────────────────────

function LoginView({ onLogin, onNavigate }: { onLogin: (dest: View, temp: boolean) => void; onNavigate: (v: View) => void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [showPwd, setShowPwd] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>("admin"); const [isTempPwd, setIsTempPwd] = useState(false); const [open, setOpen] = useState(false);
  const demoMap: Array<{ role: Role; view: View }> = [
    { role: "admin", view: "admin" }, { role: "owner", view: "owner" }, { role: "tenant", view: "tenant" },
    { role: "concierge", view: "concierge" }, { role: "maintenance", view: "maintenance" },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-8">
          <BuildingLogo />
          <div className="flex flex-col gap-4">
            <Field label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="tu@correo.cl" icon={<Mail size={14} />} />
            <Field label="Contraseña" type={showPwd ? "text" : "password"} value={password} onChange={setPassword} placeholder="••••••••" icon={<Lock size={14} />}
              right={<button onClick={() => setShowPwd(!showPwd)} className="cursor-pointer">{showPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50">
              <button className="flex items-center justify-between w-full text-xs text-slate-500 font-semibold" onClick={() => setOpen(!open)}>
                <span>Acceso de demostración</span>
                <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open ? (
                <div className="mt-2 flex flex-col gap-1">
                  {demoMap.map(({ role }) => (
                    <button key={role} onClick={() => { setDemoRole(role); setOpen(false); }}
                      className={`text-left text-xs px-3 py-2 rounded-lg transition-colors ${demoRole === role ? "bg-blue-700 text-white" : "hover:bg-slate-200 text-slate-700"}`}>
                      {ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>
              ) : <p className="mt-1 text-xs font-semibold text-blue-600">→ {ROLE_LABELS[demoRole]}</p>}
              <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                <input type="checkbox" checked={isTempPwd} onChange={(e) => setIsTempPwd(e.target.checked)} className="accent-amber-600 w-3.5 h-3.5" />
                <span className="text-xs text-amber-700 font-semibold">Simular contraseña temporal (primer ingreso)</span>
              </label>
            </div>
            <Btn size="lg" onClick={() => onLogin(demoMap.find((d) => d.role === demoRole)?.view ?? "admin", isTempPwd)} className="w-full mt-1">
              <LogIn size={15} /> Iniciar Sesión
            </Btn>
          </div>
          <div className="mt-5 flex items-center justify-center">
            <button onClick={() => onNavigate("reset")} className="text-sm text-blue-600 hover:underline">¿Olvidaste tu contraseña?</button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">© 2026 Administración Edificio El Mirador</p>
      </div>
    </div>
  );
}

function ResetView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <BuildingLogo />
          <div className="text-center mb-6"><h2 className="text-base font-bold text-slate-900">Restablecer Credenciales</h2><p className="text-xs text-slate-500 mt-1">Ingresa tu correo y recibirás un enlace de recuperación.</p></div>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 size={22} className="text-green-600" /></div>
              <div className="text-center"><p className="font-bold text-slate-800 text-sm">Enlace enviado</p><p className="text-xs text-slate-500 mt-1">Revisa tu bandeja en <strong>{email}</strong></p></div>
              <Btn variant="ghost" onClick={() => onNavigate("login")} size="sm"><ArrowLeft size={13} /> Volver</Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Field label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="tu@correo.cl" icon={<Mail size={14} />} />
              <Btn size="lg" onClick={() => email && setSent(true)} className="w-full" disabled={!email}><Send size={15} /> Enviar enlace</Btn>
              <button onClick={() => onNavigate("login")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"><ArrowLeft size={13} /> Volver</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FirstLoginView({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [newPwd, setNewPwd] = useState(""); const [confirm, setConfirm] = useState(""); const [showN, setShowN] = useState(false); const [showC, setShowC] = useState(false); const [done, setDone] = useState(false);
  const strong = newPwd.length >= 8; const match = newPwd === confirm && newPwd.length > 0;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <BuildingLogo />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex gap-3">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">Por razones de seguridad, debes cambiar la contraseña temporal asignada por la administración antes de continuar.</p>
          </div>
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 size={22} className="text-green-600" /></div>
              <div className="text-center"><p className="font-bold text-slate-800 text-sm">Contraseña establecida</p><p className="text-xs text-slate-500 mt-1">Tu acceso fue configurado correctamente.</p></div>
              <Btn onClick={onSuccess} className="w-full">Continuar al sistema</Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Field label="Nueva Contraseña" type={showN ? "text" : "password"} value={newPwd} onChange={setNewPwd} placeholder="Mínimo 8 caracteres" icon={<Lock size={14} />}
                right={<button onClick={() => setShowN(!showN)} className="cursor-pointer">{showN ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
              {newPwd && !strong && <p className="text-xs text-red-500 -mt-2">Mínimo 8 caracteres requeridos</p>}
              <Field label="Confirmar Contraseña" type={showC ? "text" : "password"} value={confirm} onChange={setConfirm} placeholder="Repite la contraseña" icon={<Lock size={14} />}
                right={<button onClick={() => setShowC(!showC)} className="cursor-pointer">{showC ? <EyeOff size={14} /> : <Eye size={14} />}</button>} />
              {confirm && !match && <p className="text-xs text-red-500 -mt-2">Las contraseñas no coinciden</p>}
              <Btn size="lg" onClick={() => match && strong && setDone(true)} disabled={!match || !strong} className="w-full mt-1"><Shield size={15} /> Establecer Nueva Contraseña</Btn>
              <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"><ArrowLeft size={13} /> Volver</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN: SIDEBAR ───────────────────────────────────────────────────────────

function AdminSidebar({ tab, onTab, onLogout }: { tab: AdminTab; onTab: (t: AdminTab) => void; onLogout: () => void }) {
  const { state } = useApp();
  const complaints = state.notifications.filter((n) => n.targetRoles.includes("admin") && !n.read);
  const items: Array<{ id: AdminTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "users", label: "Usuarios", icon: <Users size={17} /> },
    { id: "finances", label: "Finanzas", icon: <BarChart3 size={17} /> },
    { id: "complaints", label: "Quejas", icon: <MessageSquareWarning size={17} />, badge: complaints.length || undefined },
  ];
  return (
    <aside className="w-60 bg-slate-900 min-h-screen flex flex-col py-6 px-4 flex-shrink-0">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"><Building2 size={16} className="text-white" /></div>
        <div><p className="text-white font-bold text-sm leading-tight">El Mirador</p><p className="text-slate-500 text-xs">Administración</p></div>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {items.map((item) => (
          <button key={item.id} onClick={() => onTab(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === item.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            {item.icon} <span className="flex-1 text-left">{item.label}</span>
            {item.badge ? <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{item.badge}</span> : null}
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">CR</span></div>
          <div><p className="text-white text-xs font-semibold leading-tight">Carmen Rodríguez</p><p className="text-slate-500 text-xs">Administradora</p></div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"><LogOut size={15} /> Cerrar sesión</button>
      </div>
    </aside>
  );
}

// ─── ADMIN: REGISTER USER MODAL ───────────────────────────────────────────────

function RegisterUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useApp();
  const [form, setForm] = useState({ name: "", lastName: "", email: "", phone: "", unit: "", role: "owner" as Exclude<Role, "admin">, sendPassword: true });
  const [done, setDone] = useState(false);
  const roles: Array<{ value: Exclude<Role, "admin">; label: string }> = [
    { value: "owner", label: "Propietario" }, { value: "tenant", label: "Arrendatario" },
    { value: "concierge", label: "Conserje" }, { value: "maintenance", label: "Personal de Mantención" },
  ];
  const reset = () => { setDone(false); setForm({ name: "", lastName: "", email: "", phone: "", unit: "", role: "owner", sendPassword: true }); };
  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    dispatch({ type: "ADD_USER", user: { name: `${form.name} ${form.lastName}`.trim(), email: form.email, role: form.role, unit: form.unit || undefined, phone: form.phone || undefined, status: "active" } });
    setDone(true);
  };
  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Registrar Nuevo Usuario" width="max-w-xl">
      {done ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 size={26} className="text-green-600" /></div>
          <div className="text-center">
            <p className="font-bold text-slate-800">Usuario registrado</p>
            <p className="text-sm text-slate-500 mt-1">{form.name} {form.lastName} — {roles.find((r) => r.value === form.role)?.label}{form.unit ? `, Unidad ${form.unit}` : ""}</p>
            {form.sendPassword && <p className="text-xs text-blue-600 mt-2 flex items-center justify-center gap-1"><Send size={11} /> Contraseña temporal enviada a {form.email}</p>}
            {form.unit && <p className="text-xs text-green-700 mt-1 flex items-center justify-center gap-1"><CheckCircle2 size={11} /> Unidad {form.unit} añadida al módulo de Finanzas</p>}
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
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rol</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Exclude<Role, "admin"> })}
              className="border border-slate-200 bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer">
            <input type="checkbox" checked={form.sendPassword} onChange={(e) => setForm({ ...form, sendPassword: e.target.checked })} className="mt-0.5 accent-blue-600 w-4 h-4" />
            <div><p className="text-sm font-semibold text-blue-900">Generar y enviar contraseña temporal</p><p className="text-xs text-blue-700 mt-0.5">El sistema enviará las credenciales por correo electrónico.</p></div>
          </label>
          <div className="flex justify-end gap-2 mt-1">
            <Btn variant="secondary" onClick={() => { reset(); onClose(); }}>Cancelar</Btn>
            <Btn onClick={handleSubmit} disabled={!form.name || !form.email}><UserPlus size={14} /> Registrar Usuario</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── ADMIN: USERS MODULE ──────────────────────────────────────────────────────

function UsersModule() {
  const { state } = useApp();
  const [search, setSearch] = useState(""); const [roleFilter, setRoleFilter] = useState<Role | "all">("all"); const [showModal, setShowModal] = useState(false);
  const filtered = state.users.filter((u) => {
    const q = search.toLowerCase();
    return (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (roleFilter === "all" || u.role === roleFilter);
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Gestión de Usuarios</h2><p className="text-sm text-slate-500 mt-0.5">{state.users.length} usuarios · 5 roles activos</p></div>
        <Btn onClick={() => setShowModal(true)}><Plus size={14} /> Registrar Nuevo Usuario</Btn>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | "all")} className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none">
          <option value="all">Todos los roles</option>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-100">{["Nombre", "Correo", "Rol", "Unidad", "Estado", ""].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><span className="text-blue-700 text-xs font-bold">{user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span></div>
                    <span className="font-semibold text-slate-800">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 font-[DM_Mono,monospace] text-xs">{user.email}</td>
                <td className="px-4 py-3"><Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge></td>
                <td className="px-4 py-3 font-[DM_Mono,monospace] text-xs text-slate-600">{user.unit ?? "—"}</td>
                <td className="px-4 py-3"><Badge className={user.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>{user.status === "active" ? "Activo" : "Inactivo"}</Badge></td>
                <td className="px-4 py-3"><button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><MoreHorizontal size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">Sin resultados.</div>}
      </div>
      <RegisterUserModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}

// ─── ADMIN: FINANCES MODULE ───────────────────────────────────────────────────

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "Agua": <Droplets size={14} className="text-blue-500" />,
  "Gas": <Flame size={14} className="text-orange-500" />,
  "Electricidad": <Zap size={14} className="text-yellow-500" />,
  "Limpieza": <Sparkles size={14} className="text-green-500" />,
};

function FinancesModule() {
  const { state, dispatch } = useApp();
  const [service, setService] = useState(""); const [amount, setAmount] = useState(""); const [cuotasCalc, setCuotasCalc] = useState(false);

  const total = state.expenses.reduce((s, e) => s + e.amount, 0);
  const numUnits = state.unitPayments.length || 1;
  const cuota = Math.round(total / numUnits);

  const paid = state.unitPayments.filter((u) => u.status === "paid").reduce((s, u) => s + u.amount, 0);
  const pending = state.unitPayments.filter((u) => u.status === "pending").reduce((s, u) => s + u.amount, 0);
  const overdue = state.unitPayments.filter((u) => u.status === "overdue").reduce((s, u) => s + u.amount, 0);
  const totalRecaudar = state.unitPayments.reduce((s, u) => s + u.amount, 0);

  const addExpense = () => {
    const n = Number(amount.replace(/\D/g, ""));
    if (!service || !n) return;
    dispatch({ type: "ADD_EXPENSE", service, amount: n });
    setAmount(""); setService("");
  };

  const calculateCuotas = () => {
    dispatch({ type: "CALCULATE_CUOTAS" });
    setCuotasCalc(true);
  };

  const kpis = [
    { label: "Total a Recaudar", value: totalRecaudar, cls: "text-slate-900", bg: "bg-white border-slate-100" },
    { label: "Recaudado", value: paid, cls: "text-green-700", bg: "bg-green-50 border-green-100" },
    { label: "Pendiente", value: pending, cls: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
    { label: "Pago Vencido", value: overdue, cls: "text-red-700", bg: "bg-red-50 border-red-100" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Finanzas y Recaudación</h2><p className="text-sm text-slate-500 mt-0.5">Junio 2026 · Gastos Comunes</p></div>
        <Btn variant={cuotasCalc ? "secondary" : "primary"} onClick={calculateCuotas}><RefreshCw size={14} /> Calcular Cuotas y Prorrateo</Btn>
      </div>

      {cuotasCalc && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-800 font-semibold flex items-center gap-2">
          <CheckCircle2 size={14} className="text-green-600" />
          Cuotas calculadas: {formatCLP(cuota)} por unidad ({numUnits} unidades). Notificaciones enviadas a todos los residentes.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`border rounded-xl p-4 shadow-sm ${kpi.bg}`}>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">{kpi.label}</p>
            <p className={`text-lg font-extrabold font-[DM_Mono,monospace] ${kpi.cls}`}>{formatCLP(kpi.value)}</p>
          </div>
        ))}
      </div>

      {/* Expense entry */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Receipt size={15} className="text-blue-600" /> Ingresar Gastos del Período</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          <select value={service} onChange={(e) => setService(e.target.value)} className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex-1 min-w-[140px]">
            <option value="">Seleccionar servicio…</option>
            {EXPENSE_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto $" className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <Btn onClick={addExpense} disabled={!service || !amount}><Plus size={14} /> Agregar</Btn>
        </div>
        <div className="flex flex-col gap-2">
          {state.expenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                {SERVICE_ICONS[exp.service] ?? <DollarSign size={14} className="text-slate-400" />}
                <span className="text-sm font-medium text-slate-700">{exp.service}</span>
                <span className="text-xs text-slate-400 font-[DM_Mono,monospace]">{exp.period}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold font-[DM_Mono,monospace] text-slate-900 text-sm">{formatCLP(exp.amount)}</span>
                <button onClick={() => dispatch({ type: "REMOVE_EXPENSE", id: exp.id })} className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {state.expenses.length > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-100 mt-1">
              <span className="text-xs font-bold text-blue-700">Total gastos del período</span>
              <span className="font-extrabold font-[DM_Mono,monospace] text-blue-800">{formatCLP(total)}</span>
            </div>
          )}
          {state.expenses.length > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-slate-100 rounded-lg">
              <span className="text-xs font-bold text-slate-600">Cuota por unidad ({numUnits} unidades)</span>
              <span className="font-extrabold font-[DM_Mono,monospace] text-slate-800">{formatCLP(cuota)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Unit payments table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Estado de Pago por Unidad</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-50">{["Unidad", "Propietario / Arrendatario", "Monto", "Vencimiento", "Estado"].map((h) => <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-50">
            {state.unitPayments.map((p) => (
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

// ─── ADMIN: COMPLAINTS MODULE ─────────────────────────────────────────────────

function ComplaintsModule() {
  const { state, dispatch } = useApp();
  const tickets = state.tickets.filter((t) => t.category === "Queja");
  const changeStatus = (id: string, dir: "forward" | "back") => {
    const t = state.tickets.find((x) => x.id === id); if (!t) return;
    const i = STATUS_ORDER.indexOf(t.status);
    const next = dir === "forward" ? i + 1 : i - 1;
    if (next < 0 || next >= STATUS_ORDER.length) return;
    dispatch({ type: "UPDATE_TICKET_STATUS", id, newStatus: STATUS_ORDER[next] });
  };
  return (
    <div>
      <div className="mb-6"><h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Quejas Confidenciales</h2><p className="text-sm text-slate-500 mt-0.5">Solo visibles para la administración · {tickets.length} caso{tickets.length !== 1 ? "s" : ""}</p></div>
      <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-xs text-violet-700">
        <MessageSquareWarning size={13} /><span>Estas quejas son confidenciales. La identidad del remitente no es visible para otros usuarios.</span>
      </div>
      <KanbanBoard tickets={tickets} onStatusChange={changeStatus} emptyLabel="Sin quejas" />
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
          {tab === "users" && <UsersModule />}
          {tab === "finances" && <FinancesModule />}
          {tab === "complaints" && <ComplaintsModule />}
        </div>
      </main>
    </div>
  );
}

// ─── SHARED: MOBILE HEADER ────────────────────────────────────────────────────

function MobileHeader({ name, role, unit, onLogout }: { name: string; role: Role; unit?: string; onLogout: () => void }) {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-blue-700 rounded-lg flex items-center justify-center"><Building2 size={13} className="text-white" /></div>
        <div><p className="text-xs font-extrabold text-slate-900 leading-tight">El Mirador</p><Badge className={`${ROLE_COLORS[role]} text-[10px]`}>{ROLE_LABELS[role]}</Badge></div>
      </div>
      <div className="flex items-center gap-1">
        <NotificationsPanel role={role} unit={unit} />
        <button onClick={onLogout} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><LogOut size={17} /></button>
      </div>
    </header>
  );
}

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────

function PaymentModal({ open, onClose, unit, amount }: { open: boolean; onClose: () => void; unit: string; amount: number }) {
  const { dispatch } = useApp();
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => {
      dispatch({ type: "PAY_UNIT", unit });
      setStep("success");
    }, 1800);
  };

  const handleClose = () => { setStep("confirm"); onClose(); };

  return (
    <Modal open={open} onClose={step === "processing" ? () => {} : handleClose} title="Pagar Gastos Comunes">
      {step === "confirm" && (
        <div className="flex flex-col gap-5">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Monto a pagar — Unidad {unit}</p>
            <p className="text-3xl font-extrabold font-[DM_Mono,monospace] text-slate-900">{formatCLP(amount)}</p>
            <p className="text-xs text-slate-400 mt-1">Gastos Comunes · Junio 2026</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            Serás redirigido a la plataforma de pago seguro. Esta es una simulación del flujo de Webpay / Flow.
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={handleClose} className="flex-1">Cancelar</Btn>
            <Btn onClick={handlePay} className="flex-1"><CreditCard size={14} /> Pagar con Webpay</Btn>
          </div>
        </div>
      )}
      {step === "processing" && (
        <div className="flex flex-col items-center gap-5 py-8">
          <div className="w-14 h-14 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <div className="text-center"><p className="font-bold text-slate-800">Procesando pago…</p><p className="text-xs text-slate-500 mt-1">Conectando con Webpay. Por favor no cierres esta ventana.</p></div>
        </div>
      )}
      {step === "success" && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 size={28} className="text-green-600" /></div>
          <div className="text-center">
            <p className="font-bold text-slate-800 text-lg">¡Pago exitoso!</p>
            <p className="text-sm text-slate-500 mt-1">{formatCLP(amount)} procesado para Unidad {unit}</p>
            <p className="text-xs text-green-700 mt-2 font-semibold">Tu estado ha sido actualizado a "Al día"</p>
          </div>
          <Btn onClick={handleClose} variant="success" className="px-8">Cerrar</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── ACCOUNT STATUS CARD ──────────────────────────────────────────────────────

function AccountStatusCard({ unit }: { unit: string }) {
  const { state } = useApp();
  const [showPayment, setShowPayment] = useState(false);
  const p = state.unitPayments.find((x) => x.unit === unit);
  if (!p) return null;
  const statusBg: Record<PaymentStatus, string> = {
    paid: "bg-green-400/20 text-green-200 border border-green-400/30",
    pending: "bg-amber-400/20 text-amber-200 border border-amber-400/30",
    overdue: "bg-red-400/20 text-red-200 border border-red-400/30",
  };
  return (
    <>
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-5 text-white shadow-xl shadow-blue-800/30">
        <div className="flex items-start justify-between mb-4">
          <div><p className="text-blue-300 text-[10px] font-bold tracking-widest uppercase">Unidad</p><p className="text-3xl font-extrabold font-[DM_Mono,monospace] mt-0.5">{unit}</p></div>
          <Badge className={statusBg[p.status]}>{PAYMENT_LABELS[p.status]}</Badge>
        </div>
        <div className="mb-5">
          <p className="text-blue-300 text-xs mb-1">Gastos Comunes — Jun 2026</p>
          <p className="text-3xl font-extrabold font-[DM_Mono,monospace]">{formatCLP(p.amount)}</p>
        </div>
        {p.status !== "paid" ? (
          <button onClick={() => setShowPayment(true)} className="w-full bg-white text-blue-800 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-md">
            <CreditCard size={15} /> Pagar en Línea · Webpay / Flow
          </button>
        ) : (
          <div className="w-full bg-white/10 border border-white/20 text-white/80 font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
            <CheckCircle2 size={15} className="text-green-300" /> Cuota pagada — Al día
          </div>
        )}
      </div>
      <PaymentModal open={showPayment} onClose={() => setShowPayment(false)} unit={unit} amount={p.amount} />
    </>
  );
}

// ─── MY TICKETS SECTION ───────────────────────────────────────────────────────

function MyTicketsSection({ unit }: { unit: string }) {
  const { state } = useApp();
  const mine = state.tickets.filter((t) => t.unit === unit);
  if (mine.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><Wrench size={15} className="text-blue-600" /> Mis Tickets</h3>
      <div className="flex flex-col gap-2.5">
        {mine.map((t) => {
          const si = STATUS_ORDER.indexOf(t.status);
          return (
            <div key={t.id} className="border border-slate-100 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{t.title}</p>
                <Badge className={PRIORITY_COLORS[t.priority]}>{PRIORITY_LABELS[t.priority]}</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">{t.category} · {t.createdAt}</p>
              <div className="flex items-center gap-1.5">
                {STATUS_ORDER.map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-colors ${i <= si ? STATUS_TRACK[s].dot : "bg-slate-200"}`} />
                    <span className={`text-[10px] font-semibold ${i === si ? STATUS_TRACK[s].text : "text-slate-300"}`}>{STATUS_TRACK[s].label}</span>
                    {i < STATUS_ORDER.length - 1 && <div className={`w-3 h-px ${i < si ? "bg-slate-300" : "bg-slate-200"}`} />}
                  </div>
                ))}
              </div>
              {t.requiresAuth && t.authStatus && (
                <p className={`mt-2 text-xs font-semibold flex items-center gap-1 ${t.authStatus === "approved" ? "text-green-600" : t.authStatus === "rejected" ? "text-red-600" : "text-amber-600"}`}>
                  <Shield size={10} /> Autorización estructural: {t.authStatus === "approved" ? "Aprobada" : t.authStatus === "rejected" ? "Rechazada" : "Pendiente de tu aprobación"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CREATE TICKET SECTION ────────────────────────────────────────────────────

function CreateTicketSection({ unit, owner }: { unit: string; owner: string }) {
  const { dispatch } = useApp();
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [cat, setCat] = useState<TicketCategory | "">("");
  const [done, setDone] = useState(false);
  const cats: TicketCategory[] = ["Queja", "Mantención", "Conserjería"];
  const catInfo = cat ? TICKET_CATEGORY_INFO[cat] : null;

  const handleSubmit = () => {
    if (!title || !desc || !cat) return;
    dispatch({ type: "ADD_TICKET", ticket: { title, description: desc, unit, owner, category: cat, priority: "medium", status: "pending", createdAt: now, requiresAuth: false } });
    setDone(true);
  };

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"><CheckCircle2 size={19} className="text-green-600" /></div>
      <div className="flex-1">
        <p className="font-bold text-green-800 text-sm">Ticket enviado</p>
        {cat && <p className="text-xs text-green-700 mt-0.5">Dirigido a: {TICKET_CATEGORY_INFO[cat].recipient}</p>}
      </div>
      <button onClick={() => { setTitle(""); setDesc(""); setCat(""); setDone(false); }} className="text-xs text-green-700 font-semibold hover:underline">Nuevo</button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"><Wrench size={15} className="text-blue-600" /> Crear Ticket</h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipo de solicitud</label>
          <select value={cat} onChange={(e) => setCat(e.target.value as TicketCategory | "")} className="border border-slate-200 bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">Seleccionar tipo…</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {catInfo && <p className={`text-xs font-semibold flex items-center gap-1 ${catInfo.color}`}>{cat === "Queja" && <Shield size={11} />}{catInfo.desc}</p>}
        </div>
        <Field label="Título" value={title} onChange={setTitle} placeholder="Describe brevemente el problema" />
        <Field label="Descripción" value={desc} onChange={setDesc} placeholder="Detalla la situación…" rows={3} />
        <Btn onClick={handleSubmit} disabled={!title || !desc || !cat} className="w-full"><Send size={14} /> Enviar Solicitud</Btn>
      </div>
    </div>
  );
}

// ─── OWNER: AUTHORIZATIONS SECTION ───────────────────────────────────────────

function AuthorizationsSection({ unit }: { unit: string }) {
  const { state, dispatch } = useApp();
  const requests = state.authRequests.filter((r) => r.unit === unit);
  const pending = requests.filter((r) => r.status === "pending").length;
  if (requests.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Shield size={15} className="text-amber-600" /> Autorizaciones Estructurales</h3>
        {pending > 0 && <Badge className="bg-amber-100 text-amber-700">{pending} pendiente{pending > 1 ? "s" : ""}</Badge>}
      </div>
      <div className="flex flex-col gap-3">
        {requests.map((req) => (
          <div key={req.id} className={`border rounded-xl p-4 ${req.status === "pending" ? "border-amber-200 bg-amber-50" : req.status === "approved" ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-sm font-bold text-slate-800 leading-snug">{req.title}</p>
              {req.status !== "pending" && <Badge className={req.status === "approved" ? "bg-green-100 text-green-700 flex-shrink-0" : "bg-red-100 text-red-700 flex-shrink-0"}>{req.status === "approved" ? "Autorizado" : "Rechazado"}</Badge>}
            </div>
            <p className="text-[10px] font-[DM_Mono,monospace] text-slate-500 mb-2">{req.id} · {req.requestedBy} · {req.date}</p>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">{req.description}</p>
            {req.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => dispatch({ type: "RESPOND_AUTH_REQUEST", id: req.id, status: "approved" })} className="flex-1 py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-1.5 transition-colors"><Check size={12} /> Autorizar</button>
                <button onClick={() => dispatch({ type: "RESPOND_AUTH_REQUEST", id: req.id, status: "rejected" })} className="flex-1 py-2 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1.5 transition-colors"><X size={12} /> Rechazar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KANBAN SWIPE CARD ────────────────────────────────────────────────────────

function KanbanSwipeCard({ ticket, onStatusChange, extra }: {
  ticket: MaintenanceTicket; onStatusChange: (id: string, dir: "forward" | "back") => void; extra?: React.ReactNode;
}) {
  const THRESHOLD = 72;
  const dragStartX = useRef<number | null>(null);
  const [delta, setDelta] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flash, setFlash] = useState<"forward" | "back" | null>(null);

  const canForward = ticket.status !== "resolved"; const canBack = ticket.status !== "pending";
  const startDrag = (x: number) => { dragStartX.current = x; setDragging(true); };
  const moveDrag = (x: number) => { if (dragStartX.current === null) return; setDelta(x - dragStartX.current); };
  const endDrag = useCallback(() => {
    if (delta > THRESHOLD && canForward) { setFlash("forward"); onStatusChange(ticket.id, "forward"); }
    else if (delta < -THRESHOLD && canBack) { setFlash("back"); onStatusChange(ticket.id, "back"); }
    dragStartX.current = null; setDelta(0); setDragging(false);
    setTimeout(() => setFlash(null), 400);
  }, [delta, canForward, canBack, ticket.id, onStatusChange]);

  const clamped = Math.max(-48, Math.min(48, delta * 0.55));
  const fwd = delta > 20 && canForward; const bk = delta < -20 && canBack;
  const si = STATUS_ORDER.indexOf(ticket.status);

  return (
    <div className="relative overflow-hidden rounded-xl select-none">
      <div className={`absolute inset-y-0 left-0 flex items-center justify-start px-4 rounded-xl ${delta > THRESHOLD ? "bg-green-600" : "bg-green-400"}`} style={{ width: 68 }}><ChevronRight size={20} className="text-white" /></div>
      <div className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 rounded-xl ${delta < -THRESHOLD ? "bg-slate-600" : "bg-slate-400"}`} style={{ width: 68 }}><ChevronLeft size={20} className="text-white" /></div>
      <div
        className={`relative bg-white rounded-xl border shadow-sm overflow-hidden ${flash === "forward" ? "border-green-400" : flash === "back" ? "border-slate-400" : "border-slate-100"} ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ transform: `translateX(${dragging ? clamped : 0}px)`, transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
        onTouchStart={(e) => startDrag(e.touches[0].clientX)} onTouchMove={(e) => moveDrag(e.touches[0].clientX)} onTouchEnd={endDrag}
        onMouseDown={(e) => startDrag(e.clientX)} onMouseMove={(e) => { if (dragStartX.current !== null) moveDrag(e.clientX); }} onMouseUp={endDrag} onMouseLeave={endDrag}
      >
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
          {STATUS_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${i <= si ? STATUS_TRACK[s].dot : "bg-slate-200"}`} />
              {i < STATUS_ORDER.length - 1 && <div className={`w-3 h-px ${i < si ? "bg-slate-300" : "bg-slate-200"}`} />}
            </div>
          ))}
          <span className={`ml-1 text-[10px] font-semibold ${STATUS_TRACK[ticket.status].text}`}>{STATUS_TRACK[ticket.status].label}</span>
          <span className="ml-auto text-[9px] text-slate-300 font-semibold">← desliza →</span>
        </div>
        <div className="px-4 pt-1 pb-4">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-[DM_Mono,monospace] text-slate-400 font-bold">{ticket.id}</span>
            <Badge className={PRIORITY_COLORS[ticket.priority]}>{PRIORITY_LABELS[ticket.priority]}</Badge>
          </div>
          <p className="font-bold text-slate-800 text-sm leading-snug">{ticket.title}</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{ticket.description}</p>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Home size={10} /> Unidad {ticket.unit} · {ticket.owner} · <span className="font-[DM_Mono,monospace]">{ticket.createdAt}</span></p>
          {extra && <div className="mt-3" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>{extra}</div>}
        </div>
        {fwd && <div className="absolute inset-0 pointer-events-none flex items-center justify-start pl-4 rounded-xl bg-green-500/10"><span className="text-green-700 text-xs font-bold flex items-center gap-1"><ChevronRight size={14} />{delta > THRESHOLD ? "¡Avanzar!" : "En proceso →"}</span></div>}
        {bk && <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-4 rounded-xl bg-slate-500/10"><span className="text-slate-600 text-xs font-bold flex items-center gap-1">{delta < -THRESHOLD ? "¡Regresar!" : "← Pendiente"}<ChevronLeft size={14} /></span></div>}
      </div>
    </div>
  );
}

// ─── KANBAN BOARD ─────────────────────────────────────────────────────────────

function KanbanBoard({ tickets, onStatusChange, extraCard, emptyLabel = "Sin tareas" }: {
  tickets: MaintenanceTicket[]; onStatusChange: (id: string, dir: "forward" | "back") => void;
  extraCard?: (t: MaintenanceTicket) => React.ReactNode; emptyLabel?: string;
}) {
  const cols: Record<TicketStatus, { wrap: string; header: string }> = {
    pending:   { wrap: "bg-slate-100 border border-slate-200",  header: "bg-slate-200 text-slate-700" },
    inProcess: { wrap: "bg-amber-50 border border-amber-200",   header: "bg-amber-100 text-amber-800" },
    resolved:  { wrap: "bg-green-50 border border-green-200",   header: "bg-green-100 text-green-800" },
  };
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {STATUS_ORDER.map((col) => {
        const colT = tickets.filter((t) => t.status === col);
        return (
          <div key={col} className={`rounded-2xl p-4 ${cols[col].wrap}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${cols[col].header}`}>{KANBAN_LABELS[col]}</span>
              <span className="text-xs font-[DM_Mono,monospace] text-slate-500 font-bold">{colT.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {colT.length === 0 && <div className="text-center py-10 text-slate-400 text-xs">{emptyLabel}</div>}
              {colT.map((t) => <KanbanSwipeCard key={t.id} ticket={t} onStatusChange={onStatusChange} extra={extraCard ? extraCard(t) : undefined} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── OWNER DASHBOARD ──────────────────────────────────────────────────────────

function OwnerDashboard({ onLogout }: { onLogout: () => void }) {
  const unit = "4B"; const name = "Patricio Vega";
  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name={name} role="owner" unit={unit} onLogout={onLogout} />
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5">
        <div><p className="text-slate-500 text-sm">Buenos días,</p><h1 className="text-xl font-extrabold text-slate-900">{name}</h1></div>
        <AccountStatusCard unit={unit} />
        <AuthorizationsSection unit={unit} />
        <MyTicketsSection unit={unit} />
        <CreateTicketSection unit={unit} owner={name} />
      </div>
    </div>
  );
}

// ─── TENANT DASHBOARD ─────────────────────────────────────────────────────────

function TenantDashboard({ onLogout }: { onLogout: () => void }) {
  const unit = "2C"; const name = "Andrés Muñoz";
  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name={name} role="tenant" unit={unit} onLogout={onLogout} />
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5">
        <div><p className="text-slate-500 text-sm">Buenos días,</p><h1 className="text-xl font-extrabold text-slate-900">{name}</h1></div>
        <AccountStatusCard unit={unit} />
        <MyTicketsSection unit={unit} />
        <CreateTicketSection unit={unit} owner={name} />
      </div>
    </div>
  );
}

// ─── CONCIERGE VIEW ───────────────────────────────────────────────────────────

function ConciergeView({ onLogout }: { onLogout: () => void }) {
  const { state, dispatch } = useApp();
  const tickets = state.tickets.filter((t) => t.category === "Conserjería");
  const changeStatus = (id: string, dir: "forward" | "back") => {
    const t = state.tickets.find((x) => x.id === id); if (!t) return;
    const i = STATUS_ORDER.indexOf(t.status);
    const next = dir === "forward" ? i + 1 : i - 1;
    if (next < 0 || next >= STATUS_ORDER.length) return;
    dispatch({ type: "UPDATE_TICKET_STATUS", id, newStatus: STATUS_ORDER[next] });
  };
  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name="Roberto Méndez" role="concierge" onLogout={onLogout} />
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="mb-5"><h1 className="text-xl font-extrabold text-slate-900">Tablero de Conserjería</h1><p className="text-sm text-slate-500 mt-0.5">{tickets.length} solicitudes · {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-xs text-blue-700"><ChevronLeft size={13} /><ChevronRight size={13} /><span>Desliza para cambiar el estado de cada solicitud.</span></div>
        <KanbanBoard tickets={tickets} onStatusChange={changeStatus} emptyLabel="Sin solicitudes de conserjería" />
      </div>
    </div>
  );
}

// ─── MAINTENANCE VIEW ─────────────────────────────────────────────────────────

function MaintenanceView({ onLogout }: { onLogout: () => void }) {
  const { state, dispatch } = useApp();
  const tickets = state.tickets.filter((t) => t.category === "Mantención");

  const changeStatus = (id: string, dir: "forward" | "back") => {
    const t = state.tickets.find((x) => x.id === id); if (!t) return;
    const i = STATUS_ORDER.indexOf(t.status);
    const next = dir === "forward" ? i + 1 : i - 1;
    if (next < 0 || next >= STATUS_ORDER.length) return;
    dispatch({ type: "UPDATE_TICKET_STATUS", id, newStatus: STATUS_ORDER[next] });
  };

  const requestAuth = (t: MaintenanceTicket) => {
    if (t.authStatus === "pending" || t.authStatus === "approved") return;
    dispatch({
      type: "ADD_AUTH_REQUEST",
      ticketId: t.id, unit: t.unit, owner: t.owner,
      title: `Autorización estructural: ${t.title}`,
      description: `El personal de mantención requiere autorización para intervenir en tu departamento ${t.unit}.`,
      requestedBy: "Felipe Castillo",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHeader name="Felipe Castillo" role="maintenance" onLogout={onLogout} />
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="mb-5"><h1 className="text-xl font-extrabold text-slate-900">Tablero de Tareas</h1><p className="text-sm text-slate-500 mt-0.5">Personal de Mantención · Junio 2026</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-2 text-xs text-blue-700"><ChevronLeft size={13} /><ChevronRight size={13} /><span>Desliza para avanzar o retroceder el estado de cada tarea.</span></div>
        <KanbanBoard
          tickets={tickets}
          onStatusChange={changeStatus}
          emptyLabel="Sin tareas de mantención"
          extraCard={(t) => t.requiresAuth ? (
            t.authStatus === "approved" ? <Badge className="bg-green-100 text-green-700"><Check size={9} /> Autorización aprobada</Badge> :
            t.authStatus === "rejected" ? <Badge className="bg-red-100 text-red-700"><X size={9} /> Autorización rechazada</Badge> :
            t.authStatus === "pending" ? <Badge className="bg-amber-100 text-amber-700"><Clock size={9} /> Esperando autorización del propietario</Badge> :
            <button onClick={() => requestAuth(t)} className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"><Shield size={11} /> Solicitar autorización a propietario</button>
          ) : null}
        />
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [view, setView] = useState<View>("login");
  const [pendingView, setPendingView] = useState<View>("admin");

  const handleLogin = (dest: View, temp: boolean) => {
    if (temp) { setPendingView(dest); setView("firstLogin"); } else setView(dest);
  };

  return (
    <AppCtx.Provider value={{ state, dispatch }}>
      <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }} className="size-full">
        {view === "login" && <LoginView onLogin={handleLogin} onNavigate={setView} />}
        {view === "reset" && <ResetView onNavigate={setView} />}
        {view === "firstLogin" && <FirstLoginView onSuccess={() => setView(pendingView)} onBack={() => setView("login")} />}
        {view === "admin" && <AdminDashboard onLogout={() => setView("login")} />}
        {view === "owner" && <OwnerDashboard onLogout={() => setView("login")} />}
        {view === "tenant" && <TenantDashboard onLogout={() => setView("login")} />}
        {view === "concierge" && <ConciergeView onLogout={() => setView("login")} />}
        {view === "maintenance" && <MaintenanceView onLogout={() => setView("login")} />}
      </div>
    </AppCtx.Provider>
  );
}
