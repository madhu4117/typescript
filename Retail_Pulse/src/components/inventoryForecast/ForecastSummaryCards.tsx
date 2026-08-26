import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
} from "@mui/material";

interface Props {
  summary: {
    totalProducts: number;
    productsRequiringReorder: number;
    productsAtStockoutRisk: number;
    overstockedProducts: number;
    healthyProducts: number;
  };
  loading?: boolean;
}

const ForecastSummaryCards = ({
  summary,
  loading = false,
}: Props) => {
  const cards = [
    {
      title: "Total Products",
      value: summary.totalProducts,
    },
    {
      title: "Reorder Required",
      value: summary.productsRequiringReorder,
    },
    {
      title: "Stockout Risk",
      value: summary.productsAtStockoutRisk,
    },
    {
      title: "Overstocked",
      value: summary.overstockedProducts,
    },
    {
      title: "Healthy",
      value: summary.healthyProducts,
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={card.title}>
          <Card
            elevation={2}
            sx={{
              height: "100%",
              borderRadius: 3,
              border: "1px solid #e2e8f0",
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {card.title}
              </Typography>

              <Box
                sx={{
                  mt: 1,
                  minHeight: 42,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <CircularProgress size={25} />
                ) : (
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "#1e293b" }}
                  >
                    {card.value}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ForecastSummaryCards;