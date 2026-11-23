import type { EstadoCardapio, FormularioCardapio, RegistroCardapio } from '../types/cardapioOrganizacao';
import type { RestricaoAlimentar } from '../types/preferencias';
import type { TipoRefeicao } from '../types/registroRefeicao';
import { chamarApi, ErroApi } from './api';

const rota = '/organizacao/cardapios';
const camposNutricionais = {
  porcao: 'porcaoGramas',
  energia: 'energiaKcal',
  carboidratos: 'carboidratosG',
  proteinas: 'proteinasG',
  gorduras: 'gordurasG',
  sodio: 'sodioMg',
} as const;

interface EntradaCardapio {
  nome: string;
  data: string | null;
  refeicao: TipoRefeicao | null;
  unidade: string;
  inicio: string | null;
  fim: string | null;
  preparacoes: string[];
  ingredientes: string[];
  alergenos: RestricaoAlimentar[];
  revisado: boolean;
  podeConter?: FormularioCardapio['podeConter'];
  perfisCompativeis?: FormularioCardapio['perfisCompativeis'];
  nutricional: Record<(typeof camposNutricionais)[keyof typeof camposNutricionais], number | null>;
  estado: EstadoCardapio;
}
type CardapioApi = EntradaCardapio & { id: string };

function paraFormulario(cardapio: CardapioApi): RegistroCardapio {
  const { id, estado, nutricional } = cardapio;
  return {
    id,
    estado,
    dados: {
      nome: cardapio.nome,
      data: cardapio.data ?? '',
      refeicao: cardapio.refeicao ?? '',
      unidade: cardapio.unidade,
      inicio: cardapio.inicio ?? '',
      fim: cardapio.fim ?? '',
      preparacoes: cardapio.preparacoes.join(', '),
      ingredientes: cardapio.ingredientes.join(', '),
      alergenos: cardapio.alergenos,
      podeConter: cardapio.podeConter ?? [],
      perfisCompativeis: cardapio.perfisCompativeis ?? [],
      revisado: cardapio.revisado,
      porcao: String(nutricional.porcaoGramas ?? ''),
      energia: String(nutricional.energiaKcal ?? ''),
      carboidratos: String(nutricional.carboidratosG ?? ''),
      proteinas: String(nutricional.proteinasG ?? ''),
      gorduras: String(nutricional.gordurasG ?? ''),
      sodio: String(nutricional.sodioMg ?? ''),
    },
  };
}

function paraEntrada(dados: FormularioCardapio, estado: EstadoCardapio): EntradaCardapio {
  const lista = (texto: string) => texto.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);
  const numero = (texto: string) => texto.trim() ? Number(texto) : null;
  return {
    nome: dados.nome.trim(),
    data: dados.data || null,
    refeicao: (dados.refeicao || null) as TipoRefeicao | null,
    unidade: dados.unidade.trim(),
    inicio: dados.inicio || null,
    fim: dados.fim || null,
    preparacoes: lista(dados.preparacoes),
    ingredientes: lista(dados.ingredientes),
    alergenos: dados.alergenos,
    podeConter: dados.podeConter,
    perfisCompativeis: dados.perfisCompativeis,
    revisado: dados.revisado,
    nutricional: {
      porcaoGramas: numero(dados.porcao),
      energiaKcal: numero(dados.energia),
      carboidratosG: numero(dados.carboidratos),
      proteinasG: numero(dados.proteinas),
      gordurasG: numero(dados.gorduras),
      sodioMg: numero(dados.sodio),
    },
    estado,
  };
}

export async function consultarCardapioOrganizacao(id: string): Promise<RegistroCardapio> {
  return paraFormulario(await chamarApi<CardapioApi>(`${rota}/${encodeURIComponent(id)}`));
}

export async function salvarCardapioOrganizacao(
  dados: FormularioCardapio,
  estado: EstadoCardapio,
  id: string,
): Promise<RegistroCardapio> {
  try {
    const cardapio = await chamarApi<CardapioApi>(id ? `${rota}/${encodeURIComponent(id)}` : rota, {
      metodo: id ? 'PUT' : 'POST',
      corpo: paraEntrada(dados, estado),
    });
    return paraFormulario(cardapio);
  } catch (erro) {
    if (!(erro instanceof ErroApi) || !erro.campos) throw erro;
    const campos = { ...erro.campos };
    for (const [campo, origem] of Object.entries(camposNutricionais)) {
      const mensagem = campos[`nutricional.${origem}`];
      if (mensagem) campos[campo] = mensagem;
    }
    throw new ErroApi(erro.status, erro.codigo, erro.message, campos);
  }
}
