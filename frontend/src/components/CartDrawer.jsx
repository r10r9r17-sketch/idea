import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { brl } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

export const CartDrawer = () => {
  const { cartOpen, setCartOpen, cart, cartSubtotal, updateQuantity, removeFromCart, clearCart } = useStore();
  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-label="Carrinho">
      <button type="button" aria-label="Fechar carrinho" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-black/70" />
      <aside data-testid="cart-drawer" className="relative w-full max-w-md h-full bg-[#0D1117] border-l border-[#2A2F36] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
          <h2 className="font-display font-bold text-lg">Seu carrinho</h2>
          <button type="button" onClick={() => setCartOpen(false)} data-testid="close-cart" aria-label="Fechar" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-[#2A2F36] transition-colors">
            <X size={18} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 grid place-items-center p-8 text-center">
            <div>
              <p className="text-[#8B95A1] text-sm">Seu carrinho está vazio.</p>
              <Link to="/produtos" onClick={() => setCartOpen(false)} className="mt-4 inline-block h-10 px-5 leading-10 rounded-lg bt-grad text-white text-sm font-semibold">
                Explorar produtos
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.product_id} data-testid={`cart-item-${item.slug}`} className="flex gap-3 bt-card rounded-lg p-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded object-cover bg-black" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                    <p className="text-sm font-bold mt-1">{brl(item.price * item.quantity)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1)} data-testid={`decrease-${item.slug}`} aria-label="Diminuir" className="h-7 w-7 grid place-items-center rounded border border-[#2A2F36] hover:border-[#0077FF] transition-colors">
                        <Minus size={13} />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1)} data-testid={`increase-${item.slug}`} aria-label="Aumentar" className="h-7 w-7 grid place-items-center rounded border border-[#2A2F36] hover:border-[#0077FF] transition-colors">
                        <Plus size={13} />
                      </button>
                      <button type="button" onClick={() => removeFromCart(item.product_id)} data-testid={`remove-${item.slug}`} aria-label="Remover" className="ml-auto h-7 w-7 grid place-items-center rounded text-[#E53E3E] hover:bg-[#E53E3E]/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={clearCart} data-testid="clear-cart" className="text-xs text-[#8B95A1] hover:text-[#E53E3E] transition-colors">
                Limpar carrinho
              </button>
            </div>
            <div className="p-4 border-t border-[#2A2F36] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8B95A1]">Subtotal</span>
                <span data-testid="cart-subtotal" className="font-bold">{brl(cartSubtotal)}</span>
              </div>
              <p className="text-xs text-[#8B95A1]">Frete, cupom e total são calculados no checkout.</p>
              <Link to="/carrinho" onClick={() => setCartOpen(false)} data-testid="go-to-cart" className="block text-center h-11 leading-[44px] rounded-lg border border-[#2A2F36] text-sm font-semibold hover:border-[#0077FF] transition-colors">
                Ver carrinho
              </Link>
              <Link to="/checkout" onClick={() => setCartOpen(false)} data-testid="go-to-checkout" className="block text-center h-11 leading-[44px] rounded-lg bt-grad text-white text-sm font-semibold hover:brightness-110 transition-[filter]">
                Finalizar compra
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};
