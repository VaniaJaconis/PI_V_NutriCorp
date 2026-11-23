import type {
  EstadoCardapio,
  FormularioCardapio,
} from '../types/cardapioOrganizacao';
export type ErrosCardapio = Partial<Record<keyof FormularioCardapio, string>>;
export function validarCardapio(
  dados: FormularioCardapio,
  estado: EstadoCardapio,
): ErrosCardapio {
  const erros: ErrosCardapio = {};
  if (!dados.nome.trim()) erros.nome = 'Informe o nome do cardápio.';
  if (estado === 'publicado') {
    for (const campo of [
      'data',
      'refeicao',
      'unidade',
      'inicio',
      'fim',
      'preparacoes',
      'ingredientes',
      'porcao',
      'energia',
      'carboidratos',
      'proteinas',
      'gorduras',
      'sodio',
    ] as const)
      if (!dados[campo].trim())
        erros[campo] = 'Preencha este campo antes de publicar.';
    if (!dados.revisado)
      erros.revisado =
        'Revise e confirme os ingredientes e alérgenos antes de publicar.';
  }
  if (
    dados.data &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data) ||
      !Number.isFinite(Date.parse(dados.data)) ||
      new Date(dados.data).toISOString().slice(0, 10) !== dados.data)
  )
    erros.data = 'Informe uma data válida.';
  if (
    dados.refeicao &&
    !['Café da manhã', 'Almoço', 'Lanche', 'Jantar'].includes(dados.refeicao)
  )
    erros.refeicao = 'Selecione uma refeição válida.';
  for (const campo of ['inicio', 'fim'] as const)
    if (dados[campo] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(dados[campo]))
      erros[campo] = 'Informe um horário válido.';
  if (dados.inicio && dados.fim && dados.fim <= dados.inicio)
    erros.fim = 'O término deve ser posterior ao início.';
  for (const campo of [
    'porcao',
    'energia',
    'carboidratos',
    'proteinas',
    'gorduras',
    'sodio',
  ] as const) {
    if (
      dados[campo] !== '' &&
      (!Number.isFinite(Number(dados[campo])) ||
        Number(dados[campo]) < 0 ||
        (campo === 'porcao' && Number(dados[campo]) === 0))
    )
      erros[campo] =
        campo === 'porcao'
          ? 'Informe uma porção maior que zero.'
          : 'Informe um valor igual ou maior que zero.';
  }
  return erros;
}
