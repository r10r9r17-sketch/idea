import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard, QrCode } from "lucide-react";
import { api, apiError, brl, setSeo } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { Input, Row } from "@/pages/Pages";

const EMPTY = { name: "", email: "", phone: "", cpf: "", cep: "", state: "", city: "", street: "", number: "", complement: "", district: "" };

export default function Checkout() {
  const { cart, clearCart, user } = useStore();
  const [form, setForm] = useState(EMPTY);
  const [method, setMethod] = useState("pix");
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    setSeo({ title: "Checkout — BRAZA TECH", description: "Finalize sua compra com segurança.", path: "/checkout" });
    if (user) setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone || "" }));
  }, [user]);

  useEffect(() => {
    if (!cart.length) return;
    api
      .post("/cart/quote", { items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })), coupon_code: coupon || null, cep: form.cep || null })
      .then((r) => setQuote(r.data))
      .catch((e) => toast.error(apiError(e.response?.data?.detail)));
  }, [cart, coupon, form.cep]);

  if (!cart.length)
    return <div className="max-w-[900px] mx-auto px-4 py-16 text-center" data-testid="checkout-empty"><h1 className="text-2xl font-bold">Carrinho vazio</h1></div>;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: order } = await api.post("/orders", {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        coupon_code: coupon || null,
        payment_method: method,
        customer: form,
      });
      toast.success(`Pedido ${order.number} criado.`);
      try {
        const { data: pref } = await api.post("/payments/mercadopago/preference", { order_number: order.number });
        clearCart();
        if (pref.init_point) { window.location.href = pref.init_point; return; }
      } catch (err) {
        toast.info("Pedido registrado. O pagamento pelo Mercado Pago será liberado assim que as credenciais forem configuradas.");
      }
      clearCart();
      navigate(`/pedido/${order.number}`);
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail, "Erro ao processar pagamento."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10 grid lg:grid-cols-[1fr_360px] gap-8" data-testid="checkout-page">
      <div>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <section className="mt-6 bt-card rounded-xl p-5 grid sm:grid-cols-2 gap-4">
          <h2 className="sm:col-span-2 font-display font-semibold">Dados pessoais</h2>
          <Input label="Nome completo" value={form.name} onChange={set("name")} testid="checkout-name" required />
          <Input label="E-mail" type="email" value={form.email} onChange={set("email")} testid="checkout-email" required />
          <Input label="Telefone" value={form.phone} onChange={set("phone")} testid="checkout-phone" required />
          <Input label="CPF" value={form.cpf} onChange={set("cpf")} testid="checkout-cpf" required />
        </section>
        <section className="mt-4 bt-card rounded-xl p-5 grid sm:grid-cols-2 gap-4">
          <h2 className="sm:col-span-2 font-display font-semibold">Endereço de entrega</h2>
          <Input label="CEP" value={form.cep} onChange={set("cep")} testid="checkout-cep" required />
          <Input label="Estado" value={form.state} onChange={set("state")} testid="checkout-state" required />
          <Input label="Cidade" value={form.city} onChange={set("city")} testid="checkout-city" required />
          <Input label="Bairro" value={form.district} onChange={set("district")} testid="checkout-district" required />
          <Input label="Endereço" value={form.street} onChange={set("street")} testid="checkout-street" required />
          <Input label="Número" value={form.number} onChange={set("number")} testid="checkout-number" required />
          <Input label="Complemento" value={form.complement} onChange={set("complement")} testid="checkout-complement" />
        </section>
        <section className="mt-4 bt-card rounded-xl p-5">
          <h2 className="font-display font-semibold">Pagamento</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {[["pix", "PIX", QrCode], ["card", "Cartão", CreditCard]].map(([key, label, Icon]) => (
              <button key={key} type="button" onClick={() => setMethod(key)} data-testid={`payment-${key}`} className={`h-14 rounded-lg border flex items-center justify-center gap-2 font-semibold transition-colors ${method === key ? "border-[#00C2FF] text-[#00C2FF]" : "border-[#2A2F36] text-[#8B95A1]"}`}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#8B95A1]">Pagamento processado pelo Mercado Pago. A Braza Tech não recebe nem armazena dados do seu cartão.</p>
        </section>
      </div>

      <aside className="bt-card rounded-xl p-5 h-fit space-y-4 lg:sticky lg:top-24">
        <h2 className="font-display font-semibold text-lg">Resumo do pedido</h2>
        <ul className="space-y-1 text-sm">
          {cart.map((i) => <li key={i.product_id} className="flex justify-between gap-2"><span className="text-[#8B95A1] line-clamp-1">{i.quantity}x {i.name}</span><span>{brl(i.price * i.quantity)}</span></li>)}
        </ul>
        <hr className="border-[#2A2F36]" />
        <div className="space-y-2 text-sm">
          <Row label="Subtotal" value={brl(quote?.subtotal || 0)} />
          <Row label="Desconto" value={`- ${brl(quote?.discount || 0)}`} />
          <Row label="Frete" value={quote?.shipping ? brl(quote.shipping) : "Grátis"} />
          <Row label="Total" value={brl(quote?.total || 0)} bold />
        </div>
        <div className="flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} data-testid="checkout-coupon" placeholder="CUPOM" aria-label="Cupom de desconto" className="flex-1 h-10 px-3 rounded-lg bg-[#12171e] border border-[#2A2F36] text-sm uppercase" />
        </div>
        {quote?.coupon_error && <p className="text-xs text-[#E53E3E]" data-testid="coupon-error">{quote.coupon_error}</p>}
        <button type="submit" disabled={busy} data-testid="place-order-btn" className="w-full h-12 rounded-lg bt-grad text-white font-semibold disabled:opacity-50 hover:brightness-110 transition-[filter]">
          {busy ? "Processando..." : "Finalizar pedido"}
        </button>
        <p className="text-xs text-[#8B95A1]">Os valores são recalculados no servidor a partir do catálogo antes da cobrança.</p>
      </aside>
    </form>
  );
}
