import { randomUUID } from 'node:crypto';
import type {
  CredenciaisDto,
  NovaOrganizacaoDto,
  NovoColaboradorDto,
  ResultadoLoginDto,
  SessaoDto,
} from '../contratos/contas.js';
import type { Organizacao } from '../dominio/entidades.js';
import type { PerfilAcesso } from '../dominio/valores.js';
import { erros } from '../erros.js';
import type { Repositorios } from '../repositorios/tipos.js';
import {
  cnpjValido,
  normalizarCnpj,
  somenteDigitos,
} from '../util/documentos.js';
import { conferirSenha, gerarHashSenha, obterHashFicticio } from './senhas.js';
import type { DadosToken, ServicoTokens } from './tokens.js';

export function criarServicoContas(repos: Repositorios, tokens: ServicoTokens) {
  async function emailEmUso(email: string) {
    return Boolean(
      (await repos.colaboradores.buscarPorEmail(email)) ??
        (await repos.organizacoes.buscarPorEmail(email)),
    );
  }

  function autenticar(
    id: string,
    nome: string,
    perfil: PerfilAcesso,
    organizacao: Organizacao,
  ): ResultadoLoginDto {
    return {
      id,
      nome,
      perfil,
      organizacao: { id: organizacao.id, nome: organizacao.nomeFantasia },
      ...tokens.emitir({ id, perfil }),
      modo: 'api',
    };
  }

  async function localizarOrganizacao(empresa: string) {
    const cnpj = normalizarCnpj(empresa);
    if (cnpjValido(cnpj)) {
      const porCnpj = await repos.organizacoes.buscarPorCnpj(cnpj);
      if (porCnpj) return porCnpj;
    }
    const porNome = await repos.organizacoes.listarPorNome(empresa);
    if (porNome.length === 1) return porNome[0]!;
    throw erros.validacao({
      empresa: porNome.length
        ? 'Há mais de uma organização com esse nome. Informe o CNPJ.'
        : 'Organização não encontrada. Informe o CNPJ ou o nome cadastrado pela empresa.',
    });
  }

  return {
    async cadastrarOrganizacao(dados: NovaOrganizacaoDto) {
      const cnpj = normalizarCnpj(dados.cnpj);
      const email = dados.emailComunicacao.toLowerCase();
      const campos: Record<string, string> = {};
      if (await repos.organizacoes.buscarPorCnpj(cnpj))
        campos.cnpj = 'CNPJ já cadastrado.';
      if (await emailEmUso(email))
        campos.emailComunicacao = 'E-mail já cadastrado.';
      if (Object.keys(campos).length) throw erros.conflito(campos);

      const organizacao: Organizacao = {
        id: randomUUID(),
        razaoSocial: dados.razaoSocial,
        cnpj,
        nomeFantasia: dados.nomeFantasia,
        setor: dados.setor,
        emailComunicacao: email,
        senhaHash: await gerarHashSenha(dados.senha),
        criadoEm: new Date().toISOString(),
      };
      await repos.organizacoes.criar(organizacao);
      return autenticar(organizacao.id, organizacao.nomeFantasia, 'organizacao', organizacao);
    },

    async cadastrarColaborador(dados: NovoColaboradorDto) {
      const organizacao = await localizarOrganizacao(dados.empresa);
      const cpf = somenteDigitos(dados.cpf);
      const email = dados.emailCorporativo.toLowerCase();
      const campos: Record<string, string> = {};
      if (await repos.colaboradores.buscarPorCpf(cpf))
        campos.cpf = 'CPF já cadastrado.';
      if (await emailEmUso(email))
        campos.emailCorporativo = 'E-mail já cadastrado.';
      if (await repos.colaboradores.buscarPorCodigo(organizacao.id, dados.codigoFuncionario))
        campos.codigoFuncionario = 'Código já cadastrado nesta organização.';
      if (Object.keys(campos).length) throw erros.conflito(campos);

      const colaborador = {
        id: randomUUID(),
        organizacaoId: organizacao.id,
        nomeCompleto: dados.nomeCompleto.replace(/\s+/g, ' '),
        cpf,
        setor: dados.setor,
        codigoFuncionario: dados.codigoFuncionario,
        emailCorporativo: email,
        senhaHash: await gerarHashSenha(dados.senha),
        ativo: true,
        criadoEm: new Date().toISOString(),
      };
      await repos.colaboradores.criar(colaborador);
      return autenticar(colaborador.id, colaborador.nomeCompleto, 'colaborador', organizacao);
    },

    async entrar({ usuario, senha }: CredenciaisDto) {
      const email = usuario.toLowerCase();
      const colaborador = await repos.colaboradores.buscarPorEmail(email);
      const organizacao = colaborador
        ? await repos.organizacoes.buscarPorId(colaborador.organizacaoId)
        : await repos.organizacoes.buscarPorEmail(email);
      const hash = colaborador?.senhaHash ?? organizacao?.senhaHash;
      const senhaCorreta = await conferirSenha(senha, hash ?? (await obterHashFicticio()));
      if (!hash || !senhaCorreta || !organizacao) throw erros.credenciaisInvalidas();
      if (!colaborador)
        return autenticar(organizacao.id, organizacao.nomeFantasia, 'organizacao', organizacao);
      if (!colaborador.ativo) throw erros.acessoInativo();
      return autenticar(colaborador.id, colaborador.nomeCompleto, 'colaborador', organizacao);
    },

    /** Recarrega a conta a cada requisição: desativações valem na hora. */
    async carregarSessao({ id, perfil }: DadosToken): Promise<SessaoDto | null> {
      if (perfil === 'organizacao') {
        const organizacao = await repos.organizacoes.buscarPorId(id);
        return organizacao
          ? {
              id,
              nome: organizacao.nomeFantasia,
              perfil,
              organizacao: { id, nome: organizacao.nomeFantasia },
            }
          : null;
      }
      const colaborador = await repos.colaboradores.buscarPorId(id);
      if (!colaborador) return null;
      if (!colaborador.ativo) throw erros.acessoInativo();
      const organizacao = await repos.organizacoes.buscarPorId(colaborador.organizacaoId);
      return organizacao
        ? {
            id,
            nome: colaborador.nomeCompleto,
            perfil,
            organizacao: { id: organizacao.id, nome: organizacao.nomeFantasia },
          }
        : null;
    },
  };
}
