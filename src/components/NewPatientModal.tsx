import React, { useState } from 'react';
import { X, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { createPaciente } from '@/lib/db';

interface NewPatientModalProps {
  nutricionistaId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  nutricionistaId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o nome do paciente.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createPaciente({
        nutricionista_id: nutricionistaId,
        nome: nome.trim(),
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
        telefone: telefone.trim() || undefined,
        whatsapp: (whatsapp || telefone).trim() || undefined,
        email: email.trim() || undefined,
        peso_inicial: pesoInicial ? Number(pesoInicial) : undefined,
        altura: altura ? Number(altura) : undefined,
        objetivo_texto: objetivoTexto.trim() || undefined,
      });

      // Reset
      setNome('');
      setDataNascimento('');
      setTelefone('');
      setWhatsapp('');
      setEmail('');
      setPesoInicial('');
      setAltura('');
      setObjetivoTexto('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao cadastrar paciente:', err);
      setError('Ocorreu um erro ao cadastrar o paciente no Neon.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-sky-100 max-w-xl w-full flex flex-col overflow-hidden my-auto animate-scale-in">
        <div className="p-6 bg-gradient-to-r from-sky-600 to-cyan-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Novo Paciente</h2>
              <p className="text-xs text-sky-100">
                Cadastre um paciente em tempo real no Neon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="nome" required>
              Nome do Paciente
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Amanda Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nasc">Data de Nascimento</Label>
              <Input
                id="nasc"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sexo">Sexo</Label>
              <select
                id="sexo"
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="whats">WhatsApp / Telefone</Label>
              <Input
                id="whats"
                placeholder="(11) 98765-4321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email-paciente">E-mail</Label>
              <Input
                id="email-paciente"
                type="email"
                placeholder="paciente@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="peso-ini">Peso Inicial (kg)</Label>
              <Input
                id="peso-ini"
                type="number"
                step="0.1"
                placeholder="Ex: 65.0"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="alt">Altura (m)</Label>
              <Input
                id="alt"
                type="number"
                step="0.01"
                placeholder="Ex: 1.68"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="obj">Objetivo Principal</Label>
            <Input
              id="obj"
              placeholder="Ex: Emagrecimento saudável, redução de colesterol"
              value={objetivoTexto}
              onChange={(e) => setObjetivoTexto(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Cadastrar Paciente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
