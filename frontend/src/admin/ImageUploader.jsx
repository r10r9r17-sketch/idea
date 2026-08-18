import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { api, apiError } from "@/lib/api";

export const ImageUploader = ({ gallery = [], onChange }) => {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef();

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    setBusy(true);
    try {
      const { data } = await api.post("/admin/uploads", body, { headers: { "Content-Type": "multipart/form-data" } });
      onChange([...gallery, ...data.urls]);
      toast.success(data.urls.length > 1 ? "Imagens enviadas." : "Imagem enviada.");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail, "Falha ao enviar a imagem."));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (url) => onChange(gallery.filter((item) => item !== url));
  const makeMain = (url) => onChange([url, ...gallery.filter((item) => item !== url)]);

  return (
    <div data-testid="image-uploader">
      <p className="text-xs uppercase tracking-wider text-[#8B95A1]">Imagens do produto</p>
      <div className="mt-2 flex flex-wrap gap-3">
        {gallery.map((url, index) => (
          <div key={url} className="relative h-24 w-24 rounded-lg overflow-hidden border border-[#2A2F36] group" data-testid={`uploaded-image-${index}`}>
            <img src={url} alt={`Imagem ${index + 1}`} className="h-full w-full object-cover" />
            {index === 0 && (
              <span className="absolute top-1 left-1 bg-[#0077FF] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PRINCIPAL</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-[#0D1117]/85 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => makeMain(url)} data-testid={`set-main-image-${index}`} aria-label="Definir como principal" className="p-1.5 text-[#00C2FF]">
                <Star size={13} />
              </button>
              <button type="button" onClick={() => remove(url)} data-testid={`remove-image-${index}`} aria-label="Remover imagem" className="p-1.5 text-[#E53E3E]">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          data-testid="upload-image-btn"
          className="h-24 w-24 rounded-lg border border-dashed border-[#2A2F36] grid place-items-center text-[#8B95A1] hover:border-[#0077FF] hover:text-[#00C2FF] transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={upload} data-testid="image-file-input" className="hidden" />
      <p className="mt-2 text-xs text-[#8B95A1]">
        Envie fotos do seu computador (JPG, PNG, WEBP ou GIF, até 8 MB cada). A primeira imagem é a principal do produto.
      </p>
    </div>
  );
};
