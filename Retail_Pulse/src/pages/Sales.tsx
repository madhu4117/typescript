import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

import SaleForm from "../components/SaleForm";
import SaleDetail from "../components/SaleDetail";

import {
  getSales,
  getSale,
  deleteSale,
} from "../services/saleService";

import type {
  Sale,
} from "../services/saleService";

// ============================================================
// OPTIONS
// ============================================================
//
// IMPORTANT:
// These values match your actual API data.
// Example API response:
//
// salesChannel: "Online"
// paymentMethod: "Cash"
//

const channelOptions = [
  "Retail",
  "Online",
  "Marketplace",
];

const paymentOptions = [
  "Cash",
  "Card",
  "UPI",
  "Bank Transfer",
];

// ============================================================
// COMPONENT
// ============================================================

export default function Sales() {
  // ==========================================================
  // SALES
  // ==========================================================

  const [sales, setSales] =
    useState<Sale[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [search, setSearch] =
    useState("");

  const [channel, setChannel] =
    useState("");

  const [payment, setPayment] =
    useState("");

  // ==========================================================
  // FORM
  // ==========================================================

  const [openForm, setOpenForm] =
    useState(false);

  // ==========================================================
  // DETAIL
  // ==========================================================

  const [selectedSale, setSelectedSale] =
    useState<Sale | null>(null);

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [detailLoading, setDetailLoading] =
    useState(false);

  // ==========================================================
  // LOAD SALES
  // ==========================================================

  const loadSales = async () => {
    try {
      setLoading(true);

      const data =
        await getSales();

      console.log(
        "ALL SALES:",
        data
      );

      setSales(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load sales:",
        error
      );

      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadSales();
  }, []);

  // ==========================================================
  // OPEN NEW SALE
  // ==========================================================

  const handleNewSale = () => {
    setSelectedSale(null);

    setOpenForm(true);
  };

  // ==========================================================
  // VIEW SALE
  // ==========================================================

  const handleViewSale = async (
    saleId: number
  ) => {
    try {
      setDetailLoading(true);

      console.log(
        "Loading sale:",
        saleId
      );

      const data =
        await getSale(saleId);

      console.log(
        "SALE DETAILS:",
        data
      );

      setSelectedSale(data);

      setDetailOpen(true);
    } catch (error) {
      console.error(
        "Failed to load sale details:",
        error
      );

      alert(
        "Failed to load sale details"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const handleEditSale = (
    sale: Sale
  ) => {
    setSelectedSale(sale);

    setOpenForm(true);
  };

  // ==========================================================
  // FILTER SALES
  // ==========================================================

  const filteredSales =
    useMemo(() => {
      return sales.filter(
        (sale) => {
          const invoiceNumber =
            String(
              sale.invoiceNumber ||
                ""
            ).toLowerCase();

          const customerName =
            String(
              sale.customerName ||
                ""
            ).toLowerCase();

          const searchValue =
            search
              .trim()
              .toLowerCase();

          const matchSearch =
            !searchValue ||
            invoiceNumber.includes(
              searchValue
            ) ||
            customerName.includes(
              searchValue
            );

          const matchChannel =
            !channel ||
            sale.salesChannel ===
              channel;

          const matchPayment =
            !payment ||
            sale.paymentMethod ===
              payment;

          return (
            matchSearch &&
            matchChannel &&
            matchPayment
          );
        }
      );
    }, [
      sales,
      search,
      channel,
      payment,
    ]);

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalRevenue =
    filteredSales.reduce(
      (
        sum,
        sale
      ) =>
        sum +
        Number(
          sale.totalAmount || 0
        ),
      0
    );

  const totalOrders =
    filteredSales.length;

  const averageOrder =
    totalOrders === 0
      ? 0
      : totalRevenue /
        totalOrders;

  // ==========================================================
  // DELETE SALE
  // ==========================================================

  const handleDeleteSale = async (
    saleId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this sale?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSale(
        saleId
      );

      await loadSales();
    } catch (error) {
      console.error(
        "Failed to delete sale:",
        error
      );

      alert(
        "Failed to delete sale"
      );
    }
  };

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  const handleCloseForm = () => {
    setOpenForm(false);

    setSelectedSale(null);
  };

  // ==========================================================
  // SALE SAVED
  // ==========================================================

  const handleSaleSaved =
    async () => {
      await loadSales();
    };

  // ==========================================================
  // CLOSE DETAIL
  // ==========================================================

  const handleCloseDetail =
    () => {
      setDetailOpen(false);

      setSelectedSale(null);
    };

  // ==========================================================
  // STATUS COLOR
  // ==========================================================

  const getStatusColor = (
    status: string
  ) => {
    const value =
      String(
        status || ""
      ).toLowerCase();

    if (
      value === "completed" ||
      value === "complete"
    ) {
      return "success";
    }

    if (
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "error";
    }

    if (
      value === "pending"
    ) {
      return "warning";
    }

    return "default";
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Box
      sx={{
        width: "100%",
        p: 3,
        boxSizing: "border-box",
      }}
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700 }}
          >
            Sales
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Manage your sales
            and transactions
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            <AddIcon />
          }
          onClick={
            handleNewSale
          }
          sx={{
            textTransform:
              "none",
            borderRadius: 2,
          }}
        >
          New Sale
        </Button>
      </Stack>

      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        {/* TOTAL REVENUE */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Revenue
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mt: 1,
                }}
              >
                ₹{" "}
                {totalRevenue.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* TOTAL ORDERS */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Orders
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mt: 1,
                }}
              >
                {totalOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* AVERAGE ORDER */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Average Order
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mt: 1,
                }}
              >
                ₹{" "}
                {averageOrder.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* TOTAL SALES */}

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Card>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Sales
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mt: 1,
                }}
              >
                {
                  filteredSales.length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <Paper
        sx={{
          p: 2,
          mb: 3,
        }}
      >
        <Grid
          container
          spacing={2}
        >
          {/* SEARCH */}

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <TextField
              fullWidth
              label="Search"
              placeholder="Invoice or customer"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </Grid>

          {/* CHANNEL */}

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <TextField
              fullWidth
              select
              label="Sales Channel"
              value={channel}
              onChange={(e) =>
                setChannel(
                  e.target.value
                )
              }
            >
              <MenuItem value="">
                All
              </MenuItem>

              {channelOptions.map(
                (item) => (
                  <MenuItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>

          {/* PAYMENT */}

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <TextField
              fullWidth
              select
              label="Payment Method"
              value={payment}
              onChange={(e) =>
                setPayment(
                  e.target.value
                )
              }
            >
              <MenuItem value="">
                All
              </MenuItem>

              {paymentOptions.map(
                (item) => (
                  <MenuItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* ====================================================
          SALES TABLE
      ==================================================== */}

      <Paper
        sx={{
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 6,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              overflowX:
                "auto",
            }}
          >
            <Table>
              {/* TABLE HEADER */}

              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>
                      Invoice
                    </strong>
                  </TableCell>

                  <TableCell>
                    <strong>
                      Customer
                    </strong>
                  </TableCell>

                  <TableCell>
                    <strong>
                      Date
                    </strong>
                  </TableCell>

                  <TableCell>
                    <strong>
                      Channel
                    </strong>
                  </TableCell>

                  <TableCell>
                    <strong>
                      Payment
                    </strong>
                  </TableCell>

                  <TableCell>
                    <strong>
                      Total
                    </strong>
                  </TableCell>

                  <TableCell>
                    <strong>
                      Status
                    </strong>
                  </TableCell>

                  <TableCell align="center">
                    <strong>
                      Actions
                    </strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              {/* TABLE BODY */}

              <TableBody>
                {filteredSales.map(
                  (sale) => (
                    <TableRow
                      key={
                        sale.id
                      }
                      hover
                    >
                      {/* INVOICE */}

                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          {
                            sale.invoiceNumber
                          }
                        </Typography>
                      </TableCell>

                      {/* CUSTOMER */}

                      <TableCell>
                        {
                          sale.customerName ||
                          "-"
                        }
                      </TableCell>

                      {/* DATE */}

                      <TableCell>
                        {sale.saleDate
                          ? new Date(
                              sale.saleDate
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>

                      {/* CHANNEL */}

                      <TableCell>
                        {
                          sale.salesChannel ||
                          "-"
                        }
                      </TableCell>

                      {/* PAYMENT */}

                      <TableCell>
                        {
                          sale.paymentMethod ||
                          "-"
                        }
                      </TableCell>

                      {/* TOTAL */}

                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 600,
                          }}
                        >
                          ₹{" "}
                          {Number(
                            sale.totalAmount ||
                              0
                          ).toLocaleString(
                            "en-IN",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </Typography>
                      </TableCell>

                      {/* STATUS */}

                      <TableCell>
                        <Chip
                          label={
                            sale.status ||
                            "Completed"
                          }
                          color={
                            getStatusColor(
                              sale.status
                            ) as
                              | "success"
                              | "error"
                              | "warning"
                              | "default"
                          }
                          size="small"
                        />
                      </TableCell>

                      {/* ACTIONS */}

                      <TableCell align="center">
                        {/* VIEW */}

                        <IconButton
                          color="primary"
                          disabled={
                            detailLoading
                          }
                          onClick={() =>
                            handleViewSale(
                              sale.id
                            )
                          }
                        >
                          <VisibilityIcon />
                        </IconButton>

                        {/* EDIT */}

                        <IconButton
                          color="warning"
                          onClick={() =>
                            handleEditSale(
                              sale
                            )
                          }
                        >
                          <EditIcon />
                        </IconButton>

                        {/* DELETE */}

                        <IconButton
                          color="error"
                          onClick={() =>
                            handleDeleteSale(
                              sale.id
                            )
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                )}

                {/* EMPTY */}

                {filteredSales.length ===
                  0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                    >
                      <Box
                        sx={{
                          py: 6,
                        }}
                      >
                        <Typography
                          color="text.secondary"
                        >
                          No Sales Found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ====================================================
          SALE FORM
      ==================================================== */}

      <SaleForm
        open={openForm}
        sale={selectedSale}
        onSaved={
          handleSaleSaved
        }
        onClose={
          handleCloseForm
        }
      />

      {/* ====================================================
          SALE DETAIL
      ==================================================== */}

      <SaleDetail
        open={detailOpen}
        sale={selectedSale}
        onClose={
          handleCloseDetail
        }
      />
    </Box>
  );
}