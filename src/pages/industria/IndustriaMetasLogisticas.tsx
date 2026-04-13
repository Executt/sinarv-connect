import { useIndustrias, useMateriaPrima, useCertificados } from "@/hooks/use-schema-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Recycle, Award, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const IndustriaMetasLogisticas = () => {
  const { data: industrias, isLoading: loadingInd } = useIndustrias();
  const { data: materias, isLoading: loadingMat } = useMateriaPrima();
  const { data: certs, isLoading: loadingCert } = useCertificados();

  if (loadingInd || loadingMat || loadingCert) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalReciclado = materias?.reduce((s, m) => s + Number(m.peso_kg || 0), 0) ?? 0;
  const totalCertificado = certs?.reduce((s, c) => s + Number(c.volume_total_certificado || 0), 0) ?? 0;
  // Meta simulada de 2000 kg
  const metaTotal = 2000;
  const percentualMeta = Math.min((totalCertificado / metaTotal) * 100, 100);

  const kpis = [
    { label: "Matéria-Prima Reciclada", value: `${totalReciclado.toLocaleString("pt-BR")} kg`, icon: Recycle, color: "text-success" },
    { label: "Volume Certificado", value: `${totalCertificado.toLocaleString("pt-BR")} kg`, icon: Award, color: "text-primary" },
    { label: "Indústrias Cadastradas", value: String(industrias?.length ?? 0), icon: Target, color: "text-accent" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                  <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color} opacity-30`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meta progress */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Progresso da Meta PNRS — 2026
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Meta de Logística Reversa</span>
            <span className="font-bold text-foreground">{percentualMeta.toFixed(1)}%</span>
          </div>
          <Progress value={percentualMeta} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {totalCertificado.toLocaleString("pt-BR")} kg de {metaTotal.toLocaleString("pt-BR")} kg necessários
          </p>
        </CardContent>
      </Card>

      {/* Tabela de matéria-prima */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Matéria-Prima Reciclada Registada</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo Insumo</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Comprovante</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materias?.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.tipo_insumo}</TableCell>
                  <TableCell>{Number(m.peso_kg).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{m.comprovante_reaproveitamento}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(m.data_registro).toLocaleDateString("pt-BR")}
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

export default IndustriaMetasLogisticas;
