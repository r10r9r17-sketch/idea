import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api, apiError, brl } from "@/lib/api";

const STATUSES = ["pending", "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];
const LABELS = { pending: "Pendente", pending_payment: "Pagamento pendente", paid: "Pago", processing: "Processando", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado", refunded: "Reembolsado" };

const Shell = ({ title, subtitle, children, action, testid }) => (
  <div data-testid={testid}>
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#8B95A1]">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="mt-6">{children}</div>
  </div>
);

const Table = ({ head, children }) => (
  <div className="bt-card rounded-xl overflow-x-auto">
    <table className="w-full text-sm min-w-[640px]">
      <thead className="text-[#8B95A1] text-xs uppercase tracking-wider">
        <tr>{head.map((h) => <th key={h} className="text-left p-3">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-[#2A2F36]">{children}</tbody>
    </table>
  </div>
);

const Empty = ({ text }) => <p className="bt-card rounded-xl p-6 text-sm text-[#8B95A1]">{text}</p>;

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const load = useCallback(() => api.get("/admin/orders").then((r) => setOrders(r.data)), []);
  useEffect(() => { load(); }, [load]);
  const change = async (id, status) => {
    try { await api.put(`/admin/orders/${id}`, { status }); toast.success("Status atualizado."); load(); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  return (
    <Shell title="Pedidos" subtitle="O status pago também baixa o estoque automaticamente." testid="admin-orders">
      {orders.length === 0 ? <Empty text="Nenhum pedido registrado ainda." /> : (
        <Table head={["Número", "Cliente", "Total", "Pagamento", "Status", "Data"]}>
          {orders.map((o) => (
            <tr key={o.id} data-testid={`order-row-${o.number}`}>
              <td className="p-3">{o.number}</td>
              <td className="p-3">{o.customer?.name}</td>
              <td className="p-3">{brl(o.total)}</td>
              <td className="p-3 text-xs uppercase">{o.payment_method}</td>
              <td className="p-3">
                <select value={o.status} onChange={(e) => change(o.id, e.target.value)} data-testid={`order-status-${o.number}`} className="h-9 px-2 rounded bg-[#1a1f26] border border-[#2A2F36] text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
                </select>
              </td>
              <td className="p-3 text-xs">{o.created_at?.slice(0, 10)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Shell>
  );
}

export function AdminCustomers() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/admin/customers").then((r) => setRows(r.data)); }, []);
  return (
    <Shell title="Clientes" testid="admin-customers">
      {rows.length === 0 ? <Empty text="Nenhum cliente cadastrado." /> : (
        <Table head={["Nome", "E-mail", "Telefone", "Cadastro", "Pedidos", "Total comprado"]}>
          {rows.map((c) => (
            <tr key={c.id} data-testid={`customer-row-${c.email}`}>
              <td className="p-3">{c.name}</td><td className="p-3">{c.email}</td><td className="p-3">{c.phone || "—"}</td>
              <td className="p-3 text-xs">{c.created_at?.slice(0, 10)}</td><td className="p-3">{c.orders_count}</td><td className="p-3">{brl(c.total_spent)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Shell>
  );
}

export function AdminInventory() {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => api.get("/admin/inventory").then((r) => setRows(r.data)), []);
  useEffect(() => { load(); }, [load]);
  const save = async (row, stock, min_stock) => {
    try { await api.put(`/admin/products/${row.id}/stock`, { stock: Number(stock), min_stock: Number(min_stock) }); toast.success("Estoque atualizado."); load(); }
    catch (e) { toast.error(apiError(e.response?.data?.detail)); }
  };
  return (
    <Shell title="Estoque" subtitle="Estoque nunca fica negativo." testid="admin-inventory">
      <Table head={["Produto", "SKU", "Estoque", "Mínimo", "Status", ""]}>
        {rows.map((r) => (
          <tr key={r.id} data-testid={`inventory-row-${r.sku || r.id}`}>
            <td className="p-3 max-w-[240px]"><span className="line-clamp-1">{r.name}</span></td>
            <td className="p-3 text-xs">{r.sku || "—"}</td>
            <td className="p-3"><input type="number" min="0" defaultValue={r.stock} data-testid={`stock-input-${r.id}`} onChange={(e) => (r._stock = e.target.value)} className="w-20 h-9 px-2 rounded bg-[#1a1f26] border border-[#2A2F36] text-sm" aria-label="Estoque" /></td>
            <td className="p-3"><input type="number" min="0" defaultValue={r.min_stock} onChange={(e) => (r._min = e.target.value)} className="w-20 h-9 px-2 rounded bg-[#1a1f26] border border-[#2A2F36] text-sm" aria-label="Estoque mínimo" /></td>
            <td className="p-3 text-xs">{r.stock_status}</td>
            <td className="p-3"><button type="button" onClick={() => save(r, r._stock ?? r.stock, r._min ?? r.min_stock)} data-testid={`save-stock-${r.id}`} className="h-9 px-3 rounded bg-[#0077FF] text-white text-xs font-semibold">Salvar</button></td>
          </tr>
        ))}
      </Table>
    </Shell>
  );
}

export function AdminReviews() {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => api.get("/admin/reviews").then((r) => setRows(r.data)), []);
  useEffect(() => { load(); }, [load]);
  const act = async (id, status) => { await api.put(`/admin/reviews/${id}`, { status }); toast.success("Avaliação atualizada."); load(); };
  const del = async (id) => { await api.delete(`/admin/reviews/${id}`); toast.success("Avaliação excluída."); load(); };
  return (
    <Shell title="Avaliações" subtitle="Somente avaliações aprovadas aparecem na loja." testid="admin-reviews">
      {rows.length === 0 ? <Empty text="Nenhuma avaliação recebida ainda." /> : (
        <Table head={["Produto", "Cliente", "Nota", "Comentário", "Status", "Ações"]}>
          {rows.map((r) => (
            <tr key={r.id} data-testid={`review-row-${r.id}`}>
              <td className="p-3 max-w-[180px]"><span className="line-clamp-1">{r.product_name}</span></td>
              <td className="p-3">{r.customer_name}</td><td className="p-3">{r.rating}</td>
              <td className="p-3 max-w-[240px]"><span className="line-clamp-2 text-[#8B95A1]">{r.comment}</span></td>
              <td className="p-3 text-xs">{r.status}</td>
              <td className="p-3">
                <div className="flex gap-1">
                  <button type="button" onClick={() => act(r.id, "approved")} data-testid={`approve-review-${r.id}`} className="h-8 px-3 rounded bg-emerald-600 text-white text-xs">Aprovar</button>
                  <button type="button" onClick={() => act(r.id, "rejected")} data-testid={`reject-review-${r.id}`} className="h-8 px-3 rounded border border-[#2A2F36] text-xs">Rejeitar</button>
                  <button type="button" onClick={() => del(r.id)} aria-label="Excluir" className="h-8 w-8 grid place-items-center rounded text-[#E53E3E]"><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Shell>
  );
}

export function AdminSupport() {
  const [rows, setRows] = useState([]);
  const load = useCallback(() => api.get("/admin/support").then((r) => setRows(r.data)), []);
  useEffect(() => { load(); }, [load]);
  return (
    <Shell title="Atendimento" testid="admin-support">
      {rows.length === 0 ? <Empty text="Nenhuma mensagem recebida ainda." /> : (
        <Table head={["Data", "Nome", "Contato", "Assunto", "Mensagem", "Status"]}>
          {rows.map((m) => (
            <tr key={m.id} data-testid={`support-row-${m.id}`}>
              <td className="p-3 text-xs">{m.created_at?.slice(0, 10)}</td><td className="p-3">{m.name}</td>
              <td className="p-3 text-xs">{m.email}<br />{m.phone}</td><td className="p-3">{m.subject}</td>
              <td className="p-3 max-w-[240px]"><span className="line-clamp-2 text-[#8B95A1]">{m.message}</span></td>
              <td className="p-3">
                <select value={m.status} onChange={async (e) => { await api.put(`/admin/support/${m.id}`, { status: e.target.value }); load(); }} data-testid={`support-status-${m.id}`} className="h-9 px-2 rounded bg-[#1a1f26] border border-[#2A2F36] text-xs">
                  <option value="open">Aberto</option><option value="answered">Respondido</option><option value="closed">Fechado</option>
                </select>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Shell>
  );
}

function CrudPage({ title, subtitle, resource, fields, columns, testid }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const load = useCallback(() => api.get(`/admin/${resource}`).then((r) => setRows(r.data)), [resource]);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (form.id) await api.put(`/admin/${resource}/${form.id}`, form);
      else await api.post(`/admin/${resource}`, form);
      toast.success("Registro salvo.");
      setForm(null);
      load();
    } catch (err) { toast.error(apiError(err.response?.data?.detail)); }
  };
  const del = async (id) => {
    try { await api.delete(`/admin/${resource}/${id}`); toast.success("Registro excluído."); load(); }
    catch (err) { toast.error(apiError(err.response?.data?.detail)); }
  };

  const blank = fields.reduce((acc, f) => ({ ...acc, [f.key]: f.type === "checkbox" ? true : "" }), {});

  return (
    <Shell title={title} subtitle={subtitle} testid={testid}
      action={<button type="button" onClick={() => setForm({ ...blank })} data-testid={`new-${resource}-btn`} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bt-grad text-white text-sm font-semibold"><Plus size={15} /> Novo</button>}>
      {rows.length === 0 ? <Empty text="Nenhum registro cadastrado." /> : (
        <Table head={[...columns.map((c) => c.label), "Ações"]}>
          {rows.map((row) => (
            <tr key={row.id} data-testid={`${resource}-row-${row.id}`}>
              {columns.map((c) => <td key={c.key} className="p-3 max-w-[220px]"><span className="line-clamp-2">{String(row[c.key] ?? "—")}</span></td>)}
              <td className="p-3">
                <div className="flex gap-1 justify-end">
                  <button type="button" onClick={() => setForm(row)} data-testid={`edit-${resource}-${row.id}`} className="h-8 px-3 rounded border border-[#2A2F36] text-xs">Editar</button>
                  <button type="button" onClick={() => del(row.id)} data-testid={`delete-${resource}-${row.id}`} aria-label="Excluir" className="h-8 w-8 grid place-items-center rounded text-[#E53E3E]"><Trash2 size={13} /></button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {form && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 overflow-auto">
          <form onSubmit={save} className="bg-[#0D1117] border border-[#2A2F36] rounded-xl p-6 w-full max-w-lg grid gap-4" data-testid={`${resource}-form`}>
            <h2 className="font-display font-bold text-lg">{form.id ? "Editar" : "Novo"} — {title}</h2>
            {fields.map((f) => (
              <div key={f.key}>
                <label htmlFor={`f-${f.key}`} className="text-xs uppercase tracking-wider text-[#8B95A1]">{f.label}</label>
                {f.type === "checkbox" ? (
                  <input id={`f-${f.key}`} data-testid={`f-${f.key}`} type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} className="mt-2 block accent-[#0077FF]" />
                ) : f.type === "select" ? (
                  <select id={`f-${f.key}`} data-testid={`f-${f.key}`} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm">
                    {f.options.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea id={`f-${f.key}`} data-testid={`f-${f.key}`} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="mt-2 w-full min-h-24 p-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
                ) : (
                  <input id={`f-${f.key}`} data-testid={`f-${f.key}`} type={f.type || "text"} value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
                )}
              </div>
            ))}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setForm(null)} data-testid={`${resource}-cancel`} className="h-11 px-5 rounded-lg border border-[#2A2F36] text-sm">Cancelar</button>
              <button type="submit" data-testid={`${resource}-save`} className="h-11 px-6 rounded-lg bt-grad text-white text-sm font-semibold">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}

export const AdminCoupons = () => (
  <CrudPage title="Cupons" subtitle="Não deixe cupons de teste ativos em produção." resource="coupons" testid="admin-coupons"
    columns={[{ key: "code", label: "Código" }, { key: "type", label: "Tipo" }, { key: "value", label: "Valor" }, { key: "min_value", label: "Mínimo" }, { key: "used_count", label: "Usos" }, { key: "active", label: "Ativo" }]}
    fields={[
      { key: "code", label: "Código" },
      { key: "type", label: "Tipo", type: "select", options: [["percent", "Percentual"], ["fixed", "Valor fixo"]] },
      { key: "value", label: "Valor", type: "number" },
      { key: "min_value", label: "Valor mínimo do pedido", type: "number" },
      { key: "usage_limit", label: "Limite de utilização (0 = ilimitado)", type: "number" },
      { key: "valid_until", label: "Validade (AAAA-MM-DD)" },
      { key: "active", label: "Ativo", type: "checkbox" },
    ]} />
);

export const AdminCategories = () => (
  <CrudPage title="Categorias" resource="categories" testid="admin-categories"
    columns={[{ key: "name", label: "Nome" }, { key: "slug", label: "Slug" }, { key: "icon", label: "Ícone" }, { key: "order", label: "Ordem" }]}
    fields={[{ key: "name", label: "Nome" }, { key: "icon", label: "Ícone (lucide)" }, { key: "order", label: "Ordem", type: "number" }]} />
);

export const AdminBanners = () => (
  <CrudPage title="Banners" resource="banners" testid="admin-banners"
    columns={[{ key: "title", label: "Título" }, { key: "subtitle", label: "Subtítulo" }, { key: "link", label: "Link" }, { key: "active", label: "Ativo" }]}
    fields={[{ key: "title", label: "Título" }, { key: "subtitle", label: "Subtítulo" }, { key: "image", label: "Imagem (URL)" }, { key: "link", label: "Link" }, { key: "order", label: "Ordem", type: "number" }, { key: "active", label: "Ativo", type: "checkbox" }]} />
);

export const AdminTestimonials = () => (
  <CrudPage title="Depoimentos" subtitle="Publique apenas depoimentos reais de clientes." resource="testimonials" testid="admin-testimonials"
    columns={[{ key: "name", label: "Nome" }, { key: "city", label: "Cidade" }, { key: "rating", label: "Nota" }, { key: "active", label: "Ativo" }]}
    fields={[{ key: "name", label: "Nome" }, { key: "city", label: "Cidade" }, { key: "text", label: "Depoimento", type: "textarea" }, { key: "rating", label: "Nota", type: "number" }, { key: "photo", label: "Foto (URL, opcional)" }, { key: "active", label: "Ativo", type: "checkbox" }]} />
);

export function AdminSettings() {
  const [form, setForm] = useState(null);
  useEffect(() => { api.get("/settings").then((r) => setForm(r.data)); }, []);
  if (!form) return <div className="bt-card rounded-xl h-48 animate-pulse" />;
  const save = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/admin/settings", { ...form, shipping_flat: Number(form.shipping_flat), free_shipping_min: Number(form.free_shipping_min) });
      setForm(data);
      toast.success("Configurações salvas.");
    } catch (err) { toast.error(apiError(err.response?.data?.detail)); }
  };
  const fields = [
    ["store_name", "Nome da loja"], ["slogan", "Slogan"], ["whatsapp", "WhatsApp (somente números)"], ["whatsapp_display", "WhatsApp (exibição)"],
    ["email", "E-mail de atendimento"], ["instagram", "Instagram"], ["facebook", "Facebook"], ["youtube", "YouTube"],
    ["shipping_flat", "Frete padrão (R$)"], ["free_shipping_min", "Frete grátis a partir de (R$)"],
    ["seo_title", "SEO title"], ["seo_description", "SEO description"], ["policies", "Políticas"], ["affiliate_disclaimer", "Aviso de afiliado"],
  ];
  return (
    <Shell title="Configurações" testid="admin-settings">
      <form onSubmit={save} className="bt-card rounded-xl p-6 grid sm:grid-cols-2 gap-4">
        {fields.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`s-${key}`} className="text-xs uppercase tracking-wider text-[#8B95A1]">{label}</label>
            <input id={`s-${key}`} data-testid={`setting-${key}`} value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
          </div>
        ))}
        <button type="submit" data-testid="save-settings" className="h-11 px-6 rounded-lg bt-grad text-white text-sm font-semibold sm:col-span-2 justify-self-start">Salvar configurações</button>
      </form>
    </Shell>
  );
}
