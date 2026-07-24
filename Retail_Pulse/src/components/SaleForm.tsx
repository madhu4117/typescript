import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";

import {
  createSale,
  updateSale,
} from "../services/saleService";

interface SaleFormProps {
  open: boolean;
  onClose: () => void;
  sale?: any;
}

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

export default function SaleForm({
  open,
  onClose,
  sale,
}: SaleFormProps) {

  const [customerName, setCustomerName] =
    useState("");

  const [salesChannel, setSalesChannel] =
    useState("Retail Store");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [productId, setProductId] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [unitPrice, setUnitPrice] =
    useState(0);

  const [discount, setDiscount] =
    useState(0);

  const [tax, setTax] =
    useState(0);

  useEffect(() => {

    if (sale) {

      setCustomerName(sale.customerName);

      setSalesChannel(sale.salesChannel);

      setPaymentMethod(sale.paymentMethod);

    } else {

      setCustomerName("");

      setSalesChannel("Retail Store");

      setPaymentMethod("Cash");

      setProductId("");

      setCategoryId("");

      setQuantity(1);

      setUnitPrice(0);

      setDiscount(0);

      setTax(0);

    }

  }, [sale]);

    const handleSubmit = async () => {

    const payload = {

      customerName,

      salesChannel,

      paymentMethod,

      items: [
        {
          productId: Number(productId),
          categoryId: Number(categoryId),
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          discount: Number(discount),
          tax: Number(tax),
        },
      ],
    };

    if (sale) {

      await updateSale(sale.id, payload);

    } else {

      await createSale(payload);

    }

    onClose();

  };

  return (

    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >

      <DialogTitle>

        {sale ? "Edit Sale" : "New Sale"}

      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} mt={1}>

          <Grid item xs={12}>

            <TextField
              fullWidth
              label="Customer Name"
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
            />

          </Grid>

          <Grid item xs={6}>

            <TextField
              fullWidth
              label="Product ID"
              value={productId}
              onChange={(e) =>
                setProductId(e.target.value)
              }
            />

          </Grid>

          <Grid item xs={6}>

            <TextField
              fullWidth
              label="Category ID"
              value={categoryId}
              onChange={(e) =>
                setCategoryId(e.target.value)
              }
            />

          </Grid>

          <Grid item xs={4}>

            <TextField
              fullWidth
              type="number"
              label="Quantity"
              value={quantity}
              onChange={(e) =>
                setQuantity(Number(e.target.value))
              }
            />

          </Grid>

          <Grid item xs={4}>

            <TextField
              fullWidth
              type="number"
              label="Unit Price"
              value={unitPrice}
              onChange={(e) =>
                setUnitPrice(Number(e.target.value))
              }
            />

          </Grid>

          <Grid item xs={4}>

            <TextField
              fullWidth
              type="number"
              label="Discount"
              value={discount}
              onChange={(e) =>
                setDiscount(Number(e.target.value))
              }
            />

          </Grid>

            <Grid item xs={6}>

            <TextField
              fullWidth
              type="number"
              label="Tax"
              value={tax}
              onChange={(e) =>
                setTax(Number(e.target.value))
              }
            />

          </Grid>

          <Grid item xs={6}>

            <TextField
              fullWidth
              select
              label="Sales Channel"
              value={salesChannel}
              onChange={(e) =>
                setSalesChannel(e.target.value)
              }
            >
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

          <Grid item xs={12}>

            <TextField
              fullWidth
              select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
            >
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

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          Save
        </Button>

      </DialogActions>

    </Dialog>

  );

}