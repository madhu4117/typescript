import React, { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  activateCustomer,
  deactivateCustomer,
} from "../services/customerService";

import type {
  Customer,
  CustomerCreate,
} from "../services/customerService";

// ============================================================
// DEFAULT FORM
// ============================================================

const emptyForm: CustomerCreate = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",

  dateOfBirth: "",
  gender: "",

  customerType: "Retail",
  customerSegment: "New",

  preferredSalesChannel: "",
};

// ============================================================
// COMPONENT
// ============================================================

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [openDialog, setOpenDialog] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [formData, setFormData] =
    useState<CustomerCreate>(emptyForm);

  // ============================================================
  // LOAD CUSTOMERS
  // ============================================================

  const loadCustomers = async (
    searchValue: string = search,
    statusValue: string = status
  ) => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers(
        searchValue,
        statusValue
      );

      setCustomers(data);
    } catch (err: any) {
      console.error(
        "Failed to load customers:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadCustomers();
  }, []);

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // ADD CUSTOMER
  // ============================================================

  const handleAdd = () => {
    setEditingCustomer(null);

    setFormData({
      ...emptyForm,
    });

    setError("");

    setOpenDialog(true);
  };

  // ============================================================
  // EDIT CUSTOMER
  // ============================================================

  const handleEdit = (
    customer: Customer
  ) => {
    setEditingCustomer(customer);

    setFormData({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",

      email: customer.email || "",
      phone: customer.phone || "",

      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      country: customer.country || "",
      postalCode: customer.postalCode || "",

      dateOfBirth:
        customer.dateOfBirth || "",

      gender:
        customer.gender || "",

      customerType:
        customer.customerType || "Retail",

      customerSegment:
        customer.customerSegment || "New",

      preferredSalesChannel:
        customer.preferredSalesChannel || "",
    });

    setError("");

    setOpenDialog(true);
  };

  // ============================================================
  // VALIDATE FORM
  // ============================================================

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }

    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }

    if (!formData.city.trim()) {
      setError("City is required");
      return false;
    }

    if (!formData.state.trim()) {
      setError("State is required");
      return false;
    }

    if (!formData.country.trim()) {
      setError("Country is required");
      return false;
    }

    if (!formData.postalCode.trim()) {
      setError("Postal code is required");
      return false;
    }

    return true;
  };

  // ============================================================
  // SAVE CUSTOMER
  // ============================================================

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Remove empty optional values
      const payload: CustomerCreate = {
        ...formData,

        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),

        email: formData.email.trim(),
        phone: formData.phone.trim(),

        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
        postalCode:
          formData.postalCode.trim(),

        customerType:
          formData.customerType ||
          "Retail",

        customerSegment:
          formData.customerSegment ||
          "New",

        preferredSalesChannel:
          formData.preferredSalesChannel ||
          undefined,

        gender:
          formData.gender ||
          undefined,

        dateOfBirth:
          formData.dateOfBirth ||
          undefined,
      };

      console.log(
        "CUSTOMER PAYLOAD:",
        payload
      );

      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          payload
        );
      } else {
        await createCustomer(payload);
      }

      setOpenDialog(false);

      setFormData({
        ...emptyForm,
      });

      await loadCustomers();
    } catch (err: any) {
      console.error(
        "Failed to save customer:",
        err
      );

      console.error(
        "Backend response:",
        err?.response?.data
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to save customer"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (
    id: number
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteCustomer(id);

      await loadCustomers();
    } catch (err: any) {
      console.error(
        "Failed to delete customer:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to deactivate customer"
      );
    }
  };

  // ============================================================
  // ACTIVATE / DEACTIVATE
  // ============================================================

  const handleStatusChange = async (
    customer: Customer
  ) => {
    try {
      setError("");

      if (
        customer.status?.toLowerCase() ===
        "active"
      ) {
        await deactivateCustomer(
          customer.id
        );
      } else {
        await activateCustomer(
          customer.id
        );
      }

      await loadCustomers();
    } catch (err: any) {
      console.error(
        "Failed to update customer status:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to update customer status"
      );
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = () => {
    loadCustomers(search, status);
  };

  // ============================================================
  // RESET
  // ============================================================

  const handleReset = () => {
    setSearch("");
    setStatus("");

    loadCustomers("", "");
  };

  // ============================================================
  // CLOSE DIALOG
  // ============================================================

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setOpenDialog(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          flexDirection: {
            xs: "column",
            md: "row",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Customers
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#64748b",
              mt: 0.5,
            }}
          >
            Manage your customers and customer
            information
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{
            background:
              "linear-gradient(135deg, #aa3bff, #6366f1)",
            textTransform: "none",
            borderRadius: "10px",
            px: 2.5,
            py: 1.2,
            fontWeight: 600,
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: "10px",
          }}
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <Card
        sx={{
          mb: 3,
          borderRadius: "16px",
          boxShadow:
            "0 4px 15px rgba(15, 23, 42, 0.06)",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              label="Search customers"
              placeholder="Name, email or phone"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  handleSearch();
                }
              }}
              sx={{
                flex: 1,
                minWidth: 250,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              sx={{
                minWidth: 160,
              }}
            >
              <MenuItem value="">
                All
              </MenuItem>

              <MenuItem value="active">
                Active
              </MenuItem>

              <MenuItem value="inactive">
                Inactive
              </MenuItem>
            </TextField>

            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{
                textTransform: "none",
                borderRadius: "10px",
                px: 3,
              }}
            >
              Search
            </Button>

            <Button
              variant="outlined"
              onClick={handleReset}
              sx={{
                textTransform: "none",
                borderRadius: "10px",
              }}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ======================================================
          CUSTOMER TABLE
      ====================================================== */}

      <Card
        sx={{
          borderRadius: "16px",
          boxShadow:
            "0 4px 15px rgba(15, 23, 42, 0.06)",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "16px",
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor:
                      "#f8fafc",
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Customer
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Email
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Phone
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Type
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Segment
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Status
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        py: 6,
                      }}
                    >
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : customers.length ===
                  0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        py: 6,
                      }}
                    >
                      <PersonIcon
                        sx={{
                          fontSize: 50,
                          color: "#94a3b8",
                          mb: 1,
                        }}
                      />

                      <Typography color="text.secondary">
                        No customers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map(
                    (customer) => (
                      <TableRow
                        key={customer.id}
                        hover
                      >
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 600,
                            }}
                          >
                            {
                              customer.firstName
                            }{" "}
                            {
                              customer.lastName
                            }
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {customer.email}
                        </TableCell>

                        <TableCell>
                          {customer.phone}
                        </TableCell>

                        <TableCell>
                          {
                            customer.customerType
                          }
                        </TableCell>

                        <TableCell>
                          {
                            customer.customerSegment
                          }
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              customer.status
                            }
                            size="small"
                            color={
                              customer.status?.toLowerCase() ===
                              "active"
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>

                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() =>
                              handleEdit(
                                customer
                              )
                            }
                          >
                            <EditIcon />
                          </IconButton>

                          <Button
                            size="small"
                            onClick={() =>
                              handleStatusChange(
                                customer
                              )
                            }
                            sx={{
                              textTransform:
                                "none",
                            }}
                          >
                            {customer.status?.toLowerCase() ===
                            "active"
                              ? "Deactivate"
                              : "Activate"}
                          </Button>

                          <IconButton
                            color="error"
                            onClick={() =>
                              handleDelete(
                                customer.id
                              )
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ======================================================
          ADD / EDIT DIALOG
      ====================================================== */}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
          }}
        >
          {editingCustomer
            ? "Edit Customer"
            : "Add Customer"}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 2,
              mt: 1,
            }}
          >
            {/* FIRST NAME */}

            <TextField
              name="firstName"
              label="First Name"
              value={
                formData.firstName
              }
              onChange={handleChange}
              required
              fullWidth
            />

            {/* LAST NAME */}

            <TextField
              name="lastName"
              label="Last Name"
              value={
                formData.lastName
              }
              onChange={handleChange}
              required
              fullWidth
            />

            {/* EMAIL */}

            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />

            {/* PHONE */}

            <TextField
              name="phone"
              label="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
              fullWidth
            />

            {/* ADDRESS */}

            <TextField
              name="address"
              label="Address"
              value={
                formData.address
              }
              onChange={handleChange}
              required
              fullWidth
            />

            {/* CITY */}

            <TextField
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              required
              fullWidth
            />

            {/* STATE */}

            <TextField
              name="state"
              label="State"
              value={formData.state}
              onChange={handleChange}
              required
              fullWidth
            />

            {/* COUNTRY */}

            <TextField
              name="country"
              label="Country"
              value={
                formData.country
              }
              onChange={handleChange}
              required
              fullWidth
            />

            {/* POSTAL CODE */}

            <TextField
              name="postalCode"
              label="Postal Code"
              value={
                formData.postalCode
              }
              onChange={handleChange}
              required
              fullWidth
            />

            {/* DOB */}

            <TextField
              name="dateOfBirth"
              label="Date of Birth"
              type="date"
              value={
                formData.dateOfBirth
              }
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />

            {/* GENDER */}

            <TextField
              select
              name="gender"
              label="Gender"
              value={
                formData.gender
              }
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">
                Select Gender
              </MenuItem>

              <MenuItem value="Male">
                Male
              </MenuItem>

              <MenuItem value="Female">
                Female
              </MenuItem>

              <MenuItem value="Other">
                Other
              </MenuItem>
            </TextField>

            {/* CUSTOMER TYPE */}

            <TextField
              select
              name="customerType"
              label="Customer Type"
              value={
                formData.customerType
              }
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="Retail">
                Retail
              </MenuItem>

              <MenuItem value="Wholesale">
                Wholesale
              </MenuItem>

              <MenuItem value="Corporate">
                Corporate
              </MenuItem>
            </TextField>

            {/* CUSTOMER SEGMENT */}

            <TextField
              select
              name="customerSegment"
              label="Customer Segment"
              value={
                formData.customerSegment
              }
              onChange={handleChange}
              required
              fullWidth
            >
              <MenuItem value="New">
                New
              </MenuItem>

              <MenuItem value="Regular">
                Regular
              </MenuItem>

              <MenuItem value="Loyal">
                Loyal
              </MenuItem>

              <MenuItem value="VIP">
                VIP
              </MenuItem>
            </TextField>

            {/* SALES CHANNEL */}

            <TextField
              select
              name="preferredSalesChannel"
              label="Preferred Sales Channel"
              value={
                formData.preferredSalesChannel
              }
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="">
                Select Channel
              </MenuItem>

              <MenuItem value="Store">
                Store
              </MenuItem>

              <MenuItem value="Online">
                Online
              </MenuItem>

              <MenuItem value="Mobile">
                Mobile
              </MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
          }}
        >
          <Button
            onClick={
              handleCloseDialog
            }
            disabled={saving}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              minWidth: 150,
            }}
          >
            {saving ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : editingCustomer ? (
              "Update Customer"
            ) : (
              "Create Customer"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;