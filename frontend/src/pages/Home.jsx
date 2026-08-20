import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ArrowRight, MessageCircle, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { api, setSeo, waLink } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

const TRUST = [
  { icon: Sparkles, title: "Curadoria", text: "Selecionamos produtos com atenção ao que realmente importa." },
  { icon: PackageCheck, title: "Informação clara", text: "Quando o fornecedor não informa um dado, dizemos isso abertamente." },
  { icon: MessageCircle, title: "Atendimento próximo", text: "Fale com uma pessoa de verdade pelo WhatsApp." },
  { icon: ShieldCheck, title: "Compra segura", text: "Pagamentos processados por provedor autorizado, sem dados de cartão na loja." },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banner, setBanner] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSeo({
      title: "BRAZA TECH — Tecnologia que conecta. Confiança que entrega.",
      description: "Loja brasileira de tecnologia com curadoria de produtos, informações claras e atendimento próximo.",
      path: "/",
    });
    Promise.all([
      api.get("/products?featured=true&limit=8"),
      api.get("/products?on_offer=true&limit=4&sort=discount"),
      api.get("/categories"),
      api.get("/banners"),
      api.get("/testimonials"),
    ])
      .then(([f, o, c, b, t]) => {
        setFeatured(f.data.items);
        setOffers(o.data.items);
        setCategories(c.data.categories.filter((cat) => cat.product_count > 0));
        setBanner(b.data[0] || null);
        setTestimonials(t.data);
        if (f.data.items.length === 0) {
          api.get("/products?sort=newest&limit=8").then((r) => setFeatured(r.data.items));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div data-testid="home-page">
      <section className="relative overflow-hidden border-b border-[#2A2F36]">
        <div className="absolute inset-0">
          <img src={banner?.image} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D1117] via-[#0D1117]/85 to-transparent" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 py-16 sm:py-24 lg:py-32">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#00C2FF] bt-fade-up">Tecnologia que conecta. Confiança que entrega.</p>
          <h1 className="mt-4 max-w-2xl text-4xl sm:text-5xl lg:text-6xl font-bold bt-fade-up" style={{ animationDelay: "80ms" }}>
            Tecnologia para quem <span className="bt-grad-text">escolhe melhor.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-[#8B95A1] bt-fade-up" style={{ animationDelay: "160ms" }}>
            Produtos selecionados, informações claras e atendimento próximo para você comprar com mais confiança.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 bt-fade-up" style={{ animationDelay: "240ms" }}>
            <Link to="/produtos" data-testid="hero-explore-btn" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bt-grad text-white font-semibold hover:brightness-110 transition-[filter]">
              Explorar produtos <ArrowRight size={17} />
            </Link>
            <Link to="/ofertas" data-testid="hero-offers-btn" className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-[#2A2F36] font-semibold hover:border-[#00C2FF] hover:text-[#00C2FF] transition-colors">
              Ver ofertas
            </Link>
          </div>
        </div>
      </section>

      <Section title="Categorias" subtitle="Navegue pelo catálogo" link="/categorias">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat, i) => {
            const Icon = Icons[cat.icon] || Icons.Cpu;
            return (
              <Link key={cat.slug} to={`/categoria/${cat.slug}`} data-testid={`category-${cat.slug}`} className="bt-card rounded-xl p-4 flex flex-col gap-2 bt-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                <Icon size={22} className="text-[#00C2FF]" />
                <span className="font-display font-semibold text-sm">{cat.name}</span>
                <span className="text-xs text-[#8B95A1]">{cat.product_count} produto(s)</span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section title="Destaques" subtitle="Selecionados pela nossa curadoria" link="/produtos">
        <Grid loading={loading} items={featured} />
      </Section>

      {offers.length > 0 && (
        <Section title="Ofertas do momento" subtitle="Descontos calculados sobre o preço anterior real" link="/ofertas">
          <Grid loading={loading} items={offers} />
        </Section>
      )}

      <Section title="Por que comprar com a Braza Tech?" subtitle="Mais do que vender tecnologia, queremos ajudar você a escolher melhor.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="bt-card rounded-xl p-6 bt-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <Icon size={22} className="text-[#00C2FF]" />
              <h3 className="mt-3 font-display font-semibold text-base">{title}</h3>
              <p className="mt-2 text-sm text-[#8B95A1]">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="O que nossos clientes dizem" subtitle="Somente depoimentos reais publicados pela equipe.">
        {testimonials.length === 0 ? (
          <p data-testid="no-testimonials" className="bt-card rounded-xl p-6 text-sm text-[#8B95A1]">
            Ainda não há depoimentos publicados. Assim que recebermos avaliações reais de clientes, elas aparecerão aqui.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <figure key={t.id} className="bt-card rounded-xl p-6">
                <blockquote className="text-sm text-[#F2F2F2]">“{t.text}”</blockquote>
                <figcaption className="mt-3 text-xs text-[#8B95A1]">{t.name}{t.city ? ` — ${t.city}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </Section>

      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 pb-6">
        <div className="rounded-2xl border border-[#2A2F36] bg-[#12171e] p-8 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Precisa de ajuda para escolher?</h2>
            <p className="mt-2 text-sm text-[#8B95A1]">Fale com nosso time no WhatsApp e receba uma indicação sob medida.</p>
          </div>
          <a href={waLink("Olá, Braza Tech! Preciso de ajuda com um produto.")} target="_blank" rel="noopener noreferrer" data-testid="home-whatsapp-btn" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bt-grad text-white font-semibold hover:brightness-110 transition-[filter]">
            <MessageCircle size={17} /> Falar no WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}

export const Section = ({ title, subtitle, link, children }) => (
  <section className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12">
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#8B95A1]">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link} className="text-sm text-[#00C2FF] hover:underline shrink-0">Ver todos</Link>
      )}
    </div>
    {children}
  </section>
);

export const Grid = ({ items, loading }) => {
  if (loading)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bt-card rounded-xl h-72 animate-pulse" />
        ))}
      </div>
    );
  if (!items.length) return <p className="text-sm text-[#8B95A1]">Nenhum produto encontrado.</p>;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="product-grid">
      {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
};
