// Regra de negócio: comparar os pratos com as preferências e restrições do colaborador.
import type { AvaliacaoDto, PratoDto } from '../contratos/cardapios.js';
import type { Preferencias } from '../dominio/entidades.js';
import {
  NOMES_RESTRICOES,
  type SituacaoCompatibilidade,
} from '../dominio/valores.js';
import { normalizarTexto } from '../util/documentos.js';

export type PreferenciasAvaliacao = Pick<
  Preferencias,
  'perfil' | 'restricoes' | 'alimentosEvitar'
>;

export const PREFERENCIAS_PADRAO: PreferenciasAvaliacao = {
  perfil: 'sem_preferencia',
  restricoes: [],
  alimentosEvitar: '',
};

function itensEvitar(texto: string): string[] {
  return [
    ...new Set(
      texto
        .split(/[,;\n]/)
        .map(normalizarTexto)
        .filter((item) => item.length >= 3),
    ),
  ];
}

/**
 * incompativel: contém uma restrição ou não atende ao perfil alimentar.
 * parcial: só traços, alimentos que o colaborador prefere evitar ou dados incompletos.
 * compativel: nenhum alerta.
 */
export function avaliarPrato(
  prato: PratoDto,
  preferencias: PreferenciasAvaliacao = PREFERENCIAS_PADRAO,
): AvaliacaoDto {
  const alertas = new Set<string>();
  let grave = false;

  for (const restricao of preferencias.restricoes) {
    if (prato.contem.includes(restricao)) {
      alertas.add(`Contém ${NOMES_RESTRICOES[restricao]}.`);
      grave = true;
    } else if (prato.podeConter.includes(restricao)) {
      alertas.add(`Pode conter traços de ${NOMES_RESTRICOES[restricao]}.`);
    }
  }

  const ingredientes = prato.ingredientes.map((nome) => ({
    nome,
    normalizado: normalizarTexto(nome),
  }));
  for (const item of itensEvitar(preferencias.alimentosEvitar)) {
    const encontrado = ingredientes.find(
      ({ normalizado }) =>
        normalizado.includes(item) ||
        (normalizado.length >= 3 && item.includes(normalizado)),
    );
    if (encontrado)
      alertas.add(`Contém ${encontrado.nome.toLowerCase()}, que você prefere evitar.`);
  }

  const incompleto = !prato.ingredientesCompletos || !prato.alergenicosInformados;
  if (
    !incompleto &&
    preferencias.perfil !== 'sem_preferencia' &&
    !prato.perfisCompativeis.includes(preferencias.perfil)
  ) {
    alertas.add('Prato incompatível com o perfil alimentar selecionado.');
    grave = true;
  }

  const situacao: SituacaoCompatibilidade = grave
    ? 'incompativel'
    : alertas.size || incompleto
      ? 'parcial'
      : 'compativel';
  return { pratoId: prato.id, situacao, alertas: [...alertas], incompleto };
}
