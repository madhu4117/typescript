
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
  Alert,
  Typography,
  Divider,
  Box,
} from "@mui/material";

import { createSale } from "../services/saleService";

// ============================================================
// TYPES
// ============================================================

interface SaleItem {
  productId: number;
  categoryId: number;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total?: number;
}

interface Sale {
  id: number;
  customerId: number;
  customerName: string;
  salesChannel: string;
  paymentMethod: string;
  totalAmount: number;
  items?: SaleItem[];
}

interface SaleFormProps {
  open: boolean;
  onClose: () => void;
  sale?: Sale | null;
}

// ============================================================
// OPTIONS
// ============================================================

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

// ============================================================
// COMPONENT
// ============================================================

export default function SaleForm({
  open,
  onClose,
  sale,
}: SaleFormProps) {

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [customerId, setCustomerId] =
    useState("");

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

  const [salesChannel, setSalesChannel] =
    useState("Retail Store");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {

    setCustomerId("");

    setProductId("");

    setCategoryId("");

    setQuantity(1);

    setUnitPrice(0);

    setDiscount(0);

    setTax(0);

    setSalesChannel("Retail Store");

    setPaymentMethod("Cash");

    setError("");
  };

  // ==========================================================
  // LOAD SALE / RESET
  // ==========================================================

  useEffect(() => {

    if (!open) {
      return;
    }

    setError("");

    if (sale) {

      setCustomerId(
        sale.customerId
          ? String(sale.customerId)
          : ""
      );

      setSalesChannel(
        sale.salesChannel ||
        "Retail Store"
      );

      setPaymentMethod(
        sale.paymentMethod ||
        "Cash"
      );

      if (
        sale.items &&
        sale.items.length > 0
      ) {

        const item =
          sale.items[0];

        setProductId(
          item.productId
            ? String(item.productId)
            : ""
        );

        setCategoryId(
          item.categoryId
            ? String(item.categoryId)
            : ""
        );

        setQuantity(
          Number(item.quantity || 1)
        );

        setUnitPrice(
          Number(item.unitPrice || 0)
        );

        setDiscount(
          Number(item.discount || 0)
        );

        setTax(
          Number(item.tax || 0)
        );

      }

    } else {

      resetForm();

    }

  }, [open, sale]);

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = (): boolean => {

    if (!customerId.trim()) {

      setError(
        "Customer ID is required"
      );

      return false;
    }

    if (
      !Number.isInteger(
        Number(customerId)
      ) ||
      Number(customerId) <= 0
    ) {

      setError(
        "Customer ID must be a valid number"
      );

      return false;
    }

    if (!productId.trim()) {

      setError(
        "Product ID is required"
      );

      return false;
    }

    if (
      !Number.isInteger(
        Number(productId)
      ) ||
      Number(productId) <= 0
    ) {

      setError(
        "Product ID must be a valid number"
      );

      return false;
    }

    if (!categoryId.trim()) {

      setError(
        "Category ID is required"
      );

      return false;
    }

    if (
      !Number.isInteger(
        Number(categoryId)
      ) ||
      Number(categoryId) <= 0
    ) {

      setError(
        "Category ID must be a valid number"
      );

      return false;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {

      setError(
        "Quantity must be greater than zero"
      );

      return false;
    }

    if (unitPrice < 0) {

      setError(
        "Unit price cannot be negative"
      );

      return false;
    }

    if (discount < 0) {

      setError(
        "Discount cannot be negative"
      );

      return false;
    }

    if (tax < 0) {

      setError(
        "Tax cannot be negative"
      );

      return false;
    }

    const subtotal =
      unitPrice * quantity;

    if (discount > subtotal) {

      setError(
        "Discount cannot exceed subtotal"
      );

      return false;
    }

    return true;
  };

  // ==========================================================
  // CREATE SALE
  // ==========================================================

  const handleSubmit = async () => {

    setError("");

    if (!validateForm()) {
      return;
    }

    try {

      setSaving(true);

      // ======================================================
      // EXACT BACKEND SaleCreate FORMAT
      // ======================================================

      const payload = {

        customerId:
          Number(customerId),

        salesChannel:
          salesChannel,

        paymentMethod:
          paymentMethod,

        items: [
          {
            productId:
              Number(productId),

            categoryId:
              Number(categoryId),

            quantity:
              Number(quantity),

            unitPrice:
              Number(unitPrice),

            discount:
              Number(discount),

            tax:
              Number(tax),
          },
        ],
      };

      console.log(
        "CREATE SALE PAYLOAD:",
        payload
      );

      await createSale(payload);

      resetForm();

      onClose();

    } catch (err: any) {

      console.error(
        "Create sale failed:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      if (Array.isArray(detail)) {

        setError(
          detail
            .map(
              (item: any) =>
                item?.msg || "Validation error"
            )
            .join(", ")
        );

      } else {

        setError(
          detail ||
          "Failed to create sale"
        );
      }

    } finally {

      setSaving(false);

    }
  };

  // ==========================================================
  // CALCULATIONS
  // ==========================================================

  const subtotal =
    unitPrice * quantity;

  const total =
    subtotal -
    discount +
    tax;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <Dialog
      open={open}
      onClose={
        saving
          ? undefined
          : onClose
      }
      maxWidth="md"
      fullWidth
    >

      {/* =====================================================
          TITLE
      ===================================================== */}

      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.4rem",
        }}
      >
        {sale
          ? "Sale Details"
          : "Create New Sale"}
      </DialogTitle>

      <DialogContent>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <Alert
            severity="error"
            sx={{
              mt: 1,
              mb: 2,
              borderRadius: 2,
            }}
            onClose={() =>
              setError("")
            }
          >
            {error}
          </Alert>

        )}

        <Grid
          container
          spacing={2}
          sx={{
            mt: 0.5,
          }}
        >

          {/* =================================================
              CUSTOMER ID
          ================================================= */}

          <Grid item xs={12}>

            <TextField
              fullWidth
              required
              type="number"
              label="Customer ID"
              value={customerId}
              onChange={(e) =>
                setCustomerId(
                  e.target.value
                )
              }
              helperText="Enter the ID of an existing customer"
              disabled={
                Boolean(sale) ||
                saving
              }
              inputProps={{
                min: 1,
              }}
            />

          </Grid>

          {/* =================================================
              PRODUCT ID
          ================================================= */}

          <Grid item xs={6}>

            <TextField
              fullWidth
              required
              type="number"
              label="Product ID"
              value={productId}
              onChange={(e) =>
                setProductId(
                  e.target.value
                )
              }
              disabled={
                Boolean(sale) ||
                saving
              }
              inputProps={{
                min: 1,
              }}
            />

          </Grid>

          {/* =================================================
              CATEGORY ID
          ================================================= */}

          <Grid item xs={6}>

            <TextField
              fullWidth
              required
              type="number"
              label="Category ID"
              value={categoryId}
              onChange={(e) =>
                setCategoryId(
                  e.target.value
                )
              }
              disabled={
                Boolean(sale) ||
                saving
              }
              inputProps={{
                min: 1,
              }}
            />

          </Grid>

          {/* =================================================
              QUANTITY
          ================================================= */}

          <Grid item xs={4}>

            <TextField
              fullWidth
              required
              type="number"
              label="Quantity"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Number(
                    e.target.value
                  )
                )
              }
              disabled={
                Boolean(sale) ||
                saving
              }
              inputProps={{
                min: 1,
              }}
            />

          </Grid>

          {/* =================================================
              UNIT PRICE
          ================================================= */}

          <Grid item xs={4}>

            <TextField
              fullWidth
              required
              type="number"
              label="Unit Price"
              value={unitPrice}
              onChange={(e) =>
                setUnitPrice(
                  Number(
                    e.target.value
                  )
                )
              }
              disabled={
                Boolean(sale) ||
                saving
              }
              inputProps={{
                min: 0,
                step: 0.01,
              }}
            />

          </Grid>

          {/* =================================================
              DISCOUNT
          ================================================= */}

          <Grid item xs={4}>

            <TextField
              fullWidth
              type="number"
              label="Discount"
              value={discount}
              onChange={(e) =>
                setDiscount(
                  Number(
                    e.target.value
                  )
                )
              }
              disabled={
                Boolean(sale) ||
                saving
              }
              inputProps={{
                min: 0,
                step: 0.01,
              }}
            />

          </Grid>

          {/* =================================================
              TAX
          ================================================= */}

          <Grid item xs={6}>

            <TextField
              fullWidth
              type="number"
              label="Tax"
              value={tax}
              onChange={(e) =>
                setTax(
                  Number(
                    e.target.value
                  )
                )
              }
              disabled={
                Boolean(sale) ||
                saving
              }
              inputProps={{
                min: 0,
                step: 0.01,
              }}
            />

          </Grid>

          {/* =================================================
              SALES CHANNEL
          ================================================= */}

          <Grid item xs={6}>

            <TextField
              fullWidth
              required
              select
              label="Sales Channel"
              value={salesChannel}
              onChange={(e) =>
                setSalesChannel(
                  e.target.value
                )
              }
              disabled={saving}
            >

              {channelOptions.map(
                (option) => (

                  <MenuItem
                    key={option}
                    value={option}
                  >
                    {option}
                  </MenuItem>

                )
              )}

            </TextField>

          </Grid>

          {/* =================================================
              PAYMENT METHOD
          ================================================= */}

          <Grid item xs={12}>

            <TextField
              fullWidth
              required
              select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
              disabled={saving}
            >

              {paymentOptions.map(
                (option) => (

                  <MenuItem
                    key={option}
                    value={option}
                  >
                    {option}
                  </MenuItem>

                )
              )}

            </TextField>

          </Grid>

          {/* =================================================
              TOTAL
          ================================================= */}

          <Grid item xs={12}>

            <Divider
              sx={{
                my: 1,
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                p: 2,
                borderRadius: 2,
                backgroundColor:
                  "#f8fafc",
              }}
            >

              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                }}
              >
                Total Amount
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "#6366f1",
                }}
              >
                ₹ {total.toFixed(2)}
              </Typography>

            </Box>

          </Grid>

        </Grid>

      </DialogContent>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <DialogActions
        sx={{
          p: 2,
          gap: 1,
        }}
      >

        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            textTransform: "none",
          }}
        >
          Cancel
        </Button>

        {!sale && (

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              px: 3,
            }}
          >
            {saving
              ? "Creating..."
              : "Create Sale"}
          </Button>

        )}

      </DialogActions>

    </Dialog>
  );
}

