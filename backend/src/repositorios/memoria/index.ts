import { randomUUID } from 'node:crypto';
import type {
  Cardapio,
  Colaborador,
  Organizacao,
  Preferencias,
  RegistroRefeicao,
  SelecaoAlternativa,
} from '../../dominio/entidades.js';
import { normalizarTexto } from '../../util/documentos.js';
import type { FiltroCardapios, Novo, Repositorios } from '../tipos.js';

const copia = <T>(valor: T): T => structuredClone(valor);
const copiaOuNulo = <T>(valor: T | undefined): T | null =>
  valor === undefined ? null : copia(valor);

export function criarRepositoriosEmMemoria(): Repositorios {
  const organizacoes = new Map<string, Organizacao>();
  const colaboradores = new Map<string, Colaborador>();
  const preferencias = new Map<string, Preferencias>();
  const cardapios = new Map<string, Cardapio>();
  const registros: RegistroRefeicao[] = [];
  const selecoes = new Map<string, SelecaoAlternativa>();

  const novo = <T>(dados: Novo<T>) => ({ ...copia(dados), id: randomUUID() }) as T;

  return {
    organizacoes: {
      async criar(dados) {
        const organizacao = novo<Organizacao>(dados);
        organizacoes.set(organizacao.id, organizacao);
        return copia(organizacao);
      },
      async alterarSenha(id, senhaHash) {
        const organizacao = organizacoes.get(id);
        if (organizacao) organizacao.senhaHash = senhaHash;
      },
      async buscarPorId(id) {
        return copiaOuNulo(organizacoes.get(id));
      },
      async buscarPorCnpj(cnpj) {
        return copiaOuNulo([...organizacoes.values()].find((o) => o.cnpj === cnpj));
      },
      async buscarPorEmail(email) {
        return copiaOuNulo([...organizacoes.values()].find((o) => o.emailComunicacao === email));
      },
      async listarPorNome(nome) {
        const alvo = normalizarTexto(nome);
        return [...organizacoes.values()]
          .filter((o) => normalizarTexto(o.nomeFantasia) === alvo || normalizarTexto(o.razaoSocial) === alvo)
          .map(copia);
      },
    },

    colaboradores: {
      async criar(dados) {
        const colaborador = novo<Colaborador>(dados);
        colaboradores.set(colaborador.id, colaborador);
        return copia(colaborador);
      },
      async atualizar(colaborador) {
        if (colaboradores.has(colaborador.id)) colaboradores.set(colaborador.id, copia(colaborador));
      },
      async buscarPorId(id) {
        return copiaOuNulo(colaboradores.get(id));
      },
      async buscarPorEmail(email) {
        return copiaOuNulo([...colaboradores.values()].find((c) => c.emailCorporativo === email));
      },
      async buscarPorCpf(cpf) {
        return copiaOuNulo([...colaboradores.values()].find((c) => c.cpf === cpf));
      },
      async buscarPorCodigo(organizacaoId, codigo) {
        return copiaOuNulo(
          [...colaboradores.values()].find(
            (c) => c.organizacaoId === organizacaoId && c.codigoFuncionario === codigo,
          ),
        );
      },
      async listarPorOrganizacao(organizacaoId) {
        return [...colaboradores.values()]
          .filter((c) => c.organizacaoId === organizacaoId)
          .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR'))
          .map(copia);
      },
    },

    preferencias: {
      async buscar(colaboradorId) {
        return copiaOuNulo(preferencias.get(colaboradorId));
      },
      async salvar(dados) {
        preferencias.set(dados.colaboradorId, copia(dados));
      },
      async remover(colaboradorId) {
        preferencias.delete(colaboradorId);
      },
    },

    cardapios: {
      async criar(dados) {
        const cardapio = novo<Cardapio>(dados);
        cardapios.set(cardapio.id, cardapio);
        return copia(cardapio);
      },
      async atualizar(cardapio) {
        if (cardapios.has(cardapio.id)) cardapios.set(cardapio.id, copia(cardapio));
      },
      async remover(id) {
        cardapios.delete(id);
        for (const r of registros) if (r.cardapioId === id) r.cardapioId = null;
      },
      async buscarPorId(id) {
        return copiaOuNulo(cardapios.get(id));
      },
      async listar(filtro: FiltroCardapios) {
        return [...cardapios.values()]
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
      },
    },

    registros: {
      async criar(dados) {
        const existente = registros.find(
          (r) => r.colaboradorId === dados.colaboradorId && r.requisicaoId === dados.requisicaoId,
        );
        if (existente) return null;
        const registro = novo<RegistroRefeicao>(dados);
        registros.push(registro);
        return copia(registro);
      },
      async atualizar(registro) {
        const indice = registros.findIndex((r) => r.id === registro.id);
        if (indice >= 0) registros[indice] = copia(registro);
      },
      async remover(id) {
        const indice = registros.findIndex((r) => r.id === id);
        if (indice >= 0) registros.splice(indice, 1);
      },
      async buscarPorId(id) {
        return copiaOuNulo(registros.find((r) => r.id === id));
      },
      async buscarPorRequisicao(colaboradorId, requisicaoId) {
        return copiaOuNulo(
          registros.find((r) => r.colaboradorId === colaboradorId && r.requisicaoId === requisicaoId),
        );
      },
      async listarPorColaborador(colaboradorId) {
        return registros
          .filter((r) => r.colaboradorId === colaboradorId)
          .sort((a, b) => b.data.localeCompare(a.data) || b.registradoEm.localeCompare(a.registradoEm))
          .map(copia);
      },
      async listarPorOrganizacao(organizacaoId, dataInicio, dataFim) {
        return registros
          .filter((r) => r.organizacaoId === organizacaoId && r.data >= dataInicio && r.data <= dataFim)
          .map(copia);
      },
    },

    selecoes: {
      async buscar(colaboradorId, cardapioId) {
        return copiaOuNulo(selecoes.get(`${colaboradorId}:${cardapioId}`));
      },
      async salvar(selecao) {
        selecoes.set(`${selecao.colaboradorId}:${selecao.cardapioId}`, copia(selecao));
      },
    },
  };
}
