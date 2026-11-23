import { randomBytes } from 'node:crypto';

export interface Config {
  porta: number;
  jwtSegredo: string;
  tokenValidadeHoras: number;
  origensCors: string[];
  databaseUrl: string;
  seedDemo: boolean;
}

export function carregarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const producao = env.NODE_ENV === 'production';
  let jwtSegredo = env.JWT_SECRET ?? '';
  if (jwtSegredo.length < 32) {
    if (producao) throw new Error('Defina JWT_SECRET com pelo menos 32 caracteres.');
    jwtSegredo = randomBytes(48).toString('base64url');
  }
  return {
    porta: Number(env.PORT ?? 3333),
    jwtSegredo,
    tokenValidadeHoras: Number(env.TOKEN_VALIDADE_HORAS) || 8,
    origensCors: (env.CORS_ORIGIN ?? 'http://127.0.0.1:5173,http://localhost:5173')
      .split(',')
      .map((origem) => origem.trim())
      .filter(Boolean),
    databaseUrl: env.DATABASE_URL ?? '',
    seedDemo: env.SEED_DEMO ? env.SEED_DEMO === 'true' : !producao,
  };
}
