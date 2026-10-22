import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Phone,
  MessageCircle,
  UserCheck,
  CalendarCheck2,
  FolderOpen,
} from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sidebar, ActiveTab } from '@/components/Sidebar';
import { PatientProfileModal } from '@/components/PatientProfileModal';
import { PatientProfileView } from '@/components/PatientProfileView';
import { NewPatientModal } from '@/components/NewPatientModal';
import { PacientesView } from '@/components/PacientesView';
import { NovoPacienteForm } from '@/components/NovoPacienteForm';
import { useAuth } from '@/context/AuthContext';
import {
  ensureNutricionista,
  getDashboardMetrics,
  seedDemoData,
  DashboardMetrics,
  Paciente,
} from '@/lib/db';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Estados de navegação e layout
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estados de dados do Neon
  const [nutricionistaDbId, setNutricionistaDbId] = useState<string | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [seeding, setSeeding] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modais
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  /**
   * Carrega métricas em tempo real do banco Neon
   */
  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingMetrics(true);
    }

    try {
      // 1. Garante que o nutricionista existe no Neon e obtém seu ID
      const nutri = await ensureNutricionista({
        id: user.id,
        name: user.name,
        email: user.email,
      });

      setNutricionistaDbId(nutri.id);

      // 2. Busca as métricas dos 3 cards diretamente no Neon
      const data = await getDashboardMetrics(nutri.id);
      setMetrics(data);
    } catch (err) {
      console.error('Falha ao sincronizar com Neon:', err);
    } finally {
      setLoadingMetrics(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Gera dados de teste realistas para demonstração imediata do dashboard
   */
  const handleSeedData = async () => {
    if (!nutricionistaDbId) return;
    setSeeding(true);
    try {
      await seedDemoData(nutricionistaDbId);
      setFeedbackMessage('Dados de exemplo inseridos com sucesso no Neon!');
      setTimeout(() => setFeedbackMessage(null), 4000);
      await loadData(true);
    } catch (err) {
      console.error('Erro ao gerar dados de teste:', err);
      alert('Não foi possível inserir os dados de exemplo.');
    } finally {
      setSeeding(false);
    }
  };

  /**
   * Abre a página de perfil completo do paciente (Prompt 5)
   */
  const handleOpenPatientProfile = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('perfil-paciente');
  };

  /**
   * Retorna o período da semana atual formatado (ex: 13/10 a 19/10)
   */
  const getSemanaAtualFormatada = () => {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay(); // 0 = Domingo, 1 = Segunda...
    const diffParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

    const segunda = new Date(hoje);
    segunda.setDate(hoje.getDate() + diffParaSegunda);

    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);

    const f = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    return `${f(segunda)} a ${f(domingo)}`;
  };

  const formatarData = (dataStr: string) => {
    try {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex">
      {/* 1. Menu Lateral Fixo com logo "Nutri APP" no topo */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        totalPacientes={metrics.totalPacientes}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Área Principal com os Cards de Informação */}
      <div className="flex-1 lg:pl-64 xl:pl-72 flex flex-col min-h-screen">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-sky-100/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>
                  {activeTab === 'dashboard'
                    ? 'Painel de Gestão'
                    : activeTab === 'pacientes'
                    ? 'Prontuários'
                    : activeTab === 'novo-paciente'
                    ? 'Cadastro de Paciente'
                    : 'Perfil do Paciente'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Neon em Tempo Real
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              isLoading={refreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
              className="text-xs"
            >
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            {activeTab !== 'novo-paciente' && (
              <Button
                size="sm"
                onClick={() => setActiveTab('novo-paciente')}
                leftIcon={<Plus className="w-4 h-4" />}
                className="text-xs shadow-md shadow-sky-600/20"
              >
                <span>Novo Paciente</span>
              </Button>
            )}
          </div>
        </header>

        {/* Feedback Alert if seed performed */}
        {feedbackMessage && (
          <div className="mx-4 sm:mx-8 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'perfil-paciente' && selectedPatientId ? (
            /* Página Completa do Perfil do Paciente (Prompt 5) */
            nutricionistaDbId && (
              <PatientProfileView
                pacienteId={selectedPatientId}
                nutricionistaId={nutricionistaDbId}
                onBack={() => setActiveTab('pacientes')}
                onDataChanged={() => loadData(true)}
              />
            )
          ) : activeTab === 'novo-paciente' ? (
            /* Formulário Completo de Cadastro de Paciente (Página Nova com 3 Abas) */
            nutricionistaDbId && (
              <NovoPacienteForm
                nutricionistaId={nutricionistaDbId}
                onSuccess={(pacienteCriado: Paciente) => {
                  loadData(true);
                  setSelectedPatientId(pacienteCriado.id);
                  setActiveTab('perfil-paciente');
                }}
                onCancel={() => setActiveTab('pacientes')}
              />
            )
          ) : activeTab === 'pacientes' ? (
            /* Visualização da Aba Pacientes */
            nutricionistaDbId && (
              <PacientesView
                nutricionistaId={nutricionistaDbId}
                onOpenPatientProfile={handleOpenPatientProfile}
                onOpenNewPatientModal={() => setActiveTab('novo-paciente')}
              />
            )
          ) : (
            /* Visualização do Dashboard Principal */
            <div className="space-y-8 animate-fade-in">
              {/* Boas-Vindas Hero Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 sm:p-8 text-white shadow-xl shadow-sky-600/15">
                <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-2.5">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    Visão Geral da Nutricionista
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Olá, {user?.name || 'Nutricionista'}! 👋
                  </h2>
                  <p className="text-sky-100 text-sm sm:text-base leading-relaxed">
                    Acompanhe em tempo real o fluxo dos seus pacientes, consultas agendadas e retornos pendentes.
                  </p>
                </div>

                {/* Se o banco estiver vazio, oferece botão para popular dados de demonstração */}
                {metrics.totalPacientes === 0 && !loadingMetrics && (
                  <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-sky-100">
                      Deseja carregar dados clínicos simulados para testar o painel?
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleSeedData}
                      isLoading={seeding}
                      leftIcon={<FolderOpen className="w-3.5 h-3.5 text-sky-700" />}
                      className="bg-white text-sky-700 hover:bg-sky-50 shadow-sm text-xs font-bold"
                    >
                      Inserir Dados de Demonstração
                    </Button>
                  </div>
                )}
              </div>

              {/* GRID DOS 3 CARDS PRINCIPAIS (Prompt 3) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ------------------------------------------------------------- */}
                {/* CARD 1 — Total de pacientes ativos */}
                {/* ------------------------------------------------------------- */}
                <Card className="p-6 border-sky-100/90 shadow-sm hover:shadow-md transition-all duration-200 bg-white relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                        Card 1
                      </span>
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Total de Pacientes Ativos
                      </CardTitle>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3 my-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">
                      {loadingMetrics ? '—' : metrics.totalPacientes}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {metrics.totalPacientes === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}
                    </span>
                  </div>

                  <CardDescription className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-sky-700 font-medium">
                      <UserCheck className="w-4 h-4 text-sky-500" />
                      Cadastrados pela sua conta
                    </span>
                    <button
                      onClick={() => setActiveTab('pacientes')}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-0.5"
                    >
                      Ver todos
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </CardDescription>
                </Card>

                {/* ------------------------------------------------------------- */}
                {/* CARD 2 — Consultas da semana */}
                {/* ------------------------------------------------------------- */}
                <Card className="p-6 border-sky-100/90 shadow-sm hover:shadow-md transition-all duration-200 bg-white relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">
                        Card 2
                      </span>
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Consultas da Semana
                      </CardTitle>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-3 my-2">
                    <span className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">
                      {loadingMetrics ? '—' : metrics.consultasSemana}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {metrics.consultasSemana === 1 ? 'consulta registrada' : 'consultas registradas'}
                    </span>
                  </div>

                  <CardDescription className="text-xs text-slate-500 mt-2 flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1.5 text-cyan-700 font-medium">
                      <CalendarCheck2 className="w-4 h-4 text-cyan-500" />
                      Semana: {getSemanaAtualFormatada()}
                    </span>
                    <span className="text-[11px] bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-full font-semibold border border-cyan-100">
                      Semana Atual
                    </span>
                  </CardDescription>
                </Card>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* CARD 3 — Pacientes sem retorno */}
              {/* ------------------------------------------------------------- */}
              <Card className="p-6 sm:p-7 border-sky-100 shadow-sm bg-white overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                        Card 3 • Atenção Clínica
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      Pacientes sem Retorno
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Pacientes cuja última consulta foi há mais de 30 dias e que não possuem próximo retorno agendado.
                    </CardDescription>
                  </div>

                  {metrics.pacientesSemRetorno.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/70 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>{metrics.pacientesSemRetorno.length} pendente(s)</span>
                    </div>
                  )}
                </div>

                {/* Conteúdo do Card 3 */}
                {loadingMetrics ? (
                  <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                    <span>Carregando dados em tempo real do Neon...</span>
                  </div>
                ) : metrics.pacientesSemRetorno.length === 0 ? (
                  /* Regra do Prompt 3: Se não houver pacientes sem retorno */
                  <div className="py-10 px-4 text-center rounded-2xl bg-gradient-to-b from-sky-50/50 to-emerald-50/30 border border-sky-100/60 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mb-1">
                      Nenhum paciente sem retorno no momento
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md">
                      Excelente! Todos os seus pacientes atendidos há mais de 30 dias já possuem retorno marcado ou tiveram consultas recentes.
                    </p>
                  </div>
                ) : (
                  /* Lista de Pacientes Sem Retorno */
                  <div className="space-y-3">
                    {metrics.pacientesSemRetorno.map((paciente) => (
                      <div
                        key={paciente.id}
                        className="p-4 rounded-2xl border border-slate-200/80 hover:border-sky-300 bg-slate-50/50 hover:bg-white transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        {/* Nome do paciente clicável */}
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-500/10 text-amber-700 font-bold flex items-center justify-center text-sm border border-amber-200/60">
                            {paciente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <button
                              onClick={() => handleOpenPatientProfile(paciente.id)}
                              className="text-left font-bold text-slate-900 group-hover:text-sky-600 hover:underline transition-colors text-base flex items-center gap-1.5"
                            >
                              <span>{paciente.nome}</span>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                            </button>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold border border-amber-200/50">
                                Última consulta há {paciente.dias_desde_ultima} dias ({formatarData(paciente.ultima_consulta)})
                              </span>
                              {paciente.proximo_retorno && (
                                <span className="text-[11px] text-slate-400">
                                  • Retorno vencido em {formatarData(paciente.proximo_retorno)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ações Rápidas: Contato e Ver Perfil */}
                        <div className="flex items-center gap-2 sm:self-center">
                          {paciente.whatsapp && (
                            <a
                              href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(paciente.nome)},%20aqui%20%C3%A9%20da%20cl%C3%ADnica%20de%20nutri%C3%A7%C3%A3o.%20Gostar%C3%ADamos%20de%20agendar%20sua%20consulta%20de%20retorno!`}
                              target="_blank"
                              rel="noreferrer"
                              title="Contatar via WhatsApp"
                              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {paciente.telefone && (
                            <a
                              href={`tel:${paciente.telefone}`}
                              title="Ligar para o paciente"
                              className="p-2.5 rounded-xl bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200/60 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenPatientProfile(paciente.id)}
                            className="text-xs"
                          >
                            Ver Perfil
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* 3. Modal de Prontuário / Perfil do Paciente */}
      {selectedPatientId && nutricionistaDbId && (
        <PatientProfileModal
          pacienteId={selectedPatientId}
          nutricionistaId={nutricionistaDbId}
          onClose={() => setSelectedPatientId(null)}
          onDataChanged={() => loadData(true)}
        />
      )}

      {/* 4. Modal para Cadastrar Novo Paciente */}
      {isNewPatientModalOpen && nutricionistaDbId && (
        <NewPatientModal
          nutricionistaId={nutricionistaDbId}
          isOpen={isNewPatientModalOpen}
          onClose={() => setIsNewPatientModalOpen(false)}
          onSuccess={() => loadData(true)}
        />
      )}
    </div>
  );
};
