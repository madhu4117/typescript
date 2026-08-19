import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Grid,
  Box,
  Paper,
  Chip,
} from "@mui/material";

import type { Sale } from "../services/saleService";


interface SaleDetailProps {

  open: boolean;

  onClose: () => void;

  sale: Sale | null;
}


export default function SaleDetail({
  open,
  onClose,
  sale,
}: SaleDetailProps) {

  if (!sale) {
    return null;
  }


  const status =
    sale.status || "Completed";


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >

      <DialogTitle
        sx={{
          fontWeight: 700,
        }}
      >
        Sale Details
      </DialogTitle>


      <DialogContent>

        {/* ===================================================
            SALE INFORMATION
        =================================================== */}

        <Grid
          container
          spacing={2}
          sx={{
            mt: 0.5,
          }}
        >

          <Grid
            item
            xs={12}
            sm={6}
          >

            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              Invoice Number
            </Typography>

            <Typography
              fontWeight={600}
            >
              {sale.invoiceNumber}
            </Typography>

          </Grid>


          <Grid
            item
            xs={12}
            sm={6}
          >

            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              Customer
            </Typography>

            <Typography
              fontWeight={600}
            >
              {sale.customerName}
            </Typography>

          </Grid>


          <Grid
            item
            xs={12}
            sm={6}
          >

            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              Sales Channel
            </Typography>

            <Typography>
              {sale.salesChannel || "-"}
            </Typography>

          </Grid>


          <Grid
            item
            xs={12}
            sm={6}
          >

            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              Payment Method
            </Typography>

            <Typography>
              {sale.paymentMethod || "-"}
            </Typography>

          </Grid>


          <Grid
            item
            xs={12}
            sm={6}
          >

            <Typography
              variant="subtitle2"
              color="text.secondary"
            >
              Sale Date
            </Typography>

            <Typography>
              {sale.saleDate
                ? new Date(
                    sale.saleDate
                  ).toLocaleString()
                : "-"}
            </Typography>

          </Grid>


          <Grid
            item
            xs={12}
            sm={6}
          >

            <Typography
              variant="subtitle2"
              color="text.secondary"
              mb={0.5}
            >
              Status
            </Typography>

            <Chip
              label={status}
              size="small"
              color={
                status.toLowerCase()
                  === "completed"
                  ? "success"
                  : "default"
              }
            />

          </Grid>

        </Grid>


        <Divider
          sx={{
            my: 3,
          }}
        />


        {/* ===================================================
            PRODUCTS
        =================================================== */}

        <Typography
          variant="h6"
          fontWeight={700}
          gutterBottom
        >
          Products
        </Typography>


        {sale.items?.length > 0 ? (

          sale.items.map(
            (item, index) => (

              <Paper
                key={
                  item.id
                  ?? `${item.productId}-${index}`
                }
                elevation={0}
                sx={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                }}
              >

                <Grid
                  container
                  spacing={2}
                >

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Product
                    </Typography>

                    <Typography
                      fontWeight={600}
                    >
                      {item.productName
                        || `Product #${item.productId}`}
                    </Typography>

                  </Grid>


                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Category
                    </Typography>

                    <Typography>
                      {item.categoryName
                        || `Category #${item.categoryId}`}
                    </Typography>

                  </Grid>


                  <Grid
                    item
                    xs={12}
                    sm={4}
                  >

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Quantity
                    </Typography>

                    <Typography>
                      {item.quantity}
                    </Typography>

                  </Grid>


                  <Grid
                    item
                    xs={12}
                    sm={4}
                  >

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Unit Price
                    </Typography>

                    <Typography>
                      ₹{" "}
                      {Number(
                        item.unitPrice || 0
                      ).toFixed(2)}
                    </Typography>

                  </Grid>


                  <Grid
                    item
                    xs={12}
                    sm={4}
                  >

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Item Total
                    </Typography>

                    <Typography
                      fontWeight={700}
                    >
                      ₹{" "}
                      {Number(
                        item.total || 0
                      ).toFixed(2)}
                    </Typography>

                  </Grid>


                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Item Discount
                    </Typography>

                    <Typography>
                      ₹{" "}
                      {Number(
                        item.discount || 0
                      ).toFixed(2)}
                    </Typography>

                  </Grid>


                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Item Tax
                    </Typography>

                    <Typography>
                      ₹{" "}
                      {Number(
                        item.tax || 0
                      ).toFixed(2)}
                    </Typography>

                  </Grid>

                </Grid>

              </Paper>
            )

          )

        ) : (

          <Typography
            color="text.secondary"
          >
            No products found.
          </Typography>

        )}


        {/* ===================================================
            BILLING
        =================================================== */}

        <Divider
          sx={{
            my: 3,
          }}
        />


        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
          }}
        >

          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
          >
            Billing Summary
          </Typography>


          <Box
            display="flex"
            justifyContent="space-between"
            mb={1}
          >

            <Typography>
              Discount
            </Typography>

            <Typography>
              ₹{" "}
              {Number(
                sale.discount || 0
              ).toFixed(2)}
            </Typography>

          </Box>


          <Box
            display="flex"
            justifyContent="space-between"
            mb={1}
          >

            <Typography>
              Tax
            </Typography>

            <Typography>
              ₹{" "}
              {Number(
                sale.tax || 0
              ).toFixed(2)}
            </Typography>

          </Box>


          <Divider
            sx={{
              my: 1.5,
            }}
          />


          <Box
            display="flex"
            justifyContent="space-between"
          >

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Total Amount
            </Typography>

            <Typography
              variant="h5"
              fontWeight={700}
              color="primary"
            >
              ₹{" "}
              {Number(
                sale.totalAmount || 0
              ).toFixed(2)}
            </Typography>

          </Box>

        </Paper>


        {/* ===================================================
            NOTES
        =================================================== */}

        {sale.notes && (

          <>

            <Divider
              sx={{
                my: 3,
              }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
              gutterBottom
            >
              Notes
            </Typography>

            <Box
              sx={{
                p: 2,
                border:
                  "1px solid #e5e7eb",
                borderRadius: 2,
              }}
            >

              <Typography>
                {sale.notes}
              </Typography>

            </Box>

          </>
        )}

      </DialogContent>


      <DialogActions
        sx={{
          p: 2,
        }}
      >

        <Button
          variant="contained"
          onClick={onClose}
        >
          Close
        </Button>

      </DialogActions>

    </Dialog>
  );
}