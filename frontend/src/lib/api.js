import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// withCredentials=true sends httpOnly cookies automatically — no localStorage token needed
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function formatError(detail) {
  if (!detail) return "Ocorreu um erro. Tente novamente.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (typeof detail === "object" && detail.msg) return detail.msg;
  return String(detail);
}

export default api;
