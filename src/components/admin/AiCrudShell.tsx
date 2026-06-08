import { ReactNode, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export interface ColumnDef<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

interface Props<T> {
  title: string;
  description: string;
  icon: ReactNode;
  tableName: any;
  queryKey: string;
  orderBy?: string;
  columns: ColumnDef<T>[];
  emptyForm: any;
  renderForm: (form: any, setForm: (v: any) => void) => ReactNode;
  validate?: (form: any) => string | null;
  toRow?: (form: any) => any;
  fromRow?: (row: any) => any | Promise<any>;
  dialogTitle?: string;
  afterSave?: (form: any, savedRow: any) => Promise<void> | void;
}

export function AiCrudShell<T extends { id: string }>({
  title, description, icon, tableName, queryKey, orderBy = "created_at",
  columns, emptyForm, renderForm, validate, toRow, fromRow, dialogTitle, afterSave,
}: Props<T>) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select("*").order(orderBy, { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const err = validate?.(form);
      if (err) throw new Error(err);
      const payload = toRow ? toRow(form) : form;
      if (editing) {
        const { error } = await supabase.from(tableName).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); toast.success("Salvo"); setOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(tableName).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); toast.success("Removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm(fromRow ? fromRow(r) : r); setOpen(true); };

  return (
    <div className="space-y-4">
      <AdminPageHeader title={title} description={description} icon={icon}
        actions={<Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" />Novo</Button>} />
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Carregando…</p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Nenhum registro. Clique em "Novo".</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => <TableHead key={c.header} className="text-xs">{c.header}</TableHead>)}
                  <TableHead className="text-xs w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.id}>
                    {columns.map((c, i) => <TableCell key={i} className="text-xs py-2">{c.cell(r)}</TableCell>)}
                    <TableCell className="text-right py-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => confirm("Remover?") && remove.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} — {dialogTitle ?? title}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">{renderForm(form, setForm)}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
