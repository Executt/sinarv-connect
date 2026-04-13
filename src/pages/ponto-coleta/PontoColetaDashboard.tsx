import { useMemo } from "react";
import { useEstacoesColeta, useEntidadesCredenciadas, useMetasOrgao, useRegistrosEntrada } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { MapPin, Building2, CheckCircle2, Wrench, Scale, Target, CreditCard, QrCode, PlusCircle, Package } from "lucide-react";
import { Link } from "react-router-dom";

const statusConfig: Record<string, { icon: any; color: string }> = {
  Ativo: { icon: CheckCircle2, color: "text-[hsl(var(--success))]" },
  Inativo: { icon: Building2, color: "text-muted-foreground" },
  Manutenção: { icon: Wrench, color: "text-[hsl(var(--warning))]" },
};

const PontoColetaDashboard = () => {
  const { data: entidades, isLoading: l1 } = useEntidadesCredenciadas();
  const { data: estacoes, isLoading: l2 } = useEstacoesColeta();
  const { data: metas, isLoading: l3 } = useMetasOrgao();
  const { data: registros, isLoading: l4 } = useRegistrosEntrada();

  const totalRecebido = useMemo(() =>
    registros?.reduce((s: number, r: any) => s + Number(r.peso_kg || 0), 0) ?? 0, [registros]);
  const capTotal = useMemo(() =>
    estacoes?.reduce((s: number, e: any) => s + Number(e.capacidade_toneladas || 0) * 1000, 0) ?? 0, [estacoes]);
  const capOcupada = capTotal > 0 ? Math.min((totalRecebido / capTotal) * 100, 100) : 0;

  // Separate public vs private entities
  const entPublicas = useMemo(() => entidades?.filter((e: any) => e.natureza_juridica === "Órgão Público") ?? [], [entidades]);
  const entPrivadas = useMemo(() => entidades?.filter((e: any) => e.natureza_juridica === "Privada") ?? [], [entidades]);

  const creditosTotal = useMemo(() => {
    const privateIds = new Set(entPrivadas.map((e: any) => e.id));
    return registros
      ?.filter((r: any) => privateIds.has(r.entidade_id))
      .reduce((s: number, r: any) => s + Number(r.peso_kg || 0), 0) ?? 0;
  }, [registros, entPrivadas]);

  const isLoading = l1 || l2 || l3 || l4;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const ativas = estacoes?.filter((e: any) => e.status_operacional === "Ativo").length ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[hsl(var(--primary))] shadow-sm bg-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Volume Recebido</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalRecebido.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg</p>
              </div>
              <Scale className="h-9 w-9 text-[hsl(var(--primary))] opacity-25" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(var(--success))] shadow-sm bg-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Estações Ativas</p>
                <p className="text-2xl font-bold text-foreground mt-1">{ativas} <span className="text-sm font-normal text-muted-foreground">/ {estacoes?.length ?? 0}</span></p>
              </div>
              <CheckCircle2 className="h-9 w-9 text-[hsl(var(--success))] opacity-25" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(var(--warning))] shadow-sm bg-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Capacidade Ocupada</p>
                <p className="text-2xl font-bold text-foreground mt-1">{capOcupada.toFixed(1)}%</p>
              </div>
              <Package className="h-9 w-9 text-[hsl(var(--warning))] opacity-25" />
            </div>
            <Progress value={capOcupada} className="h-1.5 mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[hsl(var(--accent))] shadow-sm bg-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Registros Hoje</p>
                <p className="text-2xl font-bold text-foreground mt-1">{registros?.length ?? 0}</p>
              </div>
              <MapPin className="h-9 w-9 text-[hsl(var(--accent))] opacity-25" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick action + QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="pt-6 pb-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Registrar Nova Entrada</h3>
              <p className="text-sm text-muted-foreground mt-1">Registre a pesagem e recebimento de material reciclável entregue por cidadãos ou catadores.</p>
              <Link to="/ponto-coleta/novo-recebimento">
                <Button className="mt-4 gap-2" size="lg">
                  <PlusCircle className="h-5 w-5" />
                  Registrar Entrada de Material
                </Button>
              </Link>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-xl border border-border">
              <QrCode className="h-24 w-24 text-foreground/20" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">QR Code do Ponto</span>
              <span className="text-xs text-muted-foreground">Escaneie para identificação</span>
            </div>
          </CardContent>
        </Card>

        {/* Differentiated view: Public vs Private */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {entPublicas.length > 0 ? (
                <><Target className="h-4 w-4 text-[hsl(var(--primary))]" /> Metas Obrigatórias</>
              ) : (
                <><CreditCard className="h-4 w-4 text-[hsl(var(--success))]" /> Créditos Ecológicos</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entPublicas.length > 0 ? (
              // Public entity — show meta progress
              metas?.slice(0, 3).map((m: any) => {
                const meta = Number(m.meta_peso_kg);
                const atingido = Number(m.atingimento_peso_kg);
                const pct = meta > 0 ? Math.min((atingido / meta) * 100, 100) : 0;
                const ent = entidades?.find((e: any) => e.id === m.entidade_id);
                return (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[140px]">{ent?.nome_fantasia ?? "Entidade"}</span>
                      <span className="font-semibold text-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })
            ) : (
              // Private entity — show credits
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-[hsl(var(--success))]">{creditosTotal.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground mt-1">Créditos Fiscais Acumulados</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">(1 crédito por kg recebido)</p>
              </div>
            )}
            {entPublicas.length > 0 && entPrivadas.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Créditos (entes privados)
                  </span>
                  <span className="font-bold text-[hsl(var(--success))]">{creditosTotal.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estações de Coleta */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />
            Estações de Coleta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estacoes?.map((e: any) => {
                  const st = statusConfig[e.status_operacional] || statusConfig["Inativo"];
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-sm">{e.endereco}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{e.cidade}/{e.estado}</TableCell>
                      <TableCell className="text-sm">{Number(e.capacidade_toneladas).toLocaleString("pt-BR")} ton</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs gap-1 ${st.color}`}>
                          <st.icon className="h-3 w-3" />
                          {e.status_operacional}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimos Recebimentos</CardTitle>
          <Link to="/ponto-coleta/historico">
            <Button variant="outline" size="sm">Ver Histórico Completo</Button>
          </Link>
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
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros?.slice(0, 5).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs text-[hsl(var(--primary))]">{r.recibo_codigo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{r.tipo_material}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{Number(r.peso_kg).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.origem_anonima ? "Anônimo" : r.cpf_cidadao || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
                {(!registros || registros.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum recebimento registrado ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PontoColetaDashboard;
