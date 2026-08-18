import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiError(detail, fallback = "Algo deu errado. Tente novamente.") {
  if (detail == null) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const brl = (value) =>
  Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const WHATSAPP = "https://wa.me/67998737690";
export const WHATSAPP_DISPLAY = "(67) 99873-7690";
export const SUPPORT_EMAIL = "therenanlima@gmail.com";
export const NO_INFO = "Informação não informada pelo fornecedor.";

export const waLink = (message) => `${WHATSAPP}?text=${encodeURIComponent(message)}`;

export function setSeo({ title, description, path }) {
  document.title = title;
  const setMeta = (attr, key, content) => {
    let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  };
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", "website");
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", `${window.location.origin}${path || window.location.pathname}`);
}
