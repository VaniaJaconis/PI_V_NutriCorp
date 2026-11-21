// Implementação provisória: os dados se perdem ao reiniciar a API.
import type {
  Cardapio,
  Colaborador,
  Organizacao,
  Preferencias,
  RegistroRefeicao,
  SelecaoAlternativa,
} from '../../dominio/entidades.js';
import { normalizarTexto } from '../../util/documentos.js';
import type {
  FiltroCardapios,
  RepositorioCardapios,
  RepositorioColaboradores,
  RepositorioOrganizacoes,
  RepositorioPreferencias,
  RepositorioRegistros,
  RepositorioSelecoes,
  Repositorios,
} from '../tipos.js';

const copia = <T>(valor: T): T => structuredClone(valor);
const copiaOuNulo = <T>(valor: T | undefined): T | null =>
  valor === undefined ? null : copia(valor);

class Organizacoes implements RepositorioOrganizacoes {
  private readonly itens = new Map<string, Organizacao>();
  async criar(organizacao: Organizacao) {
    this.itens.set(organizacao.id, copia(organizacao));
  }
  async buscarPorId(id: string) {
    return copiaOuNulo(this.itens.get(id));
  }
  async buscarPorCnpj(cnpj: string) {
    return copiaOuNulo([...this.itens.values()].find((o) => o.cnpj === cnpj));
  }
  async buscarPorEmail(email: string) {
    return copiaOuNulo(
      [...this.itens.values()].find((o) => o.emailComunicacao === email),
    );
  }
  async listarPorNome(nome: string) {
    const alvo = normalizarTexto(nome);
    return [...this.itens.values()]
      .filter(
        (o) =>
          normalizarTexto(o.nomeFantasia) === alvo ||
          normalizarTexto(o.razaoSocial) === alvo,
      )
      .map(copia);
  }
}

class Colaboradores implements RepositorioColaboradores {
  private readonly itens = new Map<string, Colaborador>();
  async criar(colaborador: Colaborador) {
    this.itens.set(colaborador.id, copia(colaborador));
  }
  async atualizar(colaborador: Colaborador) {
    if (this.itens.has(colaborador.id))
      this.itens.set(colaborador.id, copia(colaborador));
  }
  async buscarPorId(id: string) {
    return copiaOuNulo(this.itens.get(id));
  }
  async buscarPorEmail(email: string) {
    return copiaOuNulo(
      [...this.itens.values()].find((c) => c.emailCorporativo === email),
    );
  }
  async buscarPorCpf(cpf: string) {
    return copiaOuNulo([...this.itens.values()].find((c) => c.cpf === cpf));
  }
  async buscarPorCodigo(organizacaoId: string, codigo: string) {
    return copiaOuNulo(
      [...this.itens.values()].find(
        (c) =>
          c.organizacaoId === organizacaoId && c.codigoFuncionario === codigo,
      ),
    );
  }
  async listarPorOrganizacao(organizacaoId: string) {
    return [...this.itens.values()]
      .filter((c) => c.organizacaoId === organizacaoId)
      .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR'))
      .map(copia);
  }
}

class PreferenciasEmMemoria implements RepositorioPreferencias {
  private readonly itens = new Map<string, Preferencias>();
  async buscar(colaboradorId: string) {
    return copiaOuNulo(this.itens.get(colaboradorId));
  }
  async salvar(preferencias: Preferencias) {
    this.itens.set(preferencias.colaboradorId, copia(preferencias));
  }
}

class Cardapios implements RepositorioCardapios {
  private readonly itens = new Map<string, Cardapio>();
  async criar(cardapio: Cardapio) {
    this.itens.set(cardapio.id, copia(cardapio));
  }
  async atualizar(cardapio: Cardapio) {
    if (this.itens.has(cardapio.id)) this.itens.set(cardapio.id, copia(cardapio));
  }
  async remover(id: string) {
    this.itens.delete(id);
  }
  async buscarPorId(id: string) {
    return copiaOuNulo(this.itens.get(id));
  }
  async listar(filtro: FiltroCardapios) {
    return [...this.itens.values()]
      .filter(
        (c) =>
          c.organizacaoId === filtro.organizacaoId &&
          (!filtro.estado || c.estado === filtro.estado) &&
          (!filtro.data || c.data === filtro.data) &&
          (!filtro.refeicao || c.refeicao === filtro.refeicao) &&
          (!filtro.dataInicio || (c.data !== null && c.data >= filtro.dataInicio)) &&
          (!filtro.dataFim || (c.data !== null && c.data <= filtro.dataFim)),
      )
      .sort(
        (a, b) =>
          (a.data ?? '9999').localeCompare(b.data ?? '9999') ||
          (a.inicio ?? '').localeCompare(b.inicio ?? '') ||
          a.nome.localeCompare(b.nome, 'pt-BR'),
      )
      .map(copia);
  }
}

class Registros implements RepositorioRegistros {
  private readonly itens: RegistroRefeicao[] = [];
  async criar(registro: RegistroRefeicao) {
    this.itens.push(copia(registro));
  }
  async buscarPorRequisicao(colaboradorId: string, requisicaoId: string) {
    return copiaOuNulo(
      this.itens.find(
        (r) => r.colaboradorId === colaboradorId && r.requisicaoId === requisicaoId,
      ),
    );
  }
  async listarPorColaborador(colaboradorId: string) {
    return this.itens
      .filter((r) => r.colaboradorId === colaboradorId)
      .sort(
        (a, b) =>
          b.data.localeCompare(a.data) ||
          b.registradoEm.localeCompare(a.registradoEm),
      )
      .map(copia);
  }
  async listarPorOrganizacao(organizacaoId: string, dataInicio: string, dataFim: string) {
    return this.itens
      .filter(
        (r) =>
          r.organizacaoId === organizacaoId &&
          r.data >= dataInicio &&
          r.data <= dataFim,
      )
      .map(copia);
  }
}

class Selecoes implements RepositorioSelecoes {
  private readonly itens = new Map<string, SelecaoAlternativa>();
  async buscar(colaboradorId: string, cardapioId: string) {
    return copiaOuNulo(this.itens.get(`${colaboradorId}:${cardapioId}`));
  }
  async salvar(selecao: SelecaoAlternativa) {
    this.itens.set(`${selecao.colaboradorId}:${selecao.cardapioId}`, copia(selecao));
  }
}

export function criarRepositoriosEmMemoria(): Repositorios {
  return {
    organizacoes: new Organizacoes(),
    colaboradores: new Colaboradores(),
    preferencias: new PreferenciasEmMemoria(),
    cardapios: new Cardapios(),
    registros: new Registros(),
    selecoes: new Selecoes(),
  };
}
