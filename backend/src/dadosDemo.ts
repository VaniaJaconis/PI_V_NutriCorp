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

const CNPJ = '11222333000181';

async function criarContas(servicos: Servicos, repos: Repositorios) {
  const organizacao = await servicos.contas.cadastrarOrganizacao({
    razaoSocial: 'NutriCorp Demonstração Ltda',
    cnpj: CNPJ,
    nomeFantasia: 'NutriCorp Demo',
    setor: 'Tecnologia',
    emailComunicacao: 'organizacao@nutricorp.dev',
    senha: SENHA,
  });
  const orgId = organizacao.organizacao.id;
  const contas = [
    ['Ana Souza', '52998224725', 'Financeiro', 'F-1024', 'colaborador@nutricorp.dev', true],
    ['Bruno Lima', '11144477735', 'Operações', 'F-2048', 'bruno.lima@nutricorp.dev', true],
    ['Carla Mendes', '98765432100', 'Recursos Humanos', 'F-4096', 'carla.mendes@nutricorp.dev', false],
    ['Diego Rocha', '12345678909', 'Logística', 'F-8192', 'diego.rocha@nutricorp.dev', null],
  ] as const;
  for (const [nomeCompleto, cpf, setor, codigo, email, ativo] of contas) {
    const { id } = await servicos.contas.cadastrarColaborador({
      nomeCompleto,
      cpf,
      empresa: CNPJ,
      setor,
      codigoFuncionario: codigo,
      emailCorporativo: email,
      senha: SENHA,
    });
    if (ativo !== null) {
      await servicos.organizacao.alterarAcesso(orgId, id, true);
      if (!ativo) await servicos.organizacao.alterarAcesso(orgId, id, false);
    }
  }
  const ana = await repos.colaboradores.buscarPorEmail('colaborador@nutricorp.dev');
  await servicos.preferencias.salvar(ana!.id, {
    perfil: 'vegetariana',
    restricoes: ['lactose'],
    alimentosEvitar: 'pimentão',
    outrasOrientacoes: '',
    consentimento: true,
  });
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
}

export async function popularDadosDemo(servicos: Servicos, repos: Repositorios) {
  if (!(await repos.organizacoes.buscarPorCnpj(CNPJ))) await criarContas(servicos, repos);
  const organizacao = (await repos.organizacoes.buscarPorCnpj(CNPJ))!;
  const orgId = organizacao.id;

  const dataHoje = hoje();
  const ids: Record<string, Record<string, string>> = {};
  for (let deslocamento = -6; deslocamento <= 1; deslocamento++) {
    const data = somarDias(dataHoje, deslocamento);
    const existentes = await repos.cardapios.listar({ organizacaoId: orgId, data });
    ids[data] = Object.fromEntries(existentes.map((c) => [c.nome, c.id]));
    for (const modelo of [tradicional, vegetariano, lanche]) {
      if (ids[data]![modelo.nome]) continue;
      const criado = await servicos.cardapios.criar(orgId, { ...modelo, data, estado: 'publicado' });
      ids[data]![modelo.nome] = criado.id;
    }
  }

  const sessao = async (email: string) => {
    const c = (await repos.colaboradores.buscarPorEmail(email))!;
    return {
      id: c.id,
      nome: c.nomeCompleto,
      perfil: 'colaborador' as const,
      organizacao: { id: orgId, nome: organizacao.nomeFantasia },
    };
  };
  const ana = await sessao('colaborador@nutricorp.dev');
  const bruno = await sessao('bruno.lima@nutricorp.dev');
  const registrar = async (quem: typeof ana, deslocamento: number, modelo: Modelo, observacoes = '') => {
    const data = somarDias(dataHoje, deslocamento);
    const opcaoId = ids[data]?.[modelo.nome];
    if (!opcaoId) return;
    await servicos.registros.registrar(quem, {
      data,
      tipo: modelo.refeicao!,
      opcaoId,
      observacoes,
      requisicaoId: `demo-${data}-${modelo.nome}`,
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
