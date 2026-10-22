import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  Loader2,
  RefreshCw,
  Calendar,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getPacientesByNutricionista, Paciente } from '@/lib/db';

interface PacientesViewProps {
  nutricionistaId: string;
  onOpenPatientProfile: (pacienteId: string) => void;
  onOpenNewPatientModal: () => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  nutricionistaId,
  onOpenPatientProfile,
  onOpenNewPatientModal,
}) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPacientes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getPacientesByNutricionista(nutricionistaId);
      setPacientes(data);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [nutricionistaId]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  const filteredPacientes = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatarData = (dataStr?: string | null) => {
    if (!dataStr) return 'Nenhuma consulta registrada';
    try {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataStr;
    }
  };

  const getObjetivoDisplay = (p: Paciente) => {
    if (p.objetivos && p.objetivos.length > 0) {
      return p.objetivos.join(', ');
    }
    if (p.objetivo_texto) {
      return p.objetivo_texto;
    }
    return 'Não especificado';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-sky-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
              Gestão de Prontuários
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Pacientes Cadastrados
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Lista completa de pacientes cadastrados pela nutricionista logada.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPacientes(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={onOpenNewPatientModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Search Input Bar (Busca por nome no topo da listagem) */}
      <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <Input
          placeholder="Buscar paciente por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-none focus:ring-0 shadow-none px-0 text-slate-700 placeholder:text-slate-400 text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-sky-600 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-medium">Carregando pacientes do Neon...</p>
        </div>
      ) : filteredPacientes.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-sky-200/80 bg-sky-50/20">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {searchTerm
              ? 'Nenhum paciente encontrado para esta busca.'
              : 'Nenhum paciente cadastrado ainda'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm
              ? 'Tente pesquisar com outro nome.'
              : 'Clique no botão abaixo para preencher o formulário de cadastro com dados pessoais, clínicos e hábitos.'}
          </p>
          {!searchTerm && (
            <Button
              className="mt-6 shadow-md shadow-sky-600/20"
              onClick={onOpenNewPatientModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Cadastrar Primeiro Paciente
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPacientes.map((p) => {
            const objetivoTexto = getObjetivoDisplay(p);
            const ultimaConsultaTexto = formatarData(p.ultima_consulta);

            return (
              <div
                key={p.id}
                onClick={() => onOpenPatientProfile(p.id)}
                className="bg-white p-5 rounded-2xl border border-sky-100/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    {p.sexo && (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {p.sexo}
                      </span>
                    )}
                  </div>

                  {/* Nome do paciente */}
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                    {p.nome}
                  </h3>

                  {/* Objetivo */}
                  <div className="mt-3 bg-sky-50/80 p-2.5 rounded-xl border border-sky-100/60">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 mb-0.5">
                      <Target className="w-3.5 h-3.5" />
                      <span>Objetivo:</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2">
                      {objetivoTexto}
                    </p>
                  </div>

                  {/* Data da última consulta */}
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Última consulta:</span>
                    <span className="font-semibold text-slate-800">{ultimaConsultaTexto}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
                  <span>Ver perfil do paciente</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
