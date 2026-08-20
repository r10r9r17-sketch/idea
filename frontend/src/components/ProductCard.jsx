import { Link } from "react-router-dom";
import { Heart, ExternalLink, ShoppingCart, Star } from "lucide-react";
import { brl, hasRange, priceLabel, priceNote } from "@/lib/api";
import { ProductImage } from "@/components/ProductImage";
import { useStore } from "@/context/StoreContext";

export const ProductCard = ({ product, index = 0 }) => {
  const { addToCart, favorites, toggleFavorite } = useStore();
  const isFav = favorites.includes(product.id);
  const isAffiliate = product.product_type === "affiliate";

  return (
    <article
      data-testid={`product-card-${product.slug}`}
      className="bt-card rounded-xl overflow-hidden flex flex-col bt-fade-up"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="relative bg-black aspect-[4/3] overflow-hidden">
        <Link to={`/produto/${product.slug}`} aria-label={product.name}>
          <ProductImage src={product.image} alt={product.name} className="w-full h-full object-cover bt-zoom opacity-90" />
        </Link>
        {product.discount_percent > 0 && (
          <span className="absolute top-2 left-2 bg-[#E53E3E] text-white text-xs font-bold px-2 py-1 rounded-md">
            -{product.discount_percent}%
          </span>
        )}
        {isAffiliate && (
          <span className="absolute bottom-2 left-2 bg-[#0D1117]/85 text-[#00C2FF] text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
            Parceiro
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleFavorite(product)}
          data-testid={`favorite-btn-${product.slug}`}
          aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute top-2 right-2 h-9 w-9 grid place-items-center rounded-full bg-[#0D1117]/80 hover:bg-[#0077FF] transition-colors"
        >
          <Heart size={16} className={isFav ? "fill-[#E53E3E] text-[#E53E3E]" : "text-white"} />
        </button>
      </div>

      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8B95A1]">{product.category}</span>
        <Link to={`/produto/${product.slug}`} className="font-display font-semibold text-sm sm:text-base leading-snug hover:text-[#00C2FF] transition-colors line-clamp-2">
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-[#8B95A1] min-h-[18px]">
          {product.rating ? (
            <>
              <Star size={13} className="fill-[#00C2FF] text-[#00C2FF]" />
              {product.rating} ({product.reviews_count})
            </>
          ) : (
            <span>Sem avaliações ainda</span>
          )}
        </div>
        <div className="mt-auto pt-2">
          {product.previous_price && product.previous_price > product.price && (
            <p className="text-xs text-[#8B95A1] line-through">{brl(product.previous_price)}</p>
          )}
          <p className={`font-bold font-display ${hasRange(product) ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}>
            {priceLabel(product)}
          </p>
          {priceNote(product) && <p className="text-[10px] text-[#8B95A1]">{priceNote(product)}</p>}
        </div>
        {isAffiliate ? (
          <a
            href={product.affiliate_url || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            data-testid={`affiliate-btn-${product.slug}`}
            className="mt-2 inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-[#00C2FF] text-[#00C2FF] text-sm font-semibold hover:bg-[#00C2FF]/10 transition-colors"
          >
            <ExternalLink size={15} /> Ver no fornecedor
          </a>
        ) : (
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={!product.stock}
            data-testid={`add-to-cart-${product.slug}`}
            className="mt-2 inline-flex items-center justify-center gap-2 h-10 rounded-lg bt-grad text-white text-sm font-semibold hover:brightness-110 transition-[filter] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={15} /> {product.stock ? "Comprar" : "Esgotado"}
          </button>
        )}
      </div>
    </article>
  );
};
