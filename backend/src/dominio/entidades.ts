import type {
  EstadoCardapio,
  PerfilAlimentar,
  RestricaoAlimentar,
  SituacaoCompatibilidade,
  TipoRefeicao,
} from './valores.js';

export interface Organizacao {
  id: string;
  razaoSocial: string;
  cnpj: string;
  nomeFantasia: string;
  setor: string;
  emailComunicacao: string;
  senhaHash: string;
  criadoEm: string;
}

export interface Colaborador {
  id: string;
  organizacaoId: string;
  nomeCompleto: string;
  cpf: string;
  setor: string;
  codigoFuncionario: string;
  emailCorporativo: string;
  senhaHash: string;
  ativo: boolean;
  aprovado: boolean;
  criadoEm: string;
}

export interface Preferencias {
  colaboradorId: string;
  perfil: PerfilAlimentar;
  alimentosEvitar: string;
  restricoes: RestricaoAlimentar[];
  outrasOrientacoes: string;
  consentimentoEm: string | null;
  atualizadoEm: string;
}

export interface InformacaoNutricional {
  porcaoGramas: number | null;
  energiaKcal: number | null;
  carboidratosG: number | null;
  proteinasG: number | null;
  gordurasG: number | null;
  sodioMg: number | null;
}

export interface Cardapio {
  id: string;
  organizacaoId: string;
  estado: EstadoCardapio;
  nome: string;
  data: string | null;
  refeicao: TipoRefeicao | null;
  unidade: string;
  inicio: string | null;
  fim: string | null;
  preparacoes: string[];
  ingredientes: string[];
  alergenos: RestricaoAlimentar[];
  podeConter: RestricaoAlimentar[];
  perfisCompativeis: PerfilAlimentar[];
  revisado: boolean;
  nutricional: InformacaoNutricional;
  criadoEm: string;
  atualizadoEm: string;
  publicadoEm: string | null;
}

export interface RegistroRefeicao {
  id: string;
  colaboradorId: string;
  organizacaoId: string;
  cardapioId: string | null;
  requisicaoId: string;
  data: string;
  tipo: TipoRefeicao;
  nomeRefeicao: string;
  energia: number | null;
  observacoes: string;
  situacao: SituacaoCompatibilidade;
  registradoEm: string;
}

export interface SelecaoAlternativa {
  colaboradorId: string;
  cardapioId: string;
  alternativaId: string;
  selecionadoEm: string;
}
