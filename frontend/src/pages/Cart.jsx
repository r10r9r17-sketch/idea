import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { api, apiError, brl, setSeo } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { Row } from "@/pages/Pages";

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useStore();
  const [coupon, setCoupon] = useState("");
  const [cep, setCep] = useState("");
  const [quote, setQuote] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(
    async (couponCode) => {
      if (!cart.length) return setQuote(null);
      try {
        const { data } = await api.post("/cart/quote", {
          items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
          coupon_code: couponCode ?? null,
          cep: cep || null,
        });
        setQuote(data);
        if (data.coupon_error) toast.error(data.coupon_error);
        else if (data.coupon) toast.success("Cupom aplicado.");
      } catch (e) {
        toast.error(apiError(e.response?.data?.detail));
      }
    },
    [cart, cep],
  );

  useEffect(() => {
    setSeo({ title: "Carrinho — BRAZA TECH", description: "Revise seus produtos antes de finalizar.", path: "/carrinho" });
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(quote?.coupon || null); }, [cart, cep]);

  if (!cart.length)
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-16 text-center" data-testid="cart-empty">
        <h1 className="text-3xl font-bold">Seu carrinho está vazio</h1>
        <Link to="/produtos" className="mt-6 inline-block h-11 px-6 leading-[44px] rounded-lg bt-grad text-white font-semibold">Explorar produtos</Link>
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10 grid lg:grid-cols-[1fr_360px] gap-8" data-testid="cart-page">
      <div>
        <h1 className="text-3xl font-bold">Carrinho</h1>
        <ul className="mt-6 space-y-3">
          {cart.map((item) => (
            <li key={item.product_id} className="bt-card rounded-xl p-4 flex gap-4">
              <img src={item.image} alt={item.name} className="h-20 w-20 rounded object-cover bg-black" />
              <div className="flex-1">
                <Link to={`/produto/${item.slug}`} className="text-sm font-medium hover:text-[#00C2FF]">{item.name}</Link>
                <p className="text-sm text-[#8B95A1]">{brl(item.price)} un.</p>
                <div className="flex items-center gap-2 mt-2">
                  <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} data-testid={`cart-dec-${item.slug}`} aria-label="Diminuir" className="h-8 w-8 grid place-items-center rounded border border-[#2A2F36]"><Minus size={14} /></button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1)} data-testid={`cart-inc-${item.slug}`} aria-label="Aumentar" className="h-8 w-8 grid place-items-center rounded border border-[#2A2F36]"><Plus size={14} /></button>
                  <button type="button" onClick={() => removeFromCart(item.product_id)} data-testid={`cart-del-${item.slug}`} aria-label="Remover" className="ml-auto text-[#E53E3E]"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="font-bold">{brl(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <button type="button" onClick={clearCart} data-testid="cart-clear" className="mt-4 text-xs text-[#8B95A1] hover:text-[#E53E3E] transition-colors">Limpar carrinho</button>
      </div>

      <aside className="bt-card rounded-xl p-5 h-fit space-y-4">
        <h2 className="font-display font-semibold text-lg">Resumo</h2>
        <div className="space-y-2 text-sm">
          <Row label="Subtotal" value={brl(quote?.subtotal || 0)} />
          <Row label="Desconto" value={`- ${brl(quote?.discount || 0)}`} />
          <Row label="Frete" value={quote?.shipping ? brl(quote.shipping) : "Grátis"} />
          <hr className="border-[#2A2F36]" />
          <Row label="Total" value={brl(quote?.total || 0)} bold />
        </div>
        <p className="text-xs text-[#8B95A1]">Frete grátis acima de {brl(quote?.free_shipping_min || 299)}.</p>
        <div className="grid gap-2">
          <label htmlFor="cart-cep" className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B95A1]">CEP</label>
          <input id="cart-cep" data-testid="cart-cep" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className="h-10 px-3 rounded-lg bg-[#12171e] border border-[#2A2F36] text-sm" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="cart-coupon" className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B95A1]">Cupom</label>
          <div className="flex gap-2">
            <input id="cart-coupon" data-testid="cart-coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="CÓDIGO" className="flex-1 h-10 px-3 rounded-lg bg-[#12171e] border border-[#2A2F36] text-sm uppercase" />
            <button type="button" onClick={() => load(coupon)} data-testid="apply-coupon" className="h-10 px-4 rounded-lg border border-[#00C2FF] text-[#00C2FF] text-sm font-semibold">Aplicar</button>
          </div>
        </div>
        <button type="button" onClick={() => navigate("/checkout")} data-testid="cart-checkout-btn" className="w-full h-12 rounded-lg bt-grad text-white font-semibold hover:brightness-110 transition-[filter]">Ir para o checkout</button>
      </aside>
    </div>
  );
}
