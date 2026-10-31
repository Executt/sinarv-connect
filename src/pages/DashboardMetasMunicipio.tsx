import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Target, Scale, ClipboardCheck, AlertTriangle, Plus, Gavel, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TIPOS_DOCUMENTO, FASES_TRAMITACAO, ENQUADRAMENTOS, dataLimiteResposta, emitirTermo } from "@/lib/fiscalizacao-report";

const META_2030 = 48;
const kg = (n: number) => `${Math.round(n).toLocaleString("pt-BR")} kg`;
const norm = (s?: string | null) => (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const STATUS_LABEL: Record<string, string> = { pendente: "Pendente", em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
const PRIO_VAR: Record<string, "destructive" | "secondary" | "default" | "outline"> = { critica: "destructive", alta: "destructive", media: "secondary", baixa: "outline" };

const DashboardMetasMunicipio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [chave, setChave] = useState<string>("");
  const [tramitando, setTramitando] = useState<any | null>(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", prioridade: "media", prazo: "", responsavel: "" });

  const bench = useQuery({
    queryKey: ["metas_mun_bench"],
    queryFn: async () => {
      const { data, error } = await supabase.from("benchmark_municipios").select("*").order("ano_referencia");
      if (error) throw error;
      return data ?? [];
    },
  });
  const mtr = useQuery({
    queryKey: ["metas_mun_mtr"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mtr_solicitacoes").select("codigo, quantidade_kg, fluxo_status, classe_residuo, geradores_criticos(municipio, uf)");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const acoes = useQuery({
    queryKey: ["fiscalizacao_acoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fiscalizacao_acoes").select("*").order("prazo", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const municipios = useMemo(() => {
    const m = new Map<string, { nome: string; uf: string }>();
    bench.data?.forEach((b) => m.set(`${b.nome_municipio}|${b.uf}`, { nome: b.nome_municipio, uf: b.uf }));
    mtr.data?.forEach((r) => r.geradores_criticos?.municipio && m.set(`${r.geradores_criticos.municipio}|${r.geradores_criticos.uf}`, { nome: r.geradores_criticos.municipio, uf: r.geradores_criticos.uf }));
    return [...m.entries()].sort((a, b) => a[1].nome.localeCompare(b[1].nome));
  }, [bench.data, mtr.data]);

  const sel = chave ? municipios.find(([k]) => k === chave)?.[1] : municipios[0]?.[1];
  const selKey = sel ? `${sel.nome}|${sel.uf}` : "";

  const dados = useMemo(() => {
    if (!sel) return null;
    const hist = (bench.data ?? []).filter((b) => b.nome_municipio === sel.nome && b.uf === sel.uf);
    const ult = hist[hist.length - 1];
    const taxa = ult ? Number(ult.taxa_desvio_aterro) || 0 : null;
    const mtrMun = (mtr.data ?? []).filter((r) => norm(r.geradores_criticos?.municipio) === norm(sel.nome) && norm(r.geradores_criticos?.uf) === norm(sel.uf));
    const aprovados = mtrMun.filter((r) => r.fluxo_status === "aprovado");
    const pendentesMtr = mtrMun.filter((r) => ["rascunho", "enviado", "em_analise"].includes(r.fluxo_status));
    const bloqueados = mtrMun.filter((r) => r.fluxo_status === "bloqueado");
    const pesoAprov = aprovados.reduce((s, r) => s + (Number(r.quantidade_kg) || 0), 0);
    const pesoPend = pendentesMtr.reduce((s, r) => s + (Number(r.quantidade_kg) || 0), 0);
    const acoesMun = (acoes.data ?? []).filter((a) => a.municipio === sel.nome && a.uf === sel.uf);
    // Sugestões automáticas derivadas da meta e do balanço
    const sugestoes: { titulo: string; prioridade: string; descricao: string }[] = [];
    if (taxa !== null && taxa < META_2030) sugestoes.push({ titulo: `Desvio de aterro abaixo da meta (${taxa.toFixed(1)}% vs ${META_2030}%)`, prioridade: META_2030 - taxa > 20 ? "alta" : "media", descricao: "Fiscalizar coleta seletiva e destinação." });
    if (taxa === null) sugestoes.push({ titulo: "Município sem indicador de desvio de aterro", prioridade: "media", descricao: "Solicitar dados SNIS/SINISA ao município." });
    if (bloqueados.length) sugestoes.push({ titulo: `${bloqueados.length} MTR bloqueado(s)`, prioridade: "alta", descricao: bloqueados.map((b) => b.codigo).join(", ") });
    if (pendentesMtr.length) sugestoes.push({ titulo: `${pendentesMtr.length} MTR aguardando aprovação (${kg(pesoPend)})`, prioridade: "media", descricao: "Peso ainda fora do balanço de massa: " + pendentesMtr.map((b) => b.codigo).join(", ") });
    const jaExiste = new Set(acoesMun.map((a) => a.titulo));
    return { ult, taxa, aprovados, pendentesMtr, bloqueados, pesoAprov, pesoPend, acoesMun, sugestoes: sugestoes.filter((s) => !jaExiste.has(s.titulo)) };
  }, [sel, bench.data, mtr.data, acoes.data]);

  const criar = useMutation({
    mutationFn: async (a: { titulo: string; descricao?: string; prioridade: string; prazo?: string; responsavel?: string; origem: string }) => {
      if (!sel || !user) throw new Error("Selecione um município");
      const { error } = await supabase.from("fiscalizacao_acoes").insert({ ...a, prazo: a.prazo || null, municipio: sel.nome, uf: sel.uf, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fiscalizacao_acoes"] }); setForm({ titulo: "", descricao: "", prioridade: "media", prazo: "", responsavel: "" }); toast({ title: "Ação registrada" }); },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });
  const mudarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("fiscalizacao_acoes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fiscalizacao_acoes"] }),
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
  const salvarTramite = useMutation({
    mutationFn: async (a: any) => {
      const dias = a.prazo_resposta_dias;
      if (dias != null && (!Number.isInteger(dias) || dias < 1 || dias > 365)) throw new Error("Prazo de resposta deve ser entre 1 e 365 dias");
      const { error } = await supabase.from("fiscalizacao_acoes").update({
        numero_processo: a.numero_processo?.trim() || null, tipo_documento: a.tipo_documento,
        enquadramento_legal: a.enquadramento_legal || null, fase_tramitacao: a.fase_tramitacao,
        data_notificacao: a.data_notificacao || null, prazo_resposta_dias: dias ?? null,
        status: ["saneado", "executado"].includes(a.fase_tramitacao) ? "concluida" : a.status === "pendente" && a.fase_tramitacao !== "instaurado" ? "em_andamento" : a.status,
      }).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fiscalizacao_acoes"] }); setTramitando(null); toast({ title: "Tramitação registrada" }); },
    onError: (e: any) => toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  const emitir = async (a: any) => {
    if (!dados) return;
    try {
      const hash = await emitirTermo(a, {
        desvio: dados.taxa === null ? "—" : `${dados.taxa.toFixed(1)}%`, meta: `Meta 2030: ${META_2030}%`,
        pesoAprovado: kg(dados.pesoAprov), foraBalanco: kg(dados.pesoPend), mtrBloqueados: dados.bloqueados.length,
      }, user?.email ?? "usuário");
      const { error } = await supabase.from("fiscalizacao_acoes").update({ hash_documento: hash, documento_emitido_em: new Date().toISOString() }).eq("id", a.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["fiscalizacao_acoes"] });
      toast({ title: "Termo emitido", description: `Hash ${hash.slice(0, 16)}…` });
    } catch (e: any) { toast({ title: "Falha ao emitir", description: e.message, variant: "destructive" }); }
  };

  if (bench.isLoading || mtr.isLoading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

  const pend = dados?.acoesMun.filter((a) => a.status === "pendente" || a.status === "em_andamento") ?? [];
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Município:</span>
        <Select value={selKey} onValueChange={setChave}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{municipios.map(([k, m]) => <SelectItem key={k} value={k}>{m.nome} / {m.uf}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!sel || !dados ? <p className="text-muted-foreground">Nenhum município com dados.</p> : (<>
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4" />Desvio de aterro</div>
            <div className="text-2xl font-bold">{dados.taxa === null ? "—" : `${dados.taxa.toFixed(1)}%`}</div>
            <div className="text-xs text-muted-foreground">Meta 2030: {META_2030}% {dados.ult ? `· ref. ${dados.ult.ano_referencia}` : ""}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Scale className="h-4 w-4" />Peso aprovado no balanço</div>
            <div className="text-2xl font-bold">{kg(dados.pesoAprov)}</div><div className="text-xs text-muted-foreground">{dados.aprovados.length} MTR aprovado(s)</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><AlertTriangle className="h-4 w-4" />Fora do balanço</div>
            <div className="text-2xl font-bold">{kg(dados.pesoPend)}</div><div className="text-xs text-muted-foreground">{dados.pendentesMtr.length} pendente(s) · {dados.bloqueados.length} bloqueado(s)</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm text-muted-foreground"><ClipboardCheck className="h-4 w-4" />Ações pendentes</div>
            <div className="text-2xl font-bold">{pend.length}</div><div className="text-xs text-muted-foreground">{pend.filter((a) => a.prazo && a.prazo < hoje).length} atrasada(s)</div></CardContent></Card>
        </div>

        {dados.sugestoes.length > 0 && (
          <Card><CardHeader><CardTitle className="text-base">Ações sugeridas pela meta e balanço</CardTitle></CardHeader>
            <CardContent className="space-y-2">{dados.sugestoes.map((s) => (
              <div key={s.titulo} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                <div><div className="font-medium">{s.titulo}</div><div className="text-xs text-muted-foreground">{s.descricao}</div></div>
                <div className="flex items-center gap-2"><Badge variant={PRIO_VAR[s.prioridade]}>{s.prioridade}</Badge>
                  <Button size="sm" variant="outline" onClick={() => criar.mutate({ ...s, origem: "automatica" })}>Abrir ação</Button></div>
              </div>))}
            </CardContent></Card>
        )}

        <Card><CardHeader><CardTitle className="text-base">Ações de fiscalização — {sel.nome}/{sel.uf}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-5">
              <Input placeholder="Título da ação" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="md:col-span-2" />
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["baixa", "media", "alta", "critica"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
              <Input placeholder="Responsável" value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
              <Textarea placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="md:col-span-4" />
              <Button disabled={form.titulo.trim().length < 3 || criar.isPending} onClick={() => criar.mutate({ ...form, titulo: form.titulo.trim(), origem: "manual" })}><Plus className="mr-1 h-4 w-4" />Registrar</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Ação</TableHead><TableHead>Processo / fase</TableHead><TableHead>Prioridade</TableHead><TableHead>Prazo</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {dados.acoesMun.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma ação registrada.</TableCell></TableRow>}
                {dados.acoesMun.map((a: any) => {
                  const limite = dataLimiteResposta(a.data_notificacao, a.prazo_resposta_dias);
                  return (
                  <TableRow key={a.id}>
                    <TableCell><div className="font-medium">{a.titulo}</div><div className="text-xs text-muted-foreground">{a.descricao}</div>{a.responsavel && <div className="text-xs text-muted-foreground">Resp.: {a.responsavel}</div>}</TableCell>
                    <TableCell><div className="text-sm">{a.numero_processo || "—"}</div><Badge variant="outline">{FASES_TRAMITACAO[a.fase_tramitacao] ?? a.fase_tramitacao}</Badge>
                      {a.hash_documento && <div className="text-[10px] text-muted-foreground" title={a.hash_documento}>Termo emitido · {a.hash_documento.slice(0, 10)}…</div>}</TableCell>
                    <TableCell><Badge variant={PRIO_VAR[a.prioridade]}>{a.prioridade}</Badge></TableCell>
                    <TableCell className={a.prazo && a.prazo < hoje && a.status !== "concluida" ? "text-destructive" : ""}>{a.prazo ? new Date(a.prazo + "T00:00").toLocaleDateString("pt-BR") : "—"}
                      {limite && <div className={`text-xs ${limite < hoje && !["saneado", "executado"].includes(a.fase_tramitacao) ? "text-destructive" : "text-muted-foreground"}`}>Resposta até {new Date(limite + "T00:00").toLocaleDateString("pt-BR")}</div>}</TableCell>
                    <TableCell>
                      <Select value={a.status} onValueChange={(v) => mudarStatus.mutate({ id: a.id, status: v })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <Button size="sm" variant="outline" className="w-full" onClick={() => setTramitando({ ...a })}><Gavel className="mr-1 h-3 w-3" />Tramitar</Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => emitir(a)}><FileText className="mr-1 h-3 w-3" />Emitir termo</Button>
                    </TableCell>
                  </TableRow>);})}
              </TableBody>
            </Table>
          </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">MTRs do município no balanço de massa</CardTitle></CardHeader>
          <CardContent><Table>
            <TableHeader><TableRow><TableHead>MTR</TableHead><TableHead>Classe</TableHead><TableHead>Peso</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...dados.aprovados, ...dados.pendentesMtr, ...dados.bloqueados].map((r) => (
                <TableRow key={r.codigo}><TableCell>{r.codigo}</TableCell><TableCell>{r.classe_residuo}</TableCell><TableCell>{kg(Number(r.quantidade_kg) || 0)}</TableCell>
                  <TableCell><Badge variant={r.fluxo_status === "aprovado" ? "default" : r.fluxo_status === "bloqueado" ? "destructive" : "secondary"}>{r.fluxo_status === "aprovado" ? "No balanço" : r.fluxo_status}</Badge></TableCell></TableRow>))}
              {dados.aprovados.length + dados.pendentesMtr.length + dados.bloqueados.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum MTR de geradores deste município.</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
      </>)}

      <Dialog open={!!tramitando} onOpenChange={(o) => !o && setTramitando(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tramitação do processo</DialogTitle></DialogHeader>
          {tramitando && (
            <div className="space-y-3">
              <div><Label>Número do processo (SEI / protocolo)</Label>
                <Input value={tramitando.numero_processo ?? ""} onChange={(e) => setTramitando({ ...tramitando, numero_processo: e.target.value })} maxLength={60} /></div>
              <div><Label>Tipo de documento</Label>
                <Select value={tramitando.tipo_documento} onValueChange={(v) => setTramitando({ ...tramitando, tipo_documento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TIPOS_DOCUMENTO).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Enquadramento legal</Label>
                <Select value={tramitando.enquadramento_legal ?? ""} onValueChange={(v) => setTramitando({ ...tramitando, enquadramento_legal: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{ENQUADRAMENTOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Fase</Label>
                <Select value={tramitando.fase_tramitacao} onValueChange={(v) => setTramitando({ ...tramitando, fase_tramitacao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(FASES_TRAMITACAO).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Data da notificação</Label><Input type="date" value={tramitando.data_notificacao ?? ""} onChange={(e) => setTramitando({ ...tramitando, data_notificacao: e.target.value || null })} /></div>
                <div><Label>Prazo de resposta (dias)</Label><Input type="number" min={1} max={365} value={tramitando.prazo_resposta_dias ?? ""} onChange={(e) => setTramitando({ ...tramitando, prazo_resposta_dias: e.target.value ? Number(e.target.value) : null })} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button disabled={salvarTramite.isPending} onClick={() => tramitando && salvarTramite.mutate(tramitando)}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardMetasMunicipio;
