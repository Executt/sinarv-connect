import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEstacoesColeta, useEntidadesCredenciadas } from "@/hooks/use-schema-data";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, Receipt, CheckCircle2 } from "lucide-react";

const MATERIAIS = ["PET", "Vidro", "Alumínio", "Papelão", "Metal", "Plástico", "Orgânico", "Eletrônico", "Outros"];

const PontoColetaNovoRecebimento = () => {
  const { data: estacoes } = useEstacoesColeta();
  const { data: entidades } = useEntidadesCredenciadas();
  const queryClient = useQueryClient();

  const [estacaoId, setEstacaoId] = useState("");
  const [material, setMaterial] = useState("");
  const [peso, setPeso] = useState("");
  const [cpf, setCpf] = useState("");
  const [anonimo, setAnonimo] = useState(false);
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recibo, setRecibo] = useState<string | null>(null);

  const estacaoSelecionada = estacoes?.find((e: any) => e.id === estacaoId);
  const entidadeId = estacaoSelecionada?.entidade_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!estacaoId || !material || !peso) {
      toast.error("Preencha a estação, material e peso.");
      return;
    }

    const pesoNum = parseFloat(peso);
    if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 99999) {
      toast.error("Peso inválido. Informe um valor entre 0.01 e 99.999 kg.");
      return;
    }

    if (!anonimo && cpf.trim().length > 0 && cpf.trim().length < 5) {
      toast.error("CPF/identificação muito curto.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await (supabase as any)
      .from("v_registro_entrada")
      .insert({
        estacao_id: estacaoId,
        entidade_id: entidadeId,
        tipo_material: material,
        peso_kg: pesoNum,
        cpf_cidadao: anonimo ? null : cpf.trim() || null,
        origem_anonima: anonimo,
        observacoes: obs.trim() || null,
      })
      .select("recibo_codigo")
      .single();

    setSubmitting(false);

    if (error) {
      toast.error("Erro ao registrar: " + error.message);
      return;
    }

    setRecibo(data?.recibo_codigo || "REC-GERADO");
    queryClient.invalidateQueries({ queryKey: ["v_registro_entrada"] });
    toast.success("Recebimento registrado com sucesso!");
  };

  const reset = () => {
    setMaterial("");
    setPeso("");
    setCpf("");
    setAnonimo(false);
    setObs("");
    setRecibo(null);
  };

  if (recibo) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="shadow-sm border-t-4 border-t-[hsl(var(--success))]">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-[hsl(var(--success))]" />
            <h2 className="text-xl font-bold text-foreground">Recebimento Registrado!</h2>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Código do Recibo</p>
              <p className="text-2xl font-mono font-bold text-[hsl(var(--primary))] mt-1">{recibo}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {material} — {parseFloat(peso).toLocaleString("pt-BR")} kg
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={reset} className="gap-2">
                <PlusCircle className="h-4 w-4" /> Nova Entrada
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Receipt className="h-4 w-4 mr-2" /> Imprimir Recibo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-[hsl(var(--primary))]" />
            Registrar Entrada de Material
          </CardTitle>
          <p className="text-xs text-muted-foreground">Formulário de ingestão — preencha os dados da pesagem aferida.</p>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Estação */}
            <div className="space-y-2">
              <Label>Estação de Coleta *</Label>
              <Select value={estacaoId} onValueChange={setEstacaoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a estação" />
                </SelectTrigger>
                <SelectContent>
                  {estacoes?.filter((e: any) => e.status_operacional === "Ativo").map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.endereco} — {e.cidade}/{e.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Material *</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAIS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Peso Aferido (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="99999"
                  placeholder="Ex: 12.50"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
              </div>
            </div>

            {/* Origem */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
              <Label className="text-sm font-semibold">Identificação da Origem</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonimo"
                  checked={anonimo}
                  onCheckedChange={(v) => setAnonimo(v === true)}
                />
                <Label htmlFor="anonimo" className="text-sm font-normal cursor-pointer">
                  Entrega anônima (sem identificação do cidadão)
                </Label>
              </div>
              {!anonimo && (
                <div className="space-y-2">
                  <Label>CPF ou Identificação do Cidadão</Label>
                  <Input
                    placeholder="Ex: ***123.456 ou nome do cidadão"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    maxLength={50}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Material limpo, separado, avariado..."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
              {submitting ? "Registrando..." : (
                <><PlusCircle className="h-5 w-5" /> Confirmar Registro de Entrada</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PontoColetaNovoRecebimento;
