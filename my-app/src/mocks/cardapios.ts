import type { Prato, Refeicao } from '../types/cardapio';
import { almocoVegetariano } from './almocoVegetariano';

// Dados de teste para as telas de cardápio.
const arroz: Prato = {
  id: 'arroz',
  nome: 'Arroz branco',
  ingredientes: ['Arroz', 'Alho', 'Sal', 'Óleo de soja'],
  ingredientesCompletos: true,
  contem: ['soja'],
  podeConter: [],
  alergenicosInformados: true,
  perfisCompativeis: ['vegetariana', 'vegana', 'pescetariana'],
  nutricional: {
    porcaoGramas: 100,
    nutrientes: [
      { nome: 'Valor energético', quantidade: 129, unidade: 'kcal' },
      { nome: 'Carboidratos', quantidade: 28.1, unidade: 'g' },
      { nome: 'Proteínas', quantidade: 2.5, unidade: 'g' },
      { nome: 'Gorduras totais', quantidade: 0.3, unidade: 'g' },
      { nome: 'Gorduras saturadas', quantidade: 0.1, unidade: 'g' },
      { nome: 'Fibras alimentares', quantidade: 0.2, unidade: 'g' },
      { nome: 'Sódio', quantidade: 365, unidade: 'mg' },
    ],
  },
};
const frango: Prato = {
  id: 'frango',
  nome: 'Frango grelhado',
  ingredientes: ['Peito de frango', 'Alho', 'Sal', 'Azeite'],
  ingredientesCompletos: true,
  contem: [],
  podeConter: ['soja'],
  alergenicosInformados: true,
  perfisCompativeis: [],
  nutricional: {
    porcaoGramas: 100,
    nutrientes: [
      { nome: 'Valor energético', quantidade: 165, unidade: 'kcal' },
      { nome: 'Carboidratos', quantidade: 0, unidade: 'g' },
      { nome: 'Proteínas', quantidade: 31, unidade: 'g' },
      { nome: 'Gorduras totais', quantidade: 3.6, unidade: 'g' },
      { nome: 'Sódio', quantidade: 240, unidade: 'mg' },
    ],
  },
};
const pure: Prato = {
  id: 'pure',
  nome: 'Purê de batata',
  ingredientes: ['Batata', 'Leite', 'Manteiga', 'Sal'],
  ingredientesCompletos: true,
  contem: ['lactose'],
  podeConter: [],
  alergenicosInformados: true,
  perfisCompativeis: ['vegetariana', 'pescetariana'],
  nutricional: {
    porcaoGramas: 100,
    nutrientes: [
      { nome: 'Valor energético', quantidade: 100, unidade: 'kcal' },
      { nome: 'Carboidratos', quantidade: 16, unidade: 'g' },
      { nome: 'Proteínas', quantidade: 2, unidade: 'g' },
      { nome: 'Gorduras totais', quantidade: 3, unidade: 'g' },
      { nome: 'Sódio', quantidade: 200, unidade: 'mg' },
    ],
  },
};
const salada: Prato = {
  id: 'salada',
  nome: 'Salada do dia',
  ingredientes: ['Alface', 'Tomate'],
  ingredientesCompletos: false,
  contem: [],
  podeConter: [],
  alergenicosInformados: false,
  perfisCompativeis: [],
  nutricional: null,
};

export const cardapiosExemplo: Refeicao[] = [
  {
    id: 'segunda-almoco',
    titulo: 'Segunda - Almoço',
    pratos: [arroz, frango, pure, salada],
  },
  { id: 'segunda-lanche', titulo: 'Segunda - Lanche', pratos: [salada] },
  { id: 'terca-almoco', titulo: 'Terça - Almoço', pratos: [frango, arroz] },
  { id: 'terca-lanche', titulo: 'Terça - Lanche', pratos: [] },
  almocoVegetariano,
];
