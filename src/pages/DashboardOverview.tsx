import KPICards from "@/components/dashboard/KPICards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import TransactionsTable from "@/components/dashboard/TransactionsTable";

const DashboardOverview = () => (
  <>
    <KPICards />
    <DashboardCharts />
    <TransactionsTable />
  </>
);

export default DashboardOverview;
