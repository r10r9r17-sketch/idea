import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { MessageCircle } from "lucide-react";
import { StoreProvider } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { CartDrawer } from "@/components/CartDrawer";
import { waLink } from "@/lib/api";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Auth from "@/pages/Auth";
import { About, Account, Categories, Faq, Favorites, Legal, NotFound, OrderDetail, Sac } from "@/pages/Pages";
import AdminLayout from "@/admin/AdminLayout";
import AdminDashboard from "@/admin/AdminDashboard";
import AdminProducts from "@/admin/AdminProducts";
import { AdminBanners, AdminCategories, AdminCoupons, AdminCustomers, AdminInventory, AdminOrders, AdminReviews, AdminSettings, AdminSupport, AdminTestimonials } from "@/admin/AdminPages";

const ScrollTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0 }), [pathname]);
  return null;
};

const Storefront = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1 pb-20 lg:pb-0">{children}</main>
    <Footer />
    <BottomNav />
    <CartDrawer />
    <a href={waLink("Olá, Braza Tech! Preciso de ajuda com um produto.")} target="_blank" rel="noopener noreferrer" data-testid="floating-whatsapp"
      aria-label="Falar no WhatsApp"
      className="fixed right-4 bottom-24 lg:bottom-6 z-40 h-12 w-12 grid place-items-center rounded-full bt-grad shadow-lg hover:brightness-110 transition-[filter]">
      <MessageCircle size={20} className="text-white" />
    </a>
  </div>
);

const page = (element) => <Storefront>{element}</Storefront>;

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <ScrollTop />
        <Toaster theme="dark" position="top-right" />
        <Routes>
          <Route path="/" element={page(<Home />)} />
          <Route path="/produtos" element={page(<Products />)} />
          <Route path="/ofertas" element={page(<Products mode="offers" />)} />
          <Route path="/categorias" element={page(<Categories />)} />
          <Route path="/categoria/:slug" element={page(<Products />)} />
          <Route path="/produto/:slug" element={page(<ProductDetail />)} />
          <Route path="/carrinho" element={page(<Cart />)} />
          <Route path="/checkout" element={page(<Checkout />)} />
          <Route path="/favoritos" element={page(<Favorites />)} />
          <Route path="/entrar" element={page(<Auth mode="login" />)} />
          <Route path="/cadastrar" element={page(<Auth mode="register" />)} />
          <Route path="/conta" element={page(<Account />)} />
          <Route path="/pedido/:number" element={page(<OrderDetail />)} />
          <Route path="/sobre" element={page(<About />)} />
          <Route path="/sac" element={page(<Sac />)} />
          <Route path="/faq" element={page(<Faq />)} />
          <Route path="/termos" element={page(<Legal kind="terms" />)} />
          <Route path="/privacidade" element={page(<Legal kind="privacy" />)} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="produtos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="estoque" element={<AdminInventory />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="clientes" element={<AdminCustomers />} />
            <Route path="cupons" element={<AdminCoupons />} />
            <Route path="avaliacoes" element={<AdminReviews />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="depoimentos" element={<AdminTestimonials />} />
            <Route path="atendimento" element={<AdminSupport />} />
            <Route path="configuracoes" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={page(<NotFound />)} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
