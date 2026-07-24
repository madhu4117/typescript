import { Grid } from "@mui/material";
import InventoryCards from "./InventoryCards";
import InventoryCharts from "./InventoryCharts";


interface Props {
  summary: {
    totalProducts: number;
    totalInventory: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
}

const InventoryDashboard = ({ summary }: Props) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12 }}>
        <InventoryCards summary={summary} />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <InventoryCharts summary={summary} />
      </Grid>
    </Grid>
  );
};

export default InventoryDashboard;