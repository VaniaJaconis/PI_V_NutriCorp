// Contrato provisório: alinhar códigos e campos com a API.
export type PerfilAlimentar = 'sem_preferencia' | 'vegetariana' | 'vegana' | 'pescetariana';
export type RestricaoAlimentar = 'lactose' | 'gluten' | 'amendoim' | 'castanhas' | 'ovo' | 'soja';
export interface PreferenciasColaborador {
  perfil: PerfilAlimentar;
  alimentosEvitar: string;
  restricoes: RestricaoAlimentar[];
  outrasOrientacoes: string;
}
