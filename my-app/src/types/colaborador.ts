export interface NovoColaborador {
  nomeCompleto: string;
  cpf: string;
  empresa: string;
  setor: string;
  codigoFuncionario: string;
  emailCorporativo: string;
  senha: string;
}

export interface ResultadoCadastroColaborador {
  id: string;
  nome: string;
  organizacao: { id: string; nome: string };
  situacao: 'pendente';
  mensagem: string;
}
