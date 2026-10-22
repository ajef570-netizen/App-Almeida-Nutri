import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Scale,
  Ruler,
  Clock,
  Activity,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  getPacienteDetails,
  createConsulta,
  Paciente,
  Consulta,
} from '@/lib/db';

interface PatientProfileModalProps {
  pacienteId: string | null;
  nutricionistaId: string;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  pacienteId,
  nutricionistaId,
  onClose,
  onDataChanged,
}) => {
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Formulário para registrar nova consulta / retorno
  const [showNewConsultaForm, setShowNewConsultaForm] = useState(false);
  const [submittingConsulta, setSubmittingConsulta] = useState(false);
  const [novaDataConsulta, setNovaDataConsulta] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [novoPeso, setNovoPeso] = useState('');
  const [novaCintura, setNovaCintura] = useState('');
  const [novoQuadril, setNovoQuadril] = useState('');
  const [novoPercentualGordura, setNovoPercentualGordura] = useState('');
  const [novasObservacoes, setNovasObservacoes] = useState('');
  const [novoProximoRetorno, setNovoProximoRetorno] = useState('');

  useEffect(() => {
    if (!pacienteId) return;

    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPacienteDetails(pacienteId!, nutricionistaId);
        if (isMounted) {
          if (data) {
            setPaciente(data.paciente);
            setConsultas(data.consultas);
          } else {
            setError('Paciente não encontrado ou sem permissão de acesso.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Erro ao carregar detalhes do paciente:', err);
          setError('Não foi possível carregar os dados do paciente.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [pacienteId, nutricionistaId]);

  if (!pacienteId) return null;

  // Cálculo do IMC
  const imc =
    paciente?.peso_inicial && paciente?.altura
      ? (
          Number(paciente.peso_inicial) /
          (Number(paciente.altura) * Number(paciente.altura))
        ).toFixed(1)
      : null;

  const handleSalvarConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    setSubmittingConsulta(true);
    try {
      const created = await createConsulta({
        paciente_id: pacienteId,
        data_consulta: novaDataConsulta,
        peso: novoPeso ? Number(novoPeso) : undefined,
        cintura: novaCintura ? Number(novaCintura) : undefined,
        quadril: novoQuadril ? Number(novoQuadril) : undefined,
        percentual_gordura: novoPercentualGordura
          ? Number(novoPercentualGordura)
          : undefined,
        observacoes: novasObservacoes || undefined,
        proximo_retorno: novoProximoRetorno || null,
      });

      setConsultas([created, ...consultas]);
      setShowNewConsultaForm(false);
      // Reset form
      setNovoPeso('');
      setNovaCintura('');
      setNovoQuadril('');
      setNovoPercentualGordura('');
      setNovasObservacoes('');
      setNovoProximoRetorno('');

      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      console.error('Erro ao registrar consulta:', err);
      alert('Erro ao salvar consulta. Verifique os dados inseridos.');
    } finally {
      setSubmittingConsulta(false);
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-scale-in">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xl font-bold shadow-inner">
              {paciente?.nome ? paciente.nome.charAt(0).toUpperCase() : <User />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                  Prontuário do Paciente
                </span>
                {paciente?.sexo && (
                  <span className="text-xs text-sky-100">• {paciente.sexo}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                {paciente?.nome || 'Carregando paciente...'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-sky-600 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Buscando dados no Neon...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : paciente ? (
            <>
              {/* Quick Contacts Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-sky-50/60 rounded-2xl border border-sky-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-sky-600 shadow-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      Telefone
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {paciente.telefone || 'Não informado'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shadow-xs">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      WhatsApp
                    </span>
                    {paciente.whatsapp ? (
                      <a
                        href={`https://wa.me/55${paciente.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        {paciente.whatsapp}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">Não informado</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-sky-600 shadow-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                      E-mail
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate block">
                      {paciente.email || 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Anthropometric & Clinical Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Scale className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-medium">Peso Inicial</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Ruler className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs font-medium">Altura</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {paciente.altura ? `${paciente.altura} m` : '—'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium">IMC Inicial</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {imc ? `${imc} kg/m²` : '—'}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Clock className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-medium">Atividade</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {paciente.nivel_atividade || 'Normal'}
                  </div>
                </div>
              </div>

              {/* Observações e Objetivos */}
              {(paciente.objetivos || paciente.observacoes) && (
                <div className="p-4 bg-sky-50/40 rounded-2xl border border-sky-100/60 space-y-2">
                  <h4 className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    Objetivos & Observações Clínicas
                  </h4>
                  {paciente.objetivos && paciente.objetivos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {paciente.objetivos.map((obj, i) => (
                        <span
                          key={i}
                          className="bg-white px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-700 border border-sky-200/60 shadow-xs"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  )}
                  {paciente.observacoes && (
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{paciente.observacoes}"
                    </p>
                  )}
                </div>
              )}

              {/* Histórico de Consultas & Agendamento */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      Histórico de Consultas ({consultas.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Registro de retornos e evolução corporal
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={showNewConsultaForm ? 'secondary' : 'default'}
                    onClick={() => setShowNewConsultaForm(!showNewConsultaForm)}
                    leftIcon={
                      showNewConsultaForm ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )
                    }
                  >
                    {showNewConsultaForm ? 'Cancelar' : 'Nova Consulta / Retorno'}
                  </Button>
                </div>

                {/* Form to Record New Consultation / Schedule Return */}
                {showNewConsultaForm && (
                  <form
                    onSubmit={handleSalvarConsulta}
                    className="p-5 bg-gradient-to-br from-sky-50 to-cyan-50/40 rounded-2xl border border-sky-200/80 space-y-4 animate-fade-in shadow-inner"
                  >
                    <h4 className="text-sm font-bold text-sky-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-600" />
                      Registrar Consulta / Agendar Próximo Retorno
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="data-consulta" required>
                          Data da Consulta
                        </Label>
                        <Input
                          id="data-consulta"
                          type="date"
                          value={novaDataConsulta}
                          onChange={(e) => setNovaDataConsulta(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="proximo-retorno">
                          Próximo Retorno Agendado
                        </Label>
                        <Input
                          id="proximo-retorno"
                          type="date"
                          value={novoProximoRetorno}
                          onChange={(e) => setNovoProximoRetorno(e.target.value)}
                          placeholder="Data do próximo retorno"
                        />
                      </div>

                      <div>
                        <Label htmlFor="peso-consulta">Peso Atual (kg)</Label>
                        <Input
                          id="peso-consulta"
                          type="number"
                          step="0.1"
                          placeholder="Ex: 68.5"
                          value={novoPeso}
                          onChange={(e) => setNovoPeso(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="gordura-consulta">
                          Percentual de Gordura (%)
                        </Label>
                        <Input
                          id="gordura-consulta"
                          type="number"
                          step="0.1"
                          placeholder="Ex: 21.5"
                          value={novoPercentualGordura}
                          onChange={(e) => setNovoPercentualGordura(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="cintura-consulta">Cintura (cm)</Label>
                        <Input
                          id="cintura-consulta"
                          type="number"
                          step="0.5"
                          placeholder="Ex: 75.0"
                          value={novaCintura}
                          onChange={(e) => setNovaCintura(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="quadril-consulta">Quadril (cm)</Label>
                        <Input
                          id="quadril-consulta"
                          type="number"
                          step="0.5"
                          placeholder="Ex: 98.0"
                          value={novoQuadril}
                          onChange={(e) => setNovoQuadril(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="obs-consulta">Observações Clínicas</Label>
                      <Input
                        id="obs-consulta"
                        type="text"
                        placeholder="Ex: Boa adesão à dieta, orientações sobre ingestão hídrica."
                        value={novasObservacoes}
                        onChange={(e) => setNovasObservacoes(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewConsultaForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        isLoading={submittingConsulta}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        Salvar Consulta
                      </Button>
                    </div>
                  </form>
                )}

                {/* List of Consultations */}
                {consultas.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      Nenhuma consulta registrada ainda.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Clique em "Nova Consulta / Retorno" para registrar o primeiro atendimento deste paciente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consultas.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-200 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">
                              {formatarData(c.data_consulta)}
                            </span>
                            {c.proximo_retorno ? (
                              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Retorno: {formatarData(c.proximo_retorno)}
                              </span>
                            ) : (
                              <span className="text-[11px] bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full border border-amber-100">
                                Sem retorno agendado
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">
                              Peso
                            </span>
                            <span className="font-semibold text-slate-700">
                              {c.peso ? `${c.peso} kg` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">
                              % Gordura
                            </span>
                            <span className="font-semibold text-slate-700">
                              {c.percentual_gordura
                                ? `${c.percentual_gordura}%`
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">
                              Cintura
                            </span>
                            <span className="font-semibold text-slate-700">
                              {c.cintura ? `${c.cintura} cm` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">
                              Quadril
                            </span>
                            <span className="font-semibold text-slate-700">
                              {c.quadril ? `${c.quadril} cm` : '—'}
                            </span>
                          </div>
                        </div>

                        {c.observacoes && (
                          <p className="text-xs text-slate-600 mt-2 italic bg-sky-50/30 p-2 rounded-lg">
                            {c.observacoes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar Prontuário
          </Button>
        </div>
      </div>
    </div>
  );
};
