import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, Heart, MessageCircle, ShoppingCart, Star } from "lucide-react";
import { api, apiError, brl, setSeo, waLink } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";

const FAQ = [
  ["Como funciona a compra?", "Você adiciona ao carrinho, informa seus dados no checkout e escolhe a forma de pagamento. Produtos de parceiros são finalizados no site do fornecedor."],
  ["Os produtos possuem garantia?", "A garantia é a informada pelo fornecedor na ficha do produto. Quando não houver essa informação, consulte o SAC da Braza Tech."],
  ["Como falo com o SAC?", "Pelo WhatsApp (67) 99873-7690 ou pelo e-mail therenanlima@gmail.com."],
];

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, favorites, toggleFavorite, user, setCartOpen } = useStore();
  const [product, setProduct] = useState(null);
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState("desc");
  const [form, setForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    setProduct(null);
    api
      .get(`/products/${slug}`)
      .then((r) => {
        setProduct(r.data);
        setActive(0);
        setSeo({ title: `${r.data.name} — BRAZA TECH`, description: r.data.short_description, path: `/produto/${r.data.slug}` });
      })
      .catch(() => toast.error("Produto não encontrado."));
  }, [slug]);

  if (!product)
    return <div className="max-w-[1400px] mx-auto px-4 py-16"><div className="bt-card rounded-xl h-96 animate-pulse" /></div>;

  const isAffiliate = product.product_type === "affiliate";
  const isFav = favorites.includes(product.id);
  const gallery = product.gallery?.length ? product.gallery : [product.image];

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/entrar");
    try {
      await api.post("/reviews", { product_id: product.id, rating: Number(form.rating), comment: form.comment });
      toast.success("Avaliação enviada e aguardando moderação.");
      setForm({ rating: 5, comment: "" });
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail));
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8" data-testid="product-detail-page">
      <nav className="text-xs text-[#8B95A1] mb-6">
        <Link to="/" className="hover:text-[#00C2FF]">Início</Link> / <Link to={`/categoria/${product.category}`} className="hover:text-[#00C2FF]">{product.category}</Link> / <span>{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="bt-card rounded-xl overflow-hidden bg-black aspect-square">
            <img src={gallery[active]} alt={product.name} className="w-full h-full object-cover" data-testid="product-main-image" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {gallery.map((img, i) => (
                <button key={i} type="button" onClick={() => setActive(i)} data-testid={`gallery-thumb-${i}`} aria-label={`Imagem ${i + 1}`} className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border ${i === active ? "border-[#00C2FF]" : "border-[#2A2F36]"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00C2FF]">{product.category}</span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold">{product.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-[#8B95A1]">
            {product.rating ? (
              <><Star size={15} className="fill-[#00C2FF] text-[#00C2FF]" /> {product.rating} · {product.reviews_count} avaliação(ões)</>
            ) : <span>Sem avaliações ainda</span>}
            <span>· SKU {product.sku || "—"}</span>
          </div>

          <div className="mt-6">
            {product.previous_price > product.price && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#8B95A1] line-through">{brl(product.previous_price)}</p>
                <span className="bg-[#E53E3E] text-white text-xs font-bold px-2 py-0.5 rounded">-{product.discount_percent}%</span>
              </div>
            )}
            <p className="text-3xl font-bold font-display" data-testid="product-price">{brl(product.price)}</p>
            {product.price_is_demo && <p className="text-xs text-[#8B95A1] mt-1">Preço demonstrativo — sujeito a atualização pelo administrador.</p>}
            <p className="mt-2 text-sm" data-testid="product-availability">
              {isAffiliate ? <span className="text-[#00C2FF]">Produto vendido pelo parceiro</span>
                : product.stock > 0 ? <span className="text-emerald-400">Disponível ({product.stock} em estoque)</span>
                : <span className="text-[#E53E3E]">Esgotado</span>}
            </p>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {!isAffiliate && (
              <>
                <button type="button" onClick={() => addToCart(product)} disabled={!product.stock} data-testid="detail-add-to-cart" className="h-12 rounded-lg bt-grad text-white font-semibold inline-flex items-center justify-center gap-2 hover:brightness-110 transition-[filter] disabled:opacity-40">
                  <ShoppingCart size={17} /> Adicionar ao carrinho
                </button>
                <button type="button" onClick={() => { addToCart(product); setCartOpen(false); navigate("/checkout"); }} disabled={!product.stock} data-testid="detail-buy-now" className="h-12 rounded-lg border border-[#00C2FF] text-[#00C2FF] font-semibold hover:bg-[#00C2FF]/10 transition-colors disabled:opacity-40">
                  Comprar agora
                </button>
              </>
            )}
            {isAffiliate && (
              <a href={product.affiliate_url || "#"} target="_blank" rel="noopener noreferrer sponsored" data-testid="detail-affiliate-btn" className="h-12 rounded-lg bt-grad text-white font-semibold inline-flex items-center justify-center gap-2 sm:col-span-2 hover:brightness-110 transition-[filter]">
                <ExternalLink size={17} /> Ver produto no fornecedor
              </a>
            )}
            <a href={waLink(`Olá, Braza Tech! Gostaria de saber mais sobre o produto: ${product.name}.`)} target="_blank" rel="noopener noreferrer" data-testid="detail-whatsapp-btn" className="h-12 rounded-lg border border-[#2A2F36] font-semibold inline-flex items-center justify-center gap-2 hover:border-[#00C2FF] transition-colors">
              <MessageCircle size={17} /> Falar sobre este produto
            </a>
            <button type="button" onClick={() => toggleFavorite(product)} data-testid="detail-favorite-btn" className="h-12 rounded-lg border border-[#2A2F36] font-semibold inline-flex items-center justify-center gap-2 hover:border-[#E53E3E] transition-colors">
              <Heart size={17} className={isFav ? "fill-[#E53E3E] text-[#E53E3E]" : ""} /> {isFav ? "Favoritado" : "Favoritar"}
            </button>
          </div>

          {isAffiliate && (
            <p className="mt-4 text-xs text-[#8B95A1]" data-testid="affiliate-disclaimer">
              Você será direcionado ao site do parceiro/fornecedor {product.affiliate_network ? `(${product.affiliate_network})` : ""} para concluir a compra.
              Este link pode gerar uma comissão para a Braza Tech, sem custo adicional para você.
            </p>
          )}

          <div className="mt-8 bt-card rounded-xl p-5">
            <h2 className="font-display font-semibold text-base">Histórico de preço</h2>
            {product.price_history?.length ? (
              <ul className="mt-3 space-y-2 text-sm" data-testid="price-history">
                {product.price_history.map((h, i) => (
                  <li key={i} className="flex justify-between"><span className="text-[#8B95A1]">{h.date}</span><span>{brl(h.price)}</span></li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#8B95A1]" data-testid="no-price-history">Histórico de preço ainda não disponível.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex gap-2 border-b border-[#2A2F36] overflow-x-auto no-scrollbar">
          {[["desc", "Descrição"], ["specs", "Especificações"], ["includes", "O que acompanha"], ["reviews", "Avaliações"], ["faq", "Perguntas frequentes"]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)} data-testid={`tab-${key}`} className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === key ? "border-[#00C2FF] text-[#F2F2F2]" : "border-transparent text-[#8B95A1]"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="py-6 text-sm text-[#8B95A1] max-w-3xl">
          {tab === "desc" && <p>{product.description}</p>}
          {tab === "specs" && (
            <ul className="space-y-2">
              {product.specs.map((s, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-[#2A2F36] pb-2"><span>{s.label}</span><span className="text-[#F2F2F2] text-right">{s.value}</span></li>
              ))}
              <li className="pt-2">Garantia: <span className="text-[#F2F2F2]">{product.warranty}</span></li>
            </ul>
          )}
          {tab === "includes" && <ul className="list-disc pl-5 space-y-1">{product.includes.map((i, k) => <li key={k}>{i}</li>)}</ul>}
          {tab === "reviews" && (
            <div>
              {product.reviews.length === 0 ? (
                <p data-testid="no-reviews">Este produto ainda não possui avaliações aprovadas.</p>
              ) : (
                <ul className="space-y-4">
                  {product.reviews.map((r) => (
                    <li key={r.id} className="bt-card rounded-lg p-4">
                      <div className="flex items-center gap-2 text-[#F2F2F2] text-sm font-medium">
                        {r.customer_name} <span className="text-[#00C2FF]">{"★".repeat(r.rating)}</span>
                        {r.verified_purchase && <span className="text-[10px] uppercase tracking-widest text-emerald-400">Compra verificada</span>}
                      </div>
                      <p className="mt-2">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={submitReview} className="mt-6 bt-card rounded-xl p-5 space-y-3" data-testid="review-form">
                <h3 className="font-display font-semibold text-[#F2F2F2]">Avaliar este produto</h3>
                <label className="block text-xs" htmlFor="review-rating">Nota</label>
                <select id="review-rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} data-testid="review-rating" className="h-10 px-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrela(s)</option>)}
                </select>
                <label className="block text-xs" htmlFor="review-comment">Comentário</label>
                <textarea id="review-comment" required minLength={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} data-testid="review-comment" className="w-full min-h-24 p-3 rounded-lg bg-[#1a1f26] border border-[#2A2F36] text-sm" />
                <button type="submit" data-testid="submit-review" className="h-10 px-5 rounded-lg bt-grad text-white text-sm font-semibold">Enviar avaliação</button>
                <p className="text-xs">Avaliações passam por moderação antes de serem publicadas.</p>
              </form>
            </div>
          )}
          {tab === "faq" && (
            <dl className="space-y-4">{FAQ.map(([q, a]) => <div key={q}><dt className="text-[#F2F2F2] font-medium">{q}</dt><dd className="mt-1">{a}</dd></div>)}</dl>
          )}
        </div>
      </div>

      {product.related?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Produtos relacionados</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {product.related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
