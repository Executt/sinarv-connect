import { useEffect, useState } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Truck, FileCheck2, AlertOctagon, Plus, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  created_at: string;
};

const statusColor: Record<string, string> = {
  solicitado: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  aceito: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  em_transito: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  recebido: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  recusado: "bg-red-500/10 text-red-600 border-red-500/20",
  divergente: "bg-red-500/10 text-red-600 border-red-500/20",
  cancelado: "bg-muted text-muted-foreground border-border",
};

export default function DashboardResiduosCriticos() {
  const [loading, setLoading] = useState(true);
  const [geradores, setGeradores] = useState<Gerador[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [mtrs, setMtrs] = useState<MTR[]>([]);

  const carregar = async () => {
    setLoading(true);
    try {
      const [g, o, l, m] = await Promise.all([
        supabase.from("geradores_criticos").select("*").order("razao_social"),
        supabase.from("operadores_logisticos").select("*").order("razao_social"),
        supabase.from("licencas_ambientais").select("*").order("validade", { ascending: true }),
        supabase.from("mtr_solicitacoes").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      if (g.error) throw g.error;
      if (o.error) throw o.error;
      if (l.error) throw l.error;
      if (m.error) throw m.error;
      setGeradores(g.data as Gerador[]);
      setOperadores(o.data as Operador[]);
      setLicencas(l.data as Licenca[]);
      setMtrs(m.data as MTR[]);
    } catch (e: any) {
      console.error("[ResiduosCriticos] load error", e);
      toast.error("Erro ao carregar dados", { description: e.message });
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
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const bloqueados = operadores.filter((o) => o.bloqueado).length;
  const vencendo = licencas.filter((l) => {
    const dias = Math.ceil((new Date(l.validade).getTime() - Date.now()) / 86400000);
    return dias >= 0 && dias <= 30;
  }).length;
  const mtrAtivos = mtrs.filter((m) => ["solicitado", "aceito", "em_transito"].includes(m.status)).length;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard icon={Building2} label="Geradores ativos" value={geradores.filter((g) => g.ativo).length} tone="text-emerald-600" />
        <KpiCard icon={Truck} label="Operadores homologados" value={operadores.filter((o) => o.homologado && !o.bloqueado).length} tone="text-cyan-600" />
        <KpiCard icon={ShieldAlert} label="Operadores bloqueados" value={bloqueados} tone={bloqueados ? "text-red-600" : "text-muted-foreground"} />
        <KpiCard icon={FileCheck2} label="Licenças vencendo (30d)" value={vencendo} tone={vencendo ? "text-amber-600" : "text-muted-foreground"} />
      </div>

      <Tabs defaultValue="mtr" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mtr">MTR ({mtrs.length})</TabsTrigger>
          <TabsTrigger value="geradores">Geradores ({geradores.length})</TabsTrigger>
          <TabsTrigger value="operadores">Operadores ({operadores.length})</TabsTrigger>
          <TabsTrigger value="licencas">Licenças ({licencas.length})</TabsTrigger>
        </TabsList>

        {/* MTR */}
        <TabsContent value="mtr">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Manifestos de Transporte de Resíduos</CardTitle>
              <NovoMTRDialog geradores={geradores} operadores={operadores} onSaved={carregar} />
            </CardHeader>
            <CardContent>
              {loading ? <LoadingRow /> : mtrs.length === 0 ? (
                <EmptyState icon={AlertOctagon} label="Nenhum MTR emitido ainda." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Gerador</TableHead>
                      <TableHead>Transportador</TableHead>
                      <TableHead>Classe / ONU</TableHead>
                      <TableHead className="text-right">Qtd (kg)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mtrs.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                        <TableCell>{geradores.find((g) => g.id === m.gerador_id)?.razao_social ?? "—"}</TableCell>
                        <TableCell>{operadores.find((o) => o.id === m.operador_id)?.razao_social ?? "—"}</TableCell>
                        <TableCell className="text-xs">{m.classe_residuo}{m.onu_number ? ` · ONU ${m.onu_number}` : ""}</TableCell>
                        <TableCell className="text-right">{m.quantidade_kg}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColor[m.status]}>{m.status.replace("_"," ")}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                        <TableCell className="text-xs capitalize">{g.tipo.replace("_"," ")}</TableCell>
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operadores.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.razao_social}</TableCell>
                        <TableCell className="font-mono text-xs">{o.cnpj}</TableCell>
                        <TableCell className="text-xs capitalize">{o.tipo}</TableCell>
                        <TableCell className="text-xs capitalize">{o.natureza}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licenças */}
        <TabsContent value="licencas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Licenças Ambientais</CardTitle>
              <NovaLicencaDialog operadores={operadores} onSaved={carregar} />
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
                      <TableHead>Validade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licencas.map((l) => {
                      const dias = Math.ceil((new Date(l.validade).getTime() - Date.now()) / 86400000);
                      const tone = dias < 0 ? "text-red-600" : dias <= 30 ? "text-amber-600" : "text-emerald-600";
                      return (
                        <TableRow key={l.id}>
                          <TableCell>{operadores.find((o) => o.id === l.operador_id)?.razao_social ?? "—"}</TableCell>
                          <TableCell className="text-xs">{l.tipo}</TableCell>
                          <TableCell className="font-mono text-xs">{l.numero}</TableCell>
                          <TableCell className="text-xs">{l.orgao_emissor}</TableCell>
                          <TableCell className={`text-xs ${tone}`}>
                            {new Date(l.validade).toLocaleDateString("pt-BR")}
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

/* --------- Dialogs --------- */

function NovoGeradorDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ razao_social: "", cnpj: "", tipo: "hospital", cnes: "", municipio: "", uf: "", responsavel_nome: "", responsavel_email: "" });
  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("geradores_criticos").insert(form);
    setSaving(false);
    if (error) return toast.error("Erro", { description: error.message });
    toast.success("Gerador cadastrado");
    setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Gerador Crítico</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razão Social" value={form.razao_social} onChange={(v) => setForm({ ...form, razao_social: v })} className="col-span-2" />
          <Field label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
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
          <Field label="UF" value={form.uf} onChange={(v) => setForm({ ...form, uf: v })} />
          <Field label="Responsável" value={form.responsavel_nome} onChange={(v) => setForm({ ...form, responsavel_nome: v })} />
          <Field label="E-mail" value={form.responsavel_email} onChange={(v) => setForm({ ...form, responsavel_email: v })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !form.razao_social || !form.cnpj}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoOperadorDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ razao_social: "", cnpj: "", tipo: "transportador", natureza: "privado", homologado: false });
  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("operadores_logisticos").insert(form);
    setSaving(false);
    if (error) return toast.error("Erro", { description: error.message });
    toast.success("Operador cadastrado");
    setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Operador Logístico</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Razão Social" value={form.razao_social} onChange={(v) => setForm({ ...form, razao_social: v })} className="col-span-2" />
          <Field label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} />
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
          <Button onClick={submit} disabled={saving || !form.razao_social || !form.cnpj}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovaLicencaDialog({ operadores, onSaved }: { operadores: Operador[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ operador_id: "", tipo: "Licença de Operação", numero: "", orgao_emissor: "", emissao: "", validade: "" });
  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("licencas_ambientais").insert(form);
    setSaving(false);
    if (error) return toast.error("Erro", { description: error.message });
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
            <Label>Operador</Label>
            <Select value={form.operador_id} onValueChange={(v) => setForm({ ...form, operador_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{operadores.map((o) => <SelectItem key={o.id} value={o.id}>{o.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
          <Field label="Nº" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} />
          <Field label="Órgão Emissor" value={form.orgao_emissor} onChange={(v) => setForm({ ...form, orgao_emissor: v })} className="col-span-2" />
          <Field label="Emissão" type="date" value={form.emissao} onChange={(v) => setForm({ ...form, emissao: v })} />
          <Field label="Validade" type="date" value={form.validade} onChange={(v) => setForm({ ...form, validade: v })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !form.operador_id || !form.numero || !form.validade}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoMTRDialog({ geradores, operadores, onSaved }: { geradores: Gerador[]; operadores: Operador[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ gerador_id: "", operador_id: "", destinador_id: "", classe_residuo: "A1 - Infectante", onu_number: "", quantidade_kg: "" });
  const transportadores = operadores.filter((o) => (o.tipo === "transportador" || o.tipo === "ambos") && !o.bloqueado);
  const destinadores = operadores.filter((o) => (o.tipo === "destinador" || o.tipo === "ambos") && !o.bloqueado);
  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("mtr_solicitacoes").insert({
      gerador_id: form.gerador_id,
      operador_id: form.operador_id || null,
      destinador_id: form.destinador_id || null,
      classe_residuo: form.classe_residuo,
      onu_number: form.onu_number || null,
      quantidade_kg: Number(form.quantidade_kg),
    });
    setSaving(false);
    if (error) return toast.error("Erro", { description: error.message });
    toast.success("MTR emitido");
    setOpen(false); onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" disabled={geradores.length === 0}><Plus className="h-4 w-4 mr-1" /> Novo MTR</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Emitir MTR</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label>Gerador</Label>
            <Select value={form.gerador_id} onValueChange={(v) => setForm({ ...form, gerador_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{geradores.map((g) => <SelectItem key={g.id} value={g.id}>{g.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Transportador</Label>
            <Select value={form.operador_id} onValueChange={(v) => setForm({ ...form, operador_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{transportadores.map((o) => <SelectItem key={o.id} value={o.id}>{o.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Destinador</Label>
            <Select value={form.destinador_id} onValueChange={(v) => setForm({ ...form, destinador_id: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{destinadores.map((o) => <SelectItem key={o.id} value={o.id}>{o.razao_social}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Field label="Classe do Resíduo" value={form.classe_residuo} onChange={(v) => setForm({ ...form, classe_residuo: v })} />
          <Field label="ONU" value={form.onu_number} onChange={(v) => setForm({ ...form, onu_number: v })} />
          <Field label="Quantidade (kg)" type="number" value={form.quantidade_kg} onChange={(v) => setForm({ ...form, quantidade_kg: v })} className="col-span-2" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || !form.gerador_id || !form.quantidade_kg}>{saving ? "Emitindo..." : "Emitir MTR"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
