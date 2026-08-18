import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, apiError, setSeo } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { Input } from "@/pages/Pages";

export default function Auth({ mode = "login" }) {
  const { login, register, user } = useStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const navigate = useNavigate();
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    setSeo({ title: `${mode === "login" ? "Entrar" : "Criar conta"} — BRAZA TECH`, description: "Acesse sua conta Braza Tech.", path: mode === "login" ? "/entrar" : "/cadastrar" });
  }, [mode]);

  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/admin" : "/conta");
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (forgot) {
        const { data } = await api.post("/auth/forgot-password", { email: form.email });
        toast.success(data.message);
        setForgot(false);
      } else if (mode === "login") {
        const u = await login(form.email, form.password);
        toast.success("Bem-vindo de volta!");
        navigate(u.role === "admin" ? "/admin" : "/conta");
      } else {
        await register(form);
        toast.success("Conta criada com sucesso!");
        navigate("/conta");
      }
    } catch (err) {
      setError(apiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16" data-testid={`auth-${mode}-page`}>
      <h1 className="text-3xl font-bold">{forgot ? "Recuperar senha" : mode === "login" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-sm text-[#8B95A1]">Tecnologia que conecta. Confiança que entrega.</p>
      <form onSubmit={submit} className="mt-8 bt-card rounded-xl p-6 grid gap-4">
        {mode === "register" && !forgot && (
          <>
            <Input label="Nome completo" value={form.name} onChange={set("name")} testid="auth-name" required />
            <Input label="Telefone" value={form.phone} onChange={set("phone")} testid="auth-phone" />
          </>
        )}
        <Input label="E-mail" type="email" value={form.email} onChange={set("email")} testid="auth-email" required />
        {!forgot && <Input label="Senha" type="password" value={form.password} onChange={set("password")} testid="auth-password" required />}
        {error && <p className="text-sm text-[#E53E3E]" data-testid="auth-error">{error}</p>}
        <button type="submit" disabled={busy} data-testid="auth-submit" className="h-12 rounded-lg bt-grad text-white font-semibold disabled:opacity-50">
          {busy ? "Aguarde..." : forgot ? "Enviar instruções" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        {mode === "login" && !forgot && (
          <button type="button" onClick={() => setForgot(true)} data-testid="forgot-password-btn" className="text-xs text-[#8B95A1] hover:text-[#00C2FF] transition-colors">Esqueci minha senha</button>
        )}
        <p className="text-sm text-[#8B95A1]">
          {mode === "login" ? (
            <>Não tem conta? <Link to="/cadastrar" className="text-[#00C2FF] hover:underline" data-testid="go-register">Cadastre-se</Link></>
          ) : (
            <>Já tem conta? <Link to="/entrar" className="text-[#00C2FF] hover:underline" data-testid="go-login">Entrar</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
