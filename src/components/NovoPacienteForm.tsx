import React, { useState, useMemo } from 'react';
import {
  User,
  HeartPulse,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { createPaciente, createConsulta, Paciente } from '@/lib/db';

interface NovoPacienteFormProps {
  nutricionistaId: string;
  onSuccess: (pacienteCriado: Paciente) => void;
  onCancel: () => void;
}

type TabType = 'pessoal' | 'clinico' | 'habitos';

const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  { value: 'Sedentário', label: 'Sedentário (pouco ou nenhum exercício)' },
  { value: 'Levemente ativo', label: 'Levemente ativo (exercício leve 1 a 3 dias/semana)' },
  { value: 'Moderadamente ativo', label: 'Moderadamente ativo (exercício moderado 3 a 5 dias/semana)' },
  { value: 'Muito ativo', label: 'Muito ativo (exercício pesado 6 a 7 dias/semana)' },
  { value: 'Extremamente ativo', label: 'Extremamente ativo (exercício muito pesado / treino duplo)' },
];

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({
  nutricionistaId,
  onSuccess,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('pessoal');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Aba 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataInicioTratamento, setDataInicioTratamento] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 - Clínico
  const [pesoAtual, setPesoAtual] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoExtra, setObjetivoExtra] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Sedentário');

  // Patologias
  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [patologiaNenhum, setPatologiaNenhum] = useState(false);
  const [patologiaExtraInput, setPatologiaExtraInput] = useState('');
  const [patologiasExtras, setPatologiasExtras] = useState<string[]>([]);

  // Restrições Alimentares
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [restricaoNenhum, setRestricaoNenhum] = useState(false);
  const [restricaoExtraInput, setRestricaoExtraInput] = useState('');
  const [restricoesExtras, setRestricoesExtras] = useState<string[]>([]);

  // Alergias
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [alergiaNenhum, setAlergiaNenhum] = useState(false);
  const [alergiaExtraInput, setAlergiaExtraInput] = useState('');
  const [alergiasExtras, setAlergiasExtras] = useState<string[]>([]);

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcordaInput, setHorarioAcordaInput] = useState('');
  const [horarioDormeInput, setHorarioDormeInput] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean>(false);
  const [detalheAtividadeFisica, setDetalheAtividadeFisica] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');

  // 1. Cálculo da idade automático
  const idadeCalculada = useMemo(() => {
    if (!dataNascimento) return null;
    const parts = dataNascimento.split('-');
    if (parts.length !== 3) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dataNascimento]);

  // 2. Cálculo do IMC automático
  const imcInfo = useMemo(() => {
    const pesoNum = parseFloat(pesoAtual.replace(',', '.'));
    const alturaNum = parseFloat(alturaCm.replace(',', '.'));
    if (!pesoNum || !alturaNum || pesoNum <= 0 || alturaNum <= 0) return null;

    // Altura em metros (se digitado em cm, ex: 170 -> 1.70 m; se digitado 1.70 -> 1.70)
    const alturaM = alturaNum > 3 ? alturaNum / 100 : alturaNum;
    const imc = pesoNum / (alturaM * alturaM);
    const imcFormatado = imc.toFixed(1);

    let classificacao = '';
    let corBadge = 'bg-slate-100 text-slate-700';

    if (imc < 18.5) {
      classificacao = 'Abaixo do peso';
      corBadge = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (imc < 25) {
      classificacao = 'Peso adequado';
      corBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (imc < 30) {
      classificacao = 'Sobrepeso';
      corBadge = 'bg-orange-50 text-orange-700 border-orange-200';
    } else if (imc < 35) {
      classificacao = 'Obesidade Grau I';
      corBadge = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (imc < 40) {
      classificacao = 'Obesidade Grau II';
      corBadge = 'bg-rose-100 text-rose-800 border-rose-300';
    } else {
      classificacao = 'Obesidade Grau III';
      corBadge = 'bg-purple-50 text-purple-700 border-purple-200';
    }

    return { imc: imcFormatado, classificacao, corBadge };
  }, [pesoAtual, alturaCm]);

  // 3. Conversor inteligente de hora: 6 -> 06:00, 630 -> 06:30, 2230 -> 22:30
  const formatarHoraAoSair = (val: string): string => {
    if (!val) return '';
    const limpo = val.trim().replace(/[^0-9]/g, '');
    if (!limpo) return val;

    let horas = 0;
    let minutos = 0;

    if (limpo.length === 1 || limpo.length === 2) {
      horas = parseInt(limpo, 10);
      minutos = 0;
    } else if (limpo.length === 3) {
      horas = parseInt(limpo.substring(0, 1), 10);
      minutos = parseInt(limpo.substring(1), 10);
    } else if (limpo.length >= 4) {
      horas = parseInt(limpo.substring(0, 2), 10);
      minutos = parseInt(limpo.substring(2, 4), 10);
    }

    if (horas > 23) horas = 23;
    if (minutos > 59) minutos = 59;

    const hh = String(horas).padStart(2, '0');
    const mm = String(minutos).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Formatador de Telefone / WhatsApp
  const formatPhone = (val: string) => {
    const limpo = val.replace(/\D/g, '');
    if (limpo.length <= 10) {
      return limpo.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return limpo.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  // Alternar Objetivos
  const toggleObjetivo = (item: string) => {
    setObjetivosSelecionados((prev) =>
      prev.includes(item) ? prev.filter((o) => o !== item) : [...prev, item]
    );
  };

  // Alternar Patologias
  const togglePatologia = (item: string) => {
    if (patologiaNenhum) setPatologiaNenhum(false);
    setPatologiasSelecionadas((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  const handleSelectPatologiaNenhum = () => {
    if (!patologiaNenhum) {
      setPatologiaNenhum(true);
      setPatologiasSelecionadas([]);
      setPatologiasExtras([]);
    } else {
      setPatologiaNenhum(false);
    }
  };

  const addPatologiaExtra = () => {
    if (patologiaExtraInput.trim()) {
      if (patologiaNenhum) setPatologiaNenhum(false);
      setPatologiasExtras((prev) => [...prev, patologiaExtraInput.trim()]);
      setPatologiaExtraInput('');
    }
  };

  // Alternar Restrições
  const toggleRestricao = (item: string) => {
    if (restricaoNenhum) setRestricaoNenhum(false);
    setRestricoesSelecionadas((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    );
  };

  const handleSelectRestricaoNenhum = () => {
    if (!restricaoNenhum) {
      setRestricaoNenhum(true);
      setRestricoesSelecionadas([]);
      setRestricoesExtras([]);
    } else {
      setRestricaoNenhum(false);
    }
  };

  const addRestricaoExtra = () => {
    if (restricaoExtraInput.trim()) {
      if (restricaoNenhum) setRestricaoNenhum(false);
      setRestricoesExtras((prev) => [...prev, restricaoExtraInput.trim()]);
      setRestricaoExtraInput('');
    }
  };

  // Alternar Alergias
  const toggleAlergia = (item: string) => {
    if (alergiaNenhum) setAlergiaNenhum(false);
    setAlergiasSelecionadas((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleSelectAlergiaNenhum = () => {
    if (!alergiaNenhum) {
      setAlergiaNenhum(true);
      setAlergiasSelecionadas([]);
      setAlergiasExtras([]);
    } else {
      setAlergiaNenhum(false);
    }
  };

  const addAlergiaExtra = () => {
    if (alergiaExtraInput.trim()) {
      if (alergiaNenhum) setAlergiaNenhum(false);
      setAlergiasExtras((prev) => [...prev, alergiaExtraInput.trim()]);
      setAlergiaExtraInput('');
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // O único campo obrigatório é o nome completo
    if (!nome.trim()) {
      setActiveTab('pessoal');
      setErrorMessage('O Nome Completo é obrigatório para cadastrar o paciente.');
      return;
    }

    setSubmitting(true);
    try {
      // Compilar listas
      const patologiasFinais = patologiaNenhum
        ? ['Nenhum']
        : [...patologiasSelecionadas, ...patologiasExtras];

      const restricoesFinais = restricaoNenhum
        ? ['Nenhum']
        : [...restricoesSelecionadas, ...restricoesExtras];

      const alergiasFinais = alergiaNenhum
        ? ['Nenhum']
        : [...alergiasSelecionadas, ...alergiasExtras];

      // Altura em metros no banco (ex: 175cm -> 1.75)
      let alturaParaDb: number | undefined = undefined;
      if (alturaCm.trim()) {
        const val = parseFloat(alturaCm.replace(',', '.'));
        if (!isNaN(val) && val > 0) {
          alturaParaDb = val > 3 ? Number((val / 100).toFixed(2)) : val;
        }
      }

      const pesoParaDb = pesoAtual.trim()
        ? parseFloat(pesoAtual.replace(',', '.'))
        : undefined;

      const refeicoesParaDb = refeicoesPorDia.trim()
        ? parseInt(refeicoesPorDia, 10)
        : undefined;

      const aguaParaDb = litrosAgua.trim()
        ? parseFloat(litrosAgua.replace(',', '.'))
        : undefined;

      const novoPaciente = await createPaciente({
        nutricionista_id: nutricionistaId,
        nome: nome.trim(),
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
        telefone: telefone.trim() || undefined,
        whatsapp: (whatsapp || telefone).trim() || undefined,
        email: email.trim() || undefined,
        peso_inicial: pesoParaDb,
        altura: alturaParaDb,
        objetivos: objetivosSelecionados,
        objetivo_texto: objetivoExtra.trim() || undefined,
        nivel_atividade: nivelAtividade || undefined,
        patologias: patologiasFinais,
        restricoes_alimentares: restricoesFinais,
        alergias: alergiasFinais,
        medicamentos: medicamentos.trim() || undefined,
        suplementos: suplementos.trim() || undefined,
        refeicoes_por_dia: refeicoesParaDb,
        horario_acorda: horarioAcordaInput || undefined,
        horario_dorme: horarioDormeInput || undefined,
        litros_agua: aguaParaDb,
        atividade_fisica: praticaAtividadeFisica,
        atividade_fisica_descricao: praticaAtividadeFisica
          ? detalheAtividadeFisica.trim()
          : undefined,
        observacoes: observacoesGerais.trim() || undefined,
      });

      // Registra a primeira consulta com a data de início do tratamento
      if (dataInicioTratamento) {
        try {
          await createConsulta({
            paciente_id: novoPaciente.id,
            data_consulta: dataInicioTratamento,
            peso: pesoParaDb,
            observacoes: 'Primeira consulta — Início do tratamento',
          });
        } catch (consultaErr) {
          console.warn('Não foi possível gravar a primeira consulta automática:', consultaErr);
        }
      }

      setSuccessMessage('Paciente cadastrado com sucesso no Neon!');
      setTimeout(() => {
        onSuccess(novoPaciente);
      }, 1000);
    } catch (err: unknown) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMessage('Falha ao salvar no banco de dados Neon. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Novo Prontuário
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Cadastro de Paciente
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Preencha os dados do paciente. O único campo estritamente obrigatório é o Nome Completo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            isLoading={submitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="shadow-md shadow-sky-600/20"
          >
            Salvar Paciente
          </Button>
        </div>
      </div>

      {/* Messages Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-medium flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecionando para o perfil...</span>
        </div>
      )}

      {/* Tabs Selector Bar */}
      <div className="bg-white p-2 rounded-2xl border border-sky-100 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'pessoal'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'clinico'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/60'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>2. Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 min-w-[130px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'habitos'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/20'
              : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50/60'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>3. Hábitos</span>
        </button>
      </div>

      {/* Main Tab Content Card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6 sm:p-8 space-y-6">
          {/* ========================================================== */}
          {/* ABA 1 — PESSOAL */}
          {/* ========================================================== */}
          {activeTab === 'pessoal' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">Dados Pessoais e Contato</h2>
                <p className="text-xs text-slate-500">
                  Identificação do paciente para prontuário e canais de comunicação.
                </p>
              </div>

              {/* Nome Completo e Data de Início do Tratamento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="nome" className="text-xs font-bold text-slate-700">
                    Nome Completo <span className="text-rose-500 font-bold">* (obrigatório)</span>
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Maria Clara dos Santos"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="text-base"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dataInicioTratamento" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Início do Tratamento</span>
                    <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded font-normal">
                      1ª Consulta
                    </span>
                  </Label>
                  <Input
                    id="dataInicioTratamento"
                    type="date"
                    value={dataInicioTratamento}
                    onChange={(e) => setDataInicioTratamento(e.target.value)}
                  />
                </div>
              </div>

              {/* Data de Nascimento + Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dataNascimento" className="text-xs font-bold text-slate-700">
                      Data de Nascimento
                    </Label>
                    {idadeCalculada !== null && (
                      <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                        {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                      </span>
                    )}
                  </div>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sexo" className="text-xs font-bold text-slate-700">
                    Sexo Biológico
                  </Label>
                  <select
                    id="sexo"
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Telefone & WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-xs font-bold text-slate-700">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp" className="text-xs font-bold text-slate-700">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="paciente@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setActiveTab('clinico')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Avançar para Clínico
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* ABA 2 — CLÍNICO */}
          {/* ========================================================== */}
          {activeTab === 'clinico' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">Avaliação Clínica & Objetivos</h2>
                <p className="text-xs text-slate-500">
                  Medidas antropométricas iniciais, patologias e preferências nutricionais.
                </p>
              </div>

              {/* Peso Atual, Altura e IMC Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="space-y-1.5">
                  <Label htmlFor="pesoAtual" className="text-xs font-bold text-slate-700">
                    Peso atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="pesoAtual"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 72.5"
                      value={pesoAtual}
                      onChange={(e) => setPesoAtual(e.target.value)}
                      className="pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="alturaCm" className="text-xs font-bold text-slate-700">
                    Altura
                  </Label>
                  <div className="relative">
                    <Input
                      id="alturaCm"
                      type="number"
                      step="1"
                      placeholder="Ex: 172"
                      value={alturaCm}
                      onChange={(e) => setAlturaCm(e.target.value)}
                      className="pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    IMC (calculado automaticamente)
                  </Label>
                  <div className="h-10 px-3.5 rounded-xl border border-dashed border-sky-200 bg-sky-50/50 flex items-center justify-between text-sm">
                    {imcInfo ? (
                      <>
                        <span className="font-extrabold text-sky-900">{imcInfo.imc} kg/m²</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${imcInfo.corBadge}`}>
                          {imcInfo.classificacao}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Informe peso e altura</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Objetivo (Múltipla Escolha + Campo de texto livre) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">
                  Objetivos Nutricionais (selecione um ou mais)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {OBJETIVOS_OPCOES.map((obj) => {
                    const isSelected = objetivosSelecionados.includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        onClick={() => toggleObjetivo(obj)}
                        className={`text-xs px-3.5 py-2 rounded-xl font-medium transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {obj}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1.5">
                  <Input
                    placeholder="Objetivo detalhado ou observação adicional (opcional)..."
                    value={objetivoExtra}
                    onChange={(e) => setObjetivoExtra(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Nível de Atividade Física */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Label htmlFor="nivelAtividade" className="text-xs font-bold text-slate-700">
                  Nível de Atividade Física
                </Label>
                <select
                  id="nivelAtividade"
                  value={nivelAtividade}
                  onChange={(e) => setNivelAtividade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {NIVEIS_ATIVIDADE.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patologias ou Condições de Saúde */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">
                    Patologias ou Condições de Saúde
                  </Label>
                  <button
                    type="button"
                    onClick={handleSelectPatologiaNenhum}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      patologiaNenhum
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {patologiaNenhum ? '✓ Nenhum marcado' : 'Marcar Nenhum'}
                  </button>
                </div>

                {!patologiaNenhum && (
                  <div className="flex flex-wrap gap-2">
                    {PATOLOGIAS_OPCOES.map((pat) => {
                      const isSelected = patologiasSelecionadas.includes(pat);
                      return (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => togglePatologia(pat)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                            isSelected
                              ? 'bg-sky-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {pat}
                        </button>
                      );
                    })}
                    {patologiasExtras.map((pExtra, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 font-semibold flex items-center gap-1.5"
                      >
                        {pExtra}
                        <button
                          type="button"
                          onClick={() =>
                            setPatologiasExtras((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {!patologiaNenhum && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Adicionar outra patologia..."
                      value={patologiaExtraInput}
                      onChange={(e) => setPatologiaExtraInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPatologiaExtra();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPatologiaExtra}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Restrições Alimentares */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Restrições Alimentares</Label>
                  <button
                    type="button"
                    onClick={handleSelectRestricaoNenhum}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      restricaoNenhum
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {restricaoNenhum ? '✓ Nenhum marcado' : 'Marcar Nenhum'}
                  </button>
                </div>

                {!restricaoNenhum && (
                  <div className="flex flex-wrap gap-2">
                    {RESTRICOES_OPCOES.map((rest) => {
                      const isSelected = restricoesSelecionadas.includes(rest);
                      return (
                        <button
                          key={rest}
                          type="button"
                          onClick={() => toggleRestricao(rest)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                            isSelected
                              ? 'bg-sky-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {rest}
                        </button>
                      );
                    })}
                    {restricoesExtras.map((rExtra, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 font-semibold flex items-center gap-1.5"
                      >
                        {rExtra}
                        <button
                          type="button"
                          onClick={() =>
                            setRestricoesExtras((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {!restricaoNenhum && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Adicionar outra restrição alimentar..."
                      value={restricaoExtraInput}
                      onChange={(e) => setRestricaoExtraInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRestricaoExtra();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRestricaoExtra}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Alergias Alimentares */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Alergias Alimentares</Label>
                  <button
                    type="button"
                    onClick={handleSelectAlergiaNenhum}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      alergiaNenhum
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {alergiaNenhum ? '✓ Nenhum marcado' : 'Marcar Nenhum'}
                  </button>
                </div>

                {!alergiaNenhum && (
                  <div className="flex flex-wrap gap-2">
                    {ALERGIAS_OPCOES.map((alerg) => {
                      const isSelected = alergiasSelecionadas.includes(alerg);
                      return (
                        <button
                          key={alerg}
                          type="button"
                          onClick={() => toggleAlergia(alerg)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                            isSelected
                              ? 'bg-sky-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {alerg}
                        </button>
                      );
                    })}
                    {alergiasExtras.map((aExtra, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1.5 rounded-xl bg-sky-100 text-sky-800 font-semibold flex items-center gap-1.5"
                      >
                        {aExtra}
                        <button
                          type="button"
                          onClick={() =>
                            setAlergiasExtras((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {!alergiaNenhum && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Adicionar outra alergia alimentar..."
                      value={alergiaExtraInput}
                      onChange={(e) => setAlergiaExtraInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAlergiaExtra();
                        }
                      }}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAlergiaExtra}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Medicamentos & Suplementos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <Label htmlFor="medicamentos" className="text-xs font-bold text-slate-700">
                    Medicamentos Contínuos
                  </Label>
                  <textarea
                    id="medicamentos"
                    rows={2}
                    placeholder="Ex: Losartana 50mg pela manhã..."
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="suplementos" className="text-xs font-bold text-slate-700">
                    Suplementos em Uso
                  </Label>
                  <textarea
                    id="suplementos"
                    rows={2}
                    placeholder="Ex: Whey protein, Creatina 5g, Vitamina D..."
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('pessoal')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Voltar para Pessoal
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('habitos')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Avançar para Hábitos
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* ABA 3 — HÁBITOS */}
          {/* ========================================================== */}
          {activeTab === 'habitos' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">Rotina e Hábitos Diários</h2>
                <p className="text-xs text-slate-500">
                  Horários, hidratação e detalhes de estilo de vida do paciente.
                </p>
              </div>

              {/* Refeições por dia e Litros de água */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="refeicoesPorDia" className="text-xs font-bold text-slate-700">
                    Quantas refeições faz por dia
                  </Label>
                  <Input
                    id="refeicoesPorDia"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Ex: 4"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="litrosAgua" className="text-xs font-bold text-slate-700">
                    Quantidade de água por dia
                  </Label>
                  <div className="relative">
                    <Input
                      id="litrosAgua"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 2.5"
                      value={litrosAgua}
                      onChange={(e) => setLitrosAgua(e.target.value)}
                      className="pr-16"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      litros
                    </span>
                  </div>
                </div>
              </div>

              {/* Horários (Conversão Inteligente 6 -> 06:00, 2230 -> 22:30) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="horarioAcorda" className="text-xs font-bold text-slate-700">
                    Horário que acorda
                  </Label>
                  <div className="relative">
                    <Input
                      id="horarioAcorda"
                      placeholder="Ex: 6 ou 630"
                      value={horarioAcordaInput}
                      onChange={(e) => setHorarioAcordaInput(e.target.value)}
                      onBlur={() =>
                        setHorarioAcordaInput(formatarHoraAoSair(horarioAcordaInput))
                      }
                      className="pr-10"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Digite número direto: ex 6 vira 06:00, 630 vira 06:30.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="horarioDorme" className="text-xs font-bold text-slate-700">
                    Horário que dorme
                  </Label>
                  <div className="relative">
                    <Input
                      id="horarioDorme"
                      placeholder="Ex: 23 ou 2230"
                      value={horarioDormeInput}
                      onChange={(e) => setHorarioDormeInput(e.target.value)}
                      onBlur={() =>
                        setHorarioDormeInput(formatarHoraAoSair(horarioDormeInput))
                      }
                      className="pr-10"
                    />
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Digite número direto: ex 23 vira 23:00, 2230 vira 22:30.
                  </p>
                </div>
              </div>

              {/* Pratica Atividade Física */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">
                  Pratica atividade física?
                </Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="atividadeFisicaRadio"
                      checked={praticaAtividadeFisica === true}
                      onChange={() => setPraticaAtividadeFisica(true)}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Sim</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="atividadeFisicaRadio"
                      checked={praticaAtividadeFisica === false}
                      onChange={() => {
                        setPraticaAtividadeFisica(false);
                        setDetalheAtividadeFisica('');
                      }}
                      className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Não</span>
                  </label>
                </div>

                {praticaAtividadeFisica && (
                  <div className="mt-2 space-y-1.5 animate-scale-in">
                    <Label
                      htmlFor="detalheAtividade"
                      className="text-xs font-semibold text-slate-600"
                    >
                      Qual atividade e frequência semanal?
                    </Label>
                    <Input
                      id="detalheAtividade"
                      placeholder="Ex: Musculação 4x/semana e corrida aos sábados"
                      value={detalheAtividadeFisica}
                      onChange={(e) => setDetalheAtividadeFisica(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Label htmlFor="observacoesGerais" className="text-xs font-bold text-slate-700">
                  Observações Gerais
                </Label>
                <textarea
                  id="observacoesGerais"
                  rows={3}
                  placeholder="Anotações livres sobre o paciente, histórico de dietas anteriores, preferências..."
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('clinico')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Voltar para Clínico
                </Button>

                <Button
                  type="submit"
                  isLoading={submitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  className="shadow-lg shadow-sky-600/25"
                >
                  Confirmar e Salvar Paciente
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};