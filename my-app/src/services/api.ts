import { encerrarSessao, lerSessao } from './sessao';

const urlBase = (import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3333/api')
  .replace(/\/+$/, '');

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

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  corpo?: object;
  publica?: boolean;
  sinal?: AbortSignal;
}

export async function chamarApi<T>(
  caminho: string,
  { metodo = 'GET', corpo, publica = false, sinal }: Opcoes = {},
): Promise<T> {
  const token = publica ? null : lerSessao()?.token;
  if (!publica && !token) {
    const mensagem = 'Sua sessão expirou. Entre novamente.';
    encerrarSessao(mensagem);
    throw new ErroApi(401, 'nao_autenticado', mensagem);
  }

  const headers = new Headers({ Accept: 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (corpo) headers.set('Content-Type', 'application/json');
  const resposta = await fetch(`${urlBase}${caminho}`, {
    method: metodo,
    headers,
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: 'no-store',
    signal: sinal,
  });

  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => null);
    const erro = dados?.erro;
    const mensagem = erro?.mensagem ?? 'Não foi possível concluir a solicitação.';
    if (
      token &&
      (resposta.status === 401 || erro?.codigo === 'acesso_inativo') &&
      lerSessao()?.token === token
    ) {
      encerrarSessao(mensagem);
    }
    throw new ErroApi(resposta.status, erro?.codigo ?? '', mensagem, erro?.campos);
  }
  return resposta.json() as Promise<T>;
}
