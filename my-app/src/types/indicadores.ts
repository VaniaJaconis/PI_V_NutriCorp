export interface RegistroIndicadorDia {
  dia: string;
  valor: number;
  percentual: number;
}

export interface IndicadoresConsolidados {
  colaboradoresAtivos: number;
  refeicoesRegistradas: number;
  taxaAdesao: number;
  cardapiosPublicados: number;
  registrosPorDia: RegistroIndicadorDia[];
  compatibilidade: {
    compativeis: number;
    parciais: number;
    incompativeis: number;
  };
}
