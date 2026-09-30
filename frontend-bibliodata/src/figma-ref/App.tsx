import { useState, useEffect } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

type Role = "admin" | "librarian" | "student";
type BookStatus = "available" | "loaned" | "reserved";
type LoanStatus = "active" | "returned" | "overdue";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  loans: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  year: number;
  copies: number;
  available: number;
  status: BookStatus;
  cover?: string;
}

interface Loan {
  id: number;
  userId: number;
  userName: string;
  bookId: number;
  bookTitle: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: LoanStatus;
}

interface Notification {
  id: number;
  type: "overdue" | "info" | "warning" | "success";
  message: string;
  date: string;
  read: boolean;
}

// ── Sample Data ─────────────────────────────────────────────────────────────

const sampleUsers: User[] = [
  { id: 1, name: "Lucía Martínez", email: "lucia@colegio.edu", role: "admin", active: true, loans: 0 },
  { id: 2, name: "Carlos Ramírez", email: "carlos@colegio.edu", role: "librarian", active: true, loans: 1 },
  { id: 3, name: "Sofía Herrera", email: "sofia@colegio.edu", role: "student", active: true, loans: 2 },
  { id: 4, name: "Andrés López", email: "andres@colegio.edu", role: "student", active: true, loans: 1 },
  { id: 5, name: "Valentina Cruz", email: "valen@colegio.edu", role: "student", active: false, loans: 0 },
  { id: 6, name: "Diego Morales", email: "diego@colegio.edu", role: "librarian", active: true, loans: 0 },
];

const sampleBooks: Book[] = [
  { id: 1, title: "Cien Años de Soledad", author: "Gabriel García Márquez", isbn: "978-0-06-088328-7", category: "Literatura", year: 1967, copies: 3, available: 1, status: "loaned", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=80&h=110&fit=crop" },
  { id: 2, title: "El Principito", author: "Antoine de Saint-Exupéry", isbn: "978-84-261-3279-9", category: "Infantil", year: 1943, copies: 5, available: 5, status: "available" },
  { id: 3, title: "Don Quijote de la Mancha", author: "Miguel de Cervantes", isbn: "978-84-376-0494-7", category: "Clásicos", year: 1605, copies: 2, available: 0, status: "loaned" },
  { id: 4, title: "Sapiens: De animales a dioses", author: "Yuval Noah Harari", isbn: "978-84-9942-798-5", category: "Historia", year: 2011, copies: 4, available: 3, status: "available" },
  { id: 5, title: "El Alquimista", author: "Paulo Coelho", isbn: "978-0-06-112241-5", category: "Literatura", year: 1988, copies: 3, available: 0, status: "loaned" },
  { id: 6, title: "Física Universitaria", author: "Sears & Zemansky", isbn: "978-607-32-2748-5", category: "Ciencias", year: 2013, copies: 6, available: 4, status: "available" },
  { id: 7, title: "La Sombra del Viento", author: "Carlos Ruiz Zafón", isbn: "978-84-08-05321-7", category: "Literatura", year: 2001, copies: 2, available: 1, status: "available" },
  { id: 8, title: "Breve Historia del Tiempo", author: "Stephen Hawking", isbn: "978-84-08-13929-5", category: "Ciencias", year: 1988, copies: 3, available: 2, status: "available" },
];

const sampleLoans: Loan[] = [
  { id: 1, userId: 3, userName: "Sofía Herrera", bookId: 1, bookTitle: "Cien Años de Soledad", loanDate: "2026-09-01", dueDate: "2026-09-15", status: "active" },
  { id: 2, userId: 4, userName: "Andrés López", bookId: 3, bookTitle: "Don Quijote de la Mancha", loanDate: "2026-08-20", dueDate: "2026-09-03", status: "overdue" },
  { id: 3, userId: 3, userName: "Sofía Herrera", bookId: 5, bookTitle: "El Alquimista", loanDate: "2026-08-25", dueDate: "2026-09-08", status: "overdue" },
  { id: 4, userId: 2, userName: "Carlos Ramírez", bookId: 1, bookTitle: "Cien Años de Soledad", loanDate: "2026-08-10", dueDate: "2026-08-24", returnDate: "2026-08-22", status: "returned" },
  { id: 5, userId: 4, userName: "Andrés López", bookId: 2, bookTitle: "El Principito", loanDate: "2026-09-05", dueDate: "2026-09-19", status: "active" },
];

const sampleNotifications: Notification[] = [
  { id: 1, type: "overdue", message: "Andrés López tiene 'Don Quijote de la Mancha' vencido desde hace 11 días.", date: "2026-09-14", read: false },
  { id: 2, type: "overdue", message: "Sofía Herrera tiene 'El Alquimista' vencido desde hace 6 días.", date: "2026-09-14", read: false },
  { id: 3, type: "info", message: "Se han agregado 3 nuevos libros al inventario.", date: "2026-09-12", read: true },
  { id: 4, type: "warning", message: "Solo quedan 2 copias disponibles de 'Física Universitaria'.", date: "2026-09-10", read: true },
  { id: 5, type: "success", message: "Carlos Ramírez devolvió 'Cien Años de Soledad' a tiempo.", date: "2026-08-22", read: true },
];

// ── Icons (inline SVG) ───────────────────────────────────────────────────────

const Icon = {
  book: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  dashboard: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  users: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  loan: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
  history: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  bell: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  report: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  search: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  ),
  plus: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  logout: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  ),
  check: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  x: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  shield: (cls = "w-5 h-5") => (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
};

// ── Helper Components ────────────────────────────────────────────────────────

function Badge({ type }: { type: string }) {
  const map: Record<string, string> = {
    available: "badge-available",
    loaned: "badge-loaned",
    overdue: "badge-overdue",
    active: "badge-loaned",
    returned: "badge-available",
    admin: "badge-admin",
    librarian: "badge-librarian",
    student: "badge-student",
  };
  const labels: Record<string, string> = {
    available: "Disponible",
    loaned: "Prestado",
    overdue: "Vencido",
    active: "Activo",
    returned: "Devuelto",
    admin: "Admin",
    librarian: "Bibliotecario",
    student: "Estudiante",
  };
  return <span className={`badge ${map[type] || ""}`}>{labels[type] || type}</span>;
}

function StatCard({ label, value, icon, sub, color = "accent" }: { label: string; value: string | number; icon: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="book-card bg-[var(--card)] p-5 rounded-sm shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted-foreground)] mb-1">{label}</p>
          <p className="text-3xl font-display font-bold text-[var(--foreground)]">{value}</p>
          {sub && <p className="text-xs text-[var(--muted-foreground)] mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-sm" style={{ background: "rgba(184,122,46,0.12)", color: "var(--accent)" }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-[var(--foreground)]">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (role: Role) => void }) {
  const [email, setEmail] = useState("lucia@colegio.edu");
  const [password, setPassword] = useState("••••••••");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin("admin");
    }, 900);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[45%] relative overflow-hidden"
        style={{ background: "var(--primary)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=1200&fit=crop&auto=format")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "luminosity",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div style={{ color: "var(--accent)" }}>{Icon.book("w-8 h-8")}</div>
            <span className="font-display text-xl font-bold" style={{ color: "var(--primary-foreground)" }}>BiblioData+</span>
          </div>
          <blockquote className="border-l-2 pl-5" style={{ borderColor: "var(--accent)" }}>
            <p className="font-display text-2xl italic leading-relaxed" style={{ color: "var(--primary-foreground)" }}>
              "Una habitación sin libros es como un cuerpo sin alma."
            </p>
            <footer className="mt-4 text-sm font-mono" style={{ color: "rgba(245,237,214,0.55)" }}>— Marco Tulio Cicerón</footer>
          </blockquote>
        </div>
        <div className="relative z-10">
          <div className="ornament" style={{ color: "rgba(245,237,214,0.3)" }}>
            <span style={{ color: "var(--accent)", fontSize: "1.2rem" }}>✦</span>
          </div>
          <p className="mt-4 text-xs font-mono leading-loose" style={{ color: "rgba(245,237,214,0.4)" }}>
            SISTEMA DE BIBLIOTECA VIRTUAL<br />
            Colegio San Agustín · Versión 2.0
          </p>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div style={{ color: "var(--accent)" }}>{Icon.book("w-6 h-6")}</div>
            <span className="font-display text-lg font-bold">BiblioData+</span>
          </div>

          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Bienvenido</h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm"
                placeholder="usuario@colegio.edu"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm"
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5" defaultChecked />
                <span style={{ color: "var(--muted-foreground)" }}>Recordarme</span>
              </label>
              <button type="button" className="text-sm" style={{ color: "var(--accent)" }}>¿Olvidaste tu contraseña?</button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold tracking-wider uppercase transition-base rounded-sm"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {loading ? "Verificando..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Quick access */}
          <div className="mt-8">
            <div className="ornament text-xs" style={{ color: "var(--border)" }}>
              <span>Acceso rápido (demo)</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["admin", "librarian", "student"] as Role[]).map(role => (
                <button
                  key={role}
                  onClick={() => onLogin(role)}
                  className="py-1.5 text-xs rounded-sm border transition-base hover:opacity-80"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                >
                  {role === "admin" ? "Admin" : role === "librarian" ? "Bibliote." : "Estudiante"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

type Page = "dashboard" | "books" | "loans" | "users" | "history" | "reports" | "notifications";

const navItems: { id: Page; label: string; icon: (cls?: string) => JSX.Element; roles: Role[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: Icon.dashboard, roles: ["admin", "librarian", "student"] },
  { id: "books", label: "Catálogo", icon: Icon.book, roles: ["admin", "librarian", "student"] },
  { id: "loans", label: "Préstamos", icon: Icon.loan, roles: ["admin", "librarian", "student"] },
  { id: "history", label: "Historial", icon: Icon.history, roles: ["admin", "librarian"] },
  { id: "users", label: "Usuarios", icon: Icon.users, roles: ["admin"] },
  { id: "reports", label: "Reportes", icon: Icon.report, roles: ["admin", "librarian"] },
  { id: "notifications", label: "Alertas", icon: Icon.bell, roles: ["admin", "librarian"] },
];

function Sidebar({ page, setPage, role, onLogout, unread }: {
  page: Page; setPage: (p: Page) => void; role: Role; onLogout: () => void; unread: number;
}) {
  const items = navItems.filter(n => n.roles.includes(role));

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "rgba(196,168,122,0.2)" }}>
        <div style={{ color: "var(--accent)" }}>{Icon.book("w-6 h-6")}</div>
        <div className="sidebar-label">
          <p className="font-display text-base font-bold" style={{ color: "var(--primary-foreground)" }}>BiblioData+</p>
          <p className="text-xs font-mono" style={{ color: "rgba(245,237,214,0.45)" }}>San Agustín</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav flex flex-col gap-0.5 p-3 flex-1">
        {items.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-base w-full text-left relative ${active ? "nav-active" : ""}`}
              style={active ? {} : { color: "rgba(245,237,214,0.65)" }}
            >
              {item.icon("w-4 h-4")}
              <span className="sidebar-label">{item.label}</span>
              {item.id === "notifications" && unread > 0 && (
                <span className="ml-auto sidebar-label font-mono text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent)", color: "#261509" }}>
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(196,168,122,0.2)" }}>
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--accent)", color: "#261509" }}>
            {role === "admin" ? "LM" : role === "librarian" ? "CR" : "SH"}
          </div>
          <div className="sidebar-label overflow-hidden">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--primary-foreground)" }}>
              {role === "admin" ? "Lucía Martínez" : role === "librarian" ? "Carlos Ramírez" : "Sofía Herrera"}
            </p>
            <Badge type={role} />
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm w-full transition-base hover:opacity-70"
          style={{ color: "rgba(245,237,214,0.5)" }}
        >
          {Icon.logout("w-3.5 h-3.5")}
          <span className="sidebar-label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

// ── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ role }: { role: Role }) {
  const active = sampleLoans.filter(l => l.status === "active").length;
  const overdue = sampleLoans.filter(l => l.status === "overdue").length;

  const categories = ["Literatura", "Ciencias", "Historia", "Infantil", "Clásicos"];
  const catCounts = categories.map(c => sampleBooks.filter(b => b.category === c).length);
  const maxCat = Math.max(...catCounts);

  return (
    <div>
      <SectionHeader
        title="Panel de Control"
        subtitle={`Resumen de actividad · ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Libros" value={sampleBooks.length} icon={Icon.book("w-5 h-5")} sub={`${sampleBooks.reduce((a, b) => a + b.copies, 0)} copias totales`} />
        <StatCard label="Usuarios" value={sampleUsers.length} icon={Icon.users("w-5 h-5")} sub={`${sampleUsers.filter(u => u.active).length} activos`} />
        <StatCard label="Préstamos Activos" value={active} icon={Icon.loan("w-5 h-5")} sub="En circulación" />
        <StatCard label="Vencidos" value={overdue} icon={Icon.warning("w-5 h-5")} sub="Requieren atención" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent loans */}
        <div className="lg:col-span-2 bg-[var(--card)] rounded-sm shadow-sm p-5">
          <h3 className="font-display font-semibold text-base mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {sampleLoans.slice(0, 4).map(loan => (
              <div key={loan.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{loan.bookTitle}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{loan.userName} · vence {loan.dueDate}</p>
                </div>
                <Badge type={loan.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Categories chart */}
        <div className="bg-[var(--card)] rounded-sm shadow-sm p-5">
          <h3 className="font-display font-semibold text-base mb-4">Por Categoría</h3>
          <div className="space-y-3">
            {categories.map((cat, i) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--muted-foreground)" }}>{cat}</span>
                  <span className="font-mono">{catCounts[i]}</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-bar-fill" style={{ width: `${(catCounts[i] / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)" }}>Disponibilidad</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="stat-bar" style={{ height: "8px" }}>
                  <div className="stat-bar-fill" style={{ width: `${(sampleBooks.filter(b => b.status === "available").length / sampleBooks.length) * 100}%`, background: "#2A7A4A" }} />
                </div>
              </div>
              <span className="text-sm font-mono font-bold">{Math.round((sampleBooks.filter(b => b.status === "available").length / sampleBooks.length) * 100)}%</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Libros disponibles</p>
          </div>
        </div>
      </div>

      {overdue > 0 && (
        <div className="mt-5 p-4 rounded-sm border flex items-start gap-3" style={{ background: "#FFF3CD", borderColor: "#C4A82A", color: "#5A4200" }}>
          {Icon.warning("w-4 h-4 mt-0.5 flex-shrink-0")}
          <div>
            <p className="text-sm font-semibold">Atención requerida</p>
            <p className="text-xs mt-0.5">Hay {overdue} préstamo{overdue > 1 ? "s" : ""} vencido{overdue > 1 ? "s" : ""}. Por favor notifica a los usuarios correspondientes.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Books Page ───────────────────────────────────────────────────────────────

function BooksPage({ role }: { role: Role }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const categories = ["all", ...Array.from(new Set(sampleBooks.map(b => b.category)))];

  const filtered = sampleBooks.filter(b => {
    const q = search.toLowerCase();
    const matchQ = b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
    const matchCat = category === "all" || b.category === category;
    return matchQ && matchCat;
  });

  return (
    <div>
      <SectionHeader
        title="Catálogo de Libros"
        subtitle={`${sampleBooks.length} títulos · ${sampleBooks.reduce((a, b) => a + b.copies, 0)} copias`}
        action={
          (role === "admin" || role === "librarian") && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-sm transition-base"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {Icon.plus("w-4 h-4")}
              <span>Agregar libro</span>
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}>{Icon.search("w-4 h-4")}</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, autor o ISBN..."
            className="w-full pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 text-sm sm:w-44"
        >
          {categories.map(c => <option key={c} value={c}>{c === "all" ? "Todas las categorías" : c}</option>)}
        </select>
      </div>

      {/* Book list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(book => (
          <div
            key={book.id}
            className="book-card bg-[var(--card)] p-4 rounded-sm cursor-pointer"
            onClick={() => setSelectedBook(book)}
          >
            <div className="flex gap-4">
              <div className="w-12 h-16 rounded-sm overflow-hidden flex-shrink-0" style={{ background: "var(--muted)" }}>
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--accent)" }}>
                    {Icon.book("w-6 h-6")}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-display font-semibold text-sm leading-tight truncate">{book.title}</h4>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>{book.author} · {book.year}</p>
                  </div>
                  <Badge type={book.status} />
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                  <span>{book.category}</span>
                  <span>{book.available}/{book.copies} disp.</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
          {Icon.book("w-10 h-10 mx-auto mb-3 opacity-30")}
          <p className="font-display text-lg">Sin resultados</p>
          <p className="text-sm">Intenta con otro término de búsqueda</p>
        </div>
      )}

      {/* Book detail modal */}
      {selectedBook && (
        <div className="modal-backdrop" onClick={() => setSelectedBook(null)}>
          <div
            className="w-full max-w-lg bg-[var(--card)] rounded-sm shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-lg">Datos del Libro</h3>
              <button onClick={() => setSelectedBook(null)} style={{ color: "var(--muted-foreground)" }}>{Icon.x("w-5 h-5")}</button>
            </div>
            <div className="p-6">
              <div className="flex gap-5 mb-5">
                <div className="w-20 h-28 rounded-sm overflow-hidden flex-shrink-0" style={{ background: "var(--muted)" }}>
                  {selectedBook.cover ? (
                    <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--accent)" }}>
                      {Icon.book("w-8 h-8")}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-display font-bold text-xl leading-tight">{selectedBook.title}</h4>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{selectedBook.author}</p>
                  <div className="mt-2"><Badge type={selectedBook.status} /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["ISBN", selectedBook.isbn],
                  ["Categoría", selectedBook.category],
                  ["Año de publicación", selectedBook.year],
                  ["Copias totales", selectedBook.copies],
                  ["Disponibles", selectedBook.available],
                  ["Prestadas", selectedBook.copies - selectedBook.available],
                ].map(([k, v]) => (
                  <div key={k as string} className="p-3 rounded-sm" style={{ background: "var(--background)" }}>
                    <p className="text-xs font-mono uppercase tracking-wide mb-0.5" style={{ color: "var(--muted-foreground)" }}>{k}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add book modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-md bg-[var(--card)] rounded-sm shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-lg">Agregar Libro</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}>{Icon.x("w-5 h-5")}</button>
            </div>
            <div className="p-6 space-y-4">
              {["Título", "Autor", "ISBN", "Categoría", "Año de publicación", "Número de copias"].map(field => (
                <div key={field}>
                  <label className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>{field}</label>
                  <input type="text" className="w-full px-3 py-2 text-sm" placeholder={`Ingresa ${field.toLowerCase()}...`} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 py-2.5 text-sm rounded-sm border transition-base"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 py-2.5 text-sm rounded-sm font-semibold transition-base"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  onClick={() => setShowModal(false)}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Loans Page ───────────────────────────────────────────────────────────────

function LoansPage({ role }: { role: Role }) {
  const [tab, setTab] = useState<"active" | "overdue" | "register">("active");
  const [showReturn, setShowReturn] = useState<Loan | null>(null);

  const active = sampleLoans.filter(l => l.status === "active");
  const overdue = sampleLoans.filter(l => l.status === "overdue");

  const tabs = [
    { id: "active" as const, label: "Activos", count: active.length },
    { id: "overdue" as const, label: "Vencidos", count: overdue.length },
    ...(role !== "student" ? [{ id: "register" as const, label: "Registrar préstamo", count: null }] : []),
  ];

  const currentLoans = tab === "active" ? active : tab === "overdue" ? overdue : [];

  return (
    <div>
      <SectionHeader title="Gestión de Préstamos" subtitle="Control de circulación del material bibliográfico" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-base border-b-2 -mb-px ${tab === t.id ? "border-[var(--accent)]" : "border-transparent"}`}
            style={{ color: tab === t.id ? "var(--accent)" : "var(--muted-foreground)" }}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded-full" style={{ background: t.id === "overdue" ? "#F8D7DA" : "var(--muted)", color: t.id === "overdue" ? "#7A1A1A" : "var(--muted-foreground)" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "register" ? (
        <div className="max-w-md">
          <div className="bg-[var(--card)] rounded-sm shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Estudiante</label>
              <select className="w-full px-3 py-2 text-sm">
                <option value="">Seleccionar usuario...</option>
                {sampleUsers.filter(u => u.active && u.role === "student").map(u => (
                  <option key={u.id}>{u.name} — {u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Libro</label>
              <select className="w-full px-3 py-2 text-sm">
                <option value="">Seleccionar libro...</option>
                {sampleBooks.filter(b => b.available > 0).map(b => (
                  <option key={b.id}>{b.title} — {b.available} disp.</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Fecha de préstamo</label>
              <input type="date" className="w-full px-3 py-2 text-sm" defaultValue="2026-09-14" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Fecha de devolución</label>
              <input type="date" className="w-full px-3 py-2 text-sm" defaultValue="2026-09-28" />
            </div>
            <div className="p-3 rounded-sm border flex items-start gap-2.5 text-xs" style={{ background: "#D4EDDA", borderColor: "#A8D5B5", color: "#1A5C2A" }}>
              {Icon.shield("w-4 h-4 flex-shrink-0 mt-0.5")}
              <span>Se validará que el usuario no tenga préstamos vencidos antes de registrar.</span>
            </div>
            <button
              className="w-full py-3 text-sm font-semibold rounded-sm transition-base"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              Registrar Préstamo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {currentLoans.map(loan => (
            <div key={loan.id} className="bg-[var(--card)] p-4 rounded-sm shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-display font-semibold text-sm">{loan.bookTitle}</h4>
                  <Badge type={loan.status} />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  {loan.userName} · Prestado: {loan.loanDate} · Vence: {loan.dueDate}
                </p>
                {loan.status === "overdue" && (
                  <p className="text-xs mt-1 font-medium" style={{ color: "#7A1A1A" }}>
                    Vencido hace {Math.floor((new Date("2026-09-14").getTime() - new Date(loan.dueDate).getTime()) / 86400000)} días
                  </p>
                )}
              </div>
              {role !== "student" && (
                <button
                  onClick={() => setShowReturn(loan)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-sm font-medium transition-base flex-shrink-0"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {Icon.check("w-3.5 h-3.5")}
                  Registrar devolución
                </button>
              )}
            </div>
          ))}
          {currentLoans.length === 0 && (
            <div className="text-center py-16" style={{ color: "var(--muted-foreground)" }}>
              {Icon.check("w-10 h-10 mx-auto mb-3 opacity-30")}
              <p className="font-display text-lg">Sin {tab === "active" ? "préstamos activos" : "préstamos vencidos"}</p>
            </div>
          )}
        </div>
      )}

      {showReturn && (
        <div className="modal-backdrop" onClick={() => setShowReturn(null)}>
          <div
            className="w-full max-w-md bg-[var(--card)] rounded-sm shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-lg">Registrar Devolución</h3>
              <button onClick={() => setShowReturn(null)} style={{ color: "var(--muted-foreground)" }}>{Icon.x()}</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-sm" style={{ background: "var(--background)" }}>
                <p className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>Libro</p>
                <p className="font-display font-semibold">{showReturn.bookTitle}</p>
                <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{showReturn.userName}</p>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Fecha de devolución</label>
                <input type="date" className="w-full px-3 py-2 text-sm" defaultValue="2026-09-14" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Condición del libro</label>
                <select className="w-full px-3 py-2 text-sm">
                  <option>Excelente</option>
                  <option>Buena</option>
                  <option>Regular</option>
                  <option>Deteriorado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Observaciones</label>
                <textarea className="w-full px-3 py-2 text-sm resize-none" rows={2} placeholder="Notas opcionales..." />
              </div>
              <button
                className="w-full py-3 text-sm font-semibold rounded-sm transition-base"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                onClick={() => setShowReturn(null)}
              >
                Confirmar Devolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── History Page ─────────────────────────────────────────────────────────────

function HistoryPage() {
  return (
    <div>
      <SectionHeader title="Historial de Préstamos" subtitle="Registro completo de todas las operaciones" />
      <div className="bg-[var(--card)] rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
              {["#", "Libro", "Usuario", "Fecha préstamo", "Fecha devolución", "Estado"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleLoans.map((loan, i) => (
              <tr key={loan.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-[var(--background)] transition-base">
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{String(i + 1).padStart(3, "0")}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{loan.bookTitle}</p>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{loan.userName}</td>
                <td className="px-4 py-3 font-mono text-xs">{loan.loanDate}</td>
                <td className="px-4 py-3 font-mono text-xs">{loan.returnDate || <span style={{ color: "var(--muted-foreground)" }}>—</span>}</td>
                <td className="px-4 py-3"><Badge type={loan.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Users Page ───────────────────────────────────────────────────────────────

function UsersPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <SectionHeader
        title="Gestión de Usuarios"
        subtitle={`${sampleUsers.length} usuarios registrados`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-sm transition-base"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {Icon.plus("w-4 h-4")}
            Nuevo usuario
          </button>
        }
      />

      <div className="bg-[var(--card)] rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--background)" }}>
              {["Usuario", "Correo", "Rol", "Estado", "Préstamos activos", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:bg-[var(--background)] transition-base">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--accent)", color: "#261509" }}>
                      {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{user.email}</td>
                <td className="px-4 py-3"><Badge type={user.role} /></td>
                <td className="px-4 py-3">
                  <span className={`badge ${user.active ? "badge-available" : "badge-overdue"}`}>{user.active ? "Activo" : "Inactivo"}</span>
                </td>
                <td className="px-4 py-3 font-mono text-center">{user.loans}</td>
                <td className="px-4 py-3">
                  <button className="text-xs px-3 py-1 rounded-sm border transition-base hover:opacity-70" style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-[var(--card)] rounded-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-display font-bold text-lg">Nuevo Usuario</h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--muted-foreground)" }}>{Icon.x()}</button>
            </div>
            <div className="p-6 space-y-4">
              {["Nombre completo", "Correo electrónico", "Contraseña temporal"].map(f => (
                <div key={f}>
                  <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>{f}</label>
                  <input type="text" className="w-full px-3 py-2 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--muted-foreground)" }}>Rol</label>
                <select className="w-full px-3 py-2 text-sm">
                  <option>student</option>
                  <option>librarian</option>
                  <option>admin</option>
                </select>
              </div>
              <button
                className="w-full py-3 text-sm font-semibold rounded-sm transition-base"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                onClick={() => setShowModal(false)}
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reports Page ─────────────────────────────────────────────────────────────

function ReportsPage() {
  const months = ["Abr", "May", "Jun", "Jul", "Ago", "Sep"];
  const data = [12, 18, 9, 23, 15, 8];
  const max = Math.max(...data);

  return (
    <div>
      <SectionHeader title="Reportes y Estadísticas" subtitle="Análisis del rendimiento de la biblioteca" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan trend */}
        <div className="bg-[var(--card)] p-5 rounded-sm shadow-sm">
          <h3 className="font-display font-semibold text-base mb-5">Préstamos por Mes</h3>
          <div className="flex items-end gap-3 h-40">
            {months.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>{data[i]}</span>
                <div
                  className="w-full rounded-sm transition-all duration-700"
                  style={{ height: `${(data[i] / max) * 120}px`, background: i === months.length - 1 ? "var(--accent)" : "var(--muted)" }}
                />
                <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top books */}
        <div className="bg-[var(--card)] p-5 rounded-sm shadow-sm">
          <h3 className="font-display font-semibold text-base mb-5">Libros más Prestados</h3>
          <div className="space-y-3">
            {[
              { title: "Cien Años de Soledad", count: 14 },
              { title: "El Principito", count: 11 },
              { title: "Sapiens", count: 9 },
              { title: "Don Quijote", count: 7 },
              { title: "El Alquimista", count: 5 },
            ].map((b, i) => (
              <div key={b.title} className="flex items-center gap-3">
                <span className="font-mono text-xs w-5 text-right" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate">{b.title}</span>
                    <span className="font-mono ml-2">{b.count}</span>
                  </div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${(b.count / 14) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="bg-[var(--card)] p-5 rounded-sm shadow-sm">
          <h3 className="font-display font-semibold text-base mb-5">Resumen General</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total préstamos", value: "85", period: "últimos 6 meses" },
              { label: "Devoluciones a tiempo", value: "76%", period: "tasa de cumplimiento" },
              { label: "Promedio días", value: "12.4", period: "por préstamo" },
              { label: "Usuario más activo", value: "Sofía H.", period: "8 préstamos" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-sm" style={{ background: "var(--background)" }}>
                <p className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>{s.label}</p>
                <p className="font-display font-bold text-xl">{s.value}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.period}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="bg-[var(--card)] p-5 rounded-sm shadow-sm">
          <h3 className="font-display font-semibold text-base mb-5">Exportar Reportes</h3>
          <div className="space-y-3">
            {[
              { label: "Inventario completo", desc: "Lista de todos los libros con estado y disponibilidad" },
              { label: "Historial de préstamos", desc: "Registro completo de préstamos y devoluciones" },
              { label: "Préstamos vencidos", desc: "Listado de usuarios con material sin devolver" },
              { label: "Actividad de usuarios", desc: "Estadísticas de uso por usuario" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between p-3 rounded-sm border" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{r.desc}</p>
                </div>
                <button
                  className="text-xs px-3 py-1.5 rounded-sm font-mono transition-base ml-3 flex-shrink-0"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Notifications Page ───────────────────────────────────────────────────────

function NotificationsPage() {
  const [notifs, setNotifs] = useState(sampleNotifications);

  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));

  const colorMap = {
    overdue: { bg: "#F8D7DA", border: "#E4A0A8", icon: "#7A1A1A" },
    warning: { bg: "#FFF3CD", border: "#E0CC70", icon: "#7A5A00" },
    info: { bg: "#D6E4F0", border: "#90B5D0", icon: "#1A3A5C" },
    success: { bg: "#D4EDDA", border: "#A8D5B5", icon: "#1A5C2A" },
  };

  return (
    <div>
      <SectionHeader
        title="Notificaciones"
        subtitle={`${notifs.filter(n => !n.read).length} sin leer`}
        action={
          <button
            onClick={markAll}
            className="text-sm px-4 py-2 rounded-sm border transition-base"
            style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            Marcar todas como leídas
          </button>
        }
      />

      <div className="space-y-3">
        {notifs.map(n => {
          const c = colorMap[n.type];
          return (
            <div
              key={n.id}
              className="p-4 rounded-sm border flex items-start gap-3 transition-base"
              style={{ background: n.read ? "var(--card)" : c.bg, borderColor: n.read ? "var(--border)" : c.border, opacity: n.read ? 0.7 : 1 }}
            >
              <div className="mt-0.5" style={{ color: n.read ? "var(--muted-foreground)" : c.icon }}>
                {n.type === "overdue" || n.type === "warning" ? Icon.warning("w-4 h-4") : n.type === "success" ? Icon.check("w-4 h-4") : Icon.bell("w-4 h-4")}
              </div>
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
                <p className="text-xs mt-1 font-mono" style={{ color: "var(--muted-foreground)" }}>{n.date}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  className="flex-shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {Icon.x("w-4 h-4")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Layout ──────────────────────────────────────────────────────────────

function MainLayout({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const [page, setPage] = useState<Page>("dashboard");
  const unread = sampleNotifications.filter(n => !n.read).length;

  const pageComponents: Record<Page, JSX.Element> = {
    dashboard: <DashboardPage role={role} />,
    books: <BooksPage role={role} />,
    loans: <LoansPage role={role} />,
    history: <HistoryPage />,
    users: <UsersPage />,
    reports: <ReportsPage />,
    notifications: <NotificationsPage />,
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar page={page} setPage={setPage} role={role} onLogout={onLogout} unread={unread} />

      {/* Main content */}
      <main className="flex-1 overflow-auto main-content">
        <div className="max-w-5xl mx-auto p-6 sm:p-8">
          {pageComponents[page]}
        </div>
      </main>
    </div>
  );
}

// ── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>("admin");

  const handleLogin = (r: Role) => {
    setRole(r);
    setLoggedIn(true);
  };

  if (!loggedIn) return <LoginPage onLogin={handleLogin} />;
  return <MainLayout role={role} onLogout={() => setLoggedIn(false)} />;
}
