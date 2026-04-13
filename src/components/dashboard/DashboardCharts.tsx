import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const regionData = [
  { name: "Sudeste", value: 14200 },
  { name: "Sul", value: 8900 },
  { name: "Nordeste", value: 7300 },
  { name: "Centro-Oeste", value: 4800 },
  { name: "Norte", value: 3720 },
];

const materialData = [
  { name: "Plástico", value: 35 },
  { name: "Metal", value: 28 },
  { name: "Papelão", value: 22 },
  { name: "Vidro", value: 10 },
  { name: "Outros", value: 5 },
];

const PIE_COLORS = [
  "hsl(210 90% 50%)",
  "hsl(145 63% 42%)",
  "hsl(38 92% 50%)",
  "hsl(210 100% 30%)",
  "hsl(210 10% 70%)",
];

const DashboardCharts = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Bar chart */}
      <div className="bg-card rounded-lg p-5 shadow-card border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-4">Volume Processado por Região (t)</h4>
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
            <Pie data={materialData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
              {materialData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i]} />
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
