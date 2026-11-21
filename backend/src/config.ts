import { randomBytes } from 'node:crypto';

export interface Config {
  porta: number;
  producao: boolean;
  jwtSegredo: string;
  tokenValidadeHoras: number;
  origensCors: string[];
  seedDemo: boolean;
}

export function carregarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const producao = env.NODE_ENV === 'production';
  let jwtSegredo = env.JWT_SECRET ?? '';
  if (jwtSegredo.length < 32) {
    if (producao)
      throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres.');
    jwtSegredo = randomBytes(48).toString('base64url');
    if (env.NODE_ENV !== 'test')
      console.warn(
        'JWT_SECRET ausente: usando um segredo temporário (os tokens deixam de valer ao reiniciar).',
      );
  }
  const tokenValidadeHoras = Number(env.TOKEN_VALIDADE_HORAS ?? 8);
  return {
    porta: Number(env.PORT ?? 3333),
    producao,
    jwtSegredo,
    tokenValidadeHoras:
      Number.isFinite(tokenValidadeHoras) && tokenValidadeHoras > 0
        ? tokenValidadeHoras
        : 8,
    origensCors: (env.CORS_ORIGIN ?? 'http://127.0.0.1:5173,http://localhost:5173')
      .split(',')
      .map((origem) => origem.trim())
      .filter(Boolean),
    seedDemo: !producao && env.SEED_DEMO !== 'false',
  };
}
