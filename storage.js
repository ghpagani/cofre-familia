/* Guarda os dados da família.
   - Com as variáveis do Supabase preenchidas -> nuvem (todos veem o mesmo).
   - Sem elas -> salva no próprio aparelho.
   ATENÇÃO: no Vercel, os nomes precisam ser MAIÚSCULOS
   (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ESPACO).
   Em minúsculo o Vite ignora sem dar erro e o app roda só local.        */

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ESPACO = import.meta.env.VITE_ESPACO || "familia";
const TABELA = import.meta.env.VITE_TABELA || "cofre";
const LOCAL_KEY = "cofre-familia-v1";

export const MODO = URL_ && ANON ? "nuvem" : "local";

const headers = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  "Content-Type": "application/json",
};

export async function loadState() {
  if (MODO === "nuvem") {
    try {
      const r = await fetch(`${URL_}/rest/v1/${TABELA}?id=eq.${ESPACO}&select=dados`, { headers });
      if (!r.ok) throw new Error(r.statusText);
      const rows = await r.json();
      if (rows?.[0]?.dados) return rows[0].dados;
      return null;
    } catch (e) {
      console.warn("Nuvem indisponível, usando o aparelho:", e.message);
    }
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveState(state) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch {}
  if (MODO !== "nuvem") return true;
  try {
    const r = await fetch(`${URL_}/rest/v1/${TABELA}?on_conflict=id`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ id: ESPACO, dados: state }),
    });
    return r.ok;
  } catch (e) {
    console.warn("Não deu para salvar na nuvem agora:", e.message);
    return false;
  }
}
