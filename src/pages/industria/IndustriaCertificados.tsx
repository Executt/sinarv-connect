import { useCertificados, useIndustrias } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  "Válido": "bg-success/10 text-success border-success/20",
  "Expirado": "bg-muted text-muted-foreground border-border",
  "Revogado": "bg-destructive/10 text-destructive border-destructive/20",
};

const IndustriaCertificados = () => {
  const { data: certs, isLoading: loadingCert } = useCertificados();
  const { data: industrias, isLoading: loadingInd } = useIndustrias();

  if (loadingCert || loadingInd) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;
  }

  const industriaMap = new Map(industrias?.map((i: any) => [i.id, i]) ?? []);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total de Certificados</p>
                <p className="text-2xl font-bold text-foreground mt-1">{certs?.length ?? 0}</p>
              </div>
              <Award className="h-8 w-8 text-primary opacity-30" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Certificados Válidos</p>
                <p className="text-2xl font-bold text-success mt-1">
                  {certs?.filter((c: any) => c.status === "Válido").length ?? 0}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-success opacity-30" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Volume Total Certificado</p>
                <p className="text-2xl font-bold text-accent mt-1">
                  {(certs?.reduce((s: number, c: any) => s + Number(c.volume_total_certificado || 0), 0) ?? 0).toLocaleString("pt-BR")} kg
                </p>
              </div>
              <Download className="h-8 w-8 text-accent opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Certificados de Logística Reversa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indústria</TableHead>
                <TableHead>Volume (kg)</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Hash Auditoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certs?.map((c: any) => {
                const ind = industriaMap.get(c.industria_id) as any;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{ind?.razao_social ?? "—"}</TableCell>
                    <TableCell>{Number(c.volume_total_certificado).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{c.ano_referencia}</TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {c.hash_auditoria?.substring(0, 16)}…
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(c.data_emissao).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Download className="h-3 w-3 mr-1" /> PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustriaCertificados;
