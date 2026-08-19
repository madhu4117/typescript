import {
  useEffect,
  useState,
} from "react";

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
  Paper,
  CircularProgress,
} from "@mui/material";

import {
  createSale,
  updateSale,
} from "../services/saleService";

import type { Sale } from "../services/saleService";

import {
  getCustomers,
} from "../services/customerService";

import {
  getProducts,
} from "../services/productService";


interface SaleFormProps {

  open: boolean;

  onClose: () => void;

  sale?: Sale | null;

  onSaved?: () => void;
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
  onSaved,
}: SaleFormProps) {

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

  const [notes, setNotes] =
    useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<any>(null);

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [loadingData, setLoadingData] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isEditMode =
    Boolean(sale);


  // =========================================================
  // RESET
  // =========================================================

  const resetForm = () => {

    setCustomerId("");

    setProductId("");

    setCategoryId("");

    setQuantity(1);

    setUnitPrice(0);

    setDiscount(0);

    setTax(0);

    setSalesChannel(
      "Retail Store"
    );

    setPaymentMethod(
      "Cash"
    );

    setNotes("");

    setSelectedProduct(null);

    setError("");
  };


  // =========================================================
  // LOAD CUSTOMERS + PRODUCTS
  // =========================================================

  useEffect(() => {

    if (!open) {
      return;
    }

    const loadData = async () => {

      try {

        setLoadingData(true);

        setError("");

        const [
          customerData,
          productData,
        ] = await Promise.all([
          getCustomers(),
          getProducts(),
        ]);

        setCustomers(
          Array.isArray(customerData)
            ? customerData
            : []
        );

        setProducts(
          Array.isArray(productData)
            ? productData
            : []
        );

      } catch (err: any) {

        console.error(
          "SALE FORM LOAD ERROR:",
          err
        );

        const detail =
          err?.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Failed to load customers and products"
        );

      } finally {

        setLoadingData(false);
      }
    };

    loadData();

  }, [open]);


  // =========================================================
  // EDIT / RESET
  // =========================================================

  useEffect(() => {

    if (!open) {
      return;
    }

    if (!sale) {

      resetForm();

      return;
    }

    setError("");

    setCustomerId(
      String(
        sale.customerId || ""
      )
    );

    setSalesChannel(
      sale.salesChannel ||
      "Retail Store"
    );

    setPaymentMethod(
      sale.paymentMethod ||
      "Cash"
    );

    setDiscount(
      Number(
        sale.discount || 0
      )
    );

    setTax(
      Number(
        sale.tax || 0
      )
    );

    setNotes(
      sale.notes || ""
    );

    if (
      sale.items &&
      sale.items.length > 0
    ) {

      const item =
        sale.items[0];

      setProductId(
        String(
          item.productId || ""
        )
      );

      setCategoryId(
        String(
          item.categoryId || ""
        )
      );

      setQuantity(
        Number(
          item.quantity || 1
        )
      );

      setUnitPrice(
        Number(
          item.unitPrice || 0
        )
      );
    }

  }, [open, sale]);


  // =========================================================
  // PRODUCT SELECTION
  // =========================================================

  useEffect(() => {

    if (!productId) {

      setSelectedProduct(null);

      setCategoryId("");

      setUnitPrice(0);

      return;
    }

    const product =
      products.find(
        (item) =>
          Number(item.id)
          === Number(productId)
      );

    if (!product) {
      return;
    }

    setSelectedProduct(product);

    setCategoryId(
      String(
        product.categoryId || ""
      )
    );

    setUnitPrice(
      Number(
        product.unitPrice || 0
      )
    );

  }, [
    productId,
    products,
  ]);


  // =========================================================
  // STOCK
  // =========================================================

  const availableStock =
    Number(
      selectedProduct?.stockQuantity || 0
    );


  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = (): boolean => {

    if (!customerId) {

      setError(
        "Please select a customer"
      );

      return false;
    }

    if (
      !Number(customerId)
      || Number(customerId) <= 0
    ) {

      setError(
        "Invalid customer"
      );

      return false;
    }

    if (
      discount < 0
      || tax < 0
    ) {

      setError(
        "Discount and tax cannot be negative"
      );

      return false;
    }

    if (isEditMode) {
      return true;
    }

    if (!productId) {

      setError(
        "Please select a product"
      );

      return false;
    }

    if (!categoryId) {

      setError(
        "Selected product has no category"
      );

      return false;
    }

    if (
      !Number.isInteger(quantity)
      || quantity <= 0
    ) {

      setError(
        "Quantity must be greater than zero"
      );

      return false;
    }

    if (
      quantity > availableStock
    ) {

      setError(
        `Only ${availableStock} items available in stock`
      );

      return false;
    }

    return true;
  };


  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async () => {

    setError("");

    if (!validateForm()) {
      return;
    }

    try {

      setSaving(true);

      // =====================================================
      // UPDATE
      // =====================================================

      if (
        isEditMode
        && sale
      ) {

        await updateSale(
          sale.id,
          {
            customerId:
              Number(customerId),

            salesChannel,

            paymentMethod,

            discount:
              Number(discount),

            tax:
              Number(tax),

            notes:
              notes.trim()
              || null,
          }
        );

      }

      // =====================================================
      // CREATE
      // =====================================================

      else {

        const payload = {

          customerId:
            Number(customerId),

          salesChannel,

          paymentMethod,

          discount:
            Number(discount),

          tax:
            Number(tax),

          notes:
            notes.trim()
            || null,

          items: [
            {
              productId:
                Number(productId),

              categoryId:
                Number(categoryId),

              quantity:
                Number(quantity),

              // Backend ignores this and
              // uses database price.
              unitPrice:
                Number(unitPrice),

              discount: 0,

              tax: 0,
            },
          ],
        };

        console.log(
          "CREATE SALE PAYLOAD:",
          payload
        );

        await createSale(
          payload
        );
      }

      resetForm();

      if (onSaved) {
        onSaved();
      }

      onClose();

    } catch (err: any) {

      console.error(
        "SALE SAVE ERROR:",
        err
      );

      const detail =
        err?.response?.data?.detail;

      if (
        Array.isArray(detail)
      ) {

        setError(
          detail
            .map(
              (item: any) =>
                item?.msg
                || "Validation error"
            )
            .join(", ")
        );

      } else {

        setError(
          detail
          || "Failed to save sale"
        );
      }

    } finally {

      setSaving(false);
    }
  };


  // =========================================================
  // CALCULATION
  // =========================================================

  const subtotal =
    unitPrice * quantity;

  const grandTotal =
    subtotal
    - discount
    + tax;


  // =========================================================
  // RENDER
  // =========================================================

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

      <DialogTitle
        sx={{
          fontWeight: 700,
        }}
      >
        {isEditMode
          ? "Edit Sale"
          : "Create New Sale"}
      </DialogTitle>

      <DialogContent>

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 1,
              mb: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {loadingData ? (

          <Box
            display="flex"
            justifyContent="center"
            py={5}
          >
            <CircularProgress />
          </Box>

        ) : (

          <Grid
            container
            spacing={2}
            sx={{
              mt: 0.5,
            }}
          >

            {/* CUSTOMER */}

            <Grid
              item
              xs={12}
            >

              <TextField
                select
                fullWidth
                required
                label="Customer"
                value={customerId}
                onChange={(e) =>
                  setCustomerId(
                    e.target.value
                  )
                }
                disabled={saving}
              >

                {customers.map(
                  (customer) => (

                    <MenuItem
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.firstName}{" "}
                      {customer.lastName}
                    </MenuItem>
                  )
                )}

              </TextField>

            </Grid>


            {/* PRODUCT */}

            {!isEditMode && (

              <Grid
                item
                xs={12}
              >

                <TextField
                  select
                  fullWidth
                  required
                  label="Product"
                  value={productId}
                  onChange={(e) =>
                    setProductId(
                      e.target.value
                    )
                  }
                  disabled={saving}
                >

                  {products.map(
                    (product) => (

                      <MenuItem
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </MenuItem>
                    )
                  )}

                </TextField>

              </Grid>
            )}


            {/* PRODUCT INFO */}

            {(selectedProduct
              || isEditMode) && (

              <Grid
                item
                xs={12}
              >

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: 2,
                  }}
                >

                  <Typography
                    fontWeight={700}
                    mb={2}
                  >
                    Product Information
                  </Typography>

                  <Grid
                    container
                    spacing={2}
                  >

                    <Grid
                      item
                      xs={12}
                      sm={4}
                    >

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Product
                      </Typography>

                      <Typography
                        fontWeight={600}
                      >
                        {
                          selectedProduct?.name
                          || sale?.items?.[0]?.productName
                          || "N/A"
                        }
                      </Typography>

                    </Grid>

                    <Grid
                      item
                      xs={12}
                      sm={4}
                    >

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Category ID
                      </Typography>

                      <Typography
                        fontWeight={600}
                      >
                        {categoryId || "N/A"}
                      </Typography>

                    </Grid>

                    <Grid
                      item
                      xs={12}
                      sm={4}
                    >

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Available Stock
                      </Typography>

                      <Typography
                        fontWeight={600}
                      >
                        {isEditMode
                          ? "N/A"
                          : availableStock}
                      </Typography>

                    </Grid>

                  </Grid>

                </Paper>

              </Grid>
            )}


            {/* QUANTITY */}

            <Grid
              item
              xs={12}
              sm={4}
            >

              <TextField
                fullWidth
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
                  isEditMode
                  || saving
                }
                inputProps={{
                  min: 1,
                  step: 1,
                }}
              />

            </Grid>


            {/* UNIT PRICE */}

            <Grid
              item
              xs={12}
              sm={4}
            >

              <TextField
                fullWidth
                type="number"
                label="Unit Price"
                value={unitPrice}
                disabled
              />

            </Grid>


            {/* DISCOUNT */}

            <Grid
              item
              xs={12}
              sm={4}
            >

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
                disabled={saving}
                inputProps={{
                  min: 0,
                  step: 0.01,
                }}
              />

            </Grid>


            {/* TAX */}

            <Grid
              item
              xs={12}
              sm={6}
            >

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
                disabled={saving}
                inputProps={{
                  min: 0,
                  step: 0.01,
                }}
              />

            </Grid>


            {/* CHANNEL */}

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                select
                fullWidth
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


            {/* PAYMENT */}

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                select
                fullWidth
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


            {/* NOTES */}

            <Grid
              item
              xs={12}
              sm={6}
            >

              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                disabled={saving}
              />

            </Grid>


            {/* SUMMARY */}

            <Grid
              item
              xs={12}
            >

              <Divider
                sx={{
                  my: 1,
                }}
              />

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                }}
              >

                <Typography
                  variant="h6"
                  fontWeight={700}
                  mb={2}
                >
                  Billing Summary
                </Typography>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  mb={1}
                >

                  <Typography>
                    Subtotal
                  </Typography>

                  <Typography>
                    ₹ {subtotal.toFixed(2)}
                  </Typography>

                </Box>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  mb={1}
                >

                  <Typography>
                    Discount
                  </Typography>

                  <Typography>
                    ₹ {discount.toFixed(2)}
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
                    ₹ {tax.toFixed(2)}
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
                    Grand Total
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="primary"
                  >
                    ₹ {grandTotal.toFixed(2)}
                  </Typography>

                </Box>

              </Paper>

            </Grid>

          </Grid>
        )}

      </DialogContent>


      <DialogActions
        sx={{
          p: 2,
        }}
      >

        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            saving
            || loadingData
          }
        >

          {saving
            ? "Saving..."
            : isEditMode
              ? "Update Sale"
              : "Create Sale"}

        </Button>

      </DialogActions>

    </Dialog>
  );
}