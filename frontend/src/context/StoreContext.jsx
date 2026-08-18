import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cart, setCart] = useState(() => read("bt_cart", []));
  const [favorites, setFavorites] = useState(() => read("bt_favs", []));
  const [cartOpen, setCartOpen] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => localStorage.setItem("bt_cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("bt_favs", JSON.stringify(favorites)), [favorites]);

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data || {})).catch(() => {});
    const token = localStorage.getItem("bt_token");
    if (!token) return setAuthChecked(true);
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("bt_token"))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get("/favorites").then((r) => setFavorites(r.data.map((p) => p.id))).catch(() => {});
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("bt_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("bt_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    localStorage.removeItem("bt_token");
    setUser(null);
    toast.success("Sessão encerrada.");
  };

  const addToCart = useCallback((product, quantity = 1) => {
    if (product.product_type === "affiliate") {
      toast.info("Este produto é vendido pelo parceiro. Use o botão do fornecedor.");
      return;
    }
    if (!product.stock) {
      toast.error("Produto sem estoque disponível.");
      return;
    }
    setCart((prev) => {
      const found = prev.find((i) => i.product_id === product.id);
      if (found)
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i,
        );
      return [
        ...prev,
        {
          product_id: product.id,
          quantity: Math.min(quantity, product.stock),
          name: product.name,
          slug: product.slug,
          image: product.image,
          price: product.price,
          stock: product.stock,
        },
      ];
    });
    toast.success("Produto adicionado ao carrinho.");
  }, []);

  const updateQuantity = (productId, quantity) =>
    setCart((prev) =>
      prev
        .map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock || 99)) } : i))
        .filter(Boolean),
    );

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
    toast.success("Produto removido do carrinho.");
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = async (product) => {
    const isFav = favorites.includes(product.id);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== product.id) : [...prev, product.id]));
    toast.success(isFav ? "Removido dos favoritos." : "Favorito salvo.");
    if (user) {
      try {
        if (isFav) await api.delete(`/favorites/${product.id}`);
        else await api.post(`/favorites/${product.id}`);
      } catch (e) {
        toast.error(apiError(e.response?.data?.detail));
      }
    }
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value = useMemo(
    () => ({
      user, authChecked, login, register, logout, settings,
      cart, cartCount, cartSubtotal, addToCart, updateQuantity, removeFromCart, clearCart,
      favorites, toggleFavorite, cartOpen, setCartOpen,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, authChecked, cart, favorites, cartOpen, settings],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
