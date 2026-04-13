import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIndustrias } from "@/hooks/use-schema-data";
import { useMetasPnrs } from "@/hooks/use-industria-data";
import { Filter, Building2, FileCheck, AlertTriangle, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const IndustriaCadastro = () => {
  const [selectedInd, setSelectedInd] = useState<string>("all");
  const { data: industrias, isLoading: loadInd } = useIndustrias();
  const { data: metas } = useMetasPnrs(selectedInd === "all" ? undefined : selectedInd);

  if (loadInd) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedInd} onValueChange={setSelectedInd}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Filtrar por indústria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Indústrias</SelectItem>
            {industrias?.map((i: any) => (
              <SelectItem key={i.id} value={i.id}>{i.razao_social || i.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-primary opacity-40" />
            <div>
              <p className="text-xs text-muted-foreground">Indústrias Cadastradas</p>
              <p className="text-2xl font-bold">{industrias?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <Target className="h-8 w-8 text-primary opacity-40" />
            <div>
              <p className="text-xs text-muted-foreground">Metas Definidas</p>
              <p className="text-2xl font-bold">{metas?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <FileCheck className="h-8 w-8 text-primary opacity-40" />
            <div>
              <p className="text-xs text-muted-foreground">Metas Atingidas (100%+)</p>
              <p className="text-2xl font-bold text-success">
                {metas?.filter((m: any) => Number(m.atingido_peso_kg) >= Number(m.meta_peso_kg)).length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="industrias">
        <TabsList>
          <TabsTrigger value="industrias">Indústrias</TabsTrigger>
          <TabsTrigger value="passivo">Passivo Ambiental (Metas)</TabsTrigger>
        </TabsList>

        <TabsContent value="industrias" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Indústrias Credenciadas</CardTitle>
              <CardDescription>CNPJ, CNAE e dados operacionais</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>CNAE</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Licença Op.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {industrias?.map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.razao_social}</TableCell>
                      <TableCell className="font-mono text-xs">{i.cnpj}</TableCell>
                      <TableCell className="text-sm">{i.cnae_principal || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{i.cidade}/{i.estado}</TableCell>
                      <TableCell>
                        <Badge variant={i.licenca_operacao ? "default" : "secondary"} className="text-xs">
                          {i.licenca_operacao || "Não informada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passivo" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Passivo Ambiental — Metas de Logística Reversa</CardTitle>
              <CardDescription>Definição e acompanhamento das metas anuais por tipo de material</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metas?.map((m: any) => {
                const pct = Number(m.meta_peso_kg) > 0
                  ? (Number(m.atingido_peso_kg) / Number(m.meta_peso_kg)) * 100
                  : 0;
                const ind = industrias?.find((i: any) => i.id === m.industria_id);
                return (
                  <div key={m.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{ind?.razao_social || "—"}</p>
                        <p className="text-xs text-muted-foreground">{m.tipo_material} — {m.ano_referencia}</p>
                      </div>
                      <Badge variant={pct >= 100 ? "default" : pct >= 50 ? "secondary" : "destructive"} className="text-xs">
                        {pct.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {(Number(m.atingido_peso_kg) / 1000).toFixed(1)} ton de {(Number(m.meta_peso_kg) / 1000).toFixed(1)} ton
                    </p>
                  </div>
                );
              })}
              {(!metas || metas.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta encontrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IndustriaCadastro;
