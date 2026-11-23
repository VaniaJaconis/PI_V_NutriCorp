// Mesmas regras usadas no frontend (my-app/src/validation).

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function cpfValido(valor: string): boolean {
  const cpf = somenteDigitos(valor);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++)
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(cpf[tamanho])) return false;
  }
  return true;
}

export function normalizarCnpj(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Módulo 11 com valor ASCII - 48: atende ao CNPJ numérico e ao alfanumérico.
// Fonte: https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf
export function cnpjValido(valor: string): boolean {
  const cnpj = normalizarCnpj(valor);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj))
    return false;
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

/** Minúsculas, sem acentos e com espaços simples: usado para comparar textos livres. */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
