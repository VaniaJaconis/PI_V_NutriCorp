export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
    readonly campos?: Record<string, string>,
  ) {
    super(mensagem);
    this.name = 'ErroApi';
  }
}

export const erros = {
  validacao: (
    campos: Record<string, string>,
    mensagem = 'Verifique os campos destacados.',
  ) => new ErroApi(422, 'validacao', mensagem, campos),
  naoAutenticado: (mensagem = 'Faça login para continuar.') =>
    new ErroApi(401, 'nao_autenticado', mensagem),
  credenciaisInvalidas: () =>
    new ErroApi(401, 'credenciais_invalidas', 'Usuário ou senha inválidos.'),
  acessoInativo: () =>
    new ErroApi(
      403,
      'acesso_inativo',
      'Seu acesso está desativado. Procure o RH da sua organização.',
    ),
  semPermissao: () =>
    new ErroApi(
      403,
      'sem_permissao',
      'Você não tem permissão para acessar este recurso.',
    ),
  naoEncontrado: (mensagem: string) =>
    new ErroApi(404, 'nao_encontrado', mensagem),
  conflito: (campos: Record<string, string>) =>
    new ErroApi(409, 'conflito', 'Já existe um cadastro com esses dados.', campos),
};
