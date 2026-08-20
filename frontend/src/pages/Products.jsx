import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api, setSeo } from "@/lib/api";
import { Grid } from "@/pages/Home";

export default function Products({ mode }) {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], total: 0, brands: [] });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const q = params.get("q") || "";
  const category = slug || params.get("category") || "";
  const brand = params.get("brand") || "";
  const maxPrice = params.get("max_price") || "";
  const minRating = params.get("min_rating") || "";
  const inStock = params.get("in_stock") === "true";
  const sort = params.get("sort") || "relevance";

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "" || value === false || value == null) next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  const load = useCallback(() => {
    setLoading(true);
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (category) search.set("category", category);
    if (brand) search.set("brand", brand);
    if (maxPrice) search.set("max_price", maxPrice);
    if (minRating) search.set("min_rating", minRating);
    if (inStock) search.set("in_stock", "true");
    if (mode === "offers") search.set("on_offer", "true");
    search.set("sort", mode === "offers" && sort === "relevance" ? "discount" : sort);
    search.set("limit", "40");
    api.get(`/products?${search.toString()}`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [q, category, brand, maxPrice, minRating, inStock, sort, mode]);

  useEffect(() => {
    load();
    api.get("/categories").then((r) => setCategories(r.data.categories.filter((c) => c.product_count > 0)));
    const title = mode === "offers" ? "Ofertas — BRAZA TECH" : category ? `${category} — BRAZA TECH` : "Produtos — BRAZA TECH";
    setSeo({ title, description: "Catálogo de tecnologia com curadoria da Braza Tech.", path: window.location.pathname });
  }, [load, mode, category]);

  const heading = mode === "offers" ? "Ofertas" : q ? `Busca: “${q}”` : category ? `Categoria: ${category}` : "Todos os produtos";

  const filters = (
    <div className="space-y-6" data-testid="filters">
      <Field label="Categoria">
        <select value={category} onChange={(e) => update("category", e.target.value)} data-testid="filter-category" className="w-full h-10 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm">
          <option value="">Todas</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Marca">
        <select value={brand} onChange={(e) => update("brand", e.target.value)} data-testid="filter-brand" className="w-full h-10 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm">
          <option value="">Todas</option>
          {data.brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>
      <Field label={`Preço até ${maxPrice ? `R$ ${maxPrice}` : "qualquer valor"}`}>
        <input type="range" min="50" max="8000" step="50" value={maxPrice || 8000} onChange={(e) => update("max_price", e.target.value)} data-testid="filter-price" className="w-full accent-[#0077FF]" />
      </Field>
      <Field label="Avaliação mínima">
        <select value={minRating} onChange={(e) => update("min_rating", e.target.value)} data-testid="filter-rating" className="w-full h-10 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm">
          <option value="">Qualquer</option>
          <option value="4">4 estrelas ou mais</option>
          <option value="3">3 estrelas ou mais</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={inStock} onChange={(e) => update("in_stock", e.target.checked)} data-testid="filter-stock" className="accent-[#0077FF]" />
        Somente disponíveis
      </label>
      <button type="button" onClick={() => setParams(new URLSearchParams())} data-testid="clear-filters" className="text-xs text-[#8B95A1] hover:text-[#00C2FF] transition-colors">
        Limpar filtros
      </button>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8" data-testid="products-page">
      <h1 className="text-3xl sm:text-4xl font-bold">{heading}</h1>
      <p className="mt-2 text-sm text-[#8B95A1]">{data.total} produto(s) encontrado(s)</p>

      <div className="mt-6 flex gap-3 items-center">
        <button type="button" onClick={() => setFiltersOpen(true)} data-testid="open-filters" className="lg:hidden inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-[#2A2F36] text-sm">
          <SlidersHorizontal size={15} /> Filtros
        </button>
        <select value={sort} onChange={(e) => update("sort", e.target.value)} data-testid="sort-select" className="h-10 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm ml-auto">
          <option value="relevance">Relevância</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="discount">Maior desconto</option>
          <option value="newest">Mais recentes</option>
        </select>
      </div>

      <div className="mt-6 grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden lg:block bt-card rounded-xl p-5 h-fit sticky top-24">{filters}</aside>
        <div>
          {!loading && data.items.length === 0 ? (
            <div data-testid="empty-results" className="bt-card rounded-xl p-8">
              <p className="font-display font-semibold">
                {mode === "offers" ? "Nenhuma oferta ativa no momento." : "Não encontramos esse produto."}
              </p>
              <p className="mt-2 text-sm text-[#8B95A1]">
                {mode === "offers"
                  ? "As ofertas aparecem aqui automaticamente quando um produto tiver preço anterior maior que o preço atual. Explore o catálogo enquanto isso:"
                  : "Tente outra palavra-chave ou explore categorias relacionadas:"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.slice(0, 6).map((c) => (
                  <button key={c.slug} type="button" onClick={() => { setParams(new URLSearchParams({ category: c.slug })); }} className="h-9 px-4 rounded-full border border-[#2A2F36] text-xs hover:border-[#00C2FF] transition-colors">
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Grid items={data.items} loading={loading} />
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-label="Filtros">
          <button type="button" aria-label="Fechar filtros" className="absolute inset-0 bg-black/70" onClick={() => setFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#0D1117] border-t border-[#2A2F36] rounded-t-2xl p-5 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold">Filtros</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} data-testid="close-filters" aria-label="Fechar"><X size={18} /></button>
            </div>
            {filters}
            <button type="button" onClick={() => setFiltersOpen(false)} className="mt-6 w-full h-11 rounded-lg bt-grad text-white font-semibold">Aplicar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ label, children }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#8B95A1] mb-2">{label}</p>
    {children}
  </div>
);
