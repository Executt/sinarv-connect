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
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const TIPOS = ["cooperativa", "industria", "ponto_coleta", "gov"];

const AdminPerfisEntidade = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    nome: "", descricao: "", tipo_entidade: TIPOS[0], permissoes_raw: "[]", ativo: true,
  });

  const { data: perfis = [] } = useQuery({
    queryKey: ["admin-perfis-entidade"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entidades_perfis").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!form.nome) throw new Error("Nome obrigatório");
      let permissoes: any;
      try { permissoes = JSON.parse(form.permissoes_raw || "[]"); }
      catch { throw new Error("Permissões: JSON inválido"); }
      const row = { nome: form.nome, descricao: form.descricao, tipo_entidade: form.tipo_entidade, permissoes, ativo: form.ativo };
      if (editing) { const { error } = await supabase.from("entidades_perfis").update(row).eq("id", editing.id); if (error) throw error; }
      else { const { error } = await supabase.from("entidades_perfis").insert(row); if (error) throw error; }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-perfis-entidade"] }); toast.success("Salvo"); setOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("entidades_perfis").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-perfis-entidade"] }); toast.success("Removido"); },
  });

  const openEdit = (r?: any) => {
    if (r) {
      setEditing(r);
      setForm({ nome: r.nome, descricao: r.descricao, tipo_entidade: r.tipo_entidade, permissoes_raw: JSON.stringify(r.permissoes, null, 2), ativo: r.ativo });
    } else {
      setEditing(null);
      setForm({ nome: "", descricao: "", tipo_entidade: TIPOS[0], permissoes_raw: "[]", ativo: true });
    }
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Perfis de Entidade"
        description="Templates de perfil aplicáveis a entidades (cooperativa, indústria, ponto de coleta, gov)."
        icon={<Building2 className="h-4 w-4" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={() => openEdit()}><Plus className="h-3.5 w-3.5 mr-1" />Novo perfil</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar perfil" : "Novo perfil"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label className="text-xs">Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div><Label className="text-xs">Tipo de entidade</Label>
                  <Select value={form.tipo_entidade} onValueChange={(v) => setForm({ ...form, tipo_entidade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Permissões (JSON array)</Label>
                  <Textarea rows={4} className="font-mono text-xs" value={form.permissoes_raw} onChange={(e) => setForm({ ...form, permissoes_raw: e.target.value })} placeholder='["lotes.write", "despacho.read"]' />
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /><Label className="text-xs">Ativo</Label></div>
              </div>
              <DialogFooter><Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button><Button size="sm" onClick={() => upsert.mutate()} disabled={upsert.isPending}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Nome</TableHead><TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Permissões</TableHead><TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-20"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {perfis.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Nenhum perfil de entidade</TableCell></TableRow>}
              {perfis.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.nome}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.tipo_entidade}</Badge></TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px]">{Array.isArray(r.permissoes) ? r.permissoes.length : 0} perms</Badge>
                  </TableCell>
                  <TableCell><Badge className={`text-[10px] ${r.ativo ? "bg-emerald-600" : "bg-muted text-muted-foreground"}`}>{r.ativo ? "ativo" : "inativo"}</Badge></TableCell>
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

export default AdminPerfisEntidade;
