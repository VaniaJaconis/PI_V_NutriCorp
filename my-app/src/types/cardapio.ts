import type { PerfilAlimentar, RestricaoAlimentar } from './preferencias';

// Contrato provisório: alinhar dados, unidades e declarações de alergênicos com a API.
export interface Nutriente { nome: string; quantidade: number; unidade: 'kcal' | 'g' | 'mg'; }
export interface Prato {
  id: string;
  nome: string;
  ingredientes: string[];
  ingredientesCompletos: boolean;
  contem: RestricaoAlimentar[];
  podeConter: RestricaoAlimentar[];
  alergenicosInformados: boolean;
  perfisCompativeis: PerfilAlimentar[];
  nutricional: { porcaoGramas: number; nutrientes: Nutriente[] } | null;
}
export interface Refeicao { id: string; titulo: string; pratos: Prato[]; }
