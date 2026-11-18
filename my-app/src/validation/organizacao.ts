import type { NovaOrganizacao } from '../types/organizacao';

export type ErrosOrganizacao = Partial<Record<keyof NovaOrganizacao, string>>;
export function normalizarCnpj(valor: string) { return valor.toUpperCase().replace(/[^A-Z0-9]/g, ''); }
export function formatarCnpj(valor: string) {
  return normalizarCnpj(valor).slice(0, 14)
    .replace(/^(.{2})(.)/, '$1.$2')
    .replace(/^(.{6})(.)/, '$1.$2')
    .replace(/^(.{10})(.)/, '$1/$2')
    .replace(/^(.{15})(.)/, '$1-$2');
}
// Módulo 11, com valor ASCII - 48: atende ao CNPJ numérico e alfanumérico.
// Fonte: https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf
export function cnpjValido(valor: string) {
  const cnpj = normalizarCnpj(valor);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false;
  for (let tamanho = 12; tamanho <= 13; tamanho++) {
    let soma = 0;
    let peso = tamanho === 12 ? 5 : 6;
    for (let i = 0; i < tamanho; i++) {
      soma += (cnpj.charCodeAt(i) - 48) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    if (Number(cnpj[tamanho]) !== (resto < 2 ? 0 : 11 - resto)) return false;
  }
  return true;
}
export function validarOrganizacao(dados: NovaOrganizacao): ErrosOrganizacao {
  const erros: ErrosOrganizacao = {};
  for (const campo of Object.keys(dados) as (keyof NovaOrganizacao)[])
    if (!dados[campo].trim()) erros[campo] = 'Preencha este campo.';
  if (!erros.cnpj && !cnpjValido(dados.cnpj)) erros.cnpj = 'Informe um CNPJ válido.';
  if (!erros.emailComunicacao && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.emailComunicacao.trim()))
    erros.emailComunicacao = 'Informe um e-mail válido.';
  // Política provisória; alinhar exigências com o back-end.
  if (!erros.senha && dados.senha.length < 8) erros.senha = 'Use pelo menos 8 caracteres.';
  return erros;
}
