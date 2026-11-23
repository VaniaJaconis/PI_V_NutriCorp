import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import { z } from './zod.js';
import {
  CardapioOrganizacao,
  CompatibilidadeRefeicao,
  EntradaCardapio,
  EntradaSelecaoAlternativa,
  FiltroCardapios,
  Refeicao,
  ResultadoSelecaoAlternativa,
} from './cardapios.js';
import { ParametroId, RespostaErro } from './comum.js';
import {
  Credenciais,
  EntradaAlterarSenha,
  MembroEquipeResumo,
  NovaOrganizacao,
  NovoColaborador,
  NovoMembroEquipe,
  ResultadoCadastroColaborador,
  ResultadoConsultaCnpj,
  ResultadoLogin,
  ResultadoNovoMembro,
  Sessao,
} from './contas.js';
import {
  ColaboradorResumo,
  EntradaAcesso,
  FiltroIndicadores,
  IndicadoresConsolidados,
  ResultadoSenhaTemporaria,
} from './organizacao.js';
import {
  EntradaPreferencias,
  PreferenciasColaborador,
  ResultadoPreferencias,
} from './preferencias.js';
import {
  EntradaAtualizacaoRegistro,
  EntradaRegistro,
  FiltroOpcoesRegistro,
  OpcaoRegistro,
  RegistroRefeicao,
} from './registros.js';

const json = (schema: z.ZodType, description: string) => ({
  description,
  content: { 'application/json': { schema } },
});
const corpo = (schema: z.ZodType) => ({
  body: { required: true, content: { 'application/json': { schema } } },
});
const erro = (description: string) => json(RespostaErro, description);

const E401 = erro('Token ausente, inválido ou expirado.');
const E403 = erro('Perfil sem permissão para este recurso, ou acesso desativado.');
const E404 = erro('Recurso não encontrado (ou de outra organização).');
const E422 = erro('Dados inválidos. "campos" traz a mensagem de cada campo.');

type Rota = Omit<RouteConfig, 'responses'> & { responses: RouteConfig['responses'] };

export function gerarDocumentoOpenApi() {
  const registro = new OpenAPIRegistry();
  const bearer = registro.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });
  const autenticada = [{ [bearer.name]: [] }];
  const rota = (config: Rota, publica = false) =>
    registro.registerPath({
      ...config,
      ...(publica ? {} : { security: autenticada }),
      responses: {
        ...config.responses,
        ...(publica ? {} : { 401: E401 }),
      },
    });

  rota(
    {
      method: 'get',
      path: '/api/saude',
      tags: ['Infraestrutura'],
      summary: 'Verificar se a API está no ar',
      responses: { 200: json(z.object({ status: z.literal('ok') }), 'API disponível.') },
    },
    true,
  );
  rota(
    {
      method: 'get',
      path: '/api/cnpj/{cnpj}',
      tags: ['Cadastro e acesso'],
      summary: 'Consultar CNPJ na Receita (ReceitaWS)',
      description:
        'Usado no cadastro da organização para preencher razão social, nome fantasia e setor. Só CNPJ numérico. Resultados ficam em cache.',
      request: { params: z.object({ cnpj: z.string().meta({ example: '00.000.000/0001-91' }) }) },
      responses: {
        200: json(ResultadoConsultaCnpj, 'Dados encontrados.'),
        404: erro('CNPJ não encontrado na Receita Federal.'),
        422: E422,
        429: erro('Muitas consultas.'),
        503: erro('ReceitaWS indisponível ou limite de consultas atingido.'),
      },
    },
    true,
  );
  rota(
    {
      method: 'post',
      path: '/api/organizacoes',
      tags: ['Cadastro e acesso'],
      summary: 'Cadastrar organização',
      description: 'Tela: Cadastro da organização. Já devolve a sessão autenticada.',
      request: corpo(NovaOrganizacao),
      responses: {
        201: json(ResultadoLogin, 'Organização cadastrada.'),
        409: erro('CNPJ ou e-mail já cadastrado.'),
        422: E422,
      },
    },
    true,
  );
  rota(
    {
      method: 'post',
      path: '/api/colaboradores',
      tags: ['Cadastro e acesso'],
      summary: 'Cadastrar colaborador',
      description:
        'Tela: Cadastro do colaborador. "empresa" deve identificar uma organização já cadastrada. O acesso só é liberado depois que a organização aprovar.',
      request: corpo(NovoColaborador),
      responses: {
        201: json(ResultadoCadastroColaborador, 'Cadastro enviado para aprovação.'),
        409: erro('CPF, e-mail ou código do funcionário já cadastrado.'),
        422: E422,
      },
    },
    true,
  );
  rota(
    {
      method: 'post',
      path: '/api/auth/login',
      tags: ['Cadastro e acesso'],
      summary: 'Entrar',
      description: 'Tela: Login. O perfil devolvido define a área (colaborador ou organização).',
      request: corpo(Credenciais),
      responses: {
        200: json(ResultadoLogin, 'Login realizado.'),
        401: erro('Usuário ou senha inválidos.'),
        403: erro('Cadastro aguardando aprovação ou acesso desativado pela organização.'),
        422: E422,
        429: erro('Muitas tentativas. Limite de 20 a cada 15 minutos.'),
      },
    },
    true,
  );
  rota({
    method: 'get',
    path: '/api/auth/sessao',
    tags: ['Cadastro e acesso'],
    summary: 'Dados da sessão atual',
    description: 'Use ao recarregar a página para recuperar nome e perfil a partir do token salvo.',
    responses: { 200: json(Sessao, 'Sessão válida.'), 403: E403 },
  });
  rota({
    method: 'put',
    path: '/api/auth/senha',
    tags: ['Cadastro e acesso'],
    summary: 'Alterar a própria senha',
    request: corpo(EntradaAlterarSenha),
    responses: { 204: { description: 'Senha alterada.' }, 422: E422 },
  });

  rota({
    method: 'get',
    path: '/api/cardapios',
    tags: ['Cardápios'],
    summary: 'Listar cardápios (formato Refeicao)',
    description:
      'Telas: Cardápios do colaborador e da organização. Colaborador: só publicados, com "avaliacoes" de compatibilidade. Organização: todos, filtráveis por estado.',
    request: { query: FiltroCardapios },
    responses: { 200: json(z.array(Refeicao), 'Cardápios.'), 422: E422 },
  });
  rota({
    method: 'get',
    path: '/api/cardapios/{id}',
    tags: ['Cardápios'],
    summary: 'Detalhar cardápio (formato Refeicao)',
    request: { params: ParametroId },
    responses: { 200: json(Refeicao, 'Cardápio.'), 404: E404 },
  });

  const soColaborador = { 403: E403 };
  rota({
    method: 'get',
    path: '/api/colaborador/preferencias',
    tags: ['Colaborador'],
    summary: 'Consultar preferências e restrições',
    description: 'Tela: Preferências e restrições. Sem cadastro prévio, devolve os valores padrão.',
    responses: { 200: json(PreferenciasColaborador, 'Preferências.'), ...soColaborador },
  });
  rota({
    method: 'put',
    path: '/api/colaborador/preferencias',
    tags: ['Colaborador'],
    summary: 'Salvar preferências e restrições',
    description: 'Exige "consentimento": true (dados de saúde, LGPD).',
    request: corpo(EntradaPreferencias),
    responses: {
      200: json(ResultadoPreferencias, 'Preferências salvas.'),
      ...soColaborador,
      422: E422,
    },
  });
  rota({
    method: 'delete',
    path: '/api/colaborador/preferencias',
    tags: ['Colaborador'],
    summary: 'Excluir preferências e restrições',
    responses: { 200: json(PreferenciasColaborador, 'Dados excluídos.'), ...soColaborador },
  });
  rota({
    method: 'get',
    path: '/api/colaborador/cardapios/{id}/compatibilidade',
    tags: ['Colaborador'],
    summary: 'Compatibilidade da refeição e alternativas',
    description: 'Tela: Compatibilidade das refeições.',
    request: { params: ParametroId },
    responses: {
      200: json(CompatibilidadeRefeicao, 'Avaliação da refeição.'),
      ...soColaborador,
      404: E404,
    },
  });
  rota({
    method: 'put',
    path: '/api/colaborador/cardapios/{id}/alternativa',
    tags: ['Colaborador'],
    summary: 'Selecionar alternativa compatível',
    request: { params: ParametroId, ...corpo(EntradaSelecaoAlternativa) },
    responses: {
      200: json(ResultadoSelecaoAlternativa, 'Alternativa selecionada.'),
      ...soColaborador,
      404: erro('Cardápio ou alternativa indisponível.'),
      422: erro('Alternativa incompatível com o perfil atual.'),
    },
  });
  rota({
    method: 'get',
    path: '/api/colaborador/registros/opcoes',
    tags: ['Colaborador'],
    summary: 'Refeições disponíveis para registro',
    description: 'Tela: Registro de refeições (lista "Selecione a refeição consumida").',
    request: { query: FiltroOpcoesRegistro },
    responses: {
      200: json(z.array(OpcaoRegistro), 'Opções do dia.'),
      ...soColaborador,
      422: E422,
    },
  });
  rota({
    method: 'get',
    path: '/api/colaborador/registros',
    tags: ['Colaborador'],
    summary: 'Histórico de refeições registradas',
    responses: {
      200: json(z.array(RegistroRefeicao), 'Mais recentes primeiro.'),
      ...soColaborador,
    },
  });
  rota({
    method: 'post',
    path: '/api/colaborador/registros',
    tags: ['Colaborador'],
    summary: 'Registrar refeição consumida',
    description:
      'Idempotente por "requisicaoId": reenviar o mesmo valor devolve o registro já criado (200) em vez de duplicar.',
    request: corpo(EntradaRegistro),
    responses: {
      201: json(RegistroRefeicao, 'Registro criado.'),
      200: json(RegistroRefeicao, 'Registro já existente para este requisicaoId.'),
      ...soColaborador,
      422: E422,
    },
  });
  rota({
    method: 'patch',
    path: '/api/colaborador/registros/{id}',
    tags: ['Colaborador'],
    summary: 'Editar observações do registro',
    request: { params: ParametroId, ...corpo(EntradaAtualizacaoRegistro) },
    responses: { 200: json(RegistroRefeicao, 'Registro atualizado.'), ...soColaborador, 404: E404, 422: E422 },
  });
  rota({
    method: 'delete',
    path: '/api/colaborador/registros/{id}',
    tags: ['Colaborador'],
    summary: 'Excluir registro',
    request: { params: ParametroId },
    responses: { 204: { description: 'Excluído.' }, ...soColaborador, 404: E404 },
  });

  const soOrganizacao = { 403: E403 };
  rota({
    method: 'get',
    path: '/api/organizacao/cardapios',
    tags: ['Organização'],
    summary: 'Listar cardápios cadastrados',
    request: { query: FiltroCardapios },
    responses: {
      200: json(z.array(CardapioOrganizacao), 'Cardápios da organização.'),
      ...soOrganizacao,
      422: E422,
    },
  });
  rota({
    method: 'post',
    path: '/api/organizacao/cardapios',
    tags: ['Organização'],
    summary: 'Cadastrar cardápio (rascunho ou publicado)',
    description: 'Tela: Cadastro de cardápio.',
    request: corpo(EntradaCardapio),
    responses: {
      201: json(CardapioOrganizacao, 'Cardápio criado.'),
      ...soOrganizacao,
      422: E422,
    },
  });
  rota({
    method: 'get',
    path: '/api/organizacao/cardapios/{id}',
    tags: ['Organização'],
    summary: 'Detalhar cardápio cadastrado',
    request: { params: ParametroId },
    responses: { 200: json(CardapioOrganizacao, 'Cardápio.'), ...soOrganizacao, 404: E404 },
  });
  rota({
    method: 'put',
    path: '/api/organizacao/cardapios/{id}',
    tags: ['Organização'],
    summary: 'Atualizar, publicar ou voltar para rascunho',
    request: { params: ParametroId, ...corpo(EntradaCardapio) },
    responses: {
      200: json(CardapioOrganizacao, 'Cardápio atualizado.'),
      ...soOrganizacao,
      404: E404,
      422: E422,
    },
  });
  rota({
    method: 'delete',
    path: '/api/organizacao/cardapios/{id}',
    tags: ['Organização'],
    summary: 'Excluir cardápio',
    description: 'Os registros de refeição já feitos continuam no histórico.',
    request: { params: ParametroId },
    responses: { 204: { description: 'Excluído.' }, ...soOrganizacao, 404: E404 },
  });
  rota({
    method: 'get',
    path: '/api/organizacao/indicadores',
    tags: ['Organização'],
    summary: 'Indicadores consolidados',
    description: 'Tela: Indicadores consolidados. Período padrão: últimos 7 dias.',
    request: { query: FiltroIndicadores },
    responses: {
      200: json(IndicadoresConsolidados, 'Indicadores do período.'),
      ...soOrganizacao,
      422: E422,
    },
  });
  rota({
    method: 'get',
    path: '/api/organizacao/colaboradores',
    tags: ['Organização'],
    summary: 'Listar colaboradores (controle de acesso)',
    description: 'Tela: Controle de acesso. Não inclui CPF nem preferências alimentares.',
    responses: {
      200: json(z.array(ColaboradorResumo), 'Colaboradores.'),
      ...soOrganizacao,
    },
  });
  rota({
    method: 'patch',
    path: '/api/organizacao/colaboradores/{id}',
    tags: ['Organização'],
    summary: 'Aprovar, ativar ou desativar o acesso do colaborador',
    request: { params: ParametroId, ...corpo(EntradaAcesso) },
    responses: {
      200: json(ColaboradorResumo, 'Acesso atualizado.'),
      ...soOrganizacao,
      404: E404,
      422: E422,
    },
  });
  rota({
    method: 'post',
    path: '/api/organizacao/colaboradores/{id}/senha',
    tags: ['Organização'],
    summary: 'Gerar senha temporária para o colaborador',
    request: { params: ParametroId },
    responses: {
      200: json(ResultadoSenhaTemporaria, 'Senha gerada. Repasse ao colaborador.'),
      ...soOrganizacao,
      404: E404,
    },
  });
  rota({
    method: 'get',
    path: '/api/organizacao/equipe',
    tags: ['Organização'],
    summary: 'Listar a equipe (RH e Cozinha)',
    description: 'Só RH. A conta titular vem primeiro, com "titular": true.',
    responses: { 200: json(z.array(MembroEquipeResumo), 'Equipe.'), ...soOrganizacao },
  });
  rota({
    method: 'post',
    path: '/api/organizacao/equipe',
    tags: ['Organização'],
    summary: 'Adicionar pessoa do RH ou da Cozinha',
    description: 'Só RH. Devolve uma senha temporária para repassar à pessoa.',
    request: corpo(NovoMembroEquipe),
    responses: {
      201: json(ResultadoNovoMembro, 'Membro criado.'),
      ...soOrganizacao,
      409: erro('E-mail já cadastrado.'),
      422: E422,
    },
  });
  rota({
    method: 'patch',
    path: '/api/organizacao/equipe/{id}',
    tags: ['Organização'],
    summary: 'Ativar ou desativar membro da equipe',
    request: { params: ParametroId, ...corpo(EntradaAcesso) },
    responses: { 200: json(MembroEquipeResumo, 'Atualizado.'), ...soOrganizacao, 404: E404, 422: E422 },
  });
  rota({
    method: 'post',
    path: '/api/organizacao/equipe/{id}/senha',
    tags: ['Organização'],
    summary: 'Gerar senha temporária para membro da equipe',
    request: { params: ParametroId },
    responses: { 200: json(ResultadoSenhaTemporaria, 'Senha gerada.'), ...soOrganizacao, 404: E404 },
  });

  return new OpenApiGeneratorV3(registro.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'NutriCorp API',
      version: '0.1.0',
      description:
        'Contrato da API do NutriCorp. Erros seguem sempre o formato "Erro". Datas em AAAA-MM-DD e fuso America/Sao_Paulo.',
    },
    servers: [{ url: '/' }],
    tags: [
      { name: 'Cadastro e acesso' },
      { name: 'Cardápios' },
      { name: 'Colaborador', description: 'Exige perfil "colaborador".' },
      {
        name: 'Organização',
        description:
          'Exige perfil "organizacao". RH: controle de acesso, equipe e indicadores (cardápios só consulta). Cozinha: cadastro de cardápios e indicadores.',
      },
      { name: 'Infraestrutura' },
    ],
  });
}
