import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  User,
  HeartPulse,
  Coffee,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Scale,
  TrendingUp,
  Plus,
  X,
  FileText,
  Sparkles,
  Edit3,
  Save,
  MessageCircle,
  ChevronRight,
  TrendingDown,
  Minus,
  Apple,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  getPacienteDetails,
  updatePaciente,
  createConsulta,
  getPlanosAlimentaresByPaciente,
  Paciente,
  Consulta,
  PlanoAlimentar,
} from '@/lib/db';

interface PatientProfileViewProps {
  pacienteId: string;
  nutricionistaId: string;
  onBack: () => void;
  onDataChanged?: () => void;
}

type PatientTab = 'pessoal' | 'clinico' | 'habitos';

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

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  pacienteId,
  nutricionistaId,
  onBack,
  onDataChanged,
}) => {
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null);

  // Seção 1 - Edição de Dados do Paciente
  const [activeDadosTab, setActiveDadosTab] = useState<PatientTab>('pessoal');
  const [savingDados, setSavingDados] = useState(false);
  const [dadosSuccessMsg, setDadosSuccessMsg] = useState<string | null>(null);
  const [dadosErrorMsg, setDadosErrorMsg] = useState<string | null>(null);

  // Form Fields editáveis
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  const [pesoAtual, setPesoAtual] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoExtra, setObjetivoExtra] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Sedentário');

  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [patologiaNenhum, setPatologiaNenhum] = useState(false);
  const [patologiaExtraInput, setPatologiaExtraInput] = useState('');
  const [patologiasExtras, setPatologiasExtras] = useState<string[]>([]);

  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [restricaoNenhum, setRestricaoNenhum] = useState(false);
  const [restricaoExtraInput, setRestricaoExtraInput] = useState('');
  const [restricoesExtras, setRestricoesExtras] = useState<string[]>([]);

  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [alergiaNenhum, setAlergiaNenhum] = useState(false);
  const [alergiaExtraInput, setAlergiaExtraInput] = useState('');
  const [alergiasExtras, setAlergiasExtras] = useState<string[]>([]);

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcordaInput, setHorarioAcordaInput] = useState('');
  const [horarioDormeInput, setHorarioDormeInput] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean>(false);
  const [detalheAtividadeFisica, setDetalheAtividadeFisica] = useState('');
  const [observacoesGerais, setObservacoesGerais] = useState('');

  // Seção 2 - Modal Nova Consulta
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);
  const [consultaErrorMsg, setConsultaErrorMsg] = useState<string | null>(null);

  const [consultaData, setConsultaData] = useState(() => new Date().toISOString().split('T')[0]);
  const [consultaPeso, setConsultaPeso] = useState('');
  const [consultaCintura, setConsultaCintura] = useState('');
  const [consultaQuadril, setConsultaQuadril] = useState('');
  const [consultaGordura, setConsultaGordura] = useState('');
  const [consultaObs, setConsultaObs] = useState('');
  const [consultaProximoRetorno, setConsultaProximoRetorno] = useState('');

  // Carrega dados do Neon
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const details = await getPacienteDetails(pacienteId, nutricionistaId);
      if (details) {
        const p = details.paciente;
        setPaciente(p);
        setConsultas(details.consultas || []);

        // Preenche campos do formulário editável
        setNome(p.nome || '');
        setDataNascimento(p.data_nascimento || '');
        setSexo(p.sexo || 'Feminino');
        setTelefone(p.telefone || '');
        setWhatsapp(p.whatsapp || '');
        setEmail(p.email || '');

        setPesoAtual(p.peso_inicial != null ? String(p.peso_inicial) : '');
        setAlturaCm(
          p.altura != null
            ? String(p.altura > 3 ? p.altura : Math.round(p.altura * 100))
            : ''
        );
        setObjetivosSelecionados(p.objetivos || []);
        setObjetivoExtra(p.objetivo_texto || '');
        setNivelAtividade(p.nivel_atividade || 'Sedentário');

        // Patologias
        if (p.patologias?.includes('Nenhum')) {
          setPatologiaNenhum(true);
          setPatologiasSelecionadas([]);
          setPatologiasExtras([]);
        } else {
          setPatologiaNenhum(false);
          const defaultList = (p.patologias || []).filter((item) =>
            PATOLOGIAS_OPCOES.includes(item)
          );
          const customList = (p.patologias || []).filter(
            (item) => !PATOLOGIAS_OPCOES.includes(item) && item !== 'Nenhum'
          );
          setPatologiasSelecionadas(defaultList);
          setPatologiasExtras(customList);
        }

        // Restrições
        if (p.restricoes_alimentares?.includes('Nenhum')) {
          setRestricaoNenhum(true);
          setRestricoesSelecionadas([]);
          setRestricoesExtras([]);
        } else {
          setRestricaoNenhum(false);
          const defaultList = (p.restricoes_alimentares || []).filter((item) =>
            RESTRICOES_OPCOES.includes(item)
          );
          const customList = (p.restricoes_alimentares || []).filter(
            (item) => !RESTRICOES_OPCOES.includes(item) && item !== 'Nenhum'
          );
          setRestricoesSelecionadas(defaultList);
          setRestricoesExtras(customList);
        }

        // Alergias
        if (p.alergias?.includes('Nenhum')) {
          setAlergiaNenhum(true);
          setAlergiasSelecionadas([]);
          setAlergiasExtras([]);
        } else {
          setAlergiaNenhum(false);
          const defaultList = (p.alergias || []).filter((item) =>
            ALERGIAS_OPCOES.includes(item)
          );
          const customList = (p.alergias || []).filter(
            (item) => !ALERGIAS_OPCOES.includes(item) && item !== 'Nenhum'
          );
          setAlergiasSelecionadas(defaultList);
          setAlergiasExtras(customList);
        }

        setMedicamentos(p.medicamentos || '');
        setSuplementos(p.suplementos || '');

        setRefeicoesPorDia(p.refeicoes_por_dia != null ? String(p.refeicoes_por_dia) : '');
        setHorarioAcordaInput(p.horario_acorda || '');
        setHorarioDormeInput(p.horario_dorme || '');
        setLitrosAgua(p.litros_agua != null ? String(p.litros_agua) : '');
        setPraticaAtividadeFisica(Boolean(p.atividade_fisica));
        setDetalheAtividadeFisica(p.atividade_fisica_descricao || '');
        setObservacoesGerais(p.observacoes || '');
      }

      // Planos alimentares
      const planosList = await getPlanosAlimentaresByPaciente(pacienteId);
      setPlanos(planosList);
    } catch (err) {
      console.error('Erro ao carregar dados do paciente:', err);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, nutricionistaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Idade
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

  // IMC
  const imcInfo = useMemo(() => {
    const pesoNum = parseFloat(pesoAtual.replace(',', '.'));
    const alturaNum = parseFloat(alturaCm.replace(',', '.'));
    if (!pesoNum || !alturaNum || pesoNum <= 0 || alturaNum <= 0) return null;

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

  // Conversor inteligente de hora: 6 -> 06:00, 630 -> 06:30, 2230 -> 22:30
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

  const formatPhone = (val: string) => {
    const limpo = val.replace(/\D/g, '');
    if (limpo.length <= 10) {
      return limpo.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return limpo.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return '—';
    try {
      const [year, month, day] = dataStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dataStr;
    }
  };

  // Funções de tags
  const toggleObjetivo = (item: string) => {
    setObjetivosSelecionados((prev) =>
      prev.includes(item) ? prev.filter((o) => o !== item) : [...prev, item]
    );
  };

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

  // Salvar alterações dos Dados do Paciente (Seção 1)
  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setDadosErrorMsg(null);
    setDadosSuccessMsg(null);

    if (!nome.trim()) {
      setDadosErrorMsg('O nome completo não pode ficar em branco.');
      return;
    }

    setSavingDados(true);
    try {
      const patologiasFinais = patologiaNenhum
        ? ['Nenhum']
        : [...patologiasSelecionadas, ...patologiasExtras];

      const restricoesFinais = restricaoNenhum
        ? ['Nenhum']
        : [...restricoesSelecionadas, ...restricoesExtras];

      const alergiasFinais = alergiaNenhum
        ? ['Nenhum']
        : [...alergiasSelecionadas, ...alergiasExtras];

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

      const updated = await updatePaciente(pacienteId, nutricionistaId, {
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

      setPaciente(updated);
      setDadosSuccessMsg('Alterações salvas com sucesso no Neon!');
      if (onDataChanged) onDataChanged();
      setTimeout(() => setDadosSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      setDadosErrorMsg('Falha ao salvar alterações no Neon. Tente novamente.');
    } finally {
      setSavingDados(false);
    }
  };

  // Salvar Nova Consulta (Seção 2)
  const handleSalvarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsultaErrorMsg(null);

    if (!consultaData) {
      setConsultaErrorMsg('A data da consulta é obrigatória.');
      return;
    }

    setSavingConsulta(true);
    try {
      const pesoNum = consultaPeso.trim()
        ? parseFloat(consultaPeso.replace(',', '.'))
        : undefined;
      const cinturaNum = consultaCintura.trim()
        ? parseFloat(consultaCintura.replace(',', '.'))
        : undefined;
      const quadrilNum = consultaQuadril.trim()
        ? parseFloat(consultaQuadril.replace(',', '.'))
        : undefined;
      const gorduraNum = consultaGordura.trim()
        ? parseFloat(consultaGordura.replace(',', '.'))
        : undefined;

      const nova = await createConsulta({
        paciente_id: pacienteId,
        data_consulta: consultaData,
        peso: pesoNum,
        cintura: cinturaNum,
        quadril: quadrilNum,
        percentual_gordura: gorduraNum,
        observacoes: consultaObs.trim() || undefined,
        proximo_retorno: consultaProximoRetorno || null,
      });

      // Atualiza lista em ordem cronológica decrescente
      setConsultas((prev) => [nova, ...prev].sort((a, b) => b.data_consulta.localeCompare(a.data_consulta)));

      // Fecha modal e reseta formulário
      setIsConsultaModalOpen(false);
      setConsultaPeso('');
      setConsultaCintura('');
      setConsultaQuadril('');
      setConsultaGordura('');
      setConsultaObs('');
      setConsultaProximoRetorno('');
      setConsultaData(new Date().toISOString().split('T')[0]);

      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Erro ao criar consulta:', err);
      setConsultaErrorMsg('Falha ao salvar consulta no Neon. Verifique os dados.');
    } finally {
      setSavingConsulta(false);
    }
  };

  // Dados para o Gráfico de Evolução de Peso (ordenados cronologicamente do mais antigo ao mais recente)
  const dadosGrafico = useMemo(() => {
    const comPeso = consultas
      .filter((c) => c.peso != null && !isNaN(Number(c.peso)))
      .map((c) => ({
        id: c.id,
        data: c.data_consulta,
        dataFormatada: formatarData(c.data_consulta),
        peso: Number(c.peso),
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return comPeso;
  }, [consultas]);

  // Estatísticas de evolução de peso
  const estatisticasPeso = useMemo(() => {
    if (dadosGrafico.length === 0) return null;
    const primeiro = dadosGrafico[0].peso;
    const atual = dadosGrafico[dadosGrafico.length - 1].peso;
    const diff = atual - primeiro;
    const min = Math.min(...dadosGrafico.map((d) => d.peso));
    const max = Math.max(...dadosGrafico.map((d) => d.peso));

    return {
      primeiro,
      atual,
      diff: Number(diff.toFixed(1)),
      min,
      max,
    };
  }, [dadosGrafico]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-sky-600 gap-3 animate-fade-in">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-sm font-semibold">Carregando prontuário do Neon em tempo real...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-sky-100 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500">
          O registro solicitado não existe ou você não possui permissão para acessá-lo.
        </p>
        <Button onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Voltar para Prontuários
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors"
            title="Voltar para a listagem"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-sky-500/25">
            {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                Prontuário Individual
              </span>
              {paciente.sexo && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                  {paciente.sexo}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              {paciente.nome}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadastrado em {formatarData(paciente.created_at?.split('T')[0])} • Sincronização Neon em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {paciente.whatsapp && (
            <a
              href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          )}
          <Button
            size="sm"
            onClick={() => setIsConsultaModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-md shadow-sky-600/20"
          >
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 2 — CONSULTAS & EVOLUÇÃO DE PESO (EM DESTAQUE) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4 text-sky-500" />
              <span>Acompanhamento Clínico</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Seção 2 — Consultas e Evolução de Peso
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Histórico cronológico e gráfico de pesagem ao longo do tratamento.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setIsConsultaModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Registrar Consulta
          </Button>
        </div>

        {/* Gráfico de Evolução de Peso */}
        <div className="bg-gradient-to-br from-sky-50/60 to-cyan-50/40 p-5 rounded-2xl border border-sky-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-800">Gráfico de Evolução de Peso</h3>
            </div>

            {estatisticasPeso && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-600">
                  Início: <strong className="text-slate-800">{estatisticasPeso.primeiro} kg</strong>
                </span>
                <span className="text-slate-600">
                  Atual: <strong className="text-slate-800">{estatisticasPeso.atual} kg</strong>
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    estatisticasPeso.diff < 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : estatisticasPeso.diff > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {estatisticasPeso.diff < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : estatisticasPeso.diff > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {estatisticasPeso.diff > 0 ? `+${estatisticasPeso.diff}` : estatisticasPeso.diff} kg
                </span>
              </div>
            )}
          </div>

          {/* Renderização do Gráfico SVG Elegante */}
          {dadosGrafico.length === 0 ? (
            <div className="p-10 text-center bg-white/70 rounded-xl border border-dashed border-sky-200">
              <Scale className="w-8 h-8 text-sky-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nenhuma consulta registrada ainda</p>
              <p className="text-xs text-slate-500 mt-1">
                Ao registrar novas consultas, a evolução do peso aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-sky-100 shadow-xs">
              <div className="w-full h-52 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                {(() => {
                  const min = Math.min(...dadosGrafico.map((d) => d.peso)) * 0.95;
                  const max = Math.max(...dadosGrafico.map((d) => d.peso)) * 1.05;
                  const range = max - min || 1;

                  return dadosGrafico.map((item, index) => {
                    const heightPercent = Math.max(15, Math.min(100, ((item.peso - min) / range) * 100));
                    const isLatest = index === dadosGrafico.length - 1;

                    return (
                      <div key={item.id} className="flex-1 flex flex-col items-center h-full justify-end group">
                        {/* Tooltip com o peso */}
                        <div className="mb-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-lg shadow-xs ${
                              isLatest
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.peso} kg
                          </span>
                        </div>

                        {/* Barra */}
                        <div className="w-full max-w-[48px] bg-sky-100 rounded-t-xl overflow-hidden flex items-end">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full transition-all duration-500 rounded-t-xl ${
                              isLatest
                                ? 'bg-gradient-to-t from-sky-600 to-cyan-500 shadow-md shadow-sky-500/30'
                                : 'bg-gradient-to-t from-sky-400 to-cyan-300 group-hover:from-sky-500 group-hover:to-cyan-400'
                            }`}
                          />
                        </div>

                        {/* Data no Eixo X */}
                        <span className="text-[10px] text-slate-500 font-medium mt-2 truncate w-full text-center">
                          {item.dataFormatada}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Lista de Consultas em Ordem Cronológica Decrescente */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Histórico de Consultas ({consultas.length})
            </h3>
            <span className="text-xs text-slate-500">Mais recentes primeiro</span>
          </div>

          {consultas.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConsultaModalOpen(true)}
                className="mt-3 text-xs"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Registrar Primeira Consulta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {consultas.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-white rounded-2xl border border-sky-100/80 hover:border-sky-300 transition-colors shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span className="font-extrabold text-slate-800 text-sm">
                        {formatarData(c.data_consulta)}
                      </span>
                    </div>

                    {c.proximo_retorno ? (
                      <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        Próximo retorno: {formatarData(c.proximo_retorno)}
                      </span>
                    ) : (
                      <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Sem retorno agendado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Peso
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm">
                        {c.peso != null ? `${c.peso} kg` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Cintura
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm">
                        {c.cintura != null ? `${c.cintura} cm` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Quadril
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm">
                        {c.quadril != null ? `${c.quadril} cm` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        % Gordura
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm">
                        {c.percentual_gordura != null ? `${c.percentual_gordura}%` : '—'}
                      </span>
                    </div>
                  </div>

                  {c.observacoes && (
                    <div className="mt-3 text-xs text-slate-600 bg-sky-50/40 p-2.5 rounded-xl border border-sky-100/60">
                      <span className="font-bold text-sky-800 block text-[11px] mb-0.5">
                        Observações:
                      </span>
                      <p className="italic leading-relaxed">{c.observacoes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE NA PÁGINA) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
              <Edit3 className="w-4 h-4 text-sky-500" />
              <span>Prontuário Completo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Seção 1 — Dados do Paciente
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Edite diretamente qualquer informação abaixo e clique em Salvar Alterações.
            </p>
          </div>

          <Button
            size="sm"
            onClick={handleSalvarDados}
            isLoading={savingDados}
            leftIcon={<Save className="w-4 h-4" />}
            className="shadow-md shadow-sky-600/20"
          >
            Salvar Alterações
          </Button>
        </div>

        {/* Feedback Messages */}
        {dadosSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{dadosSuccessMsg}</span>
          </div>
        )}
        {dadosErrorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{dadosErrorMsg}</span>
          </div>
        )}

        {/* Abas: Pessoal, Clínico e Hábitos */}
        <div className="bg-slate-100/70 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDadosTab('pessoal')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeDadosTab === 'pessoal'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pessoal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDadosTab('clinico')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeDadosTab === 'clinico'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDadosTab('habitos')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeDadosTab === 'habitos'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-sky-700'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Hábitos</span>
          </button>
        </div>

        {/* Conteúdo da Aba Ativa */}
        <div className="space-y-5">
          {/* ABA PESSOAL */}
          {activeDadosTab === 'pessoal' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nome" className="text-xs font-bold text-slate-700">
                  Nome Completo <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="edit-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do paciente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-nascimento" className="text-xs font-bold text-slate-700">
                      Data de Nascimento
                    </Label>
                    {idadeCalculada !== null && (
                      <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                        {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                      </span>
                    )}
                  </div>
                  <Input
                    id="edit-nascimento"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-sexo" className="text-xs font-bold text-slate-700">
                    Sexo Biológico
                  </Label>
                  <select
                    id="edit-sexo"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-tel" className="text-xs font-bold text-slate-700">
                    Telefone
                  </Label>
                  <Input
                    id="edit-tel"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-wpp" className="text-xs font-bold text-slate-700">
                    WhatsApp
                  </Label>
                  <Input
                    id="edit-wpp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="text-xs font-bold text-slate-700">
                    E-mail
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA CLÍNICO */}
          {activeDadosTab === 'clinico' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-peso" className="text-xs font-bold text-slate-700">
                    Peso atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-peso"
                      type="number"
                      step="0.1"
                      value={pesoAtual}
                      onChange={(e) => setPesoAtual(e.target.value)}
                      className="pr-12"
                      placeholder="Ex: 70.0"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-altura" className="text-xs font-bold text-slate-700">
                    Altura
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-altura"
                      type="number"
                      step="1"
                      value={alturaCm}
                      onChange={(e) => setAlturaCm(e.target.value)}
                      className="pr-12"
                      placeholder="Ex: 170"
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

              {/* Objetivos */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">Objetivo</Label>
                <div className="flex flex-wrap gap-2">
                  {OBJETIVOS_OPCOES.map((obj) => {
                    const isSelected = objetivosSelecionados.includes(obj);
                    return (
                      <button
                        key={obj}
                        type="button"
                        onClick={() => toggleObjetivo(obj)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {obj}
                      </button>
                    );
                  })}
                </div>
                <Input
                  placeholder="Objetivo adicional ou texto livre..."
                  value={objetivoExtra}
                  onChange={(e) => setObjetivoExtra(e.target.value)}
                  className="text-xs mt-1.5"
                />
              </div>

              {/* Nível de Atividade */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Label htmlFor="edit-nivel" className="text-xs font-bold text-slate-700">
                  Nível de Atividade Física
                </Label>
                <select
                  id="edit-nivel"
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

              {/* Patologias */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">
                    Patologias ou Condições de Saúde
                  </Label>
                  <button
                    type="button"
                    onClick={handleSelectPatologiaNenhum}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      patologiaNenhum ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {patologiaNenhum ? '✓ Nenhum marcado' : 'Marcar Nenhum'}
                  </button>
                </div>

                {!patologiaNenhum && (
                  <div className="flex flex-wrap gap-2">
                    {PATOLOGIAS_OPCOES.map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => togglePatologia(pat)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium ${
                          patologiasSelecionadas.includes(pat)
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        {patologiasSelecionadas.includes(pat) ? '✓ ' : '+ '}
                        {pat}
                      </button>
                    ))}
                    {patologiasExtras.map((pExtra, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-semibold flex items-center gap-1.5"
                      >
                        {pExtra}
                        <button
                          type="button"
                          onClick={() => setPatologiasExtras((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {!patologiaNenhum && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar patologia..."
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
                    <Button type="button" variant="outline" size="sm" onClick={addPatologiaExtra}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Restrições */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Restrições Alimentares</Label>
                  <button
                    type="button"
                    onClick={handleSelectRestricaoNenhum}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      restricaoNenhum ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {restricaoNenhum ? '✓ Nenhum marcado' : 'Marcar Nenhum'}
                  </button>
                </div>
                {!restricaoNenhum && (
                  <div className="flex flex-wrap gap-2">
                    {RESTRICOES_OPCOES.map((rest) => (
                      <button
                        key={rest}
                        type="button"
                        onClick={() => toggleRestricao(rest)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium ${
                          restricoesSelecionadas.includes(rest)
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        {restricoesSelecionadas.includes(rest) ? '✓ ' : '+ '}
                        {rest}
                      </button>
                    ))}
                    {restricoesExtras.map((rExtra, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-semibold flex items-center gap-1.5"
                      >
                        {rExtra}
                        <button
                          type="button"
                          onClick={() => setRestricoesExtras((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {!restricaoNenhum && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar restrição..."
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
                    <Button type="button" variant="outline" size="sm" onClick={addRestricaoExtra}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Alergias */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Alergias Alimentares</Label>
                  <button
                    type="button"
                    onClick={handleSelectAlergiaNenhum}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      alergiaNenhum ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {alergiaNenhum ? '✓ Nenhum marcado' : 'Marcar Nenhum'}
                  </button>
                </div>
                {!alergiaNenhum && (
                  <div className="flex flex-wrap gap-2">
                    {ALERGIAS_OPCOES.map((alerg) => (
                      <button
                        key={alerg}
                        type="button"
                        onClick={() => toggleAlergia(alerg)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-medium ${
                          alergiasSelecionadas.includes(alerg)
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                        }`}
                      >
                        {alergiasSelecionadas.includes(alerg) ? '✓ ' : '+ '}
                        {alerg}
                      </button>
                    ))}
                    {alergiasExtras.map((aExtra, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-semibold flex items-center gap-1.5"
                      >
                        {aExtra}
                        <button
                          type="button"
                          onClick={() => setAlergiasExtras((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {!alergiaNenhum && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar alergia..."
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
                    <Button type="button" variant="outline" size="sm" onClick={addAlergiaExtra}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Medicamentos e Suplementos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-meds" className="text-xs font-bold text-slate-700">
                    Medicamentos Contínuos
                  </Label>
                  <textarea
                    id="edit-meds"
                    rows={2}
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-supl" className="text-xs font-bold text-slate-700">
                    Suplementos em Uso
                  </Label>
                  <textarea
                    id="edit-supl"
                    rows={2}
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA HÁBITOS */}
          {activeDadosTab === 'habitos' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-refeicoes" className="text-xs font-bold text-slate-700">
                    Quantas refeições faz por dia
                  </Label>
                  <Input
                    id="edit-refeicoes"
                    type="number"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-agua" className="text-xs font-bold text-slate-700">
                    Quantidade de água por dia
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-agua"
                      type="number"
                      step="0.1"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-acorda" className="text-xs font-bold text-slate-700">
                    Horário que acorda
                  </Label>
                  <Input
                    id="edit-acorda"
                    value={horarioAcordaInput}
                    onChange={(e) => setHorarioAcordaInput(e.target.value)}
                    onBlur={() => setHorarioAcordaInput(formatarHoraAoSair(horarioAcordaInput))}
                    placeholder="Ex: 6 ou 630"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-dorme" className="text-xs font-bold text-slate-700">
                    Horário que dorme
                  </Label>
                  <Input
                    id="edit-dorme"
                    value={horarioDormeInput}
                    onChange={(e) => setHorarioDormeInput(e.target.value)}
                    onBlur={() => setHorarioDormeInput(formatarHoraAoSair(horarioDormeInput))}
                    placeholder="Ex: 23 ou 2230"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">Pratica atividade física?</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="edit-ativ"
                      checked={praticaAtividadeFisica === true}
                      onChange={() => setPraticaAtividadeFisica(true)}
                    />
                    <span>Sim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="edit-ativ"
                      checked={praticaAtividadeFisica === false}
                      onChange={() => {
                        setPraticaAtividadeFisica(false);
                        setDetalheAtividadeFisica('');
                      }}
                    />
                    <span>Não</span>
                  </label>
                </div>
                {praticaAtividadeFisica && (
                  <Input
                    placeholder="Qual atividade e frequência semanal?"
                    value={detalheAtividadeFisica}
                    onChange={(e) => setDetalheAtividadeFisica(e.target.value)}
                    className="text-xs mt-1"
                  />
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Label htmlFor="edit-obs" className="text-xs font-bold text-slate-700">
                  Observações Gerais
                </Label>
                <textarea
                  id="edit-obs"
                  rows={3}
                  value={observacoesGerais}
                  onChange={(e) => setObservacoesGerais(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {/* Botão Salvar no Rodapé da Seção 1 */}
          <div className="pt-3 flex justify-end">
            <Button
              size="sm"
              onClick={handleSalvarDados}
              isLoading={savingDados}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SEÇÃO 3 — PLANOS ALIMENTARES */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl border border-sky-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
              <Apple className="w-4 h-4 text-sky-500" />
              <span>Conduta Nutricional</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
              Seção 3 — Planos Alimentares
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prescrição de cardápios e dietas personalizadas para o paciente.
            </p>
          </div>

          {/* Botão "Gerar Plano Alimentar" bem visível (sem funcionalidade ativa por enquanto) */}
          <Button
            size="sm"
            onClick={() =>
              alert(
                'A geração inteligente de Planos Alimentares será implementada no próximo prompt!'
              )
            }
            leftIcon={<Sparkles className="w-4 h-4 text-sky-200" />}
            className="bg-gradient-to-r from-sky-600 to-cyan-600 shadow-md shadow-sky-600/20"
          >
            Gerar Plano Alimentar
          </Button>
        </div>

        {/* Histórico de Planos */}
        {planos.length === 0 ? (
          <div className="p-10 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">Nenhum plano alimentar gerado ainda</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Utilize o botão acima para criar e prescrever o primeiro planejamento alimentar deste paciente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planos.map((plano) => (
              <div
                key={plano.id}
                onClick={() => setSelectedPlano(plano)}
                className="p-5 bg-white rounded-2xl border border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                      Plano Alimentar
                    </span>
                    <span className="text-xs text-slate-400">{plano.created_at}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                    {plano.conteudo?.titulo || `Plano Gerado em ${plano.created_at}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {typeof plano.conteudo === 'string'
                      ? plano.conteudo
                      : plano.conteudo?.descricao || 'Clique para visualizar o conteúdo detalhado.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
                  <span>Visualizar cardápio</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* MODAL: NOVA CONSULTA (SEÇÃO 2) */}
      {/* ========================================================================= */}
      {isConsultaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 max-w-lg w-full flex flex-col overflow-hidden my-auto animate-scale-in">
            {/* Header Modal */}
            <div className="p-6 bg-gradient-to-r from-sky-600 to-cyan-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Nova Consulta</h3>
                  <p className="text-xs text-sky-100">Registro clínico e medidas antropométricas</p>
                </div>
              </div>
              <button
                onClick={() => setIsConsultaModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSalvarConsulta} className="p-6 space-y-4">
              {consultaErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {consultaErrorMsg}
                </div>
              )}

              {/* Data da Consulta (hoje por padrão, editável) */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-consulta-data" className="text-xs font-bold text-slate-700">
                  Data da consulta <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="modal-consulta-data"
                  type="date"
                  value={consultaData}
                  onChange={(e) => setConsultaData(e.target.value)}
                  required
                />
              </div>

              {/* Peso atual em kg */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-consulta-peso" className="text-xs font-bold text-slate-700">
                  Peso atual em kg
                </Label>
                <div className="relative">
                  <Input
                    id="modal-consulta-peso"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 68.4"
                    value={consultaPeso}
                    onChange={(e) => setConsultaPeso(e.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              {/* Cintura, Quadril e % Gordura (opcionais) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-cintura" className="text-[11px] font-bold text-slate-700">
                    Cintura (cm)
                  </Label>
                  <Input
                    id="modal-cintura"
                    type="number"
                    step="0.5"
                    placeholder="Ex: 74"
                    value={consultaCintura}
                    onChange={(e) => setConsultaCintura(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-quadril" className="text-[11px] font-bold text-slate-700">
                    Quadril (cm)
                  </Label>
                  <Input
                    id="modal-quadril"
                    type="number"
                    step="0.5"
                    placeholder="Ex: 96"
                    value={consultaQuadril}
                    onChange={(e) => setConsultaQuadril(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal-gordura" className="text-[11px] font-bold text-slate-700">
                    % Gordura
                  </Label>
                  <Input
                    id="modal-gordura"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 22.0"
                    value={consultaGordura}
                    onChange={(e) => setConsultaGordura(e.target.value)}
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-obs" className="text-xs font-bold text-slate-700">
                  Observações
                </Label>
                <textarea
                  id="modal-obs"
                  rows={2}
                  placeholder="Orientações dadas, evolução relatada pelo paciente..."
                  value={consultaObs}
                  onChange={(e) => setConsultaObs(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-sky-200/80 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Próximo retorno */}
              <div className="space-y-1.5">
                <Label htmlFor="modal-proximo" className="text-xs font-bold text-slate-700">
                  Próximo retorno
                </Label>
                <Input
                  id="modal-proximo"
                  type="date"
                  value={consultaProximoRetorno}
                  onChange={(e) => setConsultaProximoRetorno(e.target.value)}
                />
              </div>

              {/* Botões */}
              <div className="pt-3 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConsultaModalOpen(false)}
                  disabled={savingConsulta}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={savingConsulta}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Salvar consulta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETALHE DO PLANO ALIMENTAR (SEÇÃO 3) */}
      {/* ========================================================================= */}
      {selectedPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 max-w-2xl w-full flex flex-col overflow-hidden my-auto animate-scale-in max-h-[85vh]">
            <div className="p-6 bg-gradient-to-r from-sky-600 to-cyan-500 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  Plano Alimentar
                </span>
                <h3 className="text-xl font-bold mt-1">
                  {selectedPlano.conteudo?.titulo || `Plano Gerado em ${selectedPlano.created_at}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlano(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {typeof selectedPlano.conteudo === 'string'
                  ? selectedPlano.conteudo
                  : JSON.stringify(selectedPlano.conteudo, null, 2)}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedPlano(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};