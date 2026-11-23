import type { Refeicao } from '../types/cardapio';
import { hojeSaoPaulo } from '../validation/registroRefeicao';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function formatarDia(data: string) {
  if (!data) return 'Sem data (rascunhos)';
  const [ano, mes, dia] = data.split('-').map(Number);
  const semana = diasSemana[new Date(Date.UTC(ano!, mes! - 1, dia!)).getUTCDay()];
  const rotulo = `${semana}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
  return data === hojeSaoPaulo() ? `Hoje (${rotulo})` : rotulo;
}

export function diasDasRefeicoes(refeicoes: Refeicao[]) {
  const dias = [...new Set(refeicoes.map((r) => r.data ?? ''))];
  return dias.sort((a, b) => (a || '9999').localeCompare(b || '9999'));
}

export function diaInicial(dias: string[], preferido?: string | null) {
  if (preferido !== undefined && preferido !== null && dias.includes(preferido)) return preferido;
  const hoje = hojeSaoPaulo();
  const comData = dias.filter(Boolean);
  return dias.find((d) => d && d >= hoje) ?? comData[comData.length - 1] ?? dias[0] ?? '';
}

interface Props {
  dias: string[];
  valor: string;
  onChange: (dia: string) => void;
}

export default function FiltroDia({ dias, valor, onChange }: Props) {
  if (dias.length < 2) return null;
  return (
    <label className="filtro-dia">
      Dia
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        {dias.map((dia) => (
          <option key={dia || 'sem-data'} value={dia}>
            {formatarDia(dia)}
          </option>
        ))}
      </select>
    </label>
  );
}
