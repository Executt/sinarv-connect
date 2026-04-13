import KPICards from "@/components/dashboard/KPICards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import TransactionsTable from "@/components/dashboard/TransactionsTable";
import PlanaresMetrics from "@/components/dashboard/PlanaresMetrics";

const DashboardOverview = () => (
  <>
    <KPICards />
    <DashboardCharts />
    <PlanaresMetrics />
    <TransactionsTable />
  </>
);

export default DashboardOverview;
