import { ImageOff } from "lucide-react";

export const ProductImage = ({ src, alt, className = "" }) => {
  if (!src)
    return (
      <div
        data-testid="product-image-placeholder"
        className={`w-full h-full grid place-items-center bg-gradient-to-br from-[#101720] to-[#182430] text-center px-3 ${className}`}
      >
        <div>
          <ImageOff size={22} className="mx-auto text-[#8B95A1]" />
          <p className="mt-2 text-[10px] leading-tight text-[#8B95A1]">Imagem não informada pelo fornecedor</p>
        </div>
      </div>
    );
  return <img src={src} alt={alt} loading="lazy" className={className} />;
};
