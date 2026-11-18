import type { NovoColaborador } from '../types/colaborador';

export type ErrosCadastro = Partial<Record<keyof NovoColaborador, string>>;

export function formatarCpf(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function cpfValido(valor: string): boolean {
  const cpf = valor.replace(/\D/g, '');
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(cpf[tamanho])) return false;
  }
  return true;
}

export function validarCadastro(dados: NovoColaborador): ErrosCadastro {
  const erros: ErrosCadastro = {};
  for (const campo of Object.keys(dados) as (keyof NovoColaborador)[]) {
    if (!dados[campo].trim()) erros[campo] = 'Preencha este campo.';
  }
  if (!erros.nomeCompleto && dados.nomeCompleto.trim().split(/\s+/).length < 2)
    erros.nomeCompleto = 'Informe seu nome completo.';
  if (!erros.cpf && !cpfValido(dados.cpf)) erros.cpf = 'Informe um CPF válido.';
  if (!erros.emailCorporativo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.emailCorporativo.trim()))
    erros.emailCorporativo = 'Informe um e-mail válido.';
  // Regra provisória: alinhar a política de senhas com o back-end.
  if (!erros.senha && dados.senha.length < 8) erros.senha = 'Use pelo menos 8 caracteres.';
  return erros;
}
