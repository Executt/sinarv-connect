import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";

const REGIOES = [
  "Brasil (Nacional)",
  "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul",
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

const schema = z.object({
  periodo_inicio: z.string().min(1, "Obrigatório"),
  periodo_fim: z.string().min(1, "Obrigatório"),
  regiao: z.string().min(1, "Selecione uma região"),
  fonte_tipo: z.enum(["url", "arquivo"]),
  fonte_url: z.string().url("URL inválida").max(2048).optional().or(z.literal("")),
  observacoes: z.string().max(2000).optional(),
}).refine((v) => v.periodo_inicio <= v.periodo_fim, {
  message: "Período inicial deve ser anterior ao final",
  path: ["periodo_fim"],
});

type Props = {
  trigger?: React.ReactNode;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const SolicitarImportacaoDialog = ({ trigger }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    periodo_inicio: "",
    periodo_fim: "",
    regiao: "",
    fonte_tipo: "url" as "url" | "arquivo",
    fonte_url: "",
    observacoes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setForm({ periodo_inicio: "", periodo_fim: "", regiao: "", fonte_tipo: "url", fonte_url: "", observacoes: "" });
    setFile(null);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((er) => { errs[er.path[0] as string] = er.message; });
      setErrors(errs);
      return;
    }

    if (form.fonte_tipo === "url" && !form.fonte_url) {
      setErrors({ fonte_url: "Informe a URL do arquivo" });
      return;
    }
    if (form.fonte_tipo === "arquivo" && !file) {
      setErrors({ arquivo: "Selecione um arquivo" });
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setErrors({ arquivo: "Arquivo excede 10 MB" });
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        periodo_inicio: form.periodo_inicio,
        periodo_fim: form.periodo_fim,
        regiao: form.regiao,
        fonte_tipo: form.fonte_tipo,
        observacoes: form.observacoes || undefined,
      };
      if (form.fonte_tipo === "url") {
        payload.fonte_url = form.fonte_url;
      } else if (file) {
        payload.arquivo_nome = file.name;
        payload.arquivo_base64 = await fileToBase64(file);
      }

      const { data, error } = await supabase.functions.invoke("solicitar-importacao", {
        body: payload,
      });
      if (error) throw error;

      toast({
        title: "Solicitação enviada",
        description: `Ticket ${data?.ticket ?? ""}. A equipe de dados foi notificada.`,
      });
      reset();
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Falha ao enviar solicitação",
        description: err?.message ?? "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Solicitar importação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar importação de dados de lixões</DialogTitle>
          <DialogDescription>
            Informe o período, região e a fonte (URL ou arquivo) para a equipe de dados processar a carga.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="periodo_inicio">Período — início</Label>
              <Input
                id="periodo_inicio"
                type="date"
                value={form.periodo_inicio}
                onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
              />
              {errors.periodo_inicio && <p className="text-xs text-destructive">{errors.periodo_inicio}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="periodo_fim">Período — fim</Label>
              <Input
                id="periodo_fim"
                type="date"
                value={form.periodo_fim}
                onChange={(e) => setForm({ ...form, periodo_fim: e.target.value })}
              />
              {errors.periodo_fim && <p className="text-xs text-destructive">{errors.periodo_fim}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Região / UF</Label>
            <Select value={form.regiao} onValueChange={(v) => setForm({ ...form, regiao: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {REGIOES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.regiao && <p className="text-xs text-destructive">{errors.regiao}</p>}
          </div>

          <div className="space-y-2">
            <Label>Fonte dos dados</Label>
            <RadioGroup
              value={form.fonte_tipo}
              onValueChange={(v) => setForm({ ...form, fonte_tipo: v as "url" | "arquivo" })}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="url" id="ft-url" />
                <Label htmlFor="ft-url" className="font-normal">URL</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="arquivo" id="ft-arq" />
                <Label htmlFor="ft-arq" className="font-normal">Arquivo (CSV/XLSX/JSON)</Label>
              </div>
            </RadioGroup>

            {form.fonte_tipo === "url" ? (
              <div className="space-y-1">
                <Input
                  type="url"
                  placeholder="https://exemplo.gov.br/dados.csv"
                  value={form.fonte_url}
                  onChange={(e) => setForm({ ...form, fonte_url: e.target.value })}
                />
                {errors.fonte_url && <p className="text-xs text-destructive">{errors.fonte_url}</p>}
              </div>
            ) : (
              <div className="space-y-1">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json,.geojson"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-muted-foreground">Máx. 10 MB. Formatos: CSV, XLSX, JSON, GeoJSON.</p>
                {errors.arquivo && <p className="text-xs text-destructive">{errors.arquivo}</p>}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea
              id="obs"
              rows={3}
              maxLength={2000}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Detalhes sobre a fonte, mapeamento de colunas, prioridade…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar solicitação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SolicitarImportacaoDialog;
