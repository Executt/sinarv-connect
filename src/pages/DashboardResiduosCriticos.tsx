import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2,
  Truck,
  FileCheck2,
  AlertOctagon,
  Plus,
  ShieldAlert,
  Loader2,
  Download,
  Search,
  MoreHorizontal,
  History,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  FLUXO_STATUS,
  type FluxoStatus,
  fluxoLabel,
  fluxoColor,
  fluxoTransicoes,
  maskCNPJ,
  isValidCNPJ,
  isValidEmail,
  diasAte,
  downloadCSV,
  printPDF,
} from "@/lib/residuos-criticos";

type Gerador = {
  id: string;
  razao_social: string;
  cnpj: string;
  tipo: string;
  municipio: string | null;
  uf: string | null;
  ativo: boolean;
};

type Operador = {
  id: string;
  razao_social: string;
  cnpj: string;
  tipo: string;
  natureza: string;
  homologado: boolean;
  bloqueado: boolean;
  motivo_bloqueio: string | null;
};

type Licenca = {
  id: string;
  operador_id: string;
  tipo: string;
  numero: string;
  orgao_emissor: string;
  emissao: string;
  validade: string;
  arquivo_url: string | null;
};

type MTR = {
  id: string;
  codigo: string;
  gerador_id: string;
  operador_id: string | null;
  destinador_id: string | null;
  classe_residuo: string;
  onu_number: string | null;
  quantidade_kg: number;
  status: string;
  fluxo_status: FluxoStatus;
  aprovado_por: string | null;
  aprovado_em: string | null;
  motivo_bloqueio: string | null;
  created_at: string;
};

type Auditoria = {
  id: string;
  entidade: string;
  entidade_id: string | null;
  acao: string;
  detalhes: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
};

const PAGE_SIZE = 10;

export default function DashboardResiduosCriticos() {
  const [loading, setLoading] = useState(true);
  const [geradores, setGeradores] = useState<Gerador[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [mtrs, setMtrs] = useState<MTR[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);

  // filtros MTR
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);

  const carregar = async () => {
    setLoading(true);
    try {
      const [g, o, l, m, a] = await Promise.all([
        supabase.from("geradores_criticos").select("*").order("razao_social"),
        supabase.from("operadores_logisticos").select("*").order("razao_social"),
        supabase.from("licencas_ambientais").select("*").order("validade", { ascending: true }),
        supabase.from("mtr_solicitacoes").select("*").order("created_at", { ascending: false }).limit(500),
        supabase
          .from("residuos_criticos_auditoria")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (g.error) throw g.error;
      if (o.error) throw o.error;
      if (l.error) throw l.error;
      if (m.error) throw m.error;
      setGeradores(g.data as Gerador[]);
      setOperadores(o.data as Operador[]);
      setLicencas(l.data as Licenca[]);
      setMtrs(m.data as unknown as MTR[]);
      if (!a.error) setAuditoria(a.data as unknown as Auditoria[]);
    } catch (e) {
      const err = e as Error;
      console.error("[ResiduosCriticos] load error", err);
      toast.error("Erro ao carregar dados", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    const ch = supabase
      .channel("residuos-criticos")
      .on("postgres_changes", { event: "*", schema: "public", table: "mtr_solicitacoes" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "operadores_logisticos" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "licencas_ambientais" }, carregar)
      .on("postgres_changes", { event: "*", schema: "public", table: "residuos_criticos_auditoria" }, carregar)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const nomeEntidade = (id: string | null) =>
    (id && (geradores.find((g) => g.id === id)?.razao_social ?? operadores.find((o) => o.id === id)?.razao_social)) || "—";
  const cnpjEntidade = (id: string | null) =>
    (id && (geradores.find((g) => g.id === id)?.cnpj ?? operadores.find((o) => o.id === id)?.cnpj)) || "";

  const bloqueados = operadores.filter((o) => o.bloqueado).length;
  const licencasVencendo = licencas.filter((l) => diasAte(l.validade) >= 0 && diasAte(l.validade) <= 30);
  const licencasVencidas = licencas.filter((l) => diasAte(l.validade) < 0);

  const mtrFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return mtrs.filter((m) => {
      if (filtroStatus !== "todos" && m.fluxo_status !== filtroStatus) return false;
      if (dataIni && new Date(m.created_at) < new Date(`${dataIni}T00:00:00`)) return false;
      if (dataFim && new Date(m.created_at) > new Date(`${dataFim}T23:59:59`)) return false;
      if (!q) return true;
      const alvo = [
        m.codigo,
        m.classe_residuo,
        m.onu_number,
        nomeEntidade(m.gerador_id),
        nomeEntidade(m.operador_id),
        nomeEntidade(m.destinador_id),
        cnpjEntidade(m.gerador_id),
        cnpjEntidade(m.operador_id),
        cnpjEntidade(m.destinador_id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return alvo.includes(q) || alvo.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "\u0000");
    });
  }, [mtrs, busca, filtroStatus, dataIni, dataFim, geradores, operadores]);

  const totalPages = Math.max(1, Math.ceil(mtrFiltrados.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const mtrPagina = mtrFiltrados.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [busca, filtroStatus, dataIni, dataFim]);

  const operadorSemLicenca = (id: string | null) =>
    !!id && !licencas.some((l) => l.operador_id === id && diasAte(l.validade) >= 0);

  const mudarStatus = async (m: MTR, novo: FluxoStatus) => {
    const patch: Record<string, unknown> = { fluxo_status: novo };
    if (novo === "rascunho") patch.motivo_bloqueio = null;
    if (novo === "bloqueado") patch.motivo_bloqueio = "Bloqueado manualmente pela equipe de governo";
    const { error } = await supabase.from("mtr_solicitacoes").update(patch).eq("id", m.id);
    if (error) return toast.error("Não foi possível alterar o status", { description: error.message });
    toast.success(`MTR ${m.codigo} → ${fluxoLabel[novo]}`);
    carregar();
  };

  const exportarMTR = (formato: "csv" | "pdf") => {
    const rows = mtrFiltrados.map((m) => ({
      Codigo: m.codigo,
      Gerador: nomeEntidade(m.gerador_id),
      CNPJ_Gerador: cnpjEntidade(m.gerador_id),
      Transportador: nomeEntidade(m.operador_id),
      Destinador: nomeEntidade(m.destinador_id),
      Classe: m.classe_residuo,
      ONU: m.onu_number ?? "",
      Quantidade_kg: m.quantidade_kg,
      Fluxo: fluxoLabel[m.fluxo_status],
      Aprovado_em: m.aprovado_em ? new Date(m.aprovado_em).toLocaleString("pt-BR") : "",
      Motivo_bloqueio: m.motivo_bloqueio ?? "",
      Emitido_em: new Date(m.created_at).toLocaleString("pt-BR"),
    }));
    if (rows.length === 0) return toast.error("Nada para exportar com os filtros atuais");
    if (formato === "csv") downloadCSV(`mtr-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    else printPDF("Manifestos de Transporte de Resíduos (MTR)", rows);
  };

  const exportarLicencas = (formato: "csv" | "pdf") => {
    const rows = licencas.map((l) => ({
      Operador: operadores.find((o) => o.id === l.operador_id)?.razao_social ?? "",
      CNPJ: operadores.find((o) => o.id === l.operador_id)?.cnpj ?? "",
      Tipo: l.tipo,
      Numero: l.numero,
      Orgao: l.orgao_emissor,
      Emissao: l.emissao ? new Date(`${l.emissao}T00:00:00`).toLocaleDateString("pt-BR") : "",
      Validade: new Date(`${l.validade}T00:00:00`).toLocaleDateString("pt-BR"),
      Situacao: diasAte(l.validade) < 0 ? "Vencida" : diasAte(l.validade) <= 30 ? "Vencendo" : "Vigente",
      Documento: l.arquivo_url ?? "",
    }));
    if (rows.length === 0) return toast.error("Nenhuma licença cadastrada");
    if (formato === "csv") downloadCSV(`licencas-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    else printPDF("Licenças Ambientais", rows);
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={Building2} label="Geradores ativos" value={geradores.filter((g) => g.ativo).length} tone="text-emerald-600" />
        <KpiCard icon={Truck} label="Operadores homologados" value={operadores.filter((o) => o.homologado && !o.bloqueado).length} tone="text-cyan-600" />
        <KpiCard icon={ShieldAlert} label="Operadores bloqueados" value={bloqueados} tone={bloqueados ? "text-red-600" : "text-muted-foreground"} />
        <KpiCard icon={FileCheck2} label="Licenças vencendo (30d)" value={licencasVencendo.length} tone={licencasVencendo.length ? "text-amber-600" : "text-muted-foreground"} />
      </div>

      {/* Painel de alertas de licenças */}
      {(licencasVencendo.length > 0 || licencasVencidas.length > 0) && (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Alertas de conformidade — licenças ambientais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...licencasVencidas, ...licencasVencendo].map((l) => {
              const dias = diasAte(l.validade);
              const op = operadores.find((o) => o.id === l.operador_id);
              return (
                <div
                  key={l.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                    dias < 0 ? "border-red-500/30 bg-red-500/5" : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  <div>
                    <span className="font-medium">{op?.razao_social ?? "Operador"}</span>
                    <span className="text-muted-foreground"> · {l.tipo} nº {l.numero}</span>
                  </div>
                  <Badge variant="outline" className={dias < 0 ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                    {dias < 0 ? `Vencida há ${Math.abs(dias)}d — emissões bloqueadas` : `Vence em ${dias}d`}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="mtr" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="mtr">MTR ({mtrs.length})</TabsTrigger>
          <TabsTrigger value="geradores">Geradores ({geradores.length})</TabsTrigger>
          <TabsTrigger value="operadores">Operadores ({operadores.length})</TabsTrigger>
          <TabsTrigger value="licencas">Licenças ({licencas.length})</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria ({auditoria.length})</TabsTrigger>
        </TabsList>

        {/* MTR */}
        <TabsContent value="mtr">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Manifestos de Transporte de Resíduos</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => exportarMTR("csv")}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportarMTR("pdf")}>
                  <Printer className="h-4 w-4 mr-1" /> PDF
                </Button>
                <NovoMTRDialog geradores={geradores} operadores={operadores} operadorSemLicenca={operadorSemLicenca} onSaved={carregar} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Buscar por código, CNPJ, gerador, transportador ou destino..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    {FLUXO_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>{fluxoLabel[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input type="date" value={dataIni} onChange={(e) => setDataIni(e.target.value)} aria-label="Data inicial" />
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} aria-label="Data final" />
                </div>
              </div>

              {loading ? <LoadingRow /> : mtrFiltrados.length === 0 ? (
                <EmptyState icon={AlertOctagon} label={mtrs.length === 0 ? "Nenhum MTR emitido ainda." : "Nenhum MTR encontrado com os filtros atuais."} />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Gerador</TableHead>
                        <TableHead>Transportador</TableHead>
                        <TableHead>Classe / ONU</TableHead>
                        <TableHead className="text-right">Qtd (kg)</TableHead>
                        <TableHead>Fluxo</TableHead>
                        <TableHead>Emitido</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mtrPagina.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                          <TableCell>{nomeEntidade(m.gerador_id)}</TableCell>
                          <TableCell>{nomeEntidade(m.operador_id)}</TableCell>
                          <TableCell className="text-xs">{m.classe_residuo}{m.onu_number ? ` · ONU ${m.onu_number}` : ""}</TableCell>
                          <TableCell className="text-right tabular-nums">{m.quantidade_kg}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={fluxoColor[m.fluxo_status]} title={m.motivo_bloqueio ?? undefined}>
                              {fluxoLabel[m.fluxo_status] ?? m.fluxo_status}
                            </Badge>
                            {m.aprovado_em && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                aprovado {new Date(m.aprovado_em).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(m.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {fluxoTransicoes[m.fluxo_status]?.length ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ações do MTR ${m.codigo}`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {fluxoTransicoes[m.fluxo_status].map((s) => (
                                    <DropdownMenuItem key={s} onClick={() => mudarStatus(m, s)}>
                                      Mover para {fluxoLabel[s]}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {mtrFiltrados.length} registro(s) · página {pageSafe} de {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geradores */}
        <TabsContent value="geradores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Geradores Críticos</CardTitle>
              <NovoGeradorDialog onSaved={carregar} />
            </CardHeader>
            <CardContent>
              {loading ? <LoadingRow /> : geradores.length === 0 ? (
                <EmptyState icon={Building2} label="Nenhum gerador cadastrado." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Município/UF</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geradores.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.razao_social}</TableCell>
                        <TableCell className="font-mono text-xs">{g.cnpj}</TableCell>
                        <TableCell className="text-xs capitalize">{g.tipo.replace("_", " ")}</TableCell>
                        <TableCell className="text-xs">{[g.municipio, g.uf].filter(Boolean).join(" / ") || "—"}</TableCell>
                        <TableCell>{g.ativo ? <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operadores */}
        <TabsContent value="operadores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Operadores Logísticos</CardTitle>
              <NovoOperadorDialog onSaved={carregar} />
            </CardHeader>
            <CardContent>
              {loading ? <LoadingRow /> : operadores.length === 0 ? (
                <EmptyState icon={Truck} label="Nenhum operador cadastrado." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Natureza</TableHead>
                      <TableHead>Licença</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operadores.map((o) => {
                      const semLicenca = operadorSemLicenca(o.id);
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.razao_social}</TableCell>
                          <TableCell className="font-mono text-xs">{o.cnpj}</TableCell>
                          <TableCell className="text-xs capitalize">{o.tipo}</TableCell>
                          <TableCell className="text-xs capitalize">{o.natureza}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={semLicenca ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                              {semLicenca ? "Sem licença vigente" : "Vigente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {o.bloqueado ? (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20" title={o.motivo_bloqueio ?? undefined}>Bloqueado</Badge>
                            ) : o.homologado ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Homologado</Badge>
                            ) : (
                              <Badge variant="outline">Pendente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licenças */}
        <TabsContent value="licencas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Licenças Ambientais</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => exportarLicencas("csv")}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportarLicencas("pdf")}>
                  <Printer className="h-4 w-4 mr-1" /> PDF
                </Button>
                <NovaLicencaDialog operadores={operadores} onSaved={carregar} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingRow /> : licencas.length === 0 ? (
                <EmptyState icon={FileCheck2} label="Nenhuma licença cadastrada." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nº</TableHead>
                      <TableHead>Órgão</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Validade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licencas.map((l) => {
                      const dias = diasAte(l.validade);
                      const tone = dias < 0 ? "text-red-600" : dias <= 30 ? "text-amber-600" : "text-emerald-600";
                      return (
                        <TableRow key={l.id}>
                          <TableCell>{operadores.find((o) => o.id === l.operador_id)?.razao_social ?? "—"}</TableCell>
                          <TableCell className="text-xs">{l.tipo}</TableCell>
                          <TableCell className="font-mono text-xs">{l.numero}</TableCell>
                          <TableCell className="text-xs">{l.orgao_emissor}</TableCell>
                          <TableCell className="text-xs">
                            {l.arquivo_url ? (
                              <a href={l.arquivo_url} target="_blank" rel="noreferrer" className="text-primary underline">Abrir</a>
                            ) : "—"}
                          </TableCell>
                          <TableCell className={`text-xs ${tone}`}>
                            {new Date(`${l.validade}T00:00:00`).toLocaleDateString("pt-BR")}
                            {dias < 0 ? " · vencida" : dias <= 30 ? ` · ${dias}d` : ""}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auditoria */}
        <TabsContent value="auditoria">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Trilha de auditoria do módulo</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  auditoria.length
                    ? downloadCSV(
                        `auditoria-residuos-criticos-${new Date().toISOString().slice(0, 10)}.csv`,
                        auditoria.map((a) => ({
                          Data: new Date(a.created_at).toLocaleString("pt-BR"),
                          Entidade: a.entidade,
                          Registro: a.entidade_id ?? "",
                          Acao: a.acao,
                          Detalhes: JSON.stringify(a.detalhes ?? {}),
                          Usuario: a.user_id ?? "sistema",
                        })),
                      )
                    : toast.error("Sem registros de auditoria")
                }
              >
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? <LoadingRow /> : auditoria.length === 0 ? (
                <EmptyState icon={History} label="Nenhuma ação registrada ainda." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditoria.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-xs">{a.entidade}</TableCell>
                        <TableCell className="text-xs capitalize">{a.acao}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono break-all">
                          {JSON.stringify(a.detalhes ?? {})}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-md p-2 bg-muted ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingRow() {
  return (
    <div className="py-8 flex items-center justify-center text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando...
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
      <Icon className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

async function registrarAuditoria(entidade: string, entidadeId: string | null, acao: string, detalhes: Record<string, unknown>) {
  const { error } = await supabase.from("residuos_criticos_auditoria").insert({
    entidade,
    entidade_id: entidadeId,
    acao,
    detalhes,
  });
  if (error) console.warn("[ResiduosCriticos] auditoria não registrada", error.message);
}

/* --------- Dialogs --------- */

function NovoGeradorDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ razao_social: "", cnpj: "", tipo: "hospital", cnes: "", municipio: "", uf: "", responsavel_nome: "", responsavel_email: "" });

  const erros: Record<string, string> = {};
  if (form.razao_social.trim().length < 3) erros.razao_social = "Informe a razão social (mín. 3 caracteres)";
  if (!isValidCNPJ(form.cnpj)) erros.cnpj = "CNPJ inválido";
  if (form.uf && form.uf.trim().length !== 2) erros.uf = "UF deve ter 2 letras";
  if (form.responsavel_email && !isValidEmail(form.responsavel_email)) erros.responsavel_email = "E-mail inválido";
  const valido = Object.keys(erros).length === 0;

  const submit = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("geradores_criticos")
      .insert({ ...form, uf: form.uf.toUpperCase() || null })
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro", { description: error.message });
    await registrarAuditoria("geradores_criticos", data?.id ?? null, "criado", { razao_social: form.razao_social, cnpj: form.cnpj });
    toast.success("Gerador cadastrado");
    setOpen(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Gerador Crítico</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razão Social *" value={form.razao_social} onChange={(v) => setForm({ ...form, razao_social: v })} className="col-span-2" error={erros.razao_social} />
          <Field label="CNPJ *" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: maskCNPJ(v) })} error={erros.cnpj} placeholder="00.000.000/0000-00" />
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="clinica">Clínica</SelectItem>
                <SelectItem value="laboratorio">Laboratório</SelectItem>
                <SelectItem value="industria_publica">Indústria Pública</SelectItem>
                <SelectItem value="industria_privada">Indústria Privada</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="CNES" value={form.cnes} onChange={(v) => setForm({ ...form, cnes: v })} />
          <Field label="Município" value={form.municipio} onChange={(v) => setForm({ ...form, municipio: v })} />
          <Field label="UF" value={form.uf} onChange={(v) => setForm({ ...form, uf: v.toUpperCase().slice(0, 2) })} error={erros.uf} />
          <Field label="Responsável" value={form.responsavel_nome} onChange={(v) => setForm({ ...form, responsavel_nome: v })} />
          <Field label="E-mail" value={form.responsavel_email} onChange={(v) => setForm({ ...form, responsavel_email: v })} error={erros.responsavel_email} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !valido}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoOperadorDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ razao_social: "", cnpj: "", tipo: "transportador", natureza: "privado", homologado: false });

  const erros: Record<string, string> = {};
  if (form.razao_social.trim().length < 3) erros.razao_social = "Informe a razão social (mín. 3 caracteres)";
  if (!isValidCNPJ(form.cnpj)) erros.cnpj = "CNPJ inválido";
  const valido = Object.keys(erros).length === 0;

  const submit = async () => {
    setSaving(true);
    const { data, error } = await supabase.from("operadores_logisticos").insert(form).select("id").maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro", { description: error.message });
    await registrarAuditoria("operadores_logisticos", data?.id ?? null, "criado", { razao_social: form.razao_social, cnpj: form.cnpj });
    toast.success("Operador cadastrado");
    setOpen(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Operador Logístico</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razão Social *" value={form.razao_social} onChange={(v) => setForm({ ...form, razao_social: v })} className="col-span-2" error={erros.razao_social} />
          <Field label="CNPJ *" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: maskCNPJ(v) })} error={erros.cnpj} placeholder="00.000.000/0000-00" />
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transportador">Transportador</SelectItem>
                <SelectItem value="destinador">Destinador</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Natureza</Label>
            <Select value={form.natureza} onValueChange={(v) => setForm({ ...form, natureza: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="publico">Público</SelectItem>
                <SelectItem value="privado">Privado</SelectItem>
                <SelectItem value="misto">Misto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input type="checkbox" checked={form.homologado} onChange={(e) => setForm({ ...form, homologado: e.target.checked })} />
            Homologado
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !valido}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovaLicencaDialog({ operadores, onSaved }: { operadores: Operador[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ operador_id: "", tipo: "Licença de Operação", numero: "", orgao_emissor: "", emissao: "", validade: "", arquivo_url: "" });

  const erros: Record<string, string> = {};
  if (!form.operador_id) erros.operador_id = "Selecione o operador";
  if (!form.numero.trim()) erros.numero = "Informe o número da licença";
  if (!form.orgao_emissor.trim()) erros.orgao_emissor = "Informe o órgão emissor";
  if (!form.emissao) erros.emissao = "Informe a data de emissão";
  if (!form.validade) erros.validade = "Informe a validade";
  if (form.emissao && form.validade && form.validade < form.emissao) erros.validade = "Validade anterior à emissão";
  if (form.arquivo_url && !/^https?:\/\//i.test(form.arquivo_url)) erros.arquivo_url = "Informe uma URL válida (http/https)";
  const valido = Object.keys(erros).length === 0;

  const submit = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("licencas_ambientais")
      .insert({ ...form, arquivo_url: form.arquivo_url || null })
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro", { description: error.message });
    await registrarAuditoria("licencas_ambientais", data?.id ?? null, "criada", { numero: form.numero, validade: form.validade });
    toast.success("Licença cadastrada");
    setOpen(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" disabled={operadores.length === 0}><Plus className="h-4 w-4 mr-1" /> Nova</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Licença Ambiental</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label>Operador *</Label>
            <Select value={form.operador_id} onValueChange={(v) => setForm({ ...form, operador_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{operadores.map((o) => <SelectItem key={o.id} value={o.id}>{o.razao_social}</SelectItem>)}</SelectContent>
            </Select>
            {erros.operador_id && <p className="text-xs text-destructive">{erros.operador_id}</p>}
          </div>
          <Field label="Tipo *" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
          <Field label="Nº *" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} error={erros.numero} />
          <Field label="Órgão Emissor *" value={form.orgao_emissor} onChange={(v) => setForm({ ...form, orgao_emissor: v })} className="col-span-2" error={erros.orgao_emissor} />
          <Field label="Emissão *" type="date" value={form.emissao} onChange={(v) => setForm({ ...form, emissao: v })} error={erros.emissao} />
          <Field label="Validade *" type="date" value={form.validade} onChange={(v) => setForm({ ...form, validade: v })} error={erros.validade} />
          <Field label="URL do documento assinado" value={form.arquivo_url} onChange={(v) => setForm({ ...form, arquivo_url: v })} className="col-span-2" error={erros.arquivo_url} placeholder="https://..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !valido}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoMTRDialog({
  geradores,
  operadores,
  operadorSemLicenca,
  onSaved,
}: {
  geradores: Gerador[];
  operadores: Operador[];
  operadorSemLicenca: (id: string | null) => boolean;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ gerador_id: "", operador_id: "", destinador_id: "", classe_residuo: "A1 - Infectante", onu_number: "", quantidade_kg: "", enviar: true });
  const transportadores = operadores.filter((o) => (o.tipo === "transportador" || o.tipo === "ambos") && !o.bloqueado);
  const destinadores = operadores.filter((o) => (o.tipo === "destinador" || o.tipo === "ambos") && !o.bloqueado);

  const erros: Record<string, string> = {};
  if (!form.gerador_id) erros.gerador_id = "Selecione o gerador";
  if (!form.classe_residuo.trim()) erros.classe_residuo = "Informe a classe do resíduo";
  if (!form.quantidade_kg || Number(form.quantidade_kg) <= 0) erros.quantidade_kg = "Quantidade deve ser maior que zero";
  if (form.onu_number && !/^\d{4}$/.test(form.onu_number)) erros.onu_number = "ONU deve ter 4 dígitos";
  const bloqueioLicenca =
    (form.operador_id && operadorSemLicenca(form.operador_id)) || (form.destinador_id && operadorSemLicenca(form.destinador_id));
  const valido = Object.keys(erros).length === 0;

  const submit = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("mtr_solicitacoes")
      .insert({
        gerador_id: form.gerador_id,
        operador_id: form.operador_id || null,
        destinador_id: form.destinador_id || null,
        classe_residuo: form.classe_residuo,
        onu_number: form.onu_number || null,
        quantidade_kg: Number(form.quantidade_kg),
        fluxo_status: bloqueioLicenca ? "rascunho" : form.enviar ? "enviado" : "rascunho",
      } as never)
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro ao emitir MTR", { description: error.message });
    toast.success(bloqueioLicenca ? "MTR salvo como bloqueado (licença vencida)" : "MTR emitido");
    setOpen(false);
    void data;
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" disabled={geradores.length === 0}><Plus className="h-4 w-4 mr-1" /> Novo MTR</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Emitir MTR</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label>Gerador *</Label>
            <Select value={form.gerador_id} onValueChange={(v) => setForm({ ...form, gerador_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{geradores.map((g) => <SelectItem key={g.id} value={g.id}>{g.razao_social}</SelectItem>)}</SelectContent>
            </Select>
            {erros.gerador_id && <p className="text-xs text-destructive">{erros.gerador_id}</p>}
          </div>
          <div className="space-y-1">
            <Label>Transportador</Label>
            <Select value={form.operador_id} onValueChange={(v) => setForm({ ...form, operador_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {transportadores.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.razao_social}{operadorSemLicenca(o.id) ? " · sem licença" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Destinador</Label>
            <Select value={form.destinador_id} onValueChange={(v) => setForm({ ...form, destinador_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {destinadores.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.razao_social}{operadorSemLicenca(o.id) ? " · sem licença" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field label="Classe do Resíduo *" value={form.classe_residuo} onChange={(v) => setForm({ ...form, classe_residuo: v })} error={erros.classe_residuo} />
          <Field label="ONU" value={form.onu_number} onChange={(v) => setForm({ ...form, onu_number: v.replace(/\D/g, "").slice(0, 4) })} error={erros.onu_number} />
          <Field label="Quantidade (kg) *" type="number" value={form.quantidade_kg} onChange={(v) => setForm({ ...form, quantidade_kg: v })} className="col-span-2" error={erros.quantidade_kg} />
          {bloqueioLicenca && (
            <p className="col-span-2 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Operador selecionado está sem licença ambiental vigente — o MTR será registrado como bloqueado.
            </p>
          )}
          {!bloqueioLicenca && (
            <label className="flex items-center gap-2 text-sm col-span-2">
              <input type="checkbox" checked={form.enviar} onChange={(e) => setForm({ ...form, enviar: e.target.checked })} />
              Enviar para análise imediatamente (senão fica como rascunho)
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !valido}>{saving ? "Emitindo..." : "Emitir MTR"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
