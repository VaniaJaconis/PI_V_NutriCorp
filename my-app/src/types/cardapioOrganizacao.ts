// Contrato provisório do formulário. Converter números/unidades para o contrato da API.
export interface FormularioCardapio {
  nome: string; data: string; refeicao: string; unidade: string;
  inicio: string; fim: string; preparacoes: string; ingredientes: string;
  alergenos: string[]; revisado: boolean;
  porcao: string; energia: string; carboidratos: string; proteinas: string; gorduras: string; sodio: string;
}
export type EstadoCardapio = 'rascunho' | 'publicado';
export interface RegistroCardapio {
  id: string; dados: FormularioCardapio; estado: EstadoCardapio; modo: 'simulado' | 'api';
}
