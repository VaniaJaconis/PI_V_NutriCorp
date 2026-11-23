import type { Prato } from '../types/cardapio';
import type {
  PreferenciasColaborador,
  RestricaoAlimentar,
} from '../types/preferencias';

const nomes: Record<RestricaoAlimentar, string> = {
  lactose: 'lactose',
  gluten: 'glúten',
  amendoim: 'amendoim',
  castanhas: 'castanhas',
  ovo: 'ovo',
  soja: 'soja',
};
export function avaliarCompatibilidade(
  prato: Prato,
  perfil: PreferenciasColaborador,
) {
  const alertas: string[] = [];
  for (const restricao of perfil.restricoes) {
    if (prato.contem.includes(restricao))
      alertas.push(`Contém ${nomes[restricao]}.`);
    if (prato.podeConter.includes(restricao))
      alertas.push(`Pode conter traços de ${nomes[restricao]}.`);
  }
  const incompleto =
    !prato.ingredientesCompletos || !prato.alergenicosInformados;
  if (
    !incompleto &&
    perfil.perfil !== 'sem_preferencia' &&
    !prato.perfisCompativeis.includes(perfil.perfil)
  )
    alertas.push('Prato incompatível com o perfil alimentar selecionado.');
  return { alertas, incompleto };
}
