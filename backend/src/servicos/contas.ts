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

      const organizacao = await repos.organizacoes.criar({
        razaoSocial: dados.razaoSocial,
        cnpj,
        nomeFantasia: dados.nomeFantasia,
        setor: dados.setor,
        emailComunicacao: email,
        senhaHash: await gerarHashSenha(dados.senha),
        criadoEm: new Date().toISOString(),
      });
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

      const colaborador = await repos.colaboradores.criar({
        organizacaoId: organizacao.id,
        nomeCompleto: dados.nomeCompleto.replace(/\s+/g, ' '),
        cpf,
        setor: dados.setor,
        codigoFuncionario: dados.codigoFuncionario,
        emailCorporativo: email,
        senhaHash: await gerarHashSenha(dados.senha),
        ativo: false,
        aprovado: false,
        criadoEm: new Date().toISOString(),
      });
      return {
        id: colaborador.id,
        nome: colaborador.nomeCompleto,
        organizacao: { id: organizacao.id, nome: organizacao.nomeFantasia },
        situacao: 'pendente' as const,
        mensagem: `Cadastro enviado. Assim que ${organizacao.nomeFantasia} aprovar, você poderá entrar.`,
      };
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
      if (!colaborador.aprovado) throw erros.acessoPendente();
      if (!colaborador.ativo) throw erros.acessoInativo();
      return autenticar(colaborador.id, colaborador.nomeCompleto, 'colaborador', organizacao);
    },

    async alterarSenha(sessao: SessaoDto, senhaAtual: string, novaSenha: string) {
      if (sessao.perfil === 'organizacao') {
        const organizacao = await repos.organizacoes.buscarPorId(sessao.id);
        if (!organizacao || !(await conferirSenha(senhaAtual, organizacao.senhaHash)))
          throw erros.validacao({ senhaAtual: 'Senha atual incorreta.' });
        await repos.organizacoes.alterarSenha(sessao.id, await gerarHashSenha(novaSenha));
        return;
      }
      const colaborador = await repos.colaboradores.buscarPorId(sessao.id);
      if (!colaborador || !(await conferirSenha(senhaAtual, colaborador.senhaHash)))
        throw erros.validacao({ senhaAtual: 'Senha atual incorreta.' });
      colaborador.senhaHash = await gerarHashSenha(novaSenha);
      await repos.colaboradores.atualizar(colaborador);
    },

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
      if (!colaborador.aprovado) throw erros.acessoPendente();
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
