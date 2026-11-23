const FUSO = 'America/Sao_Paulo';
const formatoData = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function hoje(agora = new Date()): string {
  return formatoData.format(agora);
}

export function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const ano = Number(valor.slice(0, 4));
  return (
    ano >= 1900 &&
    ano <= 2100 &&
    !Number.isNaN(Date.parse(valor)) &&
    new Date(valor).toISOString().slice(0, 10) === valor
  );
}

export function contarDias(inicio: string, fim: string): number {
  const dias = (Date.parse(fim) - Date.parse(inicio)) / 86_400_000 + 1;
  return Number.isFinite(dias) ? Math.max(0, Math.round(dias)) : 0;
}

export function somarDias(data: string, dias: number): string {
  const valor = new Date(`${data}T12:00:00Z`);
  valor.setUTCDate(valor.getUTCDate() + dias);
  return valor.toISOString().slice(0, 10);
}

export function diasNoIntervalo(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) dias.push(dia);
  return dias;
}

export function diaSemanaCurto(data: string): string {
  return DIAS_SEMANA[new Date(`${data}T12:00:00Z`).getUTCDay()]!;
}
