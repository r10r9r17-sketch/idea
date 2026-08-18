import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, apiError, brl } from "@/lib/api";

const BLANK = {
  name: "", category: "acessorios", price: 0, previous_price: "", short_description: "", description: "",
  image: "", stock: 0, min_stock: 3, sku: "", brand: "", model: "", warranty: "", status: "active",
  product_type: "own_store", affiliate_url: "", affiliate_network: "", supplier: "", is_featured: false, is_offer: false, price_is_demo: false,
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(() => {
    api.get("/admin/products").then((r) => setItems(r.data));
  }, []);
  useEffect(() => { load(); api.get("/categories").then((r) => setCats(r.data.categories)); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...editing,
      price: Number(editing.price),
      previous_price: editing.previous_price ? Number(editing.previous_price) : null,
      stock: Number(editing.stock),
      min_stock: Number(editing.min_stock),
      gallery: editing.gallery?.length ? editing.gallery : editing.image ? [editing.image] : [],
    };
    try {
      if (editing.id) await api.put(`/admin/products/${editing.id}`, payload);
      else await api.post("/admin/products", payload);
      toast.success("Produto salvo.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Produto excluído.");
      setConfirming(null);
      load();
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Produtos</h1>
        <button type="button" onClick={() => setEditing({ ...BLANK })} data-testid="new-product-btn" className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bt-grad text-white text-sm font-semibold">
          <Plus size={15} /> Novo produto
        </button>
      </div>

      <div className="mt-6 bt-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-[#8B95A1] text-xs uppercase tracking-wider">
            <tr><th className="text-left p-3">Produto</th><th className="text-left p-3">Categoria</th><th className="text-left p-3">Preço</th><th className="text-left p-3">Estoque</th><th className="text-left p-3">Tipo</th><th className="p-3">Ações</th></tr>
          </thead>
          <tbody className="divide-y divide-[#2A2F36]">
            {items.map((p) => (
              <tr key={p.id} data-testid={`admin-product-row-${p.slug}`}>
                <td className="p-3 max-w-[260px]"><span className="line-clamp-1">{p.name}</span><span className="block text-xs text-[#8B95A1]">{p.sku}</span></td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">{brl(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-xs">{p.product_type === "affiliate" ? "Afiliado" : "Loja"}</td>
                <td className="p-3">
                  <div className="flex gap-1 justify-end">
                    <button type="button" onClick={() => setEditing({ ...p, previous_price: p.previous_price || "" })} data-testid={`edit-product-${p.slug}`} aria-label="Editar" className="h-8 w-8 grid place-items-center rounded border border-[#2A2F36] hover:border-[#0077FF] transition-colors"><Pencil size={14} /></button>
                    <button type="button" onClick={() => setConfirming(p)} data-testid={`delete-product-${p.slug}`} aria-label="Excluir" className="h-8 w-8 grid place-items-center rounded border border-[#2A2F36] text-[#E53E3E] hover:border-[#E53E3E] transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 overflow-auto bg-black/70">
          <form onSubmit={save} className="bg-[#0D1117] border border-[#2A2F36] rounded-xl p-6 w-full max-w-2xl my-8 grid sm:grid-cols-2 gap-4" data-testid="product-form">
            <h2 className="sm:col-span-2 font-display font-bold text-lg">{editing.id ? "Editar produto" : "Novo produto"}</h2>
            <F label="Nome" v={editing.name} on={(v) => setEditing({ ...editing, name: v })} id="pf-name" required />
            <div>
              <label htmlFor="pf-category" className="text-xs uppercase tracking-wider text-[#8B95A1]">Categoria</label>
              <select id="pf-category" data-testid="pf-category" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm">
                {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <F label="Preço" type="number" v={editing.price} on={(v) => setEditing({ ...editing, price: v })} id="pf-price" required />
            <F label="Preço anterior" type="number" v={editing.previous_price} on={(v) => setEditing({ ...editing, previous_price: v })} id="pf-previous" />
            <F label="Estoque" type="number" v={editing.stock} on={(v) => setEditing({ ...editing, stock: v })} id="pf-stock" />
            <F label="Estoque mínimo" type="number" v={editing.min_stock} on={(v) => setEditing({ ...editing, min_stock: v })} id="pf-minstock" />
            <F label="SKU" v={editing.sku} on={(v) => setEditing({ ...editing, sku: v })} id="pf-sku" />
            <F label="Marca" v={editing.brand} on={(v) => setEditing({ ...editing, brand: v })} id="pf-brand" />
            <F label="Imagem (URL)" v={editing.image} on={(v) => setEditing({ ...editing, image: v, gallery: [v] })} id="pf-image" />
            <F label="Garantia" v={editing.warranty} on={(v) => setEditing({ ...editing, warranty: v })} id="pf-warranty" />
            <div>
              <label htmlFor="pf-type" className="text-xs uppercase tracking-wider text-[#8B95A1]">Tipo</label>
              <select id="pf-type" data-testid="pf-type" value={editing.product_type} onChange={(e) => setEditing({ ...editing, product_type: e.target.value })} className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm">
                <option value="own_store">Loja própria (checkout interno)</option>
                <option value="affiliate">Afiliado (venda no parceiro)</option>
              </select>
            </div>
            <F label="Link de afiliado" v={editing.affiliate_url} on={(v) => setEditing({ ...editing, affiliate_url: v })} id="pf-affiliate" />
            <F label="Rede de afiliados" v={editing.affiliate_network} on={(v) => setEditing({ ...editing, affiliate_network: v })} id="pf-network" />
            <div className="sm:col-span-2">
              <label htmlFor="pf-short" className="text-xs uppercase tracking-wider text-[#8B95A1]">Descrição curta</label>
              <input id="pf-short" data-testid="pf-short" value={editing.short_description} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="pf-desc" className="text-xs uppercase tracking-wider text-[#8B95A1]">Descrição completa</label>
              <textarea id="pf-desc" data-testid="pf-desc" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-2 w-full min-h-24 p-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-4 text-sm">
              {[["is_featured", "Destaque"], ["is_offer", "Oferta"], ["price_is_demo", "Preço demonstrativo"]].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2"><input type="checkbox" data-testid={`pf-${key}`} checked={!!editing[key]} onChange={(e) => setEditing({ ...editing, [key]: e.target.checked })} className="accent-[#0077FF]" /> {label}</label>
              ))}
              <label className="flex items-center gap-2"><input type="checkbox" data-testid="pf-active" checked={editing.status === "active"} onChange={(e) => setEditing({ ...editing, status: e.target.checked ? "active" : "inactive" })} className="accent-[#0077FF]" /> Ativo</label>
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(null)} data-testid="pf-cancel" className="h-11 px-5 rounded-lg border border-[#2A2F36] text-sm">Cancelar</button>
              <button type="submit" data-testid="pf-save" className="h-11 px-6 rounded-lg bt-grad text-white text-sm font-semibold">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4">
          <div className="bg-[#0D1117] border border-[#2A2F36] rounded-xl p-6 max-w-sm" data-testid="delete-confirm">
            <h2 className="font-display font-bold text-lg">Excluir produto?</h2>
            <p className="mt-2 text-sm text-[#8B95A1]">“{confirming.name}” será removido permanentemente.</p>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirming(null)} data-testid="cancel-delete" className="h-10 px-4 rounded-lg border border-[#2A2F36] text-sm">Cancelar</button>
              <button type="button" onClick={() => remove(confirming.id)} data-testid="confirm-delete" className="h-10 px-4 rounded-lg bg-[#E53E3E] text-white text-sm font-semibold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const F = ({ label, v, on, id, type = "text", required }) => (
  <div>
    <label htmlFor={id} className="text-xs uppercase tracking-wider text-[#8B95A1]">{label}</label>
    <input id={id} data-testid={id} type={type} required={required} value={v ?? ""} onChange={(e) => on(e.target.value)} className="mt-2 w-full h-11 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
  </div>
);
