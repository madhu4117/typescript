import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  CircularProgress,
  Stack,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Components
import SaleForm from "../components/SaleForm";
import SaleDetail from "../components/SaleDetail";

// Services
import {
  getSales,
  deleteSale,
} from "../services/saleService";

const channelOptions = [
  "Retail Store",
  "Online Store",
  "Marketplace",
];

const paymentOptions = [
  "Cash",
  "Card",
  "UPI",
  "Bank Transfer",
];

export default function Sales() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [channel, setChannel] = useState("");

  const [payment, setPayment] = useState("");

  const [openForm, setOpenForm] = useState(false);

  const [selectedSale, setSelectedSale] = useState<any>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  async function loadSales() {
    try {
      setLoading(true);

      const data = await getSales();

      setSales(data);

    } catch (err) {
      console.log(err);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {

      const matchSearch =
        sale.invoiceNumber
          .toLowerCase()
          .includes(search.toLowerCase()) ||

        sale.customerName
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchChannel =
        !channel || sale.salesChannel === channel;

      const matchPayment =
        !payment || sale.paymentMethod === payment;

      return (
        matchSearch &&
        matchChannel &&
        matchPayment
      );
    });

  }, [sales, search, channel, payment]);

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );

  const totalOrders = filteredSales.length;

  const averageOrder =
    totalOrders === 0
      ? 0
      : totalRevenue / totalOrders;

  return (
    <Box
  sx={{
    width: "100%",
    p: 3,
    boxSizing: "border-box",
  }}
>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">
          Sales
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          New Sale
        </Button>
      </Stack>

      <Grid container spacing={2} mb={3}>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2">
                Total Revenue
              </Typography>

              <Typography variant="h5">
                ₹ {totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>

              <Typography variant="body2">
                Total Orders
              </Typography>

              <Typography variant="h5">
                {totalOrders}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>

              <Typography variant="body2">
                Average Order
              </Typography>

              <Typography variant="h5">
                ₹ {averageOrder.toFixed(2)}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>

              <Typography variant="body2">
                Total Sales
              </Typography>

              <Typography variant="h5">
                {filteredSales.length}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>

        <Grid container spacing={2}>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Sales Channel"
              value={channel}
              onChange={(e) =>
                setChannel(e.target.value)
              }
            >
              <MenuItem value="">
                All
              </MenuItem>

              {channelOptions.map((item) => (
                <MenuItem
                  key={item}
                  value={item}
                >
                  {item}
                </MenuItem>
              ))}

            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Payment"
              value={payment}
              onChange={(e) =>
                setPayment(e.target.value)
              }
            >
              <MenuItem value="">
                All
              </MenuItem>

              {paymentOptions.map((item) => (
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
            <Paper>

        {loading ? (

          <Box
            display="flex"
            justifyContent="center"
            p={5}
          >
            <CircularProgress />
          </Box>

        ) : (

          <Table>

            <TableHead>

              <TableRow>

                <TableCell>Invoice</TableCell>

                <TableCell>Customer</TableCell>

                <TableCell>Channel</TableCell>

                <TableCell>Payment</TableCell>

                <TableCell>Total</TableCell>

                <TableCell>Status</TableCell>

                <TableCell align="center">
                  Actions
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {filteredSales.map((sale) => (

                <TableRow key={sale.id} hover>

                  <TableCell>
                    {sale.invoiceNumber}
                  </TableCell>

                  <TableCell>
                    {sale.customerName}
                  </TableCell>

                  <TableCell>
                    {sale.salesChannel}
                  </TableCell>

                  <TableCell>
                    {sale.paymentMethod}
                  </TableCell>

                  <TableCell>
                    ₹ {sale.totalAmount}
                  </TableCell>

                  <TableCell>

                    <Chip
                      label="Completed"
                      color="success"
                      size="small"
                    />

                  </TableCell>

                  <TableCell align="center">

                    <IconButton
                      color="primary"
                      onClick={() => {
                        setSelectedSale(sale);
                        setDetailOpen(true);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>

                    <IconButton
                      color="warning"
                      onClick={() => {
                        setSelectedSale(sale);
                        setOpenForm(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      color="error"
                      onClick={async () => {

                        if (
                          window.confirm(
                            "Delete this sale?"
                          )
                        ) {

                          await deleteSale(sale.id);

                          loadSales();

                        }

                      }}
                    >
                      <DeleteIcon />
                    </IconButton>

                  </TableCell>

                </TableRow>

              ))}

              {filteredSales.length === 0 && (

                <TableRow>

                  <TableCell
                    colSpan={7}
                    align="center"
                  >

                    No Sales Found

                  </TableCell>

                </TableRow>

              )}

            </TableBody>

          </Table>

        )}

      </Paper>

      <SaleForm
        open={openForm}
        sale={selectedSale}
        onClose={() => {
          setOpenForm(false);
          setSelectedSale(null);
          loadSales();
        }}
      />

      <SaleDetail
        open={detailOpen}
        sale={selectedSale}
        onClose={() => {
          setDetailOpen(false);
          setSelectedSale(null);
        }}
      />

    </Box>

  );

}