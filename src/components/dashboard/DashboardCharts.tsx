import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useTelemetriaConsolidada } from "@/hooks/use-schema-data";
import { useLotesSaida } from "@/hooks/use-schema-data";
import { Skeleton } from "@/components/ui/skeleton";

const PIE_COLORS = [
  "hsl(210 90% 50%)",
  "hsl(145 63% 42%)",
  "hsl(38 92% 50%)",
  "hsl(210 100% 30%)",
  "hsl(0 72% 51%)",
  "hsl(210 10% 70%)",
];

const stateToRegion: Record<string, string> = {
  SP: "Sudeste", RJ: "Sudeste", MG: "Sudeste", ES: "Sudeste",
  RS: "Sul", SC: "Sul", PR: "Sul",
  BA: "Nordeste", PE: "Nordeste", CE: "Nordeste", MA: "Nordeste", PI: "Nordeste",
  RN: "Nordeste", PB: "Nordeste", AL: "Nordeste", SE: "Nordeste",
  GO: "Centro-Oeste", MT: "Centro-Oeste", MS: "Centro-Oeste", DF: "Centro-Oeste",
  AM: "Norte", PA: "Norte", AC: "Norte", RO: "Norte", RR: "Norte", AP: "Norte", TO: "Norte",
};

const DashboardCharts = () => {
  const { data: telemetria, isLoading: loadingTel } = useTelemetriaConsolidada();
  const { data: saidas, isLoading: loadingSaidas } = useLotesSaida();

  // Aggregate by region from latest month
  const latestDate = telemetria?.[0]?.data_referencia;
  const latestMonth = telemetria?.filter((t: any) => t.data_referencia === latestDate) ?? [];

  const regionAgg: Record<string, number> = {};
  latestMonth.forEach((t: any) => {
    const region = stateToRegion[t.estado_ibge] || "Outros";
    regionAgg[region] = (regionAgg[region] || 0) + Number(t.volume_total_reciclado_ton || 0);
  });
  const regionData = Object.entries(regionAgg)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // Aggregate materials from cooperativa saidas
  const materialAgg: Record<string, number> = {};
  saidas?.forEach((s: any) => {
    const mat = s.tipo_material || "Outros";
    materialAgg[mat] = (materialAgg[mat] || 0) + Number(s.peso_liquido_kg || 0);
  });
  const totalMaterial = Object.values(materialAgg).reduce((a, b) => a + b, 0);
  const materialData = Object.entries(materialAgg)
    .map(([name, value]) => ({ name, value: totalMaterial > 0 ? Math.round((value / totalMaterial) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);

  const isLoading = loadingTel || loadingSaidas;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <div className="bg-card rounded-lg p-5 shadow-card border border-border">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-[260px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Bar chart */}
      <div className="bg-card rounded-lg p-5 shadow-card border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-4">Volume Reciclado por Região (t)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={regionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 20% 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(210 10% 50%)" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(210 10% 50%)" }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(210 20% 90%)", fontSize: 13 }} />
            <Bar dataKey="value" fill="hsl(210 90% 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div className="bg-card rounded-lg p-5 shadow-card border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-4">Tipos de Materiais Reciclados (%)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={materialData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, value }) => `${name} ${value}%`}
              labelLine={false}
            >
              {materialData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
