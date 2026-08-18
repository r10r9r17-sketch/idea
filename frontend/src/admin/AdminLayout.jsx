import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { BarChart3, Boxes, Cpu, Image, LayoutDashboard, MessageSquare, Package, Percent, Settings, ShoppingBag, Star, Users } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { setSeo } from "@/lib/api";

const MENU = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Boxes },
  { to: "/admin/estoque", label: "Estoque", icon: BarChart3 },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/cupons", label: "Cupons", icon: Percent },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/depoimentos", label: "Depoimentos", icon: Star },
  { to: "/admin/atendimento", label: "Atendimento", icon: MessageSquare },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout() {
  const { user, authChecked } = useStore();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setSeo({ title: "Painel — BRAZA TECH", description: "Painel administrativo.", path: pathname }), [pathname]);

  if (!authChecked) return <div className="p-10 text-sm text-[#8B95A1]">Verificando acesso...</div>;
  if (!user) return <Navigate to="/entrar" replace />;
  if (user.role !== "admin")
    return (
      <div className="p-10" data-testid="admin-denied">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-[#8B95A1]">Esta área é exclusiva para administradores.</p>
        <Link to="/" className="mt-4 inline-block text-[#00C2FF]">Voltar ao início</Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0D1117]" data-testid="admin-layout">
      <header className="sticky top-0 z-40 bt-glass border-b border-[#2A2F36] h-14 flex items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2"><span className="h-8 w-8 rounded-lg bt-grad grid place-items-center"><Cpu size={16} className="text-white" /></span>
          <span className="font-display font-bold">BRAZA TECH <span className="text-[#8B95A1] font-normal text-xs">admin</span></span></Link>
        <button type="button" onClick={() => setOpen((v) => !v)} data-testid="admin-menu-toggle" className="lg:hidden ml-auto h-9 px-3 rounded-lg border border-[#2A2F36] text-xs">Menu</button>
        <span className="hidden lg:block ml-auto text-xs text-[#8B95A1]">{user.email}</span>
      </header>
      <div className="flex">
        <aside className={`${open ? "block" : "hidden"} lg:block w-full lg:w-60 shrink-0 border-r border-[#2A2F36] p-3 lg:min-h-[calc(100vh-56px)]`} data-testid="admin-sidebar">
          <nav className="grid gap-1">
            {MENU.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link key={to} to={to} onClick={() => setOpen(false)} data-testid={`admin-nav-${label.toLowerCase()}`}
                  className={`flex items-center gap-2 h-10 px-3 rounded-lg text-sm transition-colors ${active ? "bg-[#0077FF]/15 text-[#00C2FF]" : "text-[#8B95A1] hover:bg-[#2A2F36]"}`}>
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className={`${open ? "hidden" : "block"} lg:block flex-1 p-4 lg:p-8 min-w-0`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
