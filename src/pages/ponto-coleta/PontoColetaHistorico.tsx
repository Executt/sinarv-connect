import { useState, useMemo } from "react";
import { useRegistrosEntrada, useDespachosLote, useEntidadesCredenciadas } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, Truck, Package, Search } from "lucide-react";

const PontoColetaHistorico = () => {
  const { data: registros, isLoading: l1 } = useRegistrosEntrada();
  const { data: despachos, isLoading: l2 } = useDespachosLote();
  const { data: entidades } = useEntidadesCredenciadas();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [showDespacho, setShowDespacho] = useState(false);
  const [dMaterial, setDMaterial] = useState("");
  const [dPeso, setDPeso] = useState("");
  const [dCoopNome, setDCoopNome] = useState("");
  const [dCoopCnpj, setDCoopCnpj] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const entidadeId = entidades?.[0]?.id;

  const filteredRegistros = useMemo(() => {
    if (!registros) return [];
    if (!search) return registros;
    const s = search.toLowerCase();
    return registros.filter((r: any) =>
      r.tipo_material?.toLowerCase().includes(s) ||
      r.recibo_codigo?.toLowerCase().includes(s) ||
      r.cpf_cidadao?.toLowerCase().includes(s)
    );
  }, [registros, search]);

  const handleDespacho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dMaterial || !dPeso || !dCoopNome || !entidadeId) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const pesoNum = parseFloat(dPeso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      toast.error("Peso inválido.");
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("v_despacho_lote")
      .insert({
        entidade_id: entidadeId,
        cooperativa_destino_nome: dCoopNome.trim(),
        cooperativa_destino_cnpj: dCoopCnpj.trim() || null,
        tipo_material: dMaterial,
        peso_total_kg: pesoNum,
        status: "Pendente",
      });
    setSubmitting(false);

    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    toast.success("Despacho registrado com sucesso!");
    queryClient.invalidateQueries({ queryKey: ["v_despacho_lote"] });
    setShowDespacho(false);
    setDMaterial("");
    setDPeso("");
    setDCoopNome("");
    setDCoopCnpj("");
  };

  if (l1 || l2) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-5">
      <Tabs defaultValue="entradas">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="entradas" className="gap-1.5">
              <ClipboardList className="h-4 w-4" /> Recebimentos
            </TabsTrigger>
            <TabsTrigger value="despachos" className="gap-1.5">
              <Truck className="h-4 w-4" /> Despachos
            </TabsTrigger>
          </TabsList>

          <Dialog open={showDespacho} onOpenChange={setShowDespacho}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Truck className="h-4 w-4" /> Despachar Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Despachar Lote para Cooperativa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleDespacho} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Tipo de Material *</Label>
                  <Select value={dMaterial} onValueChange={setDMaterial}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["PET", "Vidro", "Alumínio", "Papelão", "Metal", "Plástico", "Eletrônico", "Outros"].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Peso Total (kg) *</Label>
                  <Input type="number" step="0.01" min="0.01" value={dPeso} onChange={e => setDPeso(e.target.value)} placeholder="Ex: 350.00" />
                </div>
                <div className="space-y-2">
                  <Label>Cooperativa Destino *</Label>
                  <Input value={dCoopNome} onChange={e => setDCoopNome(e.target.value)} placeholder="Nome da cooperativa" maxLength={200} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ da Cooperativa</Label>
                  <Input value={dCoopCnpj} onChange={e => setDCoopCnpj(e.target.value)} placeholder="00.000.000/0000-00 (opcional)" maxLength={18} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Registrando..." : "Confirmar Despacho"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="entradas">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base">Histórico de Recebimentos</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por material, recibo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recibo</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="hidden md:table-cell">Observações</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistros.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs text-[hsl(var(--primary))]">{r.recibo_codigo}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{r.tipo_material}</Badge></TableCell>
                        <TableCell className="font-medium">{Number(r.peso_kg).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.origem_anonima ? "Anônimo" : r.cpf_cidadao || "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                          {r.observacoes || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRegistros.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Total: {filteredRegistros.length} registro(s)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despachos">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-[hsl(var(--primary))]" /> Despachos para Cooperativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cooperativa</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Peso (kg)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despachos?.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{d.cooperativa_destino_nome}</p>
                            {d.cooperativa_destino_cnpj && (
                              <p className="text-[10px] text-muted-foreground">{d.cooperativa_destino_cnpj}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{d.tipo_material}</Badge></TableCell>
                        <TableCell className="font-medium">{Number(d.peso_total_kg).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={d.status === "Despachado"
                              ? "text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
                              : "text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30"
                            }
                          >
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(d.data_despacho).toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!despachos || despachos.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum despacho registrado</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PontoColetaHistorico;
