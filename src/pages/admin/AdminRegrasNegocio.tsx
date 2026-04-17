import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ListChecks, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const schema = z.object({
  chave: z.string().trim().min(1).max(64).regex(/^[a-z0-9_.]+$/, "Use minúsculas, números, _ e ."),
  nome: z.string().trim().min(1).max(120),
  descricao: z.string().max(500).optional().default(""),
  escopo: z.enum(["global", "gov", "cooperativa", "industria", "ponto_coleta"]),
  tipo: z.enum(["string", "number", "boolean", "json"]),
  valor_raw: z.string().min(1, "Informe o valor"),
  ativo: z.boolean(),
});

const parseValor = (tipo: string, raw: string) => {
  if (tipo === "number") return { v: Number(raw) };
  if (tipo === "boolean") return { v: raw === "true" };
  if (tipo === "json") return JSON.parse(raw);
  return { v: raw };
};

const stringifyValor = (tipo: string, valor: any) => {
  if (tipo === "json") return JSON.stringify(valor, null, 2);
  return String(valor?.v ?? "");
};

const AdminRegrasNegocio = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    chave: "", nome: "", descricao: "", escopo: "global",
    tipo: "string", valor_raw: "", ativo: true,
  });

  const { data: regras = [], isLoading } = useQuery({
    queryKey: ["admin-regras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_regras_negocio").select("*").order("chave");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: any) => {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      let valor: any;
      try { valor = parseValor(parsed.data.tipo, parsed.data.valor_raw); }
      catch { throw new Error("Valor inválido para o tipo selecionado"); }

      const row = {
        chave: parsed.data.chave, nome: parsed.data.nome, descricao: parsed.data.descricao,
        escopo: parsed.data.escopo, tipo: parsed.data.tipo, valor, ativo: parsed.data.ativo,
      };
      if (editing) {
        const { error } = await supabase.from("app_regras_negocio").update(row).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_regras_negocio").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-regras"] });
      toast.success(editing ? "Regra atualizada" : "Regra criada");
      setOpen(false); setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("app_regras_negocio").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-regras"] }); toast.success("Removida"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (r?: any) => {
    if (r) {
      setEditing(r);
      setForm({
        chave: r.chave, nome: r.nome, descricao: r.descricao, escopo: r.escopo,
        tipo: r.tipo, valor_raw: stringifyValor(r.tipo, r.valor), ativo: r.ativo,
      });
    } else {
      setEditing(null);
      setForm({ chave: "", nome: "", descricao: "", escopo: "global", tipo: "string", valor_raw: "", ativo: true });
    }
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Regras de Negócio"
        description="Parâmetros tipados que controlam comportamentos do sistema (com escopo e versionamento)."
        icon={<ListChecks className="h-4 w-4" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openEdit()}><Plus className="h-3.5 w-3.5 mr-1" />Nova regra</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Editar regra" : "Nova regra"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Chave</Label><Input value={form.chave} onChange={(e) => setForm({ ...form, chave: e.target.value })} placeholder="ex: max.upload.mb" /></div>
                  <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                </div>
                <div><Label className="text-xs">Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Escopo</Label>
                    <Select value={form.escopo} onValueChange={(v) => setForm({ ...form, escopo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["global", "gov", "cooperativa", "industria", "ponto_coleta"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["string", "number", "boolean", "json"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Valor {form.tipo === "boolean" && "(true/false)"}</Label>
                  <Textarea rows={form.tipo === "json" ? 4 : 1} value={form.valor_raw} onChange={(e) => setForm({ ...form, valor_raw: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                  <Label className="text-xs">Ativa</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button size="sm" onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Chave</TableHead>
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">Escopo</TableHead>
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs">Valor</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Carregando…</TableCell></TableRow>}
              {!isLoading && regras.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Nenhuma regra cadastrada</TableCell></TableRow>}
              {regras.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-mono">{r.chave}</TableCell>
                  <TableCell className="text-xs">{r.nome}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.escopo}</Badge></TableCell>
                  <TableCell className="text-xs">{r.tipo}</TableCell>
                  <TableCell className="text-xs font-mono max-w-[180px] truncate">{stringifyValor(r.tipo, r.valor)}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${r.ativo ? "bg-emerald-600" : "bg-muted text-muted-foreground"}`}>{r.ativo ? "ativa" : "inativa"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("Remover?")) remove.mutate(r.id); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRegrasNegocio;
