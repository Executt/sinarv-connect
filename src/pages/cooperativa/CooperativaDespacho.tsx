import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCooperativas, useIndustrias } from "@/hooks/use-schema-data";
import { useEstoqueCooperativa, useDespachosIndustria, useNovoDespacho } from "@/hooks/use-cooperativa-data";
import { toast } from "sonner";
import { Truck, ShieldCheck, Filter, Copy } from "lucide-react";

const CooperativaDespacho = () => {
  const [selectedCoop, setSelectedCoop] = useState<string>("");
  const { data: cooperativas, isLoading: loadCoop } = useCooperativas();
  const { data: industrias } = useIndustrias();
  const { data: estoque, isLoading: loadEst } = useEstoqueCooperativa(selectedCoop || undefined);
  const { data: despachos, isLoading: loadDesp } = useDespachosIndustria(selectedCoop || undefined);
  const despachoMut = useNovoDespacho();

  // form
  const [industriaCnpj, setIndustriaCnpj] = useState("");
  const [industriaNome, setIndustriaNome] = useState("");
  const [tipoMaterial, setTipoMaterial] = useState("");
  const [peso, setPeso] = useState("");
  const [nf, setNf] = useState("");
  const [chaveNfe, setChaveNfe] = useState("");

  // token dialog
  const [tokenDialog, setTokenDialog] = useState(false);
  const [lastToken, setLastToken] = useState("");

  const materiaisDisponiveis = estoque?.filter((e: any) => Number(e.saldo_kg) > 0) ?? [];

  const saldoMaterial = estoque?.find((e: any) => e.tipo_material === tipoMaterial);

  const handleIndustriaChange = (cnpj: string) => {
    setIndustriaCnpj(cnpj);
    const ind = industrias?.find((i: any) => i.cnpj === cnpj);
    setIndustriaNome(ind?.razao_social || ind?.nome || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoop || !industriaCnpj || !tipoMaterial || !peso || !nf) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      const result = await despachoMut.mutateAsync({
        cooperativa_id: selectedCoop,
        industria_destino_cnpj: industriaCnpj,
        industria_destino_nome: industriaNome,
        tipo_material: tipoMaterial,
        peso_despachado_kg: Number(peso),
        numero_nota_fiscal: nf,
        chave_nfe: chaveNfe || undefined,
      });
      setLastToken((result as any)?.token_rastreabilidade || "—");
      setTokenDialog(true);
      toast.success("Despacho registrado com sucesso!");
      // reset
      setIndustriaCnpj("");
      setIndustriaNome("");
      setTipoMaterial("");
      setPeso("");
      setNf("");
      setChaveNfe("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar despacho");
    }
  };

  if (loadCoop) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
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

      {selectedCoop && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de despacho */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Novo Despacho para Indústria</CardTitle>
                    <CardDescription>
                      Monte a carga, insira a NF-e e confirme. O sistema validará o balanço de massa.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Indústria Compradora (CNPJ) *</Label>
                      <Select value={industriaCnpj} onValueChange={handleIndustriaChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {industrias?.map((i: any) => (
                            <SelectItem key={i.id} value={i.cnpj || i.id}>
                              {i.cnpj} — {i.razao_social || i.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Material *</Label>
                      <Select value={tipoMaterial} onValueChange={setTipoMaterial}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {materiaisDisponiveis.map((e: any) => (
                            <SelectItem key={e.tipo_material} value={e.tipo_material}>
                              {e.tipo_material} — saldo: {Number(e.saldo_kg).toLocaleString("pt-BR")} kg
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Peso a Despachar (kg) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={saldoMaterial ? Number(saldoMaterial.saldo_kg) : undefined}
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        placeholder="0.00"
                      />
                      {saldoMaterial && (
                        <p className="text-xs text-muted-foreground">
                          Disponível: {Number(saldoMaterial.saldo_kg).toLocaleString("pt-BR")} kg
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Nº Nota Fiscal *</Label>
                      <Input value={nf} onChange={(e) => setNf(e.target.value)} placeholder="000.000.000" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Chave de Acesso NF-e (44 dígitos)</Label>
                    <Input
                      value={chaveNfe}
                      onChange={(e) => setChaveNfe(e.target.value)}
                      placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                      maxLength={55}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={despachoMut.isPending}
                    className="w-full sm:w-auto"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {despachoMut.isPending ? "Validando balanço..." : "Confirmar Despacho"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Estoque resumido */}
          <Card className="shadow-card h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estoque Disponível</CardTitle>
            </CardHeader>
            <CardContent>
              {loadEst ? (
                <Skeleton className="h-32 rounded" />
              ) : (
                <div className="space-y-2">
                  {estoque?.map((e: any) => (
                    <div key={e.id} className="flex justify-between items-center py-1.5 border-b last:border-0">
                      <span className="text-sm font-medium">{e.tipo_material}</span>
                      <span className="font-mono text-sm">
                        {Number(e.saldo_kg).toLocaleString("pt-BR")} kg
                      </span>
                    </div>
                  ))}
                  {(!estoque || estoque.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Sem estoque
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de despachos */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Despachos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadDesp ? (
            <Skeleton className="h-32 rounded" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NF</TableHead>
                  <TableHead>Indústria</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despachos?.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.numero_nota_fiscal}</TableCell>
                    <TableCell className="text-sm">{d.industria_destino_nome || d.industria_destino_cnpj}</TableCell>
                    <TableCell>{d.tipo_material}</TableCell>
                    <TableCell className="font-mono">{Number(d.peso_despachado_kg).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {d.token_rastreabilidade?.substring(0, 8)}…
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={d.status === "Entregue" ? "default" : d.status === "Em Trânsito" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.data_despacho).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
                {(!despachos || despachos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum despacho encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Token dialog */}
      <Dialog open={tokenDialog} onOpenChange={setTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Token de Rastreabilidade Emitido
            </DialogTitle>
            <DialogDescription>
              Este token acompanha a carga até a indústria. Guarde-o para auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="font-mono text-lg font-bold tracking-wider text-foreground break-all">
              {lastToken}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(lastToken);
                toast.success("Token copiado!");
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Token
            </Button>
            <Button onClick={() => setTokenDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CooperativaDespacho;
