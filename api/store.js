const g = globalThis;
if (!g.__NEXO) g.__NEXO = { leads: [], seq: 1, messages: [], tasks: [], kb: [] };
if (!g.__NEXO.messages) g.__NEXO.messages = [];
if (!g.__NEXO.tasks) g.__NEXO.tasks = [];
if (!g.__NEXO.kb) g.__NEXO.kb = [];
export function store() { return g.__NEXO; }
export function priceOf(tipo) {
  if (tipo === "empresarial") return 35;
  if (tipo === "familiar") return 24;
  return 19;
}
export const STAGES = ["novo","qualificando","cotacao","proposta","aguardando","ganho","perdido"];
