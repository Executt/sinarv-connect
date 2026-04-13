import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCooperativas } from "@/hooks/use-schema-data";
import { useCatadoresAssociados, useLicencasCooperativa } from "@/hooks/use-cooperativa-data";
import { Filter, Users, FileCheck, AlertTriangle, Building2 } from "lucide-react";

const CooperativaCadastro = () => {
  const [selectedCoop, setSelectedCoop] = useState<string>("all");
  const { data: cooperativas, isLoading: loadCoop } = useCooperativas();
  const { data: catadores, isLoading: loadCat } = useCatadoresAssociados(
    selectedCoop === "all" ? undefined : selectedCoop
  );
  const { data: licencas, isLoading: loadLic } = useLicencasCooperativa(
    selectedCoop === "all" ? undefined : selectedCoop
  );

  const isLoading = loadCoop || loadCat || loadLic;

  const licencasVencendo = licencas?.filter((l: any) => {
    const validade = new Date(l.data_validade);
    const dias = Math.ceil((validade.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias <= 30 && dias > 0;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedCoop} onValueChange={setSelectedCoop}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Filtrar por cooperativa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cooperativas</SelectItem>
            {cooperativas?.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alertas de licenças */}
      {licencasVencendo && licencasVencendo.length > 0 && (
        <Card className="border-l-4 border-l-destructive shadow-card">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="font-semibold text-destructive">Licenças próximas do vencimento</p>
            </div>
            {licencasVencendo.map((l: any) => (
              <p key={l.id} className="text-sm text-muted-foreground ml-7">
                {l.tipo} — Nº {l.numero} vence em{" "}
                {new Date(l.data_validade).toLocaleDateString("pt-BR")}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-primary opacity-40" />
            <div>
              <p className="text-xs text-muted-foreground">Cooperativas</p>
              <p className="text-2xl font-bold">{cooperativas?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary opacity-40" />
            <div>
              <p className="text-xs text-muted-foreground">Catadores Associados</p>
              <p className="text-2xl font-bold">{catadores?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <FileCheck className="h-8 w-8 text-primary opacity-40" />
            <div>
              <p className="text-xs text-muted-foreground">Licenças Ativas</p>
              <p className="text-2xl font-bold">
                {licencas?.filter((l: any) => l.status === "Válida").length ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catadores">
        <TabsList>
          <TabsTrigger value="catadores">Quadro Social</TabsTrigger>
          <TabsTrigger value="licencas">Licenças e Conformidade</TabsTrigger>
        </TabsList>

        <TabsContent value="catadores" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Catadores Associados</CardTitle>
              <CardDescription>Pessoas físicas vinculadas para repasse de remuneração</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF (hash)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Associação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catadores?.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.cpf_hash?.substring(0, 12)}…
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.status === "Ativo" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.data_associacao).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!catadores || catadores.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum catador encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licencas" className="mt-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Licenças e Documentos</CardTitle>
              <CardDescription>Conformidade legal da cooperativa</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licencas?.map((l: any) => {
                    const dias = Math.ceil(
                      (new Date(l.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.tipo}</TableCell>
                        <TableCell className="font-mono text-xs">{l.numero}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(l.data_emissao).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(l.data_validade).toLocaleDateString("pt-BR")}
                          {dias <= 30 && dias > 0 && (
                            <span className="ml-2 text-xs text-destructive font-medium">
                              ({dias}d)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={l.status === "Válida" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {l.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!licencas || licencas.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma licença encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CooperativaCadastro;
