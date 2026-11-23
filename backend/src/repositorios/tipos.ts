import type {
  Cardapio,
  Colaborador,
  Organizacao,
  Preferencias,
  RegistroRefeicao,
  SelecaoAlternativa,
} from '../dominio/entidades.js';
import type { EstadoCardapio, TipoRefeicao } from '../dominio/valores.js';

export type Novo<T> = Omit<T, 'id'>;

export interface RepositorioOrganizacoes {
  criar(organizacao: Novo<Organizacao>): Promise<Organizacao>;
  alterarSenha(id: string, senhaHash: string): Promise<void>;
  buscarPorId(id: string): Promise<Organizacao | null>;
  buscarPorCnpj(cnpj: string): Promise<Organizacao | null>;
  buscarPorEmail(email: string): Promise<Organizacao | null>;
  listarPorNome(nome: string): Promise<Organizacao[]>;
}

export interface RepositorioColaboradores {
  criar(colaborador: Novo<Colaborador>): Promise<Colaborador>;
  atualizar(colaborador: Colaborador): Promise<void>;
  buscarPorId(id: string): Promise<Colaborador | null>;
  buscarPorEmail(email: string): Promise<Colaborador | null>;
  buscarPorCpf(cpf: string): Promise<Colaborador | null>;
  buscarPorCodigo(organizacaoId: string, codigo: string): Promise<Colaborador | null>;
  listarPorOrganizacao(organizacaoId: string): Promise<Colaborador[]>;
}

export interface RepositorioPreferencias {
  buscar(colaboradorId: string): Promise<Preferencias | null>;
  salvar(preferencias: Preferencias): Promise<void>;
  remover(colaboradorId: string): Promise<void>;
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
  criar(cardapio: Novo<Cardapio>): Promise<Cardapio>;
  atualizar(cardapio: Cardapio): Promise<void>;
  remover(id: string): Promise<void>;
  buscarPorId(id: string): Promise<Cardapio | null>;
  listar(filtro: FiltroCardapios): Promise<Cardapio[]>;
}

export interface RepositorioRegistros {
  criar(registro: Novo<RegistroRefeicao>): Promise<RegistroRefeicao | null>;
  atualizar(registro: RegistroRefeicao): Promise<void>;
  remover(id: string): Promise<void>;
  buscarPorId(id: string): Promise<RegistroRefeicao | null>;
  buscarPorRequisicao(colaboradorId: string, requisicaoId: string): Promise<RegistroRefeicao | null>;
  listarPorColaborador(colaboradorId: string): Promise<RegistroRefeicao[]>;
  listarPorOrganizacao(organizacaoId: string, dataInicio: string, dataFim: string): Promise<RegistroRefeicao[]>;
}

export interface RepositorioSelecoes {
  buscar(colaboradorId: string, cardapioId: string): Promise<SelecaoAlternativa | null>;
  salvar(selecao: SelecaoAlternativa): Promise<void>;
}

export interface Repositorios {
  organizacoes: RepositorioOrganizacoes;
  colaboradores: RepositorioColaboradores;
  preferencias: RepositorioPreferencias;
  cardapios: RepositorioCardapios;
  registros: RepositorioRegistros;
  selecoes: RepositorioSelecoes;
  encerrar?(): Promise<void>;
}
