import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCooperativas } from "@/hooks/use-schema-data";
import { useEstoqueCooperativa } from "@/hooks/use-cooperativa-data";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale, QrCode, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const materiais = ["PET", "Vidro", "Alumínio", "Papelão", "Metal", "Plástico", "Orgânico", "Eletrônico", "Outros"];

const CooperativaRecepcao = () => {
  const { data: cooperativas, isLoading: loadCoop } = useCooperativas();
  const [selectedCoop, setSelectedCoop] = useState<string>("");
  const { data: estoque, isLoading: loadEst } = useEstoqueCooperativa(selectedCoop || undefined);
  const qc = useQueryClient();

  // form state
  const [origemTipo, setOrigemTipo] = useState<string>("Cidadão");
  const [origemId, setOrigemId] = useState("");
  const [tipoMaterial, setTipoMaterial] = useState("");
  const [pesoBruto, setPesoBruto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoop || !tipoMaterial || !pesoBruto) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("v_lote_entrada" as any).insert({
        cooperativa_id: selectedCoop,
        origem_tipo: origemTipo,
        origem_id: origemId || null,
        tipo_material: tipoMaterial,
        peso_bruto_kg: Number(pesoBruto),
        data_recebimento: new Date().toISOString(),
      } as any);
      if (error) throw error;
      toast.success("Lote de entrada registrado com sucesso!");
      qc.invalidateQueries({ queryKey: ["v_lote_entrada"] });
      qc.invalidateQueries({ queryKey: ["v_estoque_cooperativa"] });
      // reset
      setOrigemId("");
      setTipoMaterial("");
      setPesoBruto("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar entrada");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadCoop) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cooperativa select */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Cooperativa:</Label>
        <Select value={selectedCoop} onValueChange={setSelectedCoop}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Selecione a cooperativa" />
          </SelectTrigger>
          <SelectContent>
            {cooperativas?.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de entrada */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Registro de Entrada — Balança</CardTitle>
                  <CardDescription>Formulário rápido para operadores de balança</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select value={origemTipo} onValueChange={setOrigemTipo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cidadão">Cidadão / Catador</SelectItem>
                        <SelectItem value="PontoColeta">Ponto de Coleta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ID / QR Code da Origem (opcional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={origemId}
                        onChange={(e) => setOrigemId(e.target.value)}
                        placeholder="Escaneie ou insira o código"
                      />
                      <Button type="button" variant="outline" size="icon" title="Escanear QR">
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Material *</Label>
                    <Select value={tipoMaterial} onValueChange={setTipoMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {materiais.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Bruto (kg) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={pesoBruto}
                      onChange={(e) => setPesoBruto(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !selectedCoop}
                  className="w-full sm:w-auto"
                >
                  {submitting ? "Registrando..." : "Registrar Entrada"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Estoque atual */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary opacity-60" />
              <CardTitle className="text-base">Estoque Atual</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadEst ? (
              <Skeleton className="h-40 rounded" />
            ) : !selectedCoop ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Selecione uma cooperativa
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Saldo (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoque?.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.tipo_material}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(e.saldo_kg).toLocaleString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!estoque || estoque.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                        Sem estoque registrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CooperativaRecepcao;
