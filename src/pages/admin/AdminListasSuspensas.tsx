import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const schema = z.object({
  categoria: z.string().trim().min(1).max(64),
  codigo: z.string().trim().min(1).max(64),
  rotulo: z.string().trim().min(1).max(120),
  ordem: z.number().int().min(0),
  ativo: z.boolean(),
});

const AdminListasSuspensas = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filtro, setFiltro] = useState("all");
  const [form, setForm] = useState({ categoria: "", codigo: "", rotulo: "", ordem: 0, ativo: true });

  const { data: itens = [] } = useQuery({
    queryKey: ["admin-listas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_listas_suspensas").select("*").order("categoria").order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const categorias = Array.from(new Set(itens.map((i: any) => i.categoria)));
  const visiveis = filtro === "all" ? itens : itens.filter((i: any) => i.categoria === filtro);

  const upsert = useMutation({
    mutationFn: async (payload: any) => {
      const parsed = schema.safeParse(payload);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const row = {
        categoria: parsed.data.categoria, codigo: parsed.data.codigo,
        rotulo: parsed.data.rotulo, ordem: parsed.data.ordem, ativo: parsed.data.ativo,
      };
      if (editing) {
        const { error } = await supabase.from("app_listas_suspensas").update(row).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_listas_suspensas").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-listas"] }); toast.success("Salvo"); setOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("app_listas_suspensas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-listas"] }); toast.success("Removido"); },
  });

  const openEdit = (r?: any) => {
    if (r) { setEditing(r); setForm({ categoria: r.categoria, codigo: r.codigo, rotulo: r.rotulo, ordem: r.ordem, ativo: r.ativo }); }
    else { setEditing(null); setForm({ categoria: filtro !== "all" ? filtro : "", codigo: "", rotulo: "", ordem: 0, ativo: true }); }
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Listas Suspensas"
        description="Catálogos de opções reutilizáveis em formulários do sistema (status, materiais, motivos…)."
        icon={<ListChecks className="h-4 w-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => openEdit()}><Plus className="h-3.5 w-3.5 mr-1" />Nova opção</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Editar opção" : "Nova opção"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Categoria</Label><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="ex: motivo_recusa" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Código</Label><Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></div>
                    <div><Label className="text-xs">Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })} /></div>
                  </div>
                  <div><Label className="text-xs">Rótulo</Label><Input value={form.rotulo} onChange={(e) => setForm({ ...form, rotulo: e.target.value })} /></div>
                  <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label className="text-xs">Ativa</Label></div>
                </div>
                <DialogFooter><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button><Button size="sm" onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>Salvar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Categoria</TableHead><TableHead className="text-xs">Código</TableHead>
              <TableHead className="text-xs">Rótulo</TableHead><TableHead className="text-xs">Ordem</TableHead>
              <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-20"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visiveis.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhuma opção</TableCell></TableRow>}
              {visiveis.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.categoria}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{r.codigo}</TableCell>
                  <TableCell className="text-xs">{r.rotulo}</TableCell>
                  <TableCell className="text-xs">{r.ordem}</TableCell>
                  <TableCell><Badge className={`text-[10px] ${r.ativo ? "bg-emerald-600" : "bg-muted text-muted-foreground"}`}>{r.ativo ? "ativa" : "inativa"}</Badge></TableCell>
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

export default AdminListasSuspensas;
