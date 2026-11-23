import { ErroApi, erros } from '../erros.js';
import { cnpjValido, normalizarCnpj } from '../util/documentos.js';

export interface DadosCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  setor: string;
  situacao: string;
}

interface RespostaReceitaWs {
  status?: string;
  message?: string;
  nome?: string;
  fantasia?: string;
  situacao?: string;
  atividade_principal?: { code?: string; text?: string }[];
}

const indisponivel = () =>
  new ErroApi(
    503,
    'consulta_indisponivel',
    'Não foi possível consultar a Receita agora. Preencha os dados manualmente.',
  );

const capitalizar = (texto: string) =>
  texto
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_m, espaco: string, letra: string) => espaco + letra.toUpperCase())
    .replace(/\s(Da|De|Do|Das|Dos|E)\s/g, (m) => m.toLowerCase());

export function criarServicoCnpj(buscar: typeof fetch = fetch) {
  const cache = new Map<string, DadosCnpj>();

  return {
    async consultar(valor: string): Promise<DadosCnpj> {
      const cnpj = normalizarCnpj(valor);
      if (!cnpjValido(cnpj)) throw erros.validacao({ cnpj: 'Informe um CNPJ válido.' });
      if (!/^\d{14}$/.test(cnpj))
        throw erros.validacao({ cnpj: 'A consulta automática só aceita CNPJ numérico.' });
      const salvo = cache.get(cnpj);
      if (salvo) return salvo;

      let resposta: Response;
      try {
        resposta = await buscar(`https://receitaws.com.br/v1/cnpj/${cnpj}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
      } catch {
        throw indisponivel();
      }
      if (!resposta.ok) throw indisponivel();
      const dados = (await resposta.json().catch(() => ({}))) as RespostaReceitaWs;
      if (dados.status === 'ERROR' || !dados.nome)
        throw erros.naoEncontrado('CNPJ não encontrado na Receita Federal.');

      const resultado: DadosCnpj = {
        cnpj,
        razaoSocial: dados.nome.trim(),
        nomeFantasia: (dados.fantasia?.trim() || capitalizar(dados.nome)).slice(0, 120),
        setor: (dados.atividade_principal?.[0]?.text ?? '').trim().slice(0, 120),
        situacao: dados.situacao ?? '',
      };
      cache.set(cnpj, resultado);
      return resultado;
    },
  };
}

export type ServicoCnpj = ReturnType<typeof criarServicoCnpj>;
