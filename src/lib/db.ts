import { neon } from '@neondatabase/serverless';

// Conexão Neon Serverless via HTTP segura protegida por variáveis de ambiente
const connectionString = (import.meta.env.VITE_NEON_DATABASE_URL as string) || '';

export const sql = neon(connectionString);

export interface Nutricionista {
  id: string;
  nome: string;
  email: string;
  created_at?: string;
}

export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string;
  sexo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  peso_inicial?: number;
  altura?: number;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  restricoes_alimentares?: string[];
  alergias?: string[];
  medicamentos?: string;
  suplementos?: string;
  refeicoes_por_dia?: number;
  horario_acorda?: string;
  horario_dorme?: string;
  litros_agua?: number;
  atividade_fisica?: boolean;
  atividade_fisica_descricao?: string;
  observacoes?: string;
  created_at?: string;
  ultima_consulta?: string | null;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number;
  cintura?: number;
  quadril?: number;
  percentual_gordura?: number;
  observacoes?: string;
  proximo_retorno?: string | null;
  created_at?: string;
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

export interface PacienteSemRetorno {
  id: string;
  nome: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  ultima_consulta: string;
  dias_desde_ultima: number;
  proximo_retorno?: string | null;
}

export interface DashboardMetrics {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

/**
 * Garante que a nutricionista logada existe na tabela `nutricionistas`
 * e retorna seu id oficial no PostgreSQL.
 */
export async function ensureNutricionista(user: { id?: string; name?: string; email: string }): Promise<Nutricionista> {
  const email = user.email.trim().toLowerCase();
  const nome = user.name?.trim() || 'Nutricionista';

  // 1. Tenta buscar por e-mail ou por ID
  const existing = await sql`
    SELECT id, nome, email, created_at 
    FROM nutricionistas 
    WHERE email = ${email} ${user.id ? sql`OR id = ${user.id}::uuid` : sql``}
    LIMIT 1
  `;

  if (existing && existing.length > 0) {
    return existing[0] as Nutricionista;
  }

  // 2. Se não existir, insere e retorna
  const targetId = user.id || crypto.randomUUID();
  const inserted = await sql`
    INSERT INTO nutricionistas (id, nome, email, created_at)
    VALUES (${targetId}::uuid, ${nome}, ${email}, NOW())
    ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email
    RETURNING id, nome, email, created_at
  `;

  return inserted[0] as Nutricionista;
}

/**
 * Carrega em tempo real do Neon as 3 métricas do Prompt 3:
 * Card 1: Total de pacientes cadastrados pela nutricionista logada
 * Card 2: Consultas registradas na semana atual para essa nutricionista
 * Card 3: Pacientes com última consulta há mais de 30 dias e sem próximo retorno agendado
 */
export async function getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
  try {
    // 1. Total de pacientes ativos da nutricionista
    const totalResult = await sql`
      SELECT COUNT(*)::int as total
      FROM pacientes
      WHERE nutricionista_id = ${nutricionistaId}::uuid
    `;
    const totalPacientes = Number(totalResult[0]?.total || 0);

    // 2. Consultas da semana atual (Segunda a Domingo)
    const semanaResult = await sql`
      SELECT COUNT(*)::int as total
      FROM consultas c
      JOIN pacientes p ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}::uuid
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
        AND c.data_consulta < (date_trunc('week', CURRENT_DATE) + interval '7 days')::date
    `;
    const consultasSemana = Number(semanaResult[0]?.total || 0);

    // 3. Pacientes cuja última consulta foi há mais de 30 dias e não possuem próximo retorno agendado
    const semRetornoResult = await sql`
      SELECT 
        p.id,
        p.nome,
        p.telefone,
        p.whatsapp,
        p.email,
        TO_CHAR(MAX(c.data_consulta), 'YYYY-MM-DD') as ultima_consulta,
        (CURRENT_DATE - MAX(c.data_consulta))::int as dias_desde_ultima,
        TO_CHAR(MAX(c.proximo_retorno), 'YYYY-MM-DD') as proximo_retorno
      FROM pacientes p
      JOIN consultas c ON c.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}::uuid
      GROUP BY p.id, p.nome, p.telefone, p.whatsapp, p.email
      HAVING MAX(c.data_consulta) < (CURRENT_DATE - interval '30 days')::date
         AND (
           MAX(c.proximo_retorno) IS NULL 
           OR MAX(c.proximo_retorno) < CURRENT_DATE
         )
      ORDER BY MAX(c.data_consulta) ASC
    `;

    const pacientesSemRetorno: PacienteSemRetorno[] = (semRetornoResult || []).map((row) => ({
      id: String(row.id),
      nome: String(row.nome),
      telefone: row.telefone ? String(row.telefone) : undefined,
      whatsapp: row.whatsapp ? String(row.whatsapp) : undefined,
      email: row.email ? String(row.email) : undefined,
      ultima_consulta: String(row.ultima_consulta),
      dias_desde_ultima: Number(row.dias_desde_ultima),
      proximo_retorno: row.proximo_retorno ? String(row.proximo_retorno) : null,
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (err) {
    console.error('Erro ao consultar métricas do Neon em tempo real:', err);
    throw err;
  }
}

/**
 * Retorna todos os pacientes da nutricionista logada com a data da última consulta
 */
export async function getPacientesByNutricionista(nutricionistaId: string): Promise<Paciente[]> {
  const rows = await sql`
    SELECT 
      p.*,
      TO_CHAR(MAX(c.data_consulta), 'YYYY-MM-DD') as ultima_consulta
    FROM pacientes p
    LEFT JOIN consultas c ON c.paciente_id = p.id
    WHERE p.nutricionista_id = ${nutricionistaId}::uuid
    GROUP BY p.id
    ORDER BY p.nome ASC
  `;
  return rows as unknown as Paciente[];
}

/**
 * Retorna os detalhes de um paciente específico juntamente com o histórico de consultas
 */
export async function getPacienteDetails(pacienteId: string, nutricionistaId: string): Promise<{ paciente: Paciente; consultas: Consulta[] } | null> {
  const pacienteRows = await sql`
    SELECT 
      p.*,
      TO_CHAR(MAX(c.data_consulta), 'YYYY-MM-DD') as ultima_consulta
    FROM pacientes p
    LEFT JOIN consultas c ON c.paciente_id = p.id
    WHERE p.id = ${pacienteId}::uuid AND p.nutricionista_id = ${nutricionistaId}::uuid
    GROUP BY p.id
    LIMIT 1
  `;

  if (!pacienteRows || pacienteRows.length === 0) {
    return null;
  }

  const consultasRows = await sql`
    SELECT 
      id,
      paciente_id,
      TO_CHAR(data_consulta, 'YYYY-MM-DD') as data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      TO_CHAR(proximo_retorno, 'YYYY-MM-DD') as proximo_retorno,
      created_at
    FROM consultas
    WHERE paciente_id = ${pacienteId}::uuid
    ORDER BY data_consulta DESC
  `;

  return {
    paciente: pacienteRows[0] as unknown as Paciente,
    consultas: consultasRows as unknown as Consulta[],
  };
}

/**
 * Cria um novo paciente para a nutricionista com todos os campos clínicos e hábitos
 */
export async function createPaciente(paciente: Omit<Paciente, 'id' | 'created_at' | 'ultima_consulta'>): Promise<Paciente> {
  const rows = await sql`
    INSERT INTO pacientes (
      nutricionista_id,
      nome,
      data_nascimento,
      sexo,
      telefone,
      whatsapp,
      email,
      peso_inicial,
      altura,
      objetivos,
      objetivo_texto,
      nivel_atividade,
      patologias,
      restricoes_alimentares,
      alergias,
      medicamentos,
      suplementos,
      refeicoes_por_dia,
      horario_acorda,
      horario_dorme,
      litros_agua,
      atividade_fisica,
      atividade_fisica_descricao,
      observacoes
    ) VALUES (
      ${paciente.nutricionista_id}::uuid,
      ${paciente.nome},
      ${paciente.data_nascimento || null},
      ${paciente.sexo || null},
      ${paciente.telefone || null},
      ${paciente.whatsapp || null},
      ${paciente.email || null},
      ${paciente.peso_inicial != null && !isNaN(Number(paciente.peso_inicial)) ? Number(paciente.peso_inicial) : null},
      ${paciente.altura != null && !isNaN(Number(paciente.altura)) ? Number(paciente.altura) : null},
      ${paciente.objetivos || []},
      ${paciente.objetivo_texto || null},
      ${paciente.nivel_atividade || null},
      ${paciente.patologias || []},
      ${paciente.restricoes_alimentares || []},
      ${paciente.alergias || []},
      ${paciente.medicamentos || null},
      ${paciente.suplementos || null},
      ${paciente.refeicoes_por_dia != null && !isNaN(Number(paciente.refeicoes_por_dia)) ? Number(paciente.refeicoes_por_dia) : null},
      ${paciente.horario_acorda || null},
      ${paciente.horario_dorme || null},
      ${paciente.litros_agua != null && !isNaN(Number(paciente.litros_agua)) ? Number(paciente.litros_agua) : null},
      ${paciente.atividade_fisica ?? false},
      ${paciente.atividade_fisica_descricao || null},
      ${paciente.observacoes || null}
    )
    RETURNING *
  `;
  return rows[0] as unknown as Paciente;
}

/**
 * Registra uma nova consulta para o paciente
 */
export async function createConsulta(consulta: Omit<Consulta, 'id' | 'created_at'>): Promise<Consulta> {
  const rows = await sql`
    INSERT INTO consultas (
      paciente_id,
      data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      proximo_retorno
    ) VALUES (
      ${consulta.paciente_id}::uuid,
      ${consulta.data_consulta}::date,
      ${consulta.peso || null},
      ${consulta.cintura || null},
      ${consulta.quadril || null},
      ${consulta.percentual_gordura || null},
      ${consulta.observacoes || null},
      ${consulta.proximo_retorno ? sql`${consulta.proximo_retorno}::date` : null}
    )
    RETURNING 
      id,
      paciente_id,
      TO_CHAR(data_consulta, 'YYYY-MM-DD') as data_consulta,
      peso,
      cintura,
      quadril,
      percentual_gordura,
      observacoes,
      TO_CHAR(proximo_retorno, 'YYYY-MM-DD') as proximo_retorno,
      created_at
  `;
  return rows[0] as unknown as Consulta;
}

/**
 * Atualiza os dados cadastrais do paciente (Pessoal, Clínico e Hábitos)
 */
export async function updatePaciente(
  pacienteId: string,
  nutricionistaId: string,
  dados: Partial<Omit<Paciente, 'id' | 'nutricionista_id' | 'created_at' | 'ultima_consulta'>>
): Promise<Paciente> {
  const rows = await sql`
    UPDATE pacientes SET
      nome = COALESCE(${dados.nome ?? null}, nome),
      data_nascimento = ${dados.data_nascimento || null},
      sexo = ${dados.sexo || null},
      telefone = ${dados.telefone || null},
      whatsapp = ${dados.whatsapp || null},
      email = ${dados.email || null},
      peso_inicial = ${dados.peso_inicial != null && !isNaN(Number(dados.peso_inicial)) ? Number(dados.peso_inicial) : null},
      altura = ${dados.altura != null && !isNaN(Number(dados.altura)) ? Number(dados.altura) : null},
      objetivos = ${dados.objetivos || []},
      objetivo_texto = ${dados.objetivo_texto || null},
      nivel_atividade = ${dados.nivel_atividade || null},
      patologias = ${dados.patologias || []},
      restricoes_alimentares = ${dados.restricoes_alimentares || []},
      alergias = ${dados.alergias || []},
      medicamentos = ${dados.medicamentos || null},
      suplementos = ${dados.suplementos || null},
      refeicoes_por_dia = ${dados.refeicoes_por_dia != null && !isNaN(Number(dados.refeicoes_por_dia)) ? Number(dados.refeicoes_por_dia) : null},
      horario_acorda = ${dados.horario_acorda || null},
      horario_dorme = ${dados.horario_dorme || null},
      litros_agua = ${dados.litros_agua != null && !isNaN(Number(dados.litros_agua)) ? Number(dados.litros_agua) : null},
      atividade_fisica = ${dados.atividade_fisica ?? false},
      atividade_fisica_descricao = ${dados.atividade_fisica_descricao || null},
      observacoes = ${dados.observacoes || null}
    WHERE id = ${pacienteId}::uuid AND nutricionista_id = ${nutricionistaId}::uuid
    RETURNING *
  `;
  return rows[0] as unknown as Paciente;
}

/**
 * Retorna todos os planos alimentares gerados para o paciente
 */
export async function getPlanosAlimentaresByPaciente(pacienteId: string): Promise<PlanoAlimentar[]> {
  const rows = await sql`
    SELECT 
      id,
      paciente_id,
      conteudo,
      TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at
    FROM planos_alimentares
    WHERE paciente_id = ${pacienteId}::uuid
    ORDER BY created_at DESC
  `;
  return rows as unknown as PlanoAlimentar[];
}

/**
 * Popula dados de demonstração para a nutricionista logada,
 * permitindo testar os 3 cards do dashboard imediatamente com dados reais no Neon.
 */
export async function seedDemoData(nutricionistaId: string): Promise<void> {
  // 1. Paciente 1: Consulta esta semana
  const p1 = await createPaciente({
    nutricionista_id: nutricionistaId,
    nome: 'Beatriz Vasconcelos',
    data_nascimento: '1995-04-12',
    sexo: 'Feminino',
    telefone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    email: 'beatriz.vasc@gmail.com',
    peso_inicial: 64.5,
    altura: 1.68,
    objetivos: ['Emagrecimento', 'Hipertrofia'],
    nivel_atividade: 'Moderado',
    observacoes: 'Adaptação excelente ao plano nutricional.',
  });

  // Consulta hoje (semana atual)
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await createConsulta({
    paciente_id: p1.id,
    data_consulta: today,
    peso: 63.8,
    cintura: 71,
    quadril: 98,
    percentual_gordura: 22.4,
    observacoes: 'Redução de gordura visceral e ganho de massa magra.',
    proximo_retorno: nextMonth,
  });

  // 2. Paciente 2: Sem retorno há 45 dias (aparecerá no Card 3)
  const p2 = await createPaciente({
    nutricionista_id: nutricionistaId,
    nome: 'Lucas Mendonça de Oliveira',
    data_nascimento: '1989-11-23',
    sexo: 'Masculino',
    telefone: '(11) 97123-8899',
    whatsapp: '(11) 97123-8899',
    email: 'lucas.mendonca@outlook.com',
    peso_inicial: 88.0,
    altura: 1.82,
    objetivos: ['Controle de Glicemia', 'Saúde Cardiovascular'],
    nivel_atividade: 'Sedentário',
    observacoes: 'Paciente precisa de acompanhamento para controle alimentar.',
  });

  // Consulta 45 dias atrás, sem retorno agendado
  const date45DaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await createConsulta({
    paciente_id: p2.id,
    data_consulta: date45DaysAgo,
    peso: 87.2,
    cintura: 94,
    quadril: 104,
    percentual_gordura: 26.1,
    observacoes: 'Primeira consulta de anamnese. Não compareceu para agendar retorno.',
    proximo_retorno: null,
  });

  // 3. Paciente 3: Sem retorno há 38 dias (aparecerá no Card 3)
  const p3 = await createPaciente({
    nutricionista_id: nutricionistaId,
    nome: 'Juliana Paes Ferreira',
    data_nascimento: '1992-08-30',
    sexo: 'Feminino',
    telefone: '(11) 99441-2233',
    whatsapp: '(11) 99441-2233',
    email: 'juliana.nutri@gmail.com',
    peso_inicial: 59.0,
    altura: 1.62,
    objetivos: ['Reeducação Alimentar'],
    nivel_atividade: 'Leve',
    observacoes: 'Objetivo de melhora intestinal e hábitos saudáveis.',
  });

  // Consulta 38 dias atrás com retorno que já venceu
  const date38DaysAgo = new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const date8DaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await createConsulta({
    paciente_id: p3.id,
    data_consulta: date38DaysAgo,
    peso: 58.6,
    cintura: 68,
    quadril: 94,
    percentual_gordura: 21.0,
    observacoes: 'Retorno agendado para semana passada que não ocorreu.',
    proximo_retorno: date8DaysAgo, // Vencido
  });

  // 4. Paciente 4: Paciente ativo com retorno regular em dia
  const p4 = await createPaciente({
    nutricionista_id: nutricionistaId,
    nome: 'Rodrigo Alencar Silva',
    data_nascimento: '1985-03-15',
    sexo: 'Masculino',
    telefone: '(21) 98877-1122',
    whatsapp: '(21) 98877-1122',
    email: 'rodrigo.alencar@empresa.com.br',
    peso_inicial: 80.0,
    altura: 1.76,
    objetivos: ['Performance Esportiva', 'Hipertrofia'],
    nivel_atividade: 'Intenso',
    observacoes: 'Praticante de corrida e musculação.',
  });

  // Consulta ontem (semana atual)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await createConsulta({
    paciente_id: p4.id,
    data_consulta: yesterday,
    peso: 79.1,
    cintura: 82,
    quadril: 99,
    percentual_gordura: 14.8,
    observacoes: 'Ajuste de carboidratos peri-treino.',
    proximo_retorno: nextMonth,
  });
}
