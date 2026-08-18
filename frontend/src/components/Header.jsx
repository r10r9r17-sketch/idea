import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Heart, LogOut, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { api, brl } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Produtos" },
  { to: "/ofertas", label: "Ofertas" },
  { to: "/categorias", label: "Categorias" },
  { to: "/sobre", label: "Sobre" },
  { to: "/sac", label: "SAC" },
];

export const Header = () => {
  const { cartCount, favorites, user, logout, setCartOpen } = useStore();
  const [query, setQuery] = useState("");
  const [sugg, setSugg] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length < 2) return setSugg(null);
    timer.current = setTimeout(() => {
      api.get(`/search/suggestions?q=${encodeURIComponent(query)}`).then((r) => setSugg(r.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(timer.current);
  }, [query]);

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSugg(null);
    navigate(`/produtos?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bt-glass border-b border-[#2A2F36]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center gap-3 lg:gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="logo-link">
          <span className="h-9 w-9 rounded-lg bt-grad grid place-items-center">
            <Cpu size={19} className="text-white" />
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight hidden sm:block">
            BRAZA<span className="bt-grad-text">TECH</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#8B95A1]">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} data-testid={`nav-${item.label.toLowerCase()}`} className="hover:text-[#F2F2F2] transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submit} className="relative flex-1 max-w-md ml-auto">
          <label htmlFor="site-search" className="sr-only">Pesquisar produtos</label>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B95A1]" />
          <input
            id="site-search"
            data-testid="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm placeholder:text-[#8B95A1] focus:border-[#0077FF] transition-colors"
          />
          {sugg && (sugg.products.length > 0 || sugg.categories.length > 0) && (
            <div data-testid="search-suggestions" className="absolute top-12 left-0 right-0 bt-card rounded-xl p-2 z-50 max-h-80 overflow-auto">
              {sugg.products.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => { setSugg(null); setQuery(""); navigate(`/produto/${p.slug}`); }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#2A2F36] text-left transition-colors"
                >
                  <img src={p.image} alt="" className="h-9 w-9 rounded object-cover" />
                  <span className="text-sm flex-1 line-clamp-1">{p.name}</span>
                  <span className="text-xs text-[#8B95A1]">{brl(p.price)}</span>
                </button>
              ))}
              {sugg.categories.map((c) => (
                <button key={c.slug} type="button" onClick={() => { setSugg(null); navigate(`/categoria/${c.slug}`); }} className="w-full text-left p-2 text-xs text-[#00C2FF] hover:bg-[#2A2F36] rounded-lg transition-colors">
                  Categoria: {c.name}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="flex items-center gap-1">
          <Link to="/favoritos" data-testid="favorites-link" aria-label="Favoritos" className="relative hidden sm:grid place-items-center h-10 w-10 rounded-lg hover:bg-[#2A2F36] transition-colors">
            <Heart size={19} />
            {favorites.length > 0 && <Badge value={favorites.length} />}
          </Link>
          <button type="button" onClick={() => setCartOpen(true)} data-testid="cart-button" aria-label="Carrinho" className="relative grid place-items-center h-10 w-10 rounded-lg hover:bg-[#2A2F36] transition-colors">
            <ShoppingCart size={19} />
            {cartCount > 0 && <Badge value={cartCount} />}
          </button>
          {user ? (
            <div className="hidden sm:flex items-center gap-1">
              <Link to={user.role === "admin" ? "/admin" : "/conta"} data-testid="account-link" className="h-10 px-3 grid place-items-center rounded-lg hover:bg-[#2A2F36] text-sm transition-colors">
                {user.name.split(" ")[0]}
              </Link>
              <button type="button" onClick={logout} data-testid="logout-btn" aria-label="Sair" className="grid place-items-center h-10 w-10 rounded-lg hover:bg-[#2A2F36] transition-colors">
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link to="/entrar" data-testid="login-link" aria-label="Entrar" className="hidden sm:grid place-items-center h-10 w-10 rounded-lg hover:bg-[#2A2F36] transition-colors">
              <User size={19} />
            </Link>
          )}
          <button type="button" onClick={() => setMenuOpen((v) => !v)} data-testid="mobile-menu-btn" aria-label="Menu" className="lg:hidden grid place-items-center h-10 w-10 rounded-lg hover:bg-[#2A2F36] transition-colors">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav data-testid="mobile-menu" className="lg:hidden border-t border-[#2A2F36] px-4 py-3 grid gap-1 bg-[#0D1117]">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className="py-2.5 text-sm text-[#F2F2F2] border-b border-[#2A2F36]/60">
              {item.label}
            </Link>
          ))}
          <Link to={user ? (user.role === "admin" ? "/admin" : "/conta") : "/entrar"} onClick={() => setMenuOpen(false)} className="py-2.5 text-sm text-[#00C2FF]">
            {user ? "Minha conta" : "Entrar / Cadastrar"}
          </Link>
        </nav>
      )}
    </header>
  );
};

const Badge = ({ value }) => (
  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-[#E53E3E] text-white text-[10px] font-bold">
    {value}
  </span>
);
