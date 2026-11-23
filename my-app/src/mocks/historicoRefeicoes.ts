import type { RegistroRefeicao } from '../types/registroRefeicao';

// Registros de teste para a tela de histórico.
export const historicoExemplo: RegistroRefeicao[] = [
  {
    id: 'ex-1',
    data: '2026-11-09',
    registradoEm: '2026-11-09T15:15:00Z',
    tipo: 'Almoço',
    nomeRefeicao: 'Arroz, feijão e tofu',
    energia: 580,
    observacoes: '',
  },
  {
    id: 'ex-2',
    data: '2026-11-09',
    registradoEm: '2026-11-09T19:00:00Z',
    tipo: 'Lanche',
    nomeRefeicao: 'Banana e aveia',
    energia: 210,
    observacoes: '',
  },
  {
    id: 'ex-3',
    data: '2026-11-06',
    registradoEm: '2026-11-06T15:10:00Z',
    tipo: 'Almoço',
    nomeRefeicao: 'Arroz, lentilha e legumes',
    energia: 540,
    observacoes: '',
  },
];
