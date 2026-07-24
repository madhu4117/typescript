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
} from "@mui/material";

interface SaleDetailProps {
  open: boolean;
  onClose: () => void;
  sale: any;
}

export default function SaleDetail({
  open,
  onClose,
  sale,
}: SaleDetailProps) {

  if (!sale) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Sale Details
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} mt={1}>

          <Grid item xs={6}>
            <Typography variant="subtitle2">
              Invoice Number
            </Typography>

            <Typography>
              {sale.invoiceNumber}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">
              Customer
            </Typography>

            <Typography>
              {sale.customerName}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">
              Sales Channel
            </Typography>

            <Typography>
              {sale.salesChannel}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">
              Payment Method
            </Typography>

            <Typography>
              {sale.paymentMethod}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">
              Sale Date
            </Typography>

            <Typography>
              {sale.saleDate}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2">
              Total Amount
            </Typography>

            <Typography fontWeight="bold">
              ₹ {sale.totalAmount}
            </Typography>
          </Grid>

        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="h6"
          gutterBottom
        >
          Products
        </Typography>

        {sale.items?.map((item: any) => (

          <Box
            key={item.id}
            sx={{
              border: "1px solid #ddd",
              borderRadius: 2,
              p: 2,
              mb: 2,
            }}
          >

            <Typography>
              <strong>Product :</strong>{" "}
              {item.productName}
            </Typography>

            <Typography>
              <strong>Category :</strong>{" "}
              {item.categoryName}
            </Typography>

            <Typography>
              <strong>Quantity :</strong>{" "}
              {item.quantity}
            </Typography>

            <Typography>
              <strong>Unit Price :</strong> ₹
              {item.unitPrice}
            </Typography>

            <Typography>
              <strong>Discount :</strong> ₹
              {item.discount}
            </Typography>

            <Typography>
              <strong>Tax :</strong> ₹
              {item.tax}
            </Typography>

            <Typography
              fontWeight="bold"
            >
              Total : ₹ {item.total}
            </Typography>

          </Box>

        ))}

      </DialogContent>

      <DialogActions>

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