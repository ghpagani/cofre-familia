import { loadState, saveState, MODO } from "./storage.js";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine,
} from "recharts";
import {
  Wallet, Plus, TrendingUp, Settings, Trash2, PiggyBank, Receipt,
  ArrowDownLeft, ArrowUpRight, Coins, Landmark, Download, Upload, Check,
  RefreshCw, Users, Target, Cloud, HardDrive, CreditCard, Copy, ClipboardList,
  CalendarClock, Globe, GraduationCap, Pencil, X,
} from "lucide-react";

/* ================================================================== */
/*  DADOS DE REFERÊNCIA                                                */
/* ================================================================== */
export const CATEGORIAS = [
  // --- Entradas ---
  { nome: "Salário", tipo: "Entrada", natureza: "—" },
  { nome: "Aposentadoria / INSS", tipo: "Entrada", natureza: "—" },
  { nome: "Aluguel recebido", tipo: "Entrada", natureza: "—" },
  { nome: "13º / Férias / PLR", tipo: "Entrada", natureza: "—" },
  { nome: "Rendimentos / Juros", tipo: "Entrada", natureza: "—" },
  { nome: "Resgate de investimento", tipo: "Entrada", natureza: "—", conta: true },
  { nome: "Outras entradas", tipo: "Entrada", natureza: "—", livre: true },
  // --- Saídas fixas ---
  { nome: "Moradia (condomínio/aluguel)", tipo: "Saída", natureza: "Fixo" },
  { nome: "IPTU / IPVA", tipo: "Saída", natureza: "Fixo" },
  { nome: "Energia", tipo: "Saída", natureza: "Fixo" },
  { nome: "Água", tipo: "Saída", natureza: "Fixo" },
  { nome: "Internet / Telefone", tipo: "Saída", natureza: "Fixo" },
  { nome: "Faculdade / Mensalidade", tipo: "Saída", natureza: "Fixo" },
  { nome: "Escola / Cursos", tipo: "Saída", natureza: "Fixo" },
  { nome: "Plano de saúde", tipo: "Saída", natureza: "Fixo" },
  { nome: "Seguros", tipo: "Saída", natureza: "Fixo" },
  { nome: "Assinaturas", tipo: "Saída", natureza: "Fixo" },
  { nome: "Empréstimo / Financiamento", tipo: "Saída", natureza: "Fixo", divida: true },
  { nome: "Fatura do cartão", tipo: "Saída", natureza: "Fixo" },
  { nome: "Outra conta fixa", tipo: "Saída", natureza: "Fixo", livre: true },
  // --- Saídas variáveis ---
  { nome: "Mercado", tipo: "Saída", natureza: "Variável" },
  { nome: "Mesada", tipo: "Saída", natureza: "Variável" },
  { nome: "Alimentação fora", tipo: "Saída", natureza: "Variável" },
  { nome: "Transporte / Combustível", tipo: "Saída", natureza: "Variável" },
  { nome: "Saúde / Farmácia", tipo: "Saída", natureza: "Variável" },
  { nome: "Pet — ração", tipo: "Saída", natureza: "Variável" },
  { nome: "Pet — veterinário", tipo: "Saída", natureza: "Variável" },
  { nome: "Material de estudo", tipo: "Saída", natureza: "Variável" },
  { nome: "Lazer", tipo: "Saída", natureza: "Variável" },
  { nome: "Vestuário", tipo: "Saída", natureza: "Variável" },
  { nome: "Casa / Utensílios", tipo: "Saída", natureza: "Variável" },
  { nome: "Presentes", tipo: "Saída", natureza: "Variável" },
  { nome: "Cuidados pessoais", tipo: "Saída", natureza: "Variável" },
  { nome: "Viagem", tipo: "Saída", natureza: "Variável" },
  { nome: "Outros", tipo: "Saída", natureza: "Variável", livre: true },
  // --- Investimento ---
  { nome: "Aporte investimento", tipo: "Investimento", natureza: "—", conta: true },
  { nome: "Reserva de emergência", tipo: "Investimento", natureza: "—", conta: true },
];
export const CAT_MAP = Object.fromEntries(CATEGORIAS.map((c) => [c.nome, c]));
const FORMAS = ["Pix", "Débito", "Crédito", "Dinheiro", "Boleto", "Transferência"];
const TIPOS_INV = ["Reserva de emergência", "Renda fixa", "Tesouro Direto", "Ações / FIIs", "Fundo", "Cripto", "Poupança", "Previdência", "Outro"];
export const MOEDAS = [
  { cod: "BRL", nome: "Real", simbolo: "R$" },
  { cod: "USD", nome: "Dólar", simbolo: "US$" },
  { cod: "EUR", nome: "Euro", simbolo: "€" },
];
export const TIPOS_DIVIDA = [
  "Financiamento imobiliário", "Financiamento de veículo", "Empréstimo pessoal",
  "Consignado", "Crédito estudantil", "Cheque especial", "Outro",
];
export const PAPEIS = [
  { id: "casa", label: "Casa" },
  { id: "provedor", label: "Traz renda" },
  { id: "membro", label: "Membro" },
  { id: "pet", label: "Pet" },
];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const PALETA = ["#0F6E5B", "#8A466A", "#B4842F", "#3C6E9F", "#B0563A", "#5C7A4A", "#6E5B8A", "#A8763F"];

/* ================================================================== */
/*  UTIL                                                               */
/* ================================================================== */
export function uid() { return Math.random().toString(36).slice(2, 10); }
const brl = (n) => (isFinite(n) ? n : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = (n) => (isFinite(n) ? n : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const moedaFmt = (n, cod) => {
  const m = MOEDAS.find((x) => x.cod === cod) || MOEDAS[0];
  return `${m.simbolo} ${(isFinite(n) ? n : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const pct = (n) => `${((isFinite(n) ? n : 0) * 100).toFixed(1)}%`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const parseISO = (s) => { const [y, m, d] = String(s).split("-").map(Number); return { y, m, d }; };
const numBR = (v) => parseFloat(String(v).replace(/\./g, "").replace(",", ".")) || 0;
export const chaveMes = (a, m) => `${a}-${String(m).padStart(2, "0")}`;
const somaMeses = (a, m, d) => { let t = a * 12 + (m - 1) + d; return { a: Math.floor(t / 12), m: (t % 12) + 1 }; };
const dm = (dia, m) => `${String(dia).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
/* "2028-03-14" -> "mar/2028" */
export const mesAno = (iso) => {
  if (!iso) return "—";
  const p = parseISO(iso);
  if (!p.y || !p.m) return "—";
  return `${MESES[p.m - 1].toLowerCase()}/${p.y}`;
};
/* mês financeiro: se o mês começa no dia 27, tudo do dia 27 em diante já é do mês seguinte */
export const mesFin = (dataISO, diaIni) => {
  const p = parseISO(dataISO);
  const d = Math.min(Math.max(+diaIni || 1, 1), 28);
  return d === 1 ? { a: p.y, m: p.m } : (p.d >= d ? somaMeses(p.y, p.m, 1) : { a: p.y, m: p.m });
};
/* soma meses a uma data ISO, sem estourar o fim do mês */
export const somaMesesISO = (dataISO, n) => {
  const p = parseISO(dataISO);
  if (!p.y || !p.m) return dataISO;
  const t = somaMeses(p.y, p.m, n);
  const ultimo = new Date(t.a, t.m, 0).getDate();
  const dia = Math.min(p.d || 1, ultimo);
  return `${t.a}-${String(t.m).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
};
/* quantos meses inteiros separam duas datas ISO (b - a) */
export const mesesEntre = (aISO, bISO) => {
  const a = parseISO(aISO), b = parseISO(bISO);
  if (!a.y || !b.y) return 0;
  return (b.y - a.y) * 12 + (b.m - a.m) - (b.d < a.d ? 1 : 0);
};
const tipoDe = (t) => CAT_MAP[t.categoria]?.tipo || "Saída";
const natDe = (t) => CAT_MAP[t.categoria]?.natureza || "Variável";
export const rotulo = (t) => (t.detalhe ? `${t.categoria} · ${t.detalhe}` : t.categoria);

/* categorias fixas que NÃO entram na lista do Previsto:
   a fatura tem bloco próprio e as parcelas vêm automáticas da aba Dívidas */
const FIXAS_ESPECIAIS = ["Fatura do cartão", "Empréstimo / Financiamento"];

export const novaPessoa = (nome, papel, i) => ({
  id: uid(), nome, papel, cor: PALETA[i % PALETA.length], renda: 0, envelope: 0,
});

export const defaultState = () => ({
  _rev: Date.now(),
  config: {
    nomeLar: "Cofre da Família",
    subtitulo: "caixa único da casa",
    pessoas: [
      { id: "casa", nome: "Casa", papel: "casa", cor: PALETA[0], renda: 0, envelope: 0 },
      novaPessoa("Pai", "provedor", 1),
      novaPessoa("Mãe", "membro", 2),
      novaPessoa("Irmã", "membro", 3),
      novaPessoa("Amora", "pet", 4),
      novaPessoa("Olívia", "pet", 5),
    ],
    fixasEstimadas: 0,
    metaPoupanca: 0.1,
    mesesReserva: 6,
    diaFechamento: 26,
    diaInicioMes: 1,
  },
  transactions: [],
  previsto: {},
  rendaMes: {},
  investimentos: [{ id: uid(), instituicao: "", tipo: "Reserva de emergência", moeda: "BRL", titular: "casa", saldoInicial: 0 }],
  dividas: [],
  metas: [{ id: uid(), objetivo: "Reserva de emergência", prazo: "Contínuo", alvo: 0, guardado: 0, auto: true }],
});

/* migra formatos antigos sem perder nada */
export function migrar(s) {
  if (!s || typeof s !== "object") return defaultState();
  const base = defaultState();
  const n = { ...base, ...s, config: { ...base.config, ...(s.config || {}) } };

  /* pessoas: garante lista válida e a "Casa" sempre presente */
  let pes = Array.isArray(n.config.pessoas) ? n.config.pessoas : [];
  pes = pes.filter((p) => p && typeof p === "object").map((p, i) => ({
    id: p.id || uid(),
    nome: p.nome || "Sem nome",
    papel: PAPEIS.some((x) => x.id === p.papel) ? p.papel : "membro",
    cor: p.cor || PALETA[i % PALETA.length],
    renda: +p.renda || 0,
    envelope: +p.envelope || 0,
  }));
  if (!pes.some((p) => p.papel === "casa")) {
    pes.unshift({ id: "casa", nome: "Casa", papel: "casa", cor: PALETA[0], renda: 0, envelope: 0 });
  }
  n.config.pessoas = pes.length ? pes : base.config.pessoas;

  n.transactions = (s.transactions || []).map((t) => ({ ...t }));
  n.previsto = (s.previsto && typeof s.previsto === "object") ? { ...s.previsto } : {};
  n.rendaMes = (s.rendaMes && typeof s.rendaMes === "object") ? { ...s.rendaMes } : {};
  if (!(+n.config.diaFechamento > 0)) n.config.diaFechamento = 26;
  if (!(+n.config.diaInicioMes > 0)) n.config.diaInicioMes = 1;

  n.investimentos = (s.investimentos || []).map((i) => ({
    id: i.id || uid(),
    instituicao: i.instituicao || "",
    tipo: i.tipo || "Outro",
    moeda: MOEDAS.some((m) => m.cod === i.moeda) ? i.moeda : "BRL",
    titular: i.titular || "casa",
    saldoInicial: i.saldoInicial !== undefined ? +i.saldoInicial : +(i.saldo || 0),
  }));

  n.dividas = (s.dividas || []).map((d) => ({
    id: d.id || uid(),
    nome: d.nome || "",
    tipo: TIPOS_DIVIDA.includes(d.tipo) ? d.tipo : "Outro",
    credor: d.credor || "",
    valorOriginal: +d.valorOriginal || 0,
    saldoInicial: d.saldoInicial !== undefined ? +d.saldoInicial : +(d.saldo || 0),
    dataRef: d.dataRef || todayISO(),
    parcela: +d.parcela || 0,
    totalParcelas: +d.totalParcelas || 0,
    parcelasPagas: +d.parcelasPagas || 0,
    diaVencimento: +d.diaVencimento || 10,
    taxaMes: +d.taxaMes || 0,
  }));

  n.metas = (s.metas || base.metas).map((m) => ({ ...m, id: m.id || uid() }));
  if (!n._rev) n._rev = Date.now();
  return n;
}

/* ================================================================== */
/*  CÁLCULOS                                                           */
/* ================================================================== */
export function computeDerived(state, ano, mes, cotacoes) {
  const { config, transactions } = state;
  const sum = (arr) => arr.reduce((a, t) => a + (+t.valor || 0), 0);
  const pessoas = config.pessoas || [];
  const pessoaPorId = Object.fromEntries(pessoas.map((p) => [p.id, p]));
  const cot = cotacoes || {};
  const cotDe = (cod) => (cod === "BRL" ? 1 : +cot[cod] || 0);

  const diaIni = Math.min(Math.max(+config.diaInicioMes || 1, 1), 28);
  const inMonth = (t) => { const f = mesFin(t.data, diaIni); return f.a === ano && f.m === mes; };
  const mTx = transactions.filter(inMonth);

  const entradas = sum(mTx.filter((t) => tipoDe(t) === "Entrada"));
  const saidas = sum(mTx.filter((t) => tipoDe(t) === "Saída"));
  const aportes = sum(mTx.filter((t) => tipoDe(t) === "Investimento"));
  const sobra = entradas - saidas;
  const taxa = entradas > 0 ? sobra / entradas : 0;

  /* ---- previsto do mês ---- */
  const chave = chaveMes(ano, mes);
  const prevMes = (state.previsto && state.previsto[chave]) || {};

  /* ---- cartão ---- */
  const diaFech = Math.min(Math.max(+config.diaFechamento || 26, 1), 28);
  const ehCredito = (t) => t.forma === "Crédito" && t.categoria !== "Fatura do cartão";
  const faturaCiclo = sum(mTx.filter(ehCredito));
  const faturaExtra = +prevMes.__faturaExtra || 0;
  const faturaPrevista = faturaCiclo + faturaExtra;
  const iniMes = somaMeses(ano, mes, -1);
  const janelaMes = diaIni > 1 ? `${dm(diaIni, iniMes.m)} a ${dm(diaIni - 1, mes)}` : "";
  const janelaFatura = janelaMes || `mês inteiro de ${MESES_LONGOS[mes - 1].toLowerCase()}`;

  /* ---- dívidas: o coração deste app ---- */
  const hoje = todayISO();
  const dividas = (state.dividas || []).map((dv) => {
    const txs = transactions.filter((t) => t.dividaId === dv.id);
    const pago = sum(txs);
    const saldo = Math.max((+dv.saldoInicial || 0) - pago, 0);
    const total = +dv.totalParcelas || 0;
    const pagasTotal = Math.min((+dv.parcelasPagas || 0) + txs.length, total || Infinity);
    const restantes = total > 0 ? Math.max(total - pagasTotal, 0) : 0;
    const quitada = total > 0 ? restantes === 0 : saldo <= 0;
    const quitacao = total > 0 && restantes > 0 && dv.dataRef ? somaMesesISO(dv.dataRef, restantes) : null;
    const aPagar = (+dv.parcela || 0) * restantes;
    const jurosRest = Math.max(aPagar - saldo, 0);
    const progresso = total > 0 ? pagasTotal / total : (dv.saldoInicial > 0 ? pago / dv.saldoInicial : 0);
    const mesesFalta = quitacao ? Math.max(mesesEntre(hoje, quitacao), 0) : 0;
    return { ...dv, pago, saldo, pagasTotal, restantes, quitada, quitacao, aPagar, jurosRest, progresso, mesesFalta };
  });
  const ativas = dividas.filter((x) => !x.quitada);
  const parcelaMensal = ativas.reduce((a, x) => a + (+x.parcela || 0), 0);
  const dividaTotal = dividas.reduce((a, x) => a + x.saldo, 0);
  const jurosTotal = ativas.reduce((a, x) => a + x.jurosRest, 0);
  /* linha do tempo: quando cada dívida acaba e quanto de caixa isso libera por mês */
  const marcos = ativas.filter((x) => x.quitacao).sort((a, b) => a.quitacao.localeCompare(b.quitacao));
  let acumLiberado = 0;
  const liberacao = marcos.map((x) => {
    acumLiberado += +x.parcela || 0;
    return { id: x.id, nome: x.nome || "sem nome", data: x.quitacao, parcela: +x.parcela || 0, acumulado: acumLiberado };
  });
  const ultimaQuitacao = marcos.length ? marcos[marcos.length - 1].quitacao : null;

  /* ---- fixas previstas ---- */
  const fixasCats = CATEGORIAS.filter((c) => c.tipo === "Saída" && c.natureza === "Fixo" && !FIXAS_ESPECIAIS.includes(c.nome));
  const fixasDigitadas = fixasCats.reduce((a, c) => a + (+prevMes[c.nome] || 0), 0);
  const algumaFixaDigitada = fixasCats.some((c) => +prevMes[c.nome] > 0);
  const fixasBase = algumaFixaDigitada ? fixasDigitadas : (+config.fixasEstimadas || 0);
  const fixasPrevistas = fixasBase + faturaExtra + parcelaMensal;
  const variaveisPrevistas = CATEGORIAS
    .filter((c) => c.tipo === "Saída" && c.natureza === "Variável")
    .reduce((a, c) => a + (+prevMes[c.nome] || 0), 0);
  const totalPrevisto = fixasPrevistas + variaveisPrevistas;
  const temPrevisto = algumaFixaDigitada || faturaExtra > 0 || variaveisPrevistas > 0 || parcelaMensal > 0;
  const fixasUsadas = fixasBase + faturaExtra;

  /* realizado por categoria */
  const realizadoPorCat = {};
  mTx.filter((t) => tipoDe(t) === "Saída").forEach((t) => {
    realizadoPorCat[t.categoria] = (realizadoPorCat[t.categoria] || 0) + (+t.valor || 0);
  });
  const creditoMes = sum(mTx.filter(ehCredito));
  const faturaDuplicada = (realizadoPorCat["Fatura do cartão"] || 0) > 0 && creditoMes > 0;

  /* ---- renda: total da casa, com override do mês ---- */
  const rMes = (state.rendaMes && state.rendaMes[chave]) || {};
  const rendaDe = (p) => (rMes[p.id] != null && rMes[p.id] !== "" ? +rMes[p.id] : (+p.renda || 0));
  const rendaTotal = pessoas.reduce((a, p) => a + rendaDe(p), 0);
  const rendaPropria = Object.keys(rMes).length > 0;
  const provedores = pessoas.filter((p) => p.papel === "provedor" || (+p.renda || 0) > 0);
  const entrouDe = (id) => sum(mTx.filter((t) => tipoDe(t) === "Entrada" && t.pessoa === id));
  const entrouTotal = sum(mTx.filter((t) => tipoDe(t) === "Entrada"));

  /* ---- cascata: renda -> fixas -> dívidas -> poupança -> envelopes ---- */
  const metaPoup = rendaTotal * (+config.metaPoupanca || 0);
  const disponivel = Math.max(rendaTotal - fixasUsadas - parcelaMensal - metaPoup, 0);
  const gastouVar = (id) => sum(mTx.filter((t) => tipoDe(t) === "Saída" && natDe(t) === "Variável" && t.pessoa === id));
  const envelopes = pessoas.map((p) => {
    const teto = +p.envelope || 0;
    const gastou = gastouVar(p.id);
    return { ...p, teto, gastou, restante: teto - gastou, semTeto: teto <= 0, renda: rendaDe(p) };
  });
  const somaEnvelopes = envelopes.reduce((a, e) => a + e.teto, 0);
  const folga = disponivel - somaEnvelopes;
  const envelopesEstouram = folga < 0;

  /* ---- patrimônio, com moeda estrangeira ---- */
  const investimentos = state.investimentos.map((i) => {
    const moeda = i.moeda || "BRL";
    const taxaAtual = cotDe(moeda);
    /* aportes em BRL viram moeda da conta pela cotação do dia do lançamento */
    const naMoeda = (t) => {
      const v = +t.valor || 0;
      if (moeda === "BRL") return v;
      const c = +t.cotacao || taxaAtual;
      return c > 0 ? v / c : 0;
    };
    const txAportes = transactions.filter((t) => tipoDe(t) === "Investimento" && t.contaId === i.id);
    const txResgates = transactions.filter((t) => t.categoria === "Resgate de investimento" && t.contaId === i.id);
    const aportado = txAportes.reduce((a, t) => a + naMoeda(t), 0);
    const resgatado = txResgates.reduce((a, t) => a + naMoeda(t), 0);
    const saldoMoeda = (+i.saldoInicial || 0) + aportado - resgatado;
    const saldo = moeda === "BRL" ? saldoMoeda : saldoMoeda * taxaAtual;
    return { ...i, moeda, aportado, resgatado, saldoMoeda, saldo, taxaAtual, semCotacao: moeda !== "BRL" && !taxaAtual };
  });
  const invTotal = investimentos.reduce((a, i) => a + i.saldo, 0);
  const invExterior = investimentos.filter((i) => i.moeda !== "BRL").reduce((a, i) => a + i.saldo, 0);
  const patrimonio = invTotal - dividaTotal;
  const reservaAtual = investimentos.filter((i) => i.tipo === "Reserva de emergência").reduce((a, i) => a + i.saldo, 0);
  const semConta = sum(transactions.filter((t) => (CAT_MAP[t.categoria]?.conta) && !t.contaId));

  /* ---- série anual ---- */
  const porMes = MESES.map((nome, i) => {
    const tm = transactions.filter((t) => { const f = mesFin(t.data, diaIni); return f.a === ano && f.m === i + 1; });
    const e = sum(tm.filter((t) => tipoDe(t) === "Entrada"));
    const s = sum(tm.filter((t) => tipoDe(t) === "Saída"));
    const a = sum(tm.filter((t) => tipoDe(t) === "Investimento"));
    return { mesIdx: i, nome, entradas: e, saidas: s, aportes: a, sobra: e - s };
  });
  let acc = 0;
  porMes.forEach((m) => { acc += m.sobra; m.acumulado = acc; });

  const comSaida = porMes.filter((m) => m.saidas > 0);
  const despesaMedia = comSaida.length
    ? comSaida.reduce((a, m) => a + m.saidas, 0) / comSaida.length
    : (+config.fixasEstimadas || 0);
  const reservaAlvo = (+config.mesesReserva || 0) * despesaMedia;

  /* ---- quebra por categoria e por pessoa ---- */
  const map = {};
  mTx.filter((t) => tipoDe(t) === "Saída").forEach((t) => {
    const k = rotulo(t);
    map[k] = (map[k] || 0) + (+t.valor || 0);
  });
  const porCategoria = Object.entries(map).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);

  const porPessoa = pessoas.map((p) => ({
    nome: p.nome, cor: p.cor,
    valor: sum(mTx.filter((t) => tipoDe(t) === "Saída" && t.pessoa === p.id)),
  })).filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor);

  return {
    entradas, saidas, aportes, sobra, taxa, pessoas, pessoaPorId, provedores,
    rendaTotal, rendaDe, rendaPropria, entrouDe, entrouTotal, metaPoup, disponivel,
    envelopes, somaEnvelopes, folga, envelopesEstouram,
    fixasPrevistas, variaveisPrevistas, totalPrevisto, fixasUsadas, temPrevisto,
    fixasBase, algumaFixaDigitada, faturaCiclo, faturaExtra, janelaFatura, janelaMes, diaFech, diaIni,
    prevMes, realizadoPorCat, creditoMes, faturaPrevista, faturaDuplicada,
    sobraPrevista: rendaTotal - totalPrevisto,
    dividas, ativas, parcelaMensal, dividaTotal, jurosTotal, liberacao, ultimaQuitacao,
    investimentos, invTotal, invExterior, patrimonio, reservaAtual, reservaAlvo, semConta,
    porMes, porCategoria, porPessoa, mTx, cotDe,
  };
}

/* ================================================================== */
/*  COTAÇÕES (dólar e euro ao vivo)                                    */
/* ================================================================== */
const COT_KEY = "cofre-familia-cotacoes";
export function useCotacoes() {
  const [cot, setCot] = useState(() => {
    try { return JSON.parse(localStorage.getItem(COT_KEY)) || {}; } catch { return {}; }
  });
  const [carregando, setCarregando] = useState(false);

  const buscar = async () => {
    setCarregando(true);
    try {
      const r = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL");
      if (!r.ok) throw new Error(r.statusText);
      const j = await r.json();
      const novo = {
        USD: +j?.USDBRL?.bid || 0,
        EUR: +j?.EURBRL?.bid || 0,
        at: new Date().toISOString(),
      };
      if (novo.USD > 0) {
        setCot(novo);
        try { localStorage.setItem(COT_KEY, JSON.stringify(novo)); } catch {}
      }
    } catch (e) {
      console.warn("Não deu para buscar a cotação agora:", e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscar();
    const t = setInterval(buscar, 30 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return { cot, carregando, buscar };
}

/* ================================================================== */
/*  APP                                                                */
/* ================================================================== */
export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aba, setAba] = useState("painel");
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const skipSave = useRef(true);
  const revRef = useRef(0);
  const { cot, carregando: cotCarregando, buscar: buscarCot } = useCotacoes();

  useEffect(() => {
    (async () => {
      const raw = await loadState();
      const s = raw ? migrar(raw) : defaultState();
      revRef.current = s._rev || 0;
      setState(s);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading || !state) return;
    if (skipSave.current) { skipSave.current = false; return; }
    let alive = true;
    setSaving(true);
    revRef.current = state._rev;
    saveState(state).then(() => { if (alive) setTimeout(() => setSaving(false), 400); });
    return () => { alive = false; };
  }, [state, loading]);

  /* sincroniza mudanças de outro aparelho (só quando há nuvem) */
  useEffect(() => {
    if (MODO !== "nuvem" || loading) return;
    const check = async () => {
      const raw = await loadState();
      if (raw && (raw._rev || 0) > revRef.current) {
        revRef.current = raw._rev;
        skipSave.current = true;
        setState(migrar(raw));
      }
    };
    const t = setInterval(check, 25000);
    window.addEventListener("focus", check);
    return () => { clearInterval(t); window.removeEventListener("focus", check); };
  }, [loading]);

  const update = (fn) => setState((s) => { const n = structuredClone(s); fn(n); n._rev = Date.now(); return n; });
  const derived = useMemo(() => (state ? computeDerived(state, ano, mes, cot) : null), [state, ano, mes, cot]);

  if (loading || !state || !derived)
    return <div style={sx.loadingWrap}><PiggyBank size={26} style={{ opacity: .5 }} /><span style={{ marginLeft: 10 }}>Carregando…</span></div>;

  const cfg = state.config;

  return (
    <div style={sx.root}>
      <style>{CSS}</style>

      <header style={sx.header}>
        <div style={sx.brand}>
          <div style={sx.brandMark}><PiggyBank size={18} color="#fff" /></div>
          <div>
            <div style={sx.brandTitle}>{cfg.nomeLar || "Cofre da Família"}</div>
            <div style={sx.brandSub}>{cfg.subtitulo || "caixa único da casa"}</div>
          </div>
        </div>
        <span style={sx.saveDot}>
          {saving ? "salvando…" : <><Check size={11} /> salvo</>}
        </span>
      </header>

      <div style={sx.monthBar}>
        <button className="ghost" style={sx.monthArrow}
          onClick={() => (mes === 1 ? (setMes(12), setAno(ano - 1)) : setMes(mes - 1))}>‹</button>
        <div>
          <div style={sx.monthLabel}>{MESES_LONGOS[mes - 1]} <span style={{ opacity: .5 }}>{ano}</span></div>
          {derived.diaIni > 1 && <div style={sx.monthJanela}>{derived.janelaMes}</div>}
        </div>
        <button className="ghost" style={sx.monthArrow}
          onClick={() => (mes === 12 ? (setMes(1), setAno(ano + 1)) : setMes(mes + 1))}>›</button>
      </div>

      <main style={sx.main}>
        {aba === "painel" && <Painel d={derived} state={state} ano={ano} mes={mes} irPara={setAba} />}
        {aba === "lancar" && <Lancar d={derived} state={state} update={update} cot={cot} />}
        {aba === "previsto" && <Previsto state={state} update={update} d={derived} ano={ano} mes={mes} />}
        {aba === "dividas" && <Dividas state={state} update={update} d={derived} />}
        {aba === "patrim" && <Patrimonio state={state} update={update} d={derived} cot={cot} cotCarregando={cotCarregando} buscarCot={buscarCot} />}
        {aba === "config" && <Ajustes state={state} update={update} setState={setState} d={derived} />}
      </main>

      <nav style={sx.nav}>
        {[["painel", "Painel", Wallet], ["lancar", "Lançar", Plus], ["previsto", "Previsto", ClipboardList],
          ["dividas", "Dívidas", Receipt], ["patrim", "Patrim.", TrendingUp],
          ["config", "Ajustes", Settings]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setAba(id)} className="navbtn"
            style={{ ...sx.navBtn, ...(aba === id ? sx.navBtnOn : {}) }}>
            <Icon size={18} /><span style={sx.navLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ================================================================== */
/*  PAINEL                                                             */
/* ================================================================== */
function Painel({ d, state, ano, mes, irPara }) {
  const reservaPct = d.reservaAlvo > 0 ? Math.min(d.reservaAtual / d.reservaAlvo, 1) : 0;
  const semConfig = d.rendaTotal === 0;
  const comEnvelope = d.envelopes.filter((e) => e.teto > 0 || e.gastou > 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={sx.hero}>
        <div style={sx.heroEye}>SOBRA DESTE MÊS</div>
        <div style={{ ...sx.heroNum, color: d.sobra >= 0 ? "#EAF6F1" : "#F6D9CF" }}>{brl(d.sobra)}</div>
        <div style={sx.heroRow}>
          <span style={sx.heroChip}><ArrowDownLeft size={13} /> {brl0(d.entradas)}</span>
          <span style={sx.heroChip}><ArrowUpRight size={13} /> {brl0(d.saidas)}</span>
          <span style={sx.heroChip}><Coins size={13} /> {brl0(d.aportes)} investido</span>
        </div>
        <div style={sx.heroSavings}>taxa de poupança <b>{pct(d.taxa)}</b></div>
      </div>

      <div style={sx.kpiRow}>
        <Kpi label="Patrimônio líquido" value={brl0(d.patrimonio)} tone="ink" hint="investido − dívidas" />
        <Kpi label="Investido" value={brl0(d.invTotal)} tone="teal" />
        <Kpi label="Dívidas" value={brl0(d.dividaTotal)} tone="brick" />
      </div>

      {d.parcelaMensal > 0 && (
        <button className="ghost" style={sx.dividaResumo} onClick={() => irPara("dividas")}>
          <div style={{ textAlign: "left" }}>
            <div style={sx.dividaResumoTop}><CalendarClock size={14} /> Parcelas do mês</div>
            <div style={sx.dividaResumoSub}>
              {d.ativas.length} {d.ativas.length === 1 ? "dívida ativa" : "dívidas ativas"}
              {d.ultimaQuitacao ? ` · última quita em ${mesAno(d.ultimaQuitacao)}` : ""}
            </div>
          </div>
          <div style={sx.dividaResumoVal}>{brl0(d.parcelaMensal)}</div>
        </button>
      )}

      <SectionTitle>Envelopes do mês</SectionTitle>
      {semConfig ? (
        <EmptyHint>Defina a renda da casa em <b>Ajustes</b> para o app calcular os envelopes.</EmptyHint>
      ) : comEnvelope.length === 0 ? (
        <EmptyHint>Nenhum envelope com teto ainda. Defina quanto cabe para cada um em <b>Ajustes</b>.</EmptyHint>
      ) : (
        <>
          <div style={sx.envGrid}>
            {comEnvelope.map((e) => <Envelope key={e.id} e={e} />)}
          </div>
          <div style={sx.mesadaBreak}>
            <span>Renda {brl0(d.rendaTotal)}</span>
            <span>− fixas {brl0(d.fixasUsadas)}</span>
            {d.parcelaMensal > 0 && <span>− parcelas {brl0(d.parcelaMensal)}</span>}
            <span>− poupança {brl0(d.metaPoup)}</span>
            <span style={{ fontWeight: 700, color: "var(--teal)" }}>= livre {brl0(d.disponivel)}</span>
          </div>
          {d.envelopesEstouram ? (
            <div style={sx.warnBox}>
              Os envelopes somam {brl0(d.somaEnvelopes)}, mas só sobram {brl0(d.disponivel)} depois
              das contas. Faltam <b>{brl0(-d.folga)}</b> — reduza algum teto em Ajustes ou reveja as fixas.
            </div>
          ) : d.folga > 0 && (
            <div style={sx.okBox}>
              Sobram <b>{brl0(d.folga)}</b> além dos envelopes — folga da casa para imprevistos.
            </div>
          )}
        </>
      )}

      {(d.faturaPrevista > 0 || d.creditoMes > 0) && (
        <div style={sx.faturaCard}>
          <div style={sx.rowBetween}>
            <span style={sx.faturaTitulo}><CreditCard size={15} /> Cartão</span>
            <span style={sx.faturaValor}>{brl0(d.faturaPrevista || d.creditoMes)}</span>
          </div>
          <div style={sx.faturaHint}>
            {d.faturaPrevista > 0
              ? `Fatura prevista para este mês. No crédito agora: ${brl0(d.creditoMes)} — cai na fatura do mês que vem.`
              : `Já passou no crédito este mês. Cai na fatura de ${MESES_LONGOS[mes === 12 ? 0 : mes].toLowerCase()}.`}
          </div>
        </div>
      )}

      <SectionTitle>Reserva de emergência</SectionTitle>
      <div style={sx.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{brl0(d.reservaAtual)}</span>
          <span style={sx.muted}>meta {brl0(d.reservaAlvo)} · {state.config.mesesReserva} meses</span>
        </div>
        <Bar2 pct={reservaPct} color="var(--teal)" />
        <div style={{ ...sx.muted, marginTop: 6 }}>{pct(reservaPct)} da meta</div>
      </div>

      <SectionTitle>Quanto vamos ter guardado · {ano}</SectionTitle>
      <div style={sx.card}>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={d.porMes} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gAcc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F6E5B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0F6E5B" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="nome" tick={{ fontSize: 11, fill: "#5E6B64" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9aa39d" }} axisLine={false} tickLine={false}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
            <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 10, border: "1px solid #E2E7E0", fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#E2E7E0" />
            <Area type="monotone" dataKey="acumulado" stroke="#0F6E5B" strokeWidth={2.5} fill="url(#gAcc)" name="Acumulado" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Onde foi o dinheiro</SectionTitle>
      {d.porCategoria.length === 0 ? <EmptyHint>Nenhuma saída lançada neste mês ainda.</EmptyHint> : (
        <div style={sx.card}>
          <ResponsiveContainer width="100%" height={Math.max(140, d.porCategoria.length * 32)}>
            <BarChart data={d.porCategoria} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 11, fill: "#4a544e" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => brl(v)} cursor={{ fill: "#f0f3ef" }}
                contentStyle={{ borderRadius: 10, border: "1px solid #E2E7E0", fontSize: 12 }} />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                {d.porCategoria.map((_, i) => <Cell key={i} fill={i === 0 ? "#0F6E5B" : "#5FA694"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {d.porPessoa.length > 1 && (
        <>
          <SectionTitle>Gasto por pessoa</SectionTitle>
          <div style={sx.card}>
            <ResponsiveContainer width="100%" height={Math.max(120, d.porPessoa.length * 34)}>
              <BarChart data={d.porPessoa} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nome" width={90} tick={{ fontSize: 11.5, fill: "#4a544e" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => brl(v)} cursor={{ fill: "#f0f3ef" }}
                  contentStyle={{ borderRadius: 10, border: "1px solid #E2E7E0", fontSize: 12 }} />
                <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                  {d.porPessoa.map((p, i) => <Cell key={i} fill={p.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

function Envelope({ e }) {
  const usado = e.teto > 0 ? Math.min(e.gastou / e.teto, 1) : 0;
  const estourou = e.teto > 0 && e.restante < 0;
  return (
    <div style={{ ...sx.envelope, borderColor: e.cor + "55" }}>
      <div style={sx.envTop}>
        <span style={{ ...sx.envName, color: e.cor }}>{e.nome}</span>
        <span style={sx.envMesada}>{e.teto > 0 ? `teto ${brl0(e.teto)}` : "sem teto"}</span>
      </div>
      {e.teto > 0 ? (
        <>
          <div style={{ ...sx.envNum, color: estourou ? "var(--brick)" : "var(--ink)" }}>{brl(e.restante)}</div>
          <div style={sx.envSub}>{estourou ? "passou do limite" : "ainda pode gastar"}</div>
          <div style={sx.envBarWrap}>
            <div style={{ ...sx.envBarFill, width: `${usado * 100}%`, background: estourou ? "var(--brick)" : e.cor }} />
          </div>
        </>
      ) : (
        <div style={{ ...sx.envNum, color: "var(--ink)" }}>{brl(e.gastou)}</div>
      )}
      <div style={sx.envFoot}>gastou {brl0(e.gastou)}</div>
    </div>
  );
}

/* ================================================================== */
/*  LANÇAR                                                             */
/* ================================================================== */
function Lancar({ d, state, update, cot }) {
  const pessoas = d.pessoas;
  const [form, setForm] = useState(() => ({
    data: todayISO(), pessoa: pessoas[0]?.id || "casa", categoria: "Mercado", descricao: "",
    valor: "", forma: "Pix", detalhe: "", contaId: "", dividaId: "", parcelas: 1,
    novaInst: "", novoTipo: "Renda fixa", novaMoeda: "BRL",
  }));

  const meta = CAT_MAP[form.categoria] || {};
  const precisaConta = !!meta.conta;
  const precisaDivida = !!meta.divida;
  const precisaDetalhe = !!meta.livre;
  const contaSel = state.investimentos.find((i) => i.id === form.contaId);
  const moedaConta = form.contaId === "__nova" ? form.novaMoeda : (contaSel?.moeda || "BRL");
  const cotAtual = moedaConta === "BRL" ? 0 : (+cot[moedaConta] || 0);

  const add = () => {
    const v = numBR(form.valor);
    if (!v || v <= 0) return;
    const n = precisaConta || precisaDivida ? 1 : Math.min(Math.max(+form.parcelas || 1, 1), 24);
    const criandoConta = precisaConta && form.contaId === "__nova";
    if (criandoConta && !form.novaInst.trim()) { alert("Dê um nome à conta."); return; }
    if (precisaConta && moedaConta !== "BRL" && !cotAtual) {
      alert("Sem cotação no momento. Tente de novo em instantes ou atualize na aba Patrimônio.");
      return;
    }

    update((st) => {
      let contaId = form.contaId;
      if (criandoConta) {
        contaId = uid();
        st.investimentos.push({
          id: contaId, instituicao: form.novaInst.trim(), tipo: form.novoTipo,
          moeda: form.novaMoeda, titular: form.pessoa, saldoInicial: 0,
        });
      }
      const base = { pessoa: form.pessoa, categoria: form.categoria, forma: form.forma };
      if (precisaDetalhe) base.detalhe = form.detalhe.trim();
      if (precisaConta && contaId) base.contaId = contaId;
      if (precisaConta && moedaConta !== "BRL") base.cotacao = cotAtual;
      if (precisaDivida && form.dividaId) base.dividaId = form.dividaId;

      if (n === 1) {
        st.transactions.push({ id: uid(), ...base, data: form.data, valor: v, descricao: form.descricao });
      } else {
        const grupo = uid();
        const parte = Math.floor((v / n) * 100) / 100;
        const sobra = +(v - parte * n).toFixed(2);
        for (let i = 0; i < n; i++) {
          st.transactions.push({
            id: uid(), ...base,
            data: somaMesesISO(form.data, i),
            valor: i === 0 ? +(parte + sobra).toFixed(2) : parte,
            descricao: `${form.descricao || form.categoria} ${i + 1}/${n}`.trim(),
            grupo, parcela: i + 1, totalParcelas: n,
          });
        }
      }
    });
    setForm((f) => ({ ...f, descricao: "", valor: "", detalhe: "", parcelas: 1, novaInst: "" }));
  };

  const del = (id) => {
    const alvo = state.transactions.find((t) => t.id === id);
    if (alvo?.grupo) {
      const total = state.transactions.filter((t) => t.grupo === alvo.grupo).length;
      const todas = window.confirm(`Esta compra tem ${total} parcelas. Apagar todas?\n\nOK = apagar todas · Cancelar = só esta`);
      update((n) => {
        n.transactions = todas
          ? n.transactions.filter((t) => t.grupo !== alvo.grupo)
          : n.transactions.filter((t) => t.id !== id);
      });
      return;
    }
    update((n) => { n.transactions = n.transactions.filter((t) => t.id !== id); });
  };
  const lista = [...d.mTx].sort((a, b) => b.data.localeCompare(a.data));
  const grupo = (tipo, nat) => CATEGORIAS.filter((c) => c.tipo === tipo && (nat ? c.natureza === nat : true));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={sx.card}>
        <div style={sx.formGrid}>
          <Field label="Data">
            <input type="date" className="inp" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </Field>
          <Field label="Valor (R$)">
            <input inputMode="decimal" className="inp" placeholder="0,00" value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} />
          </Field>
        </div>

        <Field label="De quem é este lançamento">
          <div style={sx.chipWrap}>
            {pessoas.map((p) => (
              <button key={p.id} className="seg"
                style={{ ...sx.chipBtn, ...(form.pessoa === p.id ? { background: p.cor, color: "#fff", borderColor: p.cor } : {}) }}
                onClick={() => setForm({ ...form, pessoa: p.id })}>{p.nome}</button>
            ))}
          </div>
        </Field>

        <div style={{ ...sx.formGrid, marginTop: 12 }}>
          <Field label="Categoria">
            <select className="inp" value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value, contaId: "", dividaId: "", detalhe: "" })}>
              <optgroup label="Entradas">{grupo("Entrada").map((c) => <option key={c.nome}>{c.nome}</option>)}</optgroup>
              <optgroup label="Saídas fixas">{grupo("Saída", "Fixo").map((c) => <option key={c.nome}>{c.nome}</option>)}</optgroup>
              <optgroup label="Saídas variáveis">{grupo("Saída", "Variável").map((c) => <option key={c.nome}>{c.nome}</option>)}</optgroup>
              <optgroup label="Investimento">{grupo("Investimento").map((c) => <option key={c.nome}>{c.nome}</option>)}</optgroup>
            </select>
          </Field>
          <Field label="Forma">
            <select className="inp" value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })}>
              {FORMAS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>

          {precisaDetalhe && (
            <Field label="O que foi?">
              <input className="inp" placeholder="escreva aqui" value={form.detalhe} autoFocus
                onChange={(e) => setForm({ ...form, detalhe: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} />
            </Field>
          )}
          {form.forma === "Crédito" && !precisaConta && !precisaDivida && (
            <Field label="Parcelas">
              <select className="inp" value={form.parcelas}
                onChange={(e) => setForm({ ...form, parcelas: +e.target.value })}>
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n === 1 ? "à vista" : `${n}x`}</option>
                ))}
              </select>
            </Field>
          )}
          {precisaConta && (
            <Field label="Em qual conta">
              <select className="inp" value={form.contaId} onChange={(e) => setForm({ ...form, contaId: e.target.value })}>
                <option value="">— escolha —</option>
                {state.investimentos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.instituicao || "sem nome"} · {i.tipo}{i.moeda !== "BRL" ? ` · ${i.moeda}` : ""}
                  </option>
                ))}
                <option value="__nova">+ criar conta nova</option>
              </select>
            </Field>
          )}
          {precisaConta && form.contaId === "__nova" && (
            <>
              <Field label="Nome da conta">
                <input className="inp" placeholder="ex.: Nubank, Avenue, XP" value={form.novaInst} autoFocus
                  onChange={(e) => setForm({ ...form, novaInst: e.target.value })} />
              </Field>
              <Field label="Tipo">
                <select className="inp" value={form.novoTipo} onChange={(e) => setForm({ ...form, novoTipo: e.target.value })}>
                  {TIPOS_INV.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Moeda">
                <select className="inp" value={form.novaMoeda} onChange={(e) => setForm({ ...form, novaMoeda: e.target.value })}>
                  {MOEDAS.map((m) => <option key={m.cod} value={m.cod}>{m.nome} ({m.cod})</option>)}
                </select>
              </Field>
            </>
          )}
          {precisaDivida && state.dividas.length > 0 && (
            <Field label="Abater de qual dívida">
              <select className="inp" value={form.dividaId} onChange={(e) => setForm({ ...form, dividaId: e.target.value })}>
                <option value="">— nenhuma —</option>
                {d.dividas.filter((x) => !x.quitada).map((x) => (
                  <option key={x.id} value={x.id}>{x.nome || "sem nome"} · parcela {brl0(x.parcela)}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Descrição">
            <input className="inp" placeholder="opcional" value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add()} />
          </Field>
        </div>

        {precisaConta && !form.contaId && (
          <p style={sx.warn}>Escolha a conta para o valor entrar no Patrimônio automaticamente.</p>
        )}
        {precisaConta && moedaConta !== "BRL" && (
          <p style={sx.parcelaPrev}>
            <Globe size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
            Conta em {moedaConta}. {cotAtual > 0
              ? <>Convertendo por {brl(cotAtual)} — entram {moedaFmt(numBR(form.valor) / cotAtual, moedaConta)} na conta. A cotação do dia fica gravada no lançamento.</>
              : <>Sem cotação agora — atualize na aba Patrimônio antes de lançar.</>}
          </p>
        )}
        {precisaDivida && !form.dividaId && state.dividas.length > 0 && (
          <p style={sx.warn}>Escolha a dívida para a parcela abater o saldo devedor.</p>
        )}
        {form.forma === "Crédito" && form.parcelas > 1 && numBR(form.valor) > 0 && !precisaConta && (
          <p style={sx.parcelaPrev}>
            {form.parcelas}x de {brl(numBR(form.valor) / form.parcelas)} — um lançamento por mês,
            começando em {String(form.data).slice(8, 10)}/{String(form.data).slice(5, 7)}.
          </p>
        )}
        <div style={sx.formFoot}>
          <span style={sx.tag}>{meta.tipo}{meta.natureza !== "—" ? ` · ${meta.natureza}` : ""}</span>
          <button className="primary" style={sx.primaryBtn} onClick={add}><Plus size={16} /> Adicionar</button>
        </div>
      </div>

      <SectionTitle>Lançamentos do mês ({lista.length})</SectionTitle>
      {lista.length === 0 ? <EmptyHint>Comece registrando a primeira entrada ou gasto do mês.</EmptyHint> : (
        <div style={{ display: "grid", gap: 8 }}>
          {lista.map((t) => {
            const m = CAT_MAP[t.categoria] || {};
            const p = d.pessoaPorId[t.pessoa];
            const sign = m.tipo === "Entrada" ? "+" : m.tipo === "Investimento" ? "→" : "−";
            const col = m.tipo === "Entrada" ? "var(--teal)" : m.tipo === "Investimento" ? "var(--gold)" : "var(--ink)";
            return (
              <div key={t.id} style={sx.txRow}>
                <div style={{ ...sx.txDot, background: p?.cor || "#c3cbc5" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={sx.txCat}>{rotulo(t)}</div>
                  <div style={sx.txMeta}>
                    {String(t.data).slice(8, 10)}/{String(t.data).slice(5, 7)} · {p?.nome || "—"} · {t.forma}
                    {t.descricao ? ` · ${t.descricao}` : ""}
                  </div>
                </div>
                <div style={{ ...sx.txVal, color: col }}>{sign} {brl(t.valor)}</div>
                <button className="del" style={sx.delBtn} onClick={() => del(t.id)}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  PREVISTO                                                           */
/* ================================================================== */
function Previsto({ state, update, d, ano, mes }) {
  const chave = chaveMes(ano, mes);
  const prev = d.prevMes;
  const [verVar, setVerVar] = useState(false);

  const setPrev = (cat, v) => update((n) => {
    if (!n.previsto) n.previsto = {};
    if (!n.previsto[chave]) n.previsto[chave] = {};
    if (!v) delete n.previsto[chave][cat];
    else n.previsto[chave][cat] = v;
    if (!Object.keys(n.previsto[chave]).length) delete n.previsto[chave];
  });

  const copiarAnterior = () => {
    const a = mes === 1 ? ano - 1 : ano, m = mes === 1 ? 12 : mes - 1;
    const origem = (state.previsto || {})[chaveMes(a, m)];
    if (!origem || !Object.keys(origem).length) {
      alert("O mês anterior ainda não tem valores previstos.");
      return;
    }
    update((n) => {
      if (!n.previsto) n.previsto = {};
      n.previsto[chave] = { ...origem };
    });
  };

  const rMes = (state.rendaMes || {})[chave] || {};
  const setRenda = (id, v) => update((n) => {
    if (!n.rendaMes) n.rendaMes = {};
    if (!n.rendaMes[chave]) n.rendaMes[chave] = {};
    n.rendaMes[chave][id] = v;
  });
  const limparRenda = () => update((n) => { if (n.rendaMes) delete n.rendaMes[chave]; });
  const usarEntradas = () => update((n) => {
    if (!n.rendaMes) n.rendaMes = {};
    const o = {};
    d.pessoas.forEach((p) => { const v = d.entrouDe(p.id); if (v > 0) o[p.id] = +v.toFixed(2); });
    n.rendaMes[chave] = o;
  });

  const linha = (c) => {
    const p = +prev[c.nome] || 0;
    const r = d.realizadoPorCat[c.nome] || 0;
    const dif = p - r;
    return (
      <div key={c.nome} style={sx.prevRow}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={sx.prevCat}>{c.nome}</div>
          <div style={sx.prevReal}>
            já saiu {brl0(r)}
            {p > 0 && (
              <span style={{ color: dif < 0 ? "var(--brick)" : "var(--muted)" }}>
                {dif < 0 ? ` · passou ${brl0(-dif)}` : ` · faltam ${brl0(dif)}`}
              </span>
            )}
          </div>
        </div>
        <input inputMode="decimal" className="inp2" placeholder="0"
          value={prev[c.nome] ?? ""} onChange={(e) => setPrev(c.nome, numBR(e.target.value))}
          style={{ width: 96, textAlign: "right", fontWeight: 600 }} />
      </div>
    );
  };

  const fixas = CATEGORIAS.filter((c) => c.tipo === "Saída" && c.natureza === "Fixo" && !FIXAS_ESPECIAIS.includes(c.nome));
  const variaveis = CATEGORIAS.filter((c) => c.tipo === "Saída" && c.natureza === "Variável");
  const provedores = d.pessoas.filter((p) => p.papel === "provedor" || (+p.renda || 0) > 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={sx.rowBetween}>
        <SectionTitle>Previsto para {MESES_LONGOS[mes - 1]}</SectionTitle>
        <button className="ghost" style={sx.addLink} onClick={copiarAnterior}>
          <Copy size={13} /> copiar mês anterior
        </button>
      </div>

      <div style={sx.card}>
        <div style={sx.rowBetween}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Renda deste mês</span>
          {d.rendaPropria
            ? <button className="ghost" style={sx.miniBtn} onClick={limparRenda}>voltar ao padrão</button>
            : <span style={sx.muted}>usando o padrão</span>}
        </div>
        {provedores.length === 0 ? (
          <p style={sx.help}>Ninguém marcado como "traz renda" ainda. Configure em <b>Ajustes</b>.</p>
        ) : (
          <div style={{ ...sx.cfgGrid, marginTop: 10 }}>
            {provedores.map((p) => (
              <Field key={p.id} label={`${p.nome} — neste mês`}>
                <input inputMode="decimal" className="inp" placeholder={String(p.renda || 0)}
                  value={rMes[p.id] ?? ""} onChange={(e) => setRenda(p.id, numBR(e.target.value))} />
              </Field>
            ))}
          </div>
        )}
        <div style={sx.rowBetween}>
          <span style={{ ...sx.muted, marginTop: 10 }}>Total do mês: <b>{brl(d.rendaTotal)}</b></span>
          {d.entrouTotal > 0 && (
            <button className="ghost" style={{ ...sx.miniBtn, marginTop: 10 }} onClick={usarEntradas}>
              usar o que já entrou ({brl0(d.entrouTotal)})
            </button>
          )}
        </div>
        <p style={sx.help}>
          Mês de 13º, férias ou bônus? Ajuste aqui — vale só para {MESES_LONGOS[mes - 1].toLowerCase()}.
        </p>
      </div>

      {d.parcelaMensal > 0 && (
        <div style={sx.autoNote}>
          <CalendarClock size={13} />
          <span>
            As parcelas de empréstimo e financiamento ({brl0(d.parcelaMensal)}) vêm automáticas
            da aba <b>Dívidas</b> — não precisa digitar aqui.
          </span>
        </div>
      )}

      <div style={sx.faturaCard}>
        <div style={sx.rowBetween}>
          <span style={sx.faturaTitulo}><CreditCard size={15} /> Cartão em {MESES_LONGOS[mes - 1].toLowerCase()}</span>
        </div>
        <div style={sx.faturaLinha}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span>Compras já lançadas <span style={{ opacity: .7 }}>({d.janelaFatura})</span></span>
            {d.faturaCiclo > 0 && (
              <span style={{ fontSize: 11, color: "#a08a52" }}>cada parcela aparece no mês dela</span>
            )}
          </div>
          <b>{brl(d.faturaCiclo)}</b>
        </div>
        <div style={{ ...sx.faturaLinha, alignItems: "center", borderBottom: "none" }}>
          <span>+ do cartão que ainda não lancei</span>
          <input inputMode="decimal" className="inp2" placeholder="0"
            value={prev.__faturaExtra ?? ""} onChange={(e) => setPrev("__faturaExtra", numBR(e.target.value))}
            style={{ width: 92, textAlign: "right", fontWeight: 700 }} />
        </div>
        <div style={sx.faturaTotal}>
          <span>Total até agora</span>
          <span style={sx.faturaValor}>{brl(d.faturaPrevista)}</span>
        </div>
        <div style={sx.faturaHint}>
          Segue o mesmo mês selecionado lá em cima. O total acima <b>não é descontado de novo</b> do
          que sobra: cada compra já foi descontada no mês em que foi feita. Só o campo
          "ainda não lancei" entra como custo novo.
        </div>
      </div>

      {d.faturaDuplicada && (
        <div style={sx.warnBox}>
          Atenção: foi lançada uma <b>Fatura do cartão</b> e também compras no crédito neste mês.
          O mesmo dinheiro está contado duas vezes. Escolha um jeito só.
        </div>
      )}

      <SectionTitle>Contas fixas</SectionTitle>
      <div style={sx.card}>
        {fixas.map(linha)}
        {!d.algumaFixaDigitada && (
          <p style={{ ...sx.help, marginBottom: 0 }}>
            Nada preenchido: valendo a estimativa geral de Ajustes ({brl0(state.config.fixasEstimadas)}).
          </p>
        )}
        <div style={{ ...sx.prevRow, borderBottom: "none", paddingTop: 12, marginTop: 4, borderTop: "1px solid var(--line)" }}>
          <div style={{ flex: 1, fontWeight: 700 }}>Fixas + parcelas + fatura</div>
          <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 16 }}>{brl(d.fixasPrevistas)}</div>
        </div>
      </div>

      <button className="ghost" style={sx.expandBtn} onClick={() => setVerVar(!verVar)}>
        {verVar ? "Esconder" : "Também quero prever"} os gastos variáveis
      </button>
      {verVar && (
        <div style={sx.card}>
          <p style={{ ...sx.help, marginTop: 0, marginBottom: 10 }}>
            Estes não entram na conta dos envelopes — servem só para comparar depois.
          </p>
          {variaveis.map(linha)}
        </div>
      )}

      <SectionTitle>O que sobra com isso</SectionTitle>
      <div style={sx.card}>
        {[
          ["Renda da casa no mês", d.rendaTotal],
          ["− Contas fixas", -d.fixasBase],
          ["− Parcelas de dívidas", -d.parcelaMensal],
          ["− Cartão ainda não lançado", -d.faturaExtra],
          ["− Meta de poupança", -d.metaPoup],
        ].map(([l, v]) => (
          <div key={l}>
            <div style={sx.contaLinha}><span>{l}</span><span>{brl(v)}</span></div>
            {l === "− Cartão ainda não lançado" && d.faturaCiclo > 0 && (
              <div style={sx.subNota}>
                Fatura total do mês: <b>{brl(d.faturaPrevista)}</b>. Os {brl0(d.faturaCiclo)} já
                lançados saem dos envelopes — por isso não entram aqui de novo.
              </div>
            )}
          </div>
        ))}
        <div style={{ ...sx.contaLinha, ...sx.contaTotal }}>
          <span>= Livre para os envelopes</span><span>{brl(d.disponivel)}</span>
        </div>
        <div style={sx.envSimul}>
          {d.envelopes.filter((e) => e.teto > 0).map((e) => (
            <div key={e.id}><span style={sx.muted}>{e.nome}</span><b style={{ color: e.cor }}>{brl0(e.teto)}</b></div>
          ))}
        </div>
        <div style={{ ...sx.contaLinha, borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 10, fontWeight: 700 }}>
          <span>{d.folga >= 0 ? "Folga da casa" : "Falta para fechar"}</span>
          <span style={{ color: d.folga >= 0 ? "var(--teal)" : "var(--brick)" }}>{brl(Math.abs(d.folga))}</span>
        </div>
        <div style={sx.investLinha}>
          <PiggyBank size={14} />
          <span>Vai para investimento: <b>{brl(d.metaPoup)}</b> — aportado até agora {brl0(d.aportes)}</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DÍVIDAS                                                            */
/* ================================================================== */
function Dividas({ state, update, d }) {
  const [abrir, setAbrir] = useState(null);

  const addDiv = () => update((n) => {
    n.dividas.push({
      id: uid(), nome: "", tipo: "Financiamento imobiliário", credor: "",
      valorOriginal: 0, saldoInicial: 0, dataRef: todayISO(),
      parcela: 0, totalParcelas: 0, parcelasPagas: 0, diaVencimento: 10, taxaMes: 0,
    });
  });
  const setDiv = (id, k, v) => update((n) => { const x = n.dividas.find((y) => y.id === id); if (x) x[k] = v; });
  const delDiv = (id) => {
    if (!window.confirm("Apagar esta dívida? Os lançamentos já feitos continuam no histórico.")) return;
    update((n) => { n.dividas = n.dividas.filter((x) => x.id !== id); });
  };
  const acertarSaldo = (x) => {
    const txt = window.prompt(`Saldo devedor real de "${x.nome || "dívida"}" hoje (veja no extrato do banco):`, x.saldo.toFixed(2));
    if (txt === null) return;
    update((n) => {
      const alvo = n.dividas.find((y) => y.id === x.id);
      if (!alvo) return;
      alvo.saldoInicial = numBR(txt) + x.pago;
    });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...sx.hero, background: "linear-gradient(135deg,#8B3F2A,#5E2718)" }}>
        <div style={sx.heroEye}>SALDO DEVEDOR</div>
        <div style={{ ...sx.heroNum, color: "#FBE7DF" }}>{brl(d.dividaTotal)}</div>
        <div style={sx.heroRow}>
          <span style={sx.heroChip}><CalendarClock size={13} /> {brl0(d.parcelaMensal)} por mês</span>
          {d.ultimaQuitacao && <span style={sx.heroChip}>livre em {mesAno(d.ultimaQuitacao)}</span>}
        </div>
        {d.jurosTotal > 0 && (
          <div style={sx.heroSavings}>ainda a pagar em juros, se seguir até o fim: <b>{brl0(d.jurosTotal)}</b></div>
        )}
      </div>

      <div style={sx.rowBetween}>
        <SectionTitle>Empréstimos e financiamentos</SectionTitle>
        <button className="ghost" style={sx.addLink} onClick={addDiv}><Plus size={14} /> dívida</button>
      </div>

      {d.dividas.length === 0 ? (
        <EmptyHint>
          Nenhuma dívida cadastrada. Toque em <b>+ dívida</b> e preencha valor da parcela,
          total de parcelas e quantas já foram pagas — o app calcula a data de quitação sozinho.
        </EmptyHint>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {d.dividas.map((x) => {
            const aberto = abrir === x.id;
            return (
              <div key={x.id} style={{ ...sx.dividaCard, opacity: x.quitada ? .65 : 1 }}>
                <div style={sx.rowBetween}>
                  <div style={{ minWidth: 0 }}>
                    <div style={sx.dividaNome}>{x.nome || "sem nome"}</div>
                    <div style={sx.dividaSub}>
                      {x.tipo}{x.credor ? ` · ${x.credor}` : ""}
                    </div>
                  </div>
                  <button className="ghost" style={sx.miniBtn} onClick={() => setAbrir(aberto ? null : x.id)}>
                    {aberto ? <><X size={13} /> fechar</> : <><Pencil size={13} /> editar</>}
                  </button>
                </div>

                {x.quitada ? (
                  <div style={sx.quitadoTag}><Check size={13} /> Quitada</div>
                ) : (
                  <>
                    <div style={sx.dividaNums}>
                      <div>
                        <span style={sx.dividaLabel}>falta pagar</span>
                        <b style={{ ...sx.dividaVal, color: "var(--brick)" }}>{brl(x.saldo)}</b>
                      </div>
                      <div>
                        <span style={sx.dividaLabel}>parcela</span>
                        <b style={sx.dividaVal}>{brl0(x.parcela)}</b>
                      </div>
                      <div>
                        <span style={sx.dividaLabel}>quita em</span>
                        <b style={{ ...sx.dividaVal, color: "var(--teal)" }}>{mesAno(x.quitacao)}</b>
                      </div>
                    </div>
                    <Bar2 pct={x.progresso} color="var(--teal)" />
                    <div style={sx.rowBetween}>
                      <span style={sx.dividaFoot}>
                        {x.pagasTotal} de {x.totalParcelas || "?"} parcelas · faltam {x.restantes}
                      </span>
                      <span style={sx.dividaFoot}>
                        {x.mesesFalta > 0 ? `${x.mesesFalta} ${x.mesesFalta === 1 ? "mês" : "meses"}` : "último mês"}
                      </span>
                    </div>
                    {x.jurosRest > 0 && (
                      <div style={sx.dividaJuros}>
                        Ainda vai desembolsar {brl0(x.aPagar)} para quitar {brl0(x.saldo)} —
                        são <b>{brl0(x.jurosRest)}</b> de juros pela frente.
                      </div>
                    )}
                  </>
                )}

                {aberto && (
                  <div style={sx.dividaForm}>
                    <div style={sx.cfgGrid}>
                      <Field label="Nome">
                        <input className="inp" placeholder="ex.: Apartamento" value={x.nome}
                          onChange={(e) => setDiv(x.id, "nome", e.target.value)} />
                      </Field>
                      <Field label="Tipo">
                        <select className="inp" value={x.tipo} onChange={(e) => setDiv(x.id, "tipo", e.target.value)}>
                          {TIPOS_DIVIDA.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field label="Banco / credor">
                        <input className="inp" placeholder="ex.: Caixa" value={x.credor}
                          onChange={(e) => setDiv(x.id, "credor", e.target.value)} />
                      </Field>
                      <Field label="Valor financiado">
                        <input inputMode="decimal" className="inp" value={x.valorOriginal}
                          onChange={(e) => setDiv(x.id, "valorOriginal", numBR(e.target.value))} />
                      </Field>
                      <Field label="Saldo devedor hoje">
                        <input inputMode="decimal" className="inp" value={x.saldoInicial}
                          onChange={(e) => setDiv(x.id, "saldoInicial", numBR(e.target.value))} />
                      </Field>
                      <Field label="Data desse saldo">
                        <input type="date" className="inp" value={x.dataRef}
                          onChange={(e) => setDiv(x.id, "dataRef", e.target.value)} />
                      </Field>
                      <Field label="Valor da parcela">
                        <input inputMode="decimal" className="inp" value={x.parcela}
                          onChange={(e) => setDiv(x.id, "parcela", numBR(e.target.value))} />
                      </Field>
                      <Field label="Dia do vencimento">
                        <input inputMode="numeric" className="inp" value={x.diaVencimento}
                          onChange={(e) => setDiv(x.id, "diaVencimento", Math.min(Math.max(numBR(e.target.value) || 1, 1), 28))} />
                      </Field>
                      <Field label="Total de parcelas">
                        <input inputMode="numeric" className="inp" value={x.totalParcelas}
                          onChange={(e) => setDiv(x.id, "totalParcelas", numBR(e.target.value))} />
                      </Field>
                      <Field label="Já pagas até a data acima">
                        <input inputMode="numeric" className="inp" value={x.parcelasPagas}
                          onChange={(e) => setDiv(x.id, "parcelasPagas", numBR(e.target.value))} />
                      </Field>
                      <Field label="Juros (% ao mês)">
                        <input inputMode="decimal" className="inp" value={x.taxaMes}
                          onChange={(e) => setDiv(x.id, "taxaMes", numBR(e.target.value))} />
                      </Field>
                    </div>
                    <p style={sx.help}>
                      O saldo cai sozinho a cada parcela lançada na aba <b>Lançar</b> (categoria
                      "Empréstimo / Financiamento", escolhendo esta dívida). Como o banco cobra juros
                      sobre o saldo, de tempos em tempos vale conferir o extrato e usar "acertar saldo".
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <button className="ghost" style={sx.softBtn} onClick={() => acertarSaldo(x)}>
                        <RefreshCw size={14} /> Acertar saldo
                      </button>
                      <button className="del" style={{ ...sx.softBtn, color: "var(--brick)" }} onClick={() => delDiv(x.id)}>
                        <Trash2 size={14} /> Apagar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {d.liberacao.length > 0 && (
        <>
          <SectionTitle>Quando o caixa se abre</SectionTitle>
          <div style={sx.card}>
            <p style={{ ...sx.help, marginTop: 0, marginBottom: 14 }}>
              Cada dívida que acaba devolve a parcela ao orçamento. Esta é a ordem em que isso acontece:
            </p>
            <div style={sx.timeline}>
              {d.liberacao.map((m, i) => (
                <div key={m.id} style={sx.tlItem}>
                  <div style={sx.tlDotWrap}>
                    <div style={sx.tlDot} />
                    {i < d.liberacao.length - 1 && <div style={sx.tlLine} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i < d.liberacao.length - 1 ? 18 : 0 }}>
                    <div style={sx.tlData}>{mesAno(m.data)}</div>
                    <div style={sx.tlNome}>acaba {m.nome}</div>
                    <div style={sx.tlValor}>
                      + {brl0(m.parcela)} por mês
                      {i > 0 && <span style={sx.tlAcum}> · total livre a partir daqui: {brl0(m.acumulado)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={sx.tlFinal}>
              A partir de {mesAno(d.ultimaQuitacao)}, a casa terá <b>{brl0(d.parcelaMensal)}</b> a
              mais por mês — hoje isso é {d.rendaTotal > 0 ? pct(d.parcelaMensal / d.rendaTotal) : "—"} da renda.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  PATRIMÔNIO                                                         */
/* ================================================================== */
function Patrimonio({ state, update, d, cot, cotCarregando, buscarCot }) {
  const addInv = () => update((n) => n.investimentos.push({ id: uid(), instituicao: "", tipo: "Renda fixa", moeda: "BRL", titular: "casa", saldoInicial: 0 }));
  const setInv = (id, k, v) => update((n) => { const i = n.investimentos.find((x) => x.id === id); if (i) i[k] = v; });
  const delInv = (id) => update((n) => { n.investimentos = n.investimentos.filter((x) => x.id !== id); });

  const reconciliar = (i) => {
    const atual = d.investimentos.find((x) => x.id === i.id);
    const m = i.moeda || "BRL";
    const txt = window.prompt(`Saldo real de "${i.instituicao || "conta"}" no extrato hoje (em ${m}):`, atual.saldoMoeda.toFixed(2));
    if (txt === null) return;
    const real = numBR(txt);
    setInv(i.id, "saldoInicial", +(real - atual.aportado + atual.resgatado).toFixed(2));
  };

  const addMeta = () => update((n) => n.metas.push({ id: uid(), objetivo: "", prazo: "", alvo: 0, guardado: 0 }));
  const setMeta = (id, k, v) => update((n) => { const m = n.metas.find((x) => x.id === id); if (m) m[k] = v; });
  const delMeta = (id) => update((n) => { n.metas = n.metas.filter((x) => x.id !== id); });

  const cotHora = cot.at ? new Date(cot.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...sx.hero, background: "linear-gradient(135deg,#17211E,#0A4C40)" }}>
        <div style={sx.heroEye}>PATRIMÔNIO LÍQUIDO</div>
        <div style={{ ...sx.heroNum, color: d.patrimonio >= 0 ? "#EAF6F1" : "#F6D9CF" }}>{brl(d.patrimonio)}</div>
        <div style={sx.heroRow}>
          <span style={sx.heroChip}><Landmark size={13} /> {brl0(d.invTotal)} investido</span>
          <span style={sx.heroChip}>− {brl0(d.dividaTotal)} dívidas</span>
          {d.invExterior > 0 && <span style={sx.heroChip}><Globe size={13} /> {brl0(d.invExterior)} no exterior</span>}
        </div>
      </div>

      <div style={sx.cotCard}>
        <div style={sx.rowBetween}>
          <span style={sx.cotTitulo}><Globe size={15} /> Câmbio de hoje</span>
          <button className="ghost" style={sx.miniBtn} onClick={buscarCot} disabled={cotCarregando}>
            <RefreshCw size={12} style={cotCarregando ? { animation: "spin 1s linear infinite" } : undefined} /> atualizar
          </button>
        </div>
        <div style={sx.cotRow}>
          <div><span style={sx.cotLabel}>Dólar</span><b style={sx.cotVal}>{cot.USD ? brl(cot.USD) : "—"}</b></div>
          <div><span style={sx.cotLabel}>Euro</span><b style={sx.cotVal}>{cot.EUR ? brl(cot.EUR) : "—"}</b></div>
        </div>
        <div style={sx.cotFoot}>
          {cotHora ? `atualizado às ${cotHora}` : "sem cotação ainda — toque em atualizar"}
          {" · fonte AwesomeAPI"}
        </div>
      </div>

      <div style={sx.autoNote}>
        <RefreshCw size={13} />
        <span>Os saldos sobem sozinhos a cada aporte lançado. Você só mexe aqui para criar uma conta ou acertar com o extrato.</span>
      </div>
      {d.semConta > 0 && (
        <div style={sx.warnBox}>
          {brl0(d.semConta)} em aportes ainda não têm conta escolhida — esse valor não entrou no patrimônio.
        </div>
      )}

      <div style={sx.rowBetween}>
        <SectionTitle>Investimentos</SectionTitle>
        <button className="ghost" style={sx.addLink} onClick={addInv}><Plus size={14} /> conta</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {d.investimentos.map((i) => (
          <div key={i.id} style={sx.editCard}>
            <div style={sx.rowBetween}>
              <input className="inp2" placeholder="Instituição" value={i.instituicao}
                onChange={(e) => setInv(i.id, "instituicao", e.target.value)} style={{ fontWeight: 700, flex: 1 }} />
              <div style={sx.saldoAtual}>{brl(i.saldo)}</div>
            </div>
            <div style={sx.editRow2}>
              <select className="inp2" value={i.tipo} onChange={(e) => setInv(i.id, "tipo", e.target.value)}>
                {TIPOS_INV.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select className="inp2" value={i.moeda} onChange={(e) => setInv(i.id, "moeda", e.target.value)} style={{ maxWidth: 92 }}>
                {MOEDAS.map((m) => <option key={m.cod} value={m.cod}>{m.cod}</option>)}
              </select>
              <select className="inp2" value={i.titular} onChange={(e) => setInv(i.id, "titular", e.target.value)}>
                {d.pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <button className="del" style={sx.delBtn} onClick={() => delInv(i.id)}><Trash2 size={15} /></button>
            </div>
            <div style={sx.rowBetween}>
              <div style={sx.saldoBreak}>
                {i.moeda !== "BRL"
                  ? <>{moedaFmt(i.saldoMoeda, i.moeda)} × {i.taxaAtual ? brl(i.taxaAtual) : "sem cotação"}</>
                  : <>inicial {brl0(i.saldoInicial)} + aportes {brl0(i.aportado)}{i.resgatado > 0 ? ` − resgates ${brl0(i.resgatado)}` : ""}</>}
              </div>
              <button className="ghost" style={sx.miniBtn} onClick={() => reconciliar(i)}>Acertar saldo</button>
            </div>
            {i.semCotacao && (
              <div style={sx.warnInline}>Sem cotação de {i.moeda} agora — o valor em reais está zerado até atualizar o câmbio.</div>
            )}
          </div>
        ))}
      </div>

      <div style={sx.rowBetween}>
        <SectionTitle>Metas</SectionTitle>
        <button className="ghost" style={sx.addLink} onClick={addMeta}><Plus size={14} /> meta</button>
      </div>
      {state.metas.map((m) => {
        const guardado = m.auto ? d.reservaAtual : (+m.guardado || 0);
        const p = m.alvo > 0 ? Math.min(guardado / m.alvo, 1) : 0;
        return (
          <div key={m.id} style={sx.card}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <Target size={15} style={{ color: "var(--gold)", flexShrink: 0 }} />
              <input className="inp2" placeholder="Objetivo" value={m.objetivo}
                onChange={(e) => setMeta(m.id, "objetivo", e.target.value)} style={{ flex: 1, fontWeight: 700, fontSize: 15 }} />
              {!m.auto && <button className="del" style={sx.delBtn} onClick={() => delMeta(m.id)}><Trash2 size={15} /></button>}
            </div>
            <div style={sx.metaRow}>
              <label style={sx.metaField}>alvo
                <input inputMode="decimal" className="inp2" value={m.alvo} onChange={(e) => setMeta(m.id, "alvo", numBR(e.target.value))} />
              </label>
              <label style={sx.metaField}>guardado
                <input inputMode="decimal" className="inp2" disabled={m.auto}
                  value={m.auto ? guardado.toFixed(2) : m.guardado}
                  onChange={(e) => setMeta(m.id, "guardado", numBR(e.target.value))} />
              </label>
              <label style={sx.metaField}>prazo
                <input className="inp2" placeholder="ex.: dez/27" value={m.prazo} onChange={(e) => setMeta(m.id, "prazo", e.target.value)} />
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <Bar2 pct={p} color="var(--gold)" />
              <div style={sx.rowBetween}>
                <span style={{ ...sx.muted, marginTop: 6 }}>{pct(p)}{m.auto && " · segue a reserva"}</span>
                <span style={{ ...sx.muted, marginTop: 6 }}>faltam {brl0(Math.max(m.alvo - guardado, 0))}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  AJUSTES                                                            */
/* ================================================================== */
function Ajustes({ state, update, setState, d }) {
  const c = state.config;
  const set = (k, v) => update((n) => { n.config[k] = v; });
  const setPes = (id, k, v) => update((n) => { const p = n.config.pessoas.find((x) => x.id === id); if (p) p[k] = v; });
  const addPes = () => update((n) => n.config.pessoas.push(novaPessoa("", "membro", n.config.pessoas.length)));
  const delPes = (id) => {
    const p = c.pessoas.find((x) => x.id === id);
    if (p?.papel === "casa") { alert("O envelope da Casa não pode ser removido."); return; }
    const usados = state.transactions.filter((t) => t.pessoa === id).length;
    if (usados > 0 && !window.confirm(`${p.nome} tem ${usados} lançamentos. Apagar mesmo assim? Os lançamentos ficam sem dono.`)) return;
    update((n) => { n.config.pessoas = n.config.pessoas.filter((x) => x.id !== id); });
  };

  const exportar = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cofre-familia-backup-${todayISO()}.json`;
    a.click();
  };
  const importar = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { setState({ ...migrar(JSON.parse(r.result)), _rev: Date.now() }); } catch { alert("Arquivo inválido."); } };
    r.readAsText(file);
  };
  const exportarCSV = () => {
    const linhas = [["data", "pessoa", "categoria", "detalhe", "descricao", "forma", "valor"]];
    [...state.transactions].sort((a, b) => a.data.localeCompare(b.data)).forEach((t) => {
      linhas.push([t.data, d.pessoaPorId[t.pessoa]?.nome || "", t.categoria, t.detalhe || "", t.descricao || "", t.forma, String(t.valor).replace(".", ",")]);
    });
    const csv = "\uFEFF" + linhas.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `cofre-familia-lancamentos-${todayISO()}.csv`;
    a.click();
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionTitle>Identidade do app</SectionTitle>
      <div style={sx.card}>
        <div style={sx.cfgGrid}>
          <Field label="Nome do cofre">
            <input className="inp" value={c.nomeLar} onChange={(e) => set("nomeLar", e.target.value)} />
          </Field>
          <Field label="Legenda">
            <input className="inp" value={c.subtitulo} onChange={(e) => set("subtitulo", e.target.value)} />
          </Field>
        </div>
      </div>

      <div style={sx.rowBetween}>
        <SectionTitle>Quem mora na casa</SectionTitle>
        <button className="ghost" style={sx.addLink} onClick={addPes}><Plus size={14} /> pessoa</button>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {c.pessoas.map((p) => (
          <div key={p.id} style={{ ...sx.editCard, borderLeft: `4px solid ${p.cor}` }}>
            <div style={sx.editRow2}>
              <input className="inp2" placeholder="Nome" value={p.nome}
                onChange={(e) => setPes(p.id, "nome", e.target.value)} style={{ flex: 2, fontWeight: 700 }} />
              <select className="inp2" value={p.papel} onChange={(e) => setPes(p.id, "papel", e.target.value)} style={{ flex: 1 }}>
                {PAPEIS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
              </select>
              {p.papel !== "casa" && (
                <button className="del" style={sx.delBtn} onClick={() => delPes(p.id)}><Trash2 size={15} /></button>
              )}
            </div>
            <div style={sx.editRow2}>
              {(p.papel === "provedor") && (
                <label style={sx.metaField}>renda por mês
                  <input inputMode="decimal" className="inp2" value={p.renda}
                    onChange={(e) => setPes(p.id, "renda", numBR(e.target.value))} />
                </label>
              )}
              <label style={sx.metaField}>envelope por mês
                <input inputMode="decimal" className="inp2" value={p.envelope}
                  onChange={(e) => setPes(p.id, "envelope", numBR(e.target.value))} />
              </label>
              <label style={sx.metaField}>cor
                <input type="color" className="inp2" value={p.cor} style={{ padding: 2, height: 34 }}
                  onChange={(e) => setPes(p.id, "cor", e.target.value)} />
              </label>
            </div>
          </div>
        ))}
      </div>
      <p style={sx.help}>
        <b>Traz renda</b> soma no total do mês. <b>Envelope</b> é quanto aquela pessoa (ou pet) pode
        gastar em variáveis por mês — mesada da filha, ração e veterinário do cachorro, e assim por
        diante. Deixe em zero para acompanhar o gasto sem limite.
      </p>

      <SectionTitle>Contas e poupança</SectionTitle>
      <div style={sx.card}>
        <div style={sx.cfgGrid}>
          <Field label="Contas fixas — estimativa (sem cartão e sem parcelas)">
            <input inputMode="decimal" className="inp" value={c.fixasEstimadas} onChange={(e) => set("fixasEstimadas", numBR(e.target.value))} />
          </Field>
          <Field label="Meta de poupança (%)">
            <input inputMode="decimal" className="inp" value={Math.round(c.metaPoupanca * 100)}
              onChange={(e) => set("metaPoupanca", numBR(e.target.value) / 100)} />
          </Field>
          <Field label="Reserva (meses de despesa)">
            <input inputMode="numeric" className="inp" value={c.mesesReserva} onChange={(e) => set("mesesReserva", numBR(e.target.value))} />
          </Field>
        </div>
        <div style={sx.resumoCascata}>
          <div><span style={sx.muted}>Renda</span><b>{brl0(d.rendaTotal)}</b></div>
          <div><span style={sx.muted}>Fixas</span><b>− {brl0(d.fixasUsadas)}</b></div>
          <div><span style={sx.muted}>Parcelas</span><b>− {brl0(d.parcelaMensal)}</b></div>
          <div><span style={sx.muted}>Poupança</span><b>− {brl0(d.metaPoup)}</b></div>
          <div><span style={sx.muted}>Envelopes</span><b>− {brl0(d.somaEnvelopes)}</b></div>
          <div><span style={sx.muted}>{d.folga >= 0 ? "Folga" : "Falta"}</span>
            <b style={{ color: d.folga >= 0 ? "var(--teal)" : "var(--brick)" }}>{brl0(Math.abs(d.folga))}</b></div>
        </div>
        <p style={sx.help}>
          A estimativa é o ponto de partida de todo mês. Para detalhar conta por conta, use a
          aba <b>Previsto</b>. As parcelas de dívida vêm sozinhas da aba <b>Dívidas</b>.
        </p>
      </div>

      <SectionTitle>Cartão e início do mês</SectionTitle>
      <div style={sx.card}>
        <div style={sx.cfgGrid}>
          <Field label="Dia do fechamento do cartão">
            <input inputMode="numeric" className="inp" value={c.diaFechamento ?? 26}
              onChange={(e) => set("diaFechamento", Math.min(Math.max(numBR(e.target.value), 1), 28))} />
          </Field>
          <Field label="O mês começa no dia">
            <input inputMode="numeric" className="inp" value={c.diaInicioMes ?? 1}
              onChange={(e) => set("diaInicioMes", Math.min(Math.max(numBR(e.target.value) || 1, 1), 28))} />
          </Field>
        </div>
        <p style={sx.help}>
          Se o salário cai antes do fim do mês, coloque aqui o dia em que ele chega. Aí tudo desse
          dia em diante já conta no mês seguinte, junto das contas que esse salário paga.
          {(c.diaInicioMes ?? 1) > 1 && <> Hoje o mês vai do dia {c.diaInicioMes} ao dia {c.diaInicioMes - 1} do mês seguinte.</>}
        </p>
      </div>

      <SectionTitle>Os dados</SectionTitle>
      <div style={sx.card}>
        <div style={sx.modoBox}>
          {MODO === "nuvem"
            ? <><Cloud size={15} style={{ color: "var(--teal)" }} /> <span>Sincronizado na nuvem — todos os aparelhos da família veem os mesmos dados.</span></>
            : <><HardDrive size={15} style={{ color: "var(--gold)" }} /> <span>Salvo só neste aparelho. Para sincronizar, ligue a nuvem (veja o manual).</span></>}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button className="ghost" style={sx.softBtn} onClick={exportar}><Download size={15} /> Baixar backup</button>
          <label className="ghost" style={sx.softBtn}><Upload size={15} /> Restaurar backup
            <input type="file" accept="application/json" onChange={importar} style={{ display: "none" }} />
          </label>
          <button className="ghost" style={sx.softBtn} onClick={exportarCSV}><Download size={15} /> Lançamentos em CSV</button>
        </div>
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTES BASE                                                   */
/* ================================================================== */
const SectionTitle = ({ children }) => <h2 style={sx.sectionTitle}>{children}</h2>;
const Field = ({ label, children }) => (<label style={sx.field}><span style={sx.fieldLabel}>{label}</span>{children}</label>);
const EmptyHint = ({ children }) => <div style={sx.empty}>{children}</div>;
function Kpi({ label, value, tone, hint }) {
  const col = tone === "teal" ? "var(--teal)" : tone === "brick" ? "var(--brick)" : "var(--ink)";
  return (
    <div style={sx.kpi}>
      <div style={sx.kpiLabel}>{label}</div>
      <div style={{ ...sx.kpiVal, color: col }}>{value}</div>
      {hint && <div style={sx.kpiHint}>{hint}</div>}
    </div>
  );
}
const Bar2 = ({ pct, color }) => (
  <div style={sx.bar2}><div style={{ ...sx.bar2fill, width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} /></div>
);

/* ================================================================== */
/*  ESTILOS                                                            */
/* ================================================================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
:root{--bg:#EDF1EC;--surface:#FFFFFF;--ink:#17211E;--muted:#5E6B64;--teal:#0F6E5B;--teal-dk:#0A4C40;--gold:#B4842F;--plum:#8A466A;--brick:#BB5138;--line:#E2E7E0;}
*{box-sizing:border-box}
body{margin:0;background:#EDF1EC}
.inp,.inp2,select,input,button{font-family:Inter,system-ui,sans-serif}
.inp{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#fff;font-size:14px;color:var(--ink);outline:none}
.inp:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(15,110,91,.12)}
.inp2{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;font-size:13px;color:var(--ink);outline:none}
.inp2:focus{border-color:var(--teal)}
.inp2:disabled{background:#f4f6f3;color:#8a938d}
button{cursor:pointer;border:none;background:none}
button:disabled{opacity:.5;cursor:default}
.primary:hover{filter:brightness(1.06)}
.ghost:hover{background:#e6ebe5}
.seg:active{transform:scale(.97)}
.del{opacity:.45;transition:opacity .15s}
.del:hover{opacity:1;color:var(--brick)}
*:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const sx = {
  root: { fontFamily: "Inter,system-ui,sans-serif", background: "var(--bg)", color: "var(--ink)", minHeight: "100vh", paddingBottom: 78, maxWidth: 760, margin: "0 auto", position: "relative" },
  loadingWrap: { display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#5E6B64", fontFamily: "Inter,system-ui,sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px 10px" },
  brand: { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
  brandMark: { width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,var(--teal),var(--teal-dk))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  brandTitle: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 19, lineHeight: 1 },
  brandSub: { fontSize: 11, color: "var(--muted)", marginTop: 3 },
  saveDot: { fontSize: 10.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" },
  monthBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "4px 0 14px" },
  monthArrow: { width: 34, height: 34, borderRadius: 9, fontSize: 22, color: "var(--ink)", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid var(--line)" },
  monthLabel: { fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 17, minWidth: 160, textAlign: "center" },
  monthJanela: { fontSize: 10.5, color: "var(--muted)", textAlign: "center", marginTop: 2 },
  main: { padding: "0 16px" },

  hero: { background: "linear-gradient(135deg,var(--teal),var(--teal-dk))", borderRadius: 18, padding: "22px 22px 20px", color: "#fff", boxShadow: "0 10px 30px -12px rgba(10,76,64,.5)" },
  heroEye: { fontSize: 11, letterSpacing: 1.5, opacity: .8, fontWeight: 600 },
  heroNum: { fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 40, lineHeight: 1.05, margin: "6px 0 12px" },
  heroRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  heroChip: { display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.14)", padding: "5px 10px", borderRadius: 20, fontSize: 12.5, fontWeight: 500 },
  heroSavings: { marginTop: 12, fontSize: 12.5, opacity: .92 },

  kpiRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  kpi: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "13px 13px 12px" },
  kpiLabel: { fontSize: 11, color: "var(--muted)", fontWeight: 500, lineHeight: 1.2 },
  kpiVal: { fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 19, marginTop: 5 },
  kpiHint: { fontSize: 10, color: "#9aa39d", marginTop: 3 },

  sectionTitle: { fontFamily: "Fraunces,serif", fontSize: 15, fontWeight: 600, margin: "4px 2px", color: "var(--ink)" },
  card: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 16 },
  muted: { fontSize: 12, color: "var(--muted)" },
  empty: { background: "#fff", border: "1px dashed #cfd8d1", borderRadius: 14, padding: "18px 16px", fontSize: 13.5, color: "var(--muted)", textAlign: "center", lineHeight: 1.55 },
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },

  envGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 },
  envelope: { background: "var(--surface)", border: "2px solid", borderRadius: 16, padding: "14px 14px 12px" },
  envTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, gap: 6, flexWrap: "wrap" },
  envName: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 16 },
  envMesada: { fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap" },
  envNum: { fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 22, lineHeight: 1 },
  envSub: { fontSize: 10.5, color: "var(--muted)", marginTop: 2, marginBottom: 10 },
  envBarWrap: { height: 8, background: "#eef1ee", borderRadius: 20, overflow: "hidden" },
  envBarFill: { height: "100%", borderRadius: 20, transition: "width .5s cubic-bezier(.2,.7,.3,1)" },
  envFoot: { fontSize: 10.5, color: "var(--muted)", marginTop: 7 },
  mesadaBreak: { display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11.5, color: "var(--muted)", padding: "0 2px" },
  envSimul: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))", gap: 8, marginTop: 14, padding: "12px 0 0", borderTop: "1px solid var(--line)", textAlign: "center", fontSize: 14, fontFamily: "Fraunces,serif" },
  resumoCascata: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))", gap: 8, marginTop: 14, padding: "12px 0 0", borderTop: "1px solid var(--line)", textAlign: "center", fontSize: 14, fontFamily: "Fraunces,serif" },

  bar2: { height: 10, background: "#eef1ee", borderRadius: 20, overflow: "hidden" },
  bar2fill: { height: "100%", borderRadius: 20, transition: "width .5s ease" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel: { fontSize: 11.5, color: "var(--muted)", fontWeight: 600 },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  chipBtn: { padding: "7px 13px", borderRadius: 20, fontSize: 13, fontWeight: 600, color: "var(--muted)", background: "#fff", border: "1px solid var(--line)" },
  formFoot: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 10 },
  tag: { fontSize: 11.5, color: "var(--muted)", background: "#f1f4f0", padding: "5px 10px", borderRadius: 20 },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: "var(--teal)", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 14, fontWeight: 600 },
  parcelaPrev: { fontSize: 12, color: "var(--teal)", marginTop: 10, marginBottom: 0, background: "#EAF3EF", padding: "8px 11px", borderRadius: 9, lineHeight: 1.5 },
  warn: { fontSize: 12, color: "var(--gold)", marginTop: 10, marginBottom: 0 },
  warnBox: { background: "#FFF7E6", border: "1px solid #F0DEB4", borderRadius: 12, padding: "10px 13px", fontSize: 12.5, color: "#7A5B18", lineHeight: 1.5 },
  warnInline: { fontSize: 11, color: "#8A6416", background: "#FFF7E6", padding: "6px 9px", borderRadius: 8 },
  okBox: { background: "#EAF3EF", border: "1px solid #CFE3DA", borderRadius: 12, padding: "10px 13px", fontSize: 12.5, color: "#22574A", lineHeight: 1.5 },

  txRow: { display: "flex", alignItems: "center", gap: 11, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 12px" },
  txDot: { width: 9, height: 9, borderRadius: 9, flexShrink: 0 },
  txCat: { fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  txMeta: { fontSize: 11.5, color: "var(--muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  txVal: { fontFamily: "Fraunces,serif", fontWeight: 600, fontSize: 15, whiteSpace: "nowrap" },
  delBtn: { padding: 6, borderRadius: 8, color: "var(--muted)", display: "flex" },

  editCard: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 12, display: "grid", gap: 8 },
  editRow2: { display: "flex", gap: 8, alignItems: "flex-end" },
  addLink: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600, color: "var(--teal)", padding: "6px 10px", borderRadius: 8, background: "#fff", border: "1px solid var(--line)", whiteSpace: "nowrap" },
  miniBtn: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--muted)", padding: "7px 9px", borderRadius: 8, background: "#f4f6f3", border: "1px solid var(--line)", whiteSpace: "nowrap" },
  saldoAtual: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", marginLeft: 8 },
  saldoBreak: { fontSize: 11, color: "#8f9a93" },
  autoNote: { display: "flex", gap: 8, alignItems: "flex-start", background: "#EAF3EF", border: "1px solid #CFE3DA", borderRadius: 12, padding: "10px 13px", fontSize: 12.5, color: "#22574A", lineHeight: 1.45 },

  cfgGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  help: { fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginTop: 12, marginBottom: 0 },
  softBtn: { display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--ink)", padding: "9px 14px", borderRadius: 10, background: "#fff", border: "1px solid var(--line)" },
  modoBox: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.45 },

  metaRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  metaField: { display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "var(--muted)", fontWeight: 600, flex: 1, minWidth: 0 },

  prevRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F2F5F1" },
  prevCat: { fontSize: 13.5, fontWeight: 500 },
  prevReal: { fontSize: 11, color: "var(--muted)", marginTop: 2 },
  faturaCard: { background: "#FFFCF4", border: "1px solid #EBDCB8", borderRadius: 14, padding: 15 },
  faturaTitulo: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 15, color: "#8A6416" },
  faturaValor: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 19, color: "#8A6416" },
  faturaLinha: { display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, color: "#6b5b33", padding: "8px 0", borderBottom: "1px solid #EFE6D0" },
  faturaTotal: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 11, marginTop: 2, borderTop: "2px solid #E3D3A6", fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 14, color: "#8A6416" },
  faturaHint: { fontSize: 11.5, color: "#8a7a55", marginTop: 7, lineHeight: 1.45 },
  expandBtn: { fontSize: 12.5, fontWeight: 600, color: "var(--teal)", padding: "10px", borderRadius: 10, background: "#fff", border: "1px dashed #cfd8d1" },
  contaLinha: { display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "7px 0", color: "var(--ink)" },
  subNota: { fontSize: 11, color: "var(--muted)", lineHeight: 1.45, margin: "-2px 0 6px", paddingLeft: 2 },
  contaTotal: { fontWeight: 700, borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 10, fontSize: 15 },
  investLinha: { display: "flex", gap: 7, alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--teal)" },

  /* dívidas */
  dividaResumo: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, width: "100%", background: "#FDF2EE", border: "1px solid #EFCFC3", borderRadius: 14, padding: "13px 15px" },
  dividaResumoTop: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#8B3F2A" },
  dividaResumoSub: { fontSize: 11.5, color: "#a2705f", marginTop: 3 },
  dividaResumoVal: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 20, color: "#8B3F2A", whiteSpace: "nowrap" },
  dividaCard: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 15, display: "grid", gap: 10 },
  dividaNome: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  dividaSub: { fontSize: 11.5, color: "var(--muted)", marginTop: 2 },
  dividaNums: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  dividaLabel: { display: "block", fontSize: 10.5, color: "var(--muted)", fontWeight: 600 },
  dividaVal: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 16, display: "block", marginTop: 2 },
  dividaFoot: { fontSize: 11, color: "var(--muted)", marginTop: 6 },
  dividaJuros: { fontSize: 11.5, color: "#7A5B18", background: "#FFF7E6", border: "1px solid #F0DEB4", borderRadius: 9, padding: "8px 11px", lineHeight: 1.5 },
  dividaForm: { borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 4 },
  quitadoTag: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, color: "var(--teal)", background: "#EAF3EF", padding: "6px 11px", borderRadius: 20, justifySelf: "start" },

  /* linha do tempo */
  timeline: { display: "grid", gap: 0 },
  tlItem: { display: "flex", gap: 12 },
  tlDotWrap: { display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 },
  tlDot: { width: 10, height: 10, borderRadius: 10, background: "var(--teal)", marginTop: 4, flexShrink: 0 },
  tlLine: { width: 2, flex: 1, background: "#DCE5DF", marginTop: 3 },
  tlData: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 14, color: "var(--teal)" },
  tlNome: { fontSize: 13, fontWeight: 600, marginTop: 1 },
  tlValor: { fontSize: 11.5, color: "var(--muted)", marginTop: 3, lineHeight: 1.45 },
  tlAcum: { color: "#8f9a93" },
  tlFinal: { marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--teal)", lineHeight: 1.5 },

  /* câmbio */
  cotCard: { background: "#F3F7FB", border: "1px solid #D3E0EC", borderRadius: 14, padding: 15 },
  cotTitulo: { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 15, color: "#2F5675" },
  cotRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 },
  cotLabel: { display: "block", fontSize: 11, color: "#6a8299", fontWeight: 600 },
  cotVal: { fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: 20, color: "#2F5675", display: "block", marginTop: 2 },
  cotFoot: { fontSize: 11, color: "#7d93a6", marginTop: 10 },

  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 760, background: "rgba(255,255,255,.94)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-around", padding: "8px 2px 10px", zIndex: 10 },
  navBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "var(--muted)", padding: "4px 2px", flex: 1, minWidth: 0 },
  navBtnOn: { color: "var(--teal)" },
  navLabel: { fontSize: 9.5, fontWeight: 600, whiteSpace: "nowrap" },
};
