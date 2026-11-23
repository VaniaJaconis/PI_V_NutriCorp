import type { EntradaCardapioDto } from './contratos/cardapios.js';
import type { Repositorios } from './repositorios/tipos.js';
import type { Servicos } from './servicos/index.js';
import { hoje, somarDias } from './util/datas.js';

const SENHA = 'NutriCorp123!';

type Modelo = Omit<EntradaCardapioDto, 'data' | 'estado'>;

const tradicional: Modelo = {
  nome: 'Almoço tradicional',
  refeicao: 'Almoço',
  unidade: 'Refeitório central',
  inicio: '11:30',
  fim: '14:00',
  preparacoes: ['Arroz branco', 'Frango grelhado', 'Purê de batata'],
  ingredientes: ['Arroz', 'Peito de frango', 'Batata', 'Leite', 'Manteiga', 'Alho', 'Sal', 'Óleo de soja'],
  alergenos: ['lactose', 'soja'],
  podeConter: [],
  perfisCompativeis: [],
  revisado: true,
  nutricional: { porcaoGramas: 450, energiaKcal: 620, carboidratosG: 70, proteinasG: 38, gordurasG: 18, sodioMg: 980 },
};

const vegetariano: Modelo = {
  nome: 'Almoço vegetariano',
  refeicao: 'Almoço',
  unidade: 'Refeitório central',
  inicio: '11:30',
  fim: '14:00',
  preparacoes: ['Arroz integral', 'Feijão', 'Legumes salteados', 'Tofu grelhado'],
  ingredientes: ['Arroz integral', 'Feijão', 'Cenoura', 'Abobrinha', 'Tofu de soja', 'Azeite', 'Alho', 'Sal'],
  alergenos: ['soja'],
  podeConter: [],
  perfisCompativeis: ['vegetariana', 'vegana'],
  revisado: true,
  nutricional: { porcaoGramas: 450, energiaKcal: 580, carboidratosG: 78, proteinasG: 24, gordurasG: 14, sodioMg: 720 },
};

const lanche: Modelo = {
  nome: 'Lanche da tarde',
  refeicao: 'Lanche',
  unidade: 'Refeitório central',
  inicio: '15:30',
  fim: '16:30',
  preparacoes: ['Iogurte com granola', 'Banana'],
  ingredientes: ['Iogurte natural', 'Granola', 'Aveia', 'Mel', 'Banana'],
  alergenos: ['lactose', 'gluten'],
  podeConter: ['castanhas', 'amendoim'],
  perfisCompativeis: ['vegetariana'],
  revisado: true,
  nutricional: { porcaoGramas: 250, energiaKcal: 310, carboidratosG: 52, proteinasG: 9, gordurasG: 7, sodioMg: 85 },
};

export async function popularDadosDemo(servicos: Servicos, repos: Repositorios) {
  if (await repos.organizacoes.buscarPorCnpj('11222333000181')) return;
  const organizacao = await servicos.contas.cadastrarOrganizacao({
    razaoSocial: 'NutriCorp Demonstração Ltda',
    cnpj: '11.222.333/0001-81',
    nomeFantasia: 'NutriCorp Demo',
    setor: 'Tecnologia',
    emailComunicacao: 'organizacao@nutricorp.dev',
    senha: SENHA,
  });
  const orgId = organizacao.organizacao.id;
  const colaborador = (nomeCompleto: string, cpf: string, setor: string, codigo: string, email: string) =>
    servicos.contas.cadastrarColaborador({
      nomeCompleto,
      cpf,
      empresa: '11.222.333/0001-81',
      setor,
      codigoFuncionario: codigo,
      emailCorporativo: email,
      senha: SENHA,
    });

  const ana = await colaborador('Ana Souza', '529.982.247-25', 'Financeiro', 'F-1024', 'colaborador@nutricorp.dev');
  const bruno = await colaborador('Bruno Lima', '111.444.777-35', 'Operações', 'F-2048', 'bruno.lima@nutricorp.dev');
  const carla = await colaborador('Carla Mendes', '987.654.321-00', 'Recursos Humanos', 'F-4096', 'carla.mendes@nutricorp.dev');
  await servicos.organizacao.alterarAcesso(orgId, carla.id, false);

  await servicos.preferencias.salvar(ana.id, {
    perfil: 'vegetariana',
    restricoes: ['lactose'],
    alimentosEvitar: 'pimentão',
    outrasOrientacoes: '',
  });

  const dataHoje = hoje();
  const ids: Record<string, Record<string, string>> = {};
  for (let deslocamento = -4; deslocamento <= 1; deslocamento++) {
    const data = somarDias(dataHoje, deslocamento);
    ids[data] = {};
    for (const modelo of [tradicional, vegetariano, lanche]) {
      const criado = await servicos.cardapios.criar(orgId, { ...modelo, data, estado: 'publicado' });
      ids[data]![modelo.nome] = criado.id;
    }
  }
  await servicos.cardapios.criar(orgId, {
    ...tradicional,
    nome: 'Jantar de sexta',
    refeicao: 'Jantar',
    data: null,
    inicio: null,
    fim: null,
    preparacoes: [],
    ingredientes: [],
    alergenos: [],
    revisado: false,
    estado: 'rascunho',
  });

  const registrar = async (
    sessao: typeof ana,
    deslocamento: number,
    modelo: Modelo,
    observacoes = '',
  ) => {
    const data = somarDias(dataHoje, deslocamento);
    await servicos.registros.registrar(sessao, {
      data,
      tipo: modelo.refeicao!,
      opcaoId: ids[data]![modelo.nome]!,
      observacoes,
      requisicaoId: `demo-${sessao.id}-${data}-${modelo.nome}`,
    });
  };
  await registrar(ana, -4, vegetariano);
  await registrar(ana, -3, vegetariano);
  await registrar(ana, -2, vegetariano, 'Porção completa.');
  await registrar(ana, -2, lanche);
  await registrar(ana, -1, vegetariano);
  await registrar(bruno, -3, tradicional);
  await registrar(bruno, -1, tradicional);
  await registrar(bruno, -1, lanche);
}
