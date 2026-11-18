import type { Prato, Refeicao } from '../types/cardapio';

// Dados de teste para a comparação de refeições.
const base: Omit<Prato, 'id' | 'nome' | 'ingredientes'> = {
  ingredientesCompletos: true,
  contem: [],
  podeConter: [],
  alergenicosInformados: true,
  perfisCompativeis: ['vegetariana', 'vegana', 'pescetariana'],
  nutricional: null,
};
export const almocoVegetariano: Refeicao = {
  id: 'terca-vegetariano',
  titulo: 'Almoço vegetariano',
  pratos: [
    {
      ...base,
      id: 'arroz-integral',
      nome: 'Arroz integral',
      ingredientes: ['Arroz integral', 'Água', 'Sal', 'Azeite'],
    },
    {
      ...base,
      id: 'feijao',
      nome: 'Feijão',
      ingredientes: ['Feijão', 'Água', 'Alho', 'Sal'],
    },
    {
      ...base,
      id: 'legumes',
      nome: 'Legumes salteados',
      ingredientes: ['Cenoura', 'Abobrinha', 'Sal', 'Azeite'],
    },
    {
      ...base,
      id: 'omelete',
      nome: 'Omelete com leite',
      ingredientes: ['Ovo', 'Leite', 'Sal'],
      contem: ['ovo', 'lactose'],
      perfisCompativeis: ['vegetariana', 'pescetariana'],
    },
  ],
};
export const alternativaVegetariana: Prato = {
  ...base,
  id: 'alternativa-tofu',
  nome: 'Arroz integral, feijão, legumes e tofu grelhado',
  ingredientes: [
    'Arroz integral',
    'Feijão',
    'Cenoura',
    'Abobrinha',
    'Tofu de soja',
    'Azeite',
    'Sal',
  ],
  contem: ['soja'],
  nutricional: {
    porcaoGramas: 450,
    nutrientes: [
      { nome: 'Valor energético', quantidade: 580, unidade: 'kcal' },
      { nome: 'Proteínas', quantidade: 24, unidade: 'g' },
    ],
  },
};
