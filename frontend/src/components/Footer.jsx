import { Link } from "react-router-dom";
import { Cpu, Mail, MessageCircle } from "lucide-react";
import { SUPPORT_EMAIL, WHATSAPP_DISPLAY, waLink } from "@/lib/api";

export const Footer = () => (
  <footer className="mt-20 border-t border-[#2A2F36] bg-[#0b0f14]" data-testid="site-footer">
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-lg bt-grad grid place-items-center"><Cpu size={19} className="text-white" /></span>
          <span className="font-display font-extrabold text-lg">BRAZA<span className="bt-grad-text">TECH</span></span>
        </div>
        <p className="mt-3 text-sm text-[#8B95A1] max-w-sm">Tecnologia que conecta. Confiança que entrega.</p>
        <p className="mt-4 text-xs text-[#8B95A1] max-w-md">
          Alguns links desta loja podem gerar comissão para a Braza Tech, sem custo adicional para você.
        </p>
      </div>

      <nav aria-label="Links do rodapé">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B95A1]">Navegação</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {[["/", "Início"], ["/produtos", "Produtos"], ["/ofertas", "Ofertas"], ["/sobre", "Sobre"], ["/sac", "SAC"], ["/faq", "FAQ"], ["/termos", "Termos"], ["/privacidade", "Privacidade"]].map(([to, label]) => (
            <li key={to}>
              <Link to={to} className="text-[#8B95A1] hover:text-[#00C2FF] transition-colors">{label}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B95A1]">Contato</h3>
        <ul className="mt-4 space-y-3 text-sm">
          <li>
            <a href={waLink("Olá, Braza Tech! Preciso de ajuda com um produto.")} target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp" className="inline-flex items-center gap-2 text-[#8B95A1] hover:text-[#00C2FF] transition-colors">
              <MessageCircle size={15} /> {WHATSAPP_DISPLAY}
            </a>
          </li>
          <li>
            <a href={`mailto:${SUPPORT_EMAIL}`} data-testid="footer-email" className="inline-flex items-center gap-2 text-[#8B95A1] hover:text-[#00C2FF] transition-colors">
              <Mail size={15} /> {SUPPORT_EMAIL}
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-[#2A2F36] py-5 text-center text-xs text-[#8B95A1]">
      © {new Date().getFullYear()} BRAZA TECH. Todos os direitos reservados.
    </div>
  </footer>
);
