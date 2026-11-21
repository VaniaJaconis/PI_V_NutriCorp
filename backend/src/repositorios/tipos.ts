// Contratos de persistência. A implementação em memória (./memoria) é a referência
// para a implementação em PostgreSQL: mesmos métodos, mesmas regras de unicidade.
import type {
  Cardapio,
  Colaborador,
  Organizacao,
  Preferencias,
  RegistroRefeicao,
  SelecaoAlternativa,
} from '../dominio/entidades.js';
import type { EstadoCardapio, TipoRefeicao } from '../dominio/valores.js';

export interface RepositorioOrganizacoes {
  criar(organizacao: Organizacao): Promise<void>;
  buscarPorId(id: string): Promise<Organizacao | null>;
  /** CNPJ normalizado (único). */
  buscarPorCnpj(cnpj: string): Promise<Organizacao | null>;
  /** E-mail em minúsculas (único). */
  buscarPorEmail(email: string): Promise<Organizacao | null>;
  /** Nome fantasia ou razão social, sem diferenciar maiúsculas e acentos. */
  listarPorNome(nome: string): Promise<Organizacao[]>;
}

export interface RepositorioColaboradores {
  criar(colaborador: Colaborador): Promise<void>;
  atualizar(colaborador: Colaborador): Promise<void>;
  buscarPorId(id: string): Promise<Colaborador | null>;
  /** E-mail em minúsculas (único). */
  buscarPorEmail(email: string): Promise<Colaborador | null>;
  /** CPF só com dígitos (único). */
  buscarPorCpf(cpf: string): Promise<Colaborador | null>;
  /** Código do funcionário (único por organização). */
  buscarPorCodigo(organizacaoId: string, codigo: string): Promise<Colaborador | null>;
  listarPorOrganizacao(organizacaoId: string): Promise<Colaborador[]>;
}

export interface RepositorioPreferencias {
  buscar(colaboradorId: string): Promise<Preferencias | null>;
  salvar(preferencias: Preferencias): Promise<void>;
}

export interface FiltroCardapios {
  organizacaoId: string;
  estado?: EstadoCardapio;
  data?: string;
  refeicao?: TipoRefeicao;
  dataInicio?: string;
  dataFim?: string;
}

export interface RepositorioCardapios {
  criar(cardapio: Cardapio): Promise<void>;
  atualizar(cardapio: Cardapio): Promise<void>;
  remover(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Cardapio | null>;
  /** Ordenado por data, início e nome; cardápios sem data por último. */
  listar(filtro: FiltroCardapios): Promise<Cardapio[]>;
}

export interface RepositorioRegistros {
  criar(registro: RegistroRefeicao): Promise<void>;
  /** (colaboradorId, requisicaoId) é único. */
  buscarPorRequisicao(colaboradorId: string, requisicaoId: string): Promise<RegistroRefeicao | null>;
  /** Mais recentes primeiro. */
  listarPorColaborador(colaboradorId: string): Promise<RegistroRefeicao[]>;
  listarPorOrganizacao(organizacaoId: string, dataInicio: string, dataFim: string): Promise<RegistroRefeicao[]>;
}

export interface RepositorioSelecoes {
  buscar(colaboradorId: string, cardapioId: string): Promise<SelecaoAlternativa | null>;
  /** Substitui a seleção anterior do mesmo (colaboradorId, cardapioId). */
  salvar(selecao: SelecaoAlternativa): Promise<void>;
}

export interface Repositorios {
  organizacoes: RepositorioOrganizacoes;
  colaboradores: RepositorioColaboradores;
  preferencias: RepositorioPreferencias;
  cardapios: RepositorioCardapios;
  registros: RepositorioRegistros;
  selecoes: RepositorioSelecoes;
}
