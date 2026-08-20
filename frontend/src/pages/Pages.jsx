import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { Mail, MessageCircle } from "lucide-react";
import { api, apiError, brl, setSeo, SUPPORT_EMAIL, WHATSAPP_DISPLAY, waLink } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

const Wrap = ({ children, testid }) => (
  <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-10" data-testid={testid}>{children}</div>
);

export function Categories() {
  const [cats, setCats] = useState([]);
  useEffect(() => {
    setSeo({ title: "Categorias — BRAZA TECH", description: "Navegue pelas categorias de tecnologia da Braza Tech.", path: "/categorias" });
    api.get("/categories").then((r) => setCats(r.data.categories.filter((c) => c.product_count > 0)));
  }, []);
  return (
    <Wrap testid="categories-page">
      <h1 className="text-3xl sm:text-4xl font-bold">Categorias</h1>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cats.map((c, i) => {
          const Icon = Icons[c.icon] || Icons.Cpu;
          return (
            <Link key={c.slug} to={`/categoria/${c.slug}`} data-testid={`cat-card-${c.slug}`} className="bt-card rounded-xl p-5 bt-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
              <Icon size={22} className="text-[#00C2FF]" />
              <p className="mt-3 font-display font-semibold">{c.name}</p>
              <p className="text-xs text-[#8B95A1]">{c.product_count} produto(s)</p>
            </Link>
          );
        })}
      </div>
    </Wrap>
  );
}

export function About() {
  useEffect(() => setSeo({ title: "Sobre a Braza Tech", description: "A Braza Tech nasceu para tornar a tecnologia mais simples de escolher.", path: "/sobre" }), []);
  return (
    <Wrap testid="about-page">
      <h1 className="text-3xl sm:text-4xl font-bold">Sobre a Braza Tech</h1>
      <p className="mt-6 text-base text-[#8B95A1]">
        A Braza Tech nasceu para tornar a tecnologia mais simples de escolher. Em vez de simplesmente apresentar produtos,
        buscamos reunir informações úteis, opções interessantes e atendimento próximo para ajudar você a tomar decisões melhores.
      </p>
      <p className="mt-6 text-lg font-display bt-grad-text font-semibold">Tecnologia que conecta. Confiança que entrega.</p>
      <div className="mt-10 grid sm:grid-cols-3 gap-4">
        {[["Curadoria", "Selecionamos com critério e explicamos o porquê."], ["Transparência", "Quando um dado não é informado pelo fornecedor, dizemos claramente."], ["Proximidade", "Atendimento humano por WhatsApp e e-mail."]].map(([t, d]) => (
          <div key={t} className="bt-card rounded-xl p-6"><h2 className="font-display font-semibold">{t}</h2><p className="mt-2 text-sm text-[#8B95A1]">{d}</p></div>
        ))}
      </div>
    </Wrap>
  );
}

export function Faq() {
  const items = [
    ["Como funciona a compra?", "Escolha o produto, adicione ao carrinho e finalize no checkout. Produtos de parceiros são concluídos no site do fornecedor."],
    ["Como funciona o pagamento?", "O pagamento é processado pelo Mercado Pago. A Braza Tech não armazena dados de cartão."],
    ["Quais formas de pagamento?", "PIX e cartão de crédito via Mercado Pago."],
    ["Como acompanho meu pedido?", "Na página do pedido, com o número recebido no checkout, ou pelo WhatsApp do SAC."],
    ["Como falar com o SAC?", `WhatsApp ${WHATSAPP_DISPLAY} ou e-mail ${SUPPORT_EMAIL}.`],
    ["Os produtos possuem garantia?", "A garantia é a informada pelo fornecedor na ficha do produto. Consulte o SAC da Braza Tech para obter informações atualizadas."],
    ["Como funciona o link de afiliado?", "Alguns produtos são indicações: você é direcionado ao parceiro para concluir a compra. O link pode gerar comissão para a Braza Tech, sem custo adicional para você."],
    ["Como funciona o frete?", "O frete é calculado no checkout a partir do CEP. Consulte o SAC da Braza Tech para obter informações atualizadas."],
  ];
  const [open, setOpen] = useState(null);
  useEffect(() => setSeo({ title: "FAQ — BRAZA TECH", description: "Perguntas frequentes da Braza Tech.", path: "/faq" }), []);
  return (
    <Wrap testid="faq-page">
      <h1 className="text-3xl sm:text-4xl font-bold">Perguntas frequentes</h1>
      <div className="mt-8 divide-y divide-[#2A2F36] border-y border-[#2A2F36]">
        {items.map(([q, a], i) => (
          <div key={q}>
            <button type="button" onClick={() => setOpen(open === i ? null : i)} data-testid={`faq-item-${i}`} aria-expanded={open === i} className="w-full text-left py-4 flex justify-between gap-4 font-medium">
              {q} <span className="text-[#00C2FF]">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="pb-4 text-sm text-[#8B95A1]">{a}</p>}
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function Sac() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  useEffect(() => setSeo({ title: "Central de Atendimento — BRAZA TECH", description: "Precisa de ajuda? Estamos aqui para ajudar.", path: "/sac" }), []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/support", form);
      toast.success(data.message);
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  return (
    <Wrap testid="sac-page">
      <h1 className="text-3xl sm:text-4xl font-bold">Central de Atendimento</h1>
      <p className="mt-3 text-base text-[#8B95A1]">Precisa de ajuda? Estamos aqui para ajudar.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={waLink("Olá, Braza Tech! Preciso de ajuda com um produto.")} target="_blank" rel="noopener noreferrer" data-testid="sac-whatsapp" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bt-grad text-white font-semibold">
          <MessageCircle size={17} /> Falar no WhatsApp
        </a>
        <a href={`mailto:${SUPPORT_EMAIL}`} data-testid="sac-email" className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-[#2A2F36] font-semibold hover:border-[#00C2FF] transition-colors">
          <Mail size={17} /> Enviar e-mail
        </a>
      </div>
      <p className="mt-4 text-sm text-[#8B95A1]">WhatsApp: {WHATSAPP_DISPLAY} · E-mail: {SUPPORT_EMAIL}</p>

      <form onSubmit={submit} className="mt-10 bt-card rounded-xl p-6 grid sm:grid-cols-2 gap-4" data-testid="sac-form">
        <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="sac-name" required />
        <Input label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} testid="sac-email-input" required />
        <Input label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} testid="sac-phone" />
        <Input label="Assunto" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} testid="sac-subject" required />
        <div className="sm:col-span-2">
          <label htmlFor="sac-message" className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B95A1]">Mensagem</label>
          <textarea id="sac-message" required minLength={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="sac-message" className="mt-2 w-full min-h-32 p-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
        </div>
        <button type="submit" data-testid="sac-submit" className="h-11 px-6 rounded-lg bt-grad text-white font-semibold sm:col-span-2 justify-self-start">Enviar mensagem</button>
        {sent && <p className="sm:col-span-2 text-sm text-emerald-400" data-testid="sac-success">Mensagem registrada. Responderemos pelo e-mail informado.</p>}
      </form>
    </Wrap>
  );
}

export const Input = ({ label, value, onChange, type = "text", testid, required, placeholder }) => (
  <div>
    <label htmlFor={testid} className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B95A1]">{label}</label>
    <input id={testid} data-testid={testid} type={type} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm focus:border-[#0077FF] transition-colors" />
  </div>
);

export function Favorites() {
  const { favorites } = useStore();
  const [items, setItems] = useState([]);
  useEffect(() => {
    setSeo({ title: "Favoritos — BRAZA TECH", description: "Seus produtos favoritos.", path: "/favoritos" });
    if (!favorites.length) return setItems([]);
    api.get("/products?limit=60").then((r) => setItems(r.data.items.filter((p) => favorites.includes(p.id))));
  }, [favorites]);
  return (
    <Wrap testid="favorites-page">
      <h1 className="text-3xl sm:text-4xl font-bold">Favoritos</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-[#8B95A1]" data-testid="empty-favorites">Você ainda não favoritou nenhum produto.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
      )}
    </Wrap>
  );
}

export function Account() {
  const { user, logout } = useStore();
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    setSeo({ title: "Minha conta — BRAZA TECH", description: "Seus pedidos e dados.", path: "/conta" });
    if (!user) return;
    api.get("/orders/mine").then((r) => setOrders(r.data)).catch(() => {});
  }, [user]);
  if (!user) { navigate("/entrar"); return null; }
  return (
    <Wrap testid="account-page">
      <h1 className="text-3xl sm:text-4xl font-bold">Olá, {user.name.split(" ")[0]}</h1>
      <p className="mt-2 text-sm text-[#8B95A1]">{user.email}</p>
      <button type="button" onClick={logout} data-testid="account-logout" className="mt-4 h-10 px-5 rounded-lg border border-[#2A2F36] text-sm hover:border-[#E53E3E] transition-colors">Sair da conta</button>
      <h2 className="mt-10 text-2xl font-semibold">Meus pedidos</h2>
      {orders.length === 0 ? <p className="mt-3 text-sm text-[#8B95A1]" data-testid="no-orders">Você ainda não possui pedidos.</p> : (
        <ul className="mt-4 space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="bt-card rounded-xl p-4 flex justify-between items-center gap-4">
              <div><p className="font-medium">Pedido {o.number}</p><p className="text-xs text-[#8B95A1]">{o.created_at?.slice(0, 10)} · {o.status}</p></div>
              <Link to={`/pedido/${o.number}`} className="text-sm text-[#00C2FF] hover:underline">Detalhes</Link>
            </li>
          ))}
        </ul>
      )}
    </Wrap>
  );
}

export function OrderDetail() {
  const { number } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => {
    setSeo({ title: `Pedido ${number} — BRAZA TECH`, description: "Acompanhe seu pedido.", path: `/pedido/${number}` });
    api.get(`/orders/${number}`).then((r) => setOrder(r.data)).catch(() => toast.error("Pedido não encontrado."));
  }, [number]);
  if (!order) return <Wrap testid="order-loading"><div className="bt-card rounded-xl h-64 animate-pulse" /></Wrap>;
  return (
    <Wrap testid="order-detail-page">
      <h1 className="text-3xl font-bold">Pedido {order.number}</h1>
      <p className="mt-2 text-sm text-[#8B95A1]">Status atual (confirmado pelo servidor): <span className="text-[#00C2FF]" data-testid="order-status">{order.status}</span></p>
      <p className="mt-1 text-xs text-[#8B95A1]">O pagamento só é considerado aprovado após confirmação do provedor via webhook.</p>
      <div className="mt-6 bt-card rounded-xl p-5 space-y-2 text-sm">
        {order.items.map((i) => (
          <div key={i.product_id} className="flex justify-between"><span>{i.quantity}x {i.name}</span><span>{brl(i.line_total)}</span></div>
        ))}
        <hr className="border-[#2A2F36]" />
        <Row label="Subtotal" value={brl(order.subtotal)} />
        <Row label="Desconto" value={`- ${brl(order.discount)}`} />
        <Row label="Frete" value={brl(order.shipping)} />
        <Row label="Total" value={brl(order.total)} bold />
      </div>
      <a href={waLink(`Olá! Gostaria de obter informações sobre meu pedido ${order.number}.`)} target="_blank" rel="noopener noreferrer" data-testid="order-whatsapp" className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-full bt-grad text-white font-semibold">
        <MessageCircle size={17} /> Falar sobre meu pedido
      </a>
    </Wrap>
  );
}

export const Row = ({ label, value, bold }) => (
  <div className="flex justify-between"><span className="text-[#8B95A1]">{label}</span><span className={bold ? "font-bold text-base" : ""}>{value}</span></div>
);

export function Legal({ kind }) {
  useEffect(() => setSeo({ title: `${kind === "terms" ? "Termos" : "Privacidade"} — BRAZA TECH`, description: "Políticas da Braza Tech.", path: window.location.pathname }), [kind]);
  return (
    <Wrap testid={`legal-${kind}`}>
      <h1 className="text-3xl font-bold">{kind === "terms" ? "Termos de uso" : "Política de privacidade"}</h1>
      <p className="mt-6 text-sm text-[#8B95A1]">
        Esta política ainda não foi definida em sua versão final. Consulte o SAC da Braza Tech para obter informações atualizadas.
      </p>
      <Link to="/sac" className="mt-6 inline-block text-sm text-[#00C2FF] hover:underline">Ir para a Central de Atendimento</Link>
    </Wrap>
  );
}

export function NotFound() {
  return (
    <Wrap testid="not-found-page">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="mt-3 text-sm text-[#8B95A1]">O endereço acessado não existe ou foi movido.</p>
      <Link to="/" className="mt-6 inline-block h-11 px-6 leading-[44px] rounded-lg bt-grad text-white font-semibold">Voltar para o início</Link>
    </Wrap>
  );
}
