import {
  Grid,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

interface Props {
  summary: {
    totalProducts: number;
    totalInventory: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
}

const cards = (
  summary: Props["summary"]
) => [
  {
    title: "Total Products",
    value: summary.totalProducts,
    icon: <Inventory2OutlinedIcon fontSize="large" />,
  },
  {
    title: "Total Inventory",
    value: summary.totalInventory,
    icon: <WarehouseOutlinedIcon fontSize="large" />,
  },
  {
    title: "Low Stock",
    value: summary.lowStockProducts,
    icon: <WarningAmberOutlinedIcon fontSize="large" />,
  },
  {
    title: "Out of Stock",
    value: summary.outOfStockProducts,
    icon: <CancelOutlinedIcon fontSize="large" />,
  },
];

const InventoryCards = ({ summary }: Props) => {
  return (
    <Grid container spacing={3}>
      {cards(summary).map((card) => (
        <Grid
          key={card.title}
          size={{ xs: 12, sm: 6, md: 3 }}
        >
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              height: "100%",
            }}
          >
            <CardContent>
              <Typography color="text.secondary">
                {card.title}
              </Typography>

              <Typography
                variant="h4"
                fontWeight="bold"
                mt={1}
              >
                {card.value}
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  color: "primary.main",
                }}
              >
                {card.icon}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default InventoryCards;