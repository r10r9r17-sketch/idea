import { Link, useLocation } from "react-router-dom";
import { Heart, Home, ShoppingCart, Tag, User } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export const BottomNav = () => {
  const { cartCount, favorites, user, setCartOpen } = useStore();
  const { pathname } = useLocation();

  const items = [
    { to: "/", label: "Início", icon: Home },
    { to: "/ofertas", label: "Ofertas", icon: Tag },
    { to: "/favoritos", label: "Favoritos", icon: Heart, badge: favorites.length },
    { action: true, label: "Carrinho", icon: ShoppingCart, badge: cartCount },
    { to: user ? (user.role === "admin" ? "/admin" : "/conta") : "/entrar", label: "Conta", icon: User },
  ];

  return (
    <nav data-testid="bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bt-glass border-t border-[#2A2F36] pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, badge, action }) => {
          const active = to && (to === "/" ? pathname === "/" : pathname.startsWith(to));
          const content = (
            <span className="relative flex flex-col items-center gap-0.5 py-2.5">
              <Icon size={19} className={active ? "text-[#00C2FF]" : "text-[#8B95A1]"} />
              <span className={`text-[10px] ${active ? "text-[#00C2FF]" : "text-[#8B95A1]"}`}>{label}</span>
              {badge > 0 && (
                <span className="absolute top-1 right-3 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-[#E53E3E] text-white text-[9px] font-bold">
                  {badge}
                </span>
              )}
            </span>
          );
          return (
            <li key={label}>
              {action ? (
                <button type="button" onClick={() => setCartOpen(true)} data-testid="bottom-nav-cart" className="w-full" aria-label={label}>
                  {content}
                </button>
              ) : (
                <Link to={to} data-testid={`bottom-nav-${label.toLowerCase()}`} className="block" aria-label={label}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
