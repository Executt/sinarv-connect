import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Recycle } from "lucide-react";

const COR_MAP: Record<string, string> = {
  blue: "bg-blue-500", yellow: "bg-yellow-400", green: "bg-green-600",
  orange: "bg-orange-500", gray: "bg-gray-600", red: "bg-red-500", purple: "bg-purple-500", brown: "bg-amber-700",
};

const AdminContenedores = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ cor: "", nome: "", material: "", descricao: "", volumes: "", boas_praticas: "", icone: "Recycle", ativo: true });

  const { data: contenedores = [], isLoading } = useQuery({
    queryKey: ["admin-contenedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contenedores").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        cor: form.cor, nome: form.nome, material: form.material, descricao: form.descricao,
        volumes: form.volumes.split(",").map((v) => v.trim()).filter(Boolean),
        boas_praticas: form.boas_praticas.split("\n").map((v) => v.trim()).filter(Boolean),
        icone: form.icone, ativo: form.ativo,
      };
      if (editId) {
        const { error } = await supabase.from("contenedores").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contenedores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contenedores"] });
      toast({ title: editId ? "Contenedor atualizado" : "Contenedor criado" });
      setOpen(false); resetForm();
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ cor: "", nome: "", material: "", descricao: "", volumes: "", boas_praticas: "", icone: "Recycle", ativo: true });
    setEditId(null);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      cor: c.cor, nome: c.nome, material: c.material, descricao: c.descricao || "",
      volumes: (c.volumes || []).join(", "), boas_praticas: (c.boas_praticas || []).join("\n"),
      icone: c.icone || "Recycle", ativo: c.ativo,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{contenedores.length} tipos cadastrados</Badge>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo Contenedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Contenedor</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label className="text-xs">Cor</Label>
                  <Select value={form.cor} onValueChange={(v) => setForm({ ...form, cor: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{Object.keys(COR_MAP).map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} /></div>
              <div><Label className="text-xs">Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} /></div>
              <div><Label className="text-xs">Volumes (separados por vírgula)</Label><Input value={form.volumes} onChange={(e) => setForm({ ...form, volumes: e.target.value })} placeholder="240L, 660L, 1100L" /></div>
              <div><Label className="text-xs">Boas Práticas (uma por linha)</Label><Textarea value={form.boas_praticas} onChange={(e) => setForm({ ...form, boas_praticas: e.target.value })} rows={3} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => upsert.mutate()} disabled={!form.nome || !form.cor || !form.material || upsert.isPending}>
                {upsert.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs w-10">Cor</TableHead>
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs">Material</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Volumes</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-16"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {contenedores.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell><div className={`w-5 h-5 rounded-full ${COR_MAP[c.cor] || "bg-muted"} shadow-sm`} /></TableCell>
                    <TableCell className="text-xs font-medium">{c.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.material}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex gap-1 flex-wrap">{(c.volumes || []).map((v: string) => <Badge key={v} variant="outline" className="text-[9px]">{v}</Badge>)}</div>
                    </TableCell>
                    <TableCell><Badge variant={c.ativo ? "default" : "secondary"} className="text-[10px]">{c.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminContenedores;
