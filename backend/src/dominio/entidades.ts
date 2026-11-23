// Entidades persistidas. Servem de referência para as tabelas e migrações do PostgreSQL.
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
  /** Somente letras maiúsculas e dígitos (aceita CNPJ alfanumérico). */
  cnpj: string;
  nomeFantasia: string;
  setor: string;
  /** Sempre em minúsculas. Usado como usuário no login. */
  emailComunicacao: string;
  senhaHash: string;
  criadoEm: string;
}

export interface Colaborador {
  id: string;
  organizacaoId: string;
  nomeCompleto: string;
  /** Somente dígitos. */
  cpf: string;
  setor: string;
  codigoFuncionario: string;
  /** Sempre em minúsculas. Usado como usuário no login. */
  emailCorporativo: string;
  senhaHash: string;
  /** Controlado pela organização. Colaborador inativo não consegue entrar. */
  ativo: boolean;
  criadoEm: string;
}

/** Dado pessoal sensível (saúde, LGPD art. 11): nunca expor à organização de forma individual. */
export interface Preferencias {
  colaboradorId: string;
  perfil: PerfilAlimentar;
  alimentosEvitar: string;
  restricoes: RestricaoAlimentar[];
  outrasOrientacoes: string;
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
  /** AAAA-MM-DD */
  data: string | null;
  refeicao: TipoRefeicao | null;
  unidade: string;
  /** HH:MM */
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
  cardapioId: string;
  /** Único por colaborador: evita registros duplicados quando o envio é repetido. */
  requisicaoId: string;
  data: string;
  tipo: TipoRefeicao;
  /** Cópia do nome no momento do registro, para o histórico não mudar se o cardápio mudar. */
  nomeRefeicao: string;
  energia: number | null;
  observacoes: string;
  /** Compatibilidade com as preferências no momento do registro (alimenta os indicadores). */
  situacao: SituacaoCompatibilidade;
  registradoEm: string;
}

export interface SelecaoAlternativa {
  colaboradorId: string;
  cardapioId: string;
  alternativaId: string;
  selecionadoEm: string;
}
