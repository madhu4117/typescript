import {
  Grid,
  TextField,
  MenuItem,
  Paper,
} from "@mui/material";

interface Props {
  salesChannel: string;
  paymentMethod: string;
  onSalesChannelChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
}

const channels = [
  "All",
  "Retail Store",
  "Online Store",
  "Marketplace",
];

const payments = [
  "All",
  "Cash",
  "Card",
  "UPI",
  "Bank Transfer",
];

export default function DashboardFilters({
  salesChannel,
  paymentMethod,
  onSalesChannelChange,
  onPaymentMethodChange,
}: Props) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label="Sales Channel"
            value={salesChannel}
            onChange={(e) =>
              onSalesChannelChange(e.target.value)
            }
          >
            {channels.map((item) => (
              <MenuItem
                key={item}
                value={item}
              >
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) =>
              onPaymentMethodChange(e.target.value)
            }
          >
            {payments.map((item) => (
              <MenuItem
                key={item}
                value={item}
              >
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

      </Grid>
    </Paper>
  );
}