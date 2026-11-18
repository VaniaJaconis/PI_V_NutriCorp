export interface NovoColaborador {
  nomeCompleto: string;
  cpf: string;
  empresa: string;
  setor: string;
  codigoFuncionario: string;
  emailCorporativo: string;
  senha: string;
}

export interface CadastroResultado {
  id: string;
  modo: 'simulado' | 'api';
}
