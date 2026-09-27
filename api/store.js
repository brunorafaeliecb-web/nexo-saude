const g = globalThis;
if (!g.__NEXO) g.__NEXO = { leads: [], seq: 1 };
export function store() { return g.__NEXO; }
export function priceOf(tipo) {
  if (tipo === "empresarial") return 35;
  if (tipo === "familiar") return 24;
  return 19;
}
