import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';

const PARAMETROS = { N: 16384, r: 8, p: 1 } as const;
const TAMANHO = 64;

function scrypt(senha: string, sal: Buffer, opcoes: ScryptOptions) {
  return new Promise<Buffer>((resolver, rejeitar) =>
    scryptCallback(senha.normalize('NFKC'), sal, TAMANHO, opcoes, (erro, chave) =>
      erro ? rejeitar(erro) : resolver(chave),
    ),
  );
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scrypt(senha, sal, PARAMETROS);
  const { N, r, p } = PARAMETROS;
  return `scrypt$${N}$${r}$${p}$${sal.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [algoritmo, N, r, p, sal, hash] = armazenado.split('$');
  if (algoritmo !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'base64url');
  const calculado = await scrypt(senha, Buffer.from(sal, 'base64url'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}

let hashFicticio: Promise<string> | undefined;
export function obterHashFicticio(): Promise<string> {
  hashFicticio ??= gerarHashSenha(randomBytes(16).toString('hex'));
  return hashFicticio;
}
