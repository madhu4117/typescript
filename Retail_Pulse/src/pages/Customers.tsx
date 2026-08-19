
import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Grid,
  Switch,
} from "@mui/material";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Sort as SortIcon,
} from "@mui/icons-material";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  activateCustomer,
  deactivateCustomer,
} from "../services/customerService";

// ============================================================
// TYPES
// ============================================================

interface Customer {
  id: number | string;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  dateOfBirth?: string | null;
  gender?: string | null;

  customerType: string;
  customerSegment: string;

  preferredSalesChannel?: string | null;

  status: string;

  createdAt: string;
  updatedAt?: string;
}

interface CustomerCreate {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  dateOfBirth?: string;
  gender?: string;

  customerType: string;
  customerSegment: string;

  preferredSalesChannel?: string;
}

interface CustomerUpdate {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  dateOfBirth?: string;
  gender?: string;

  customerType: string;
  customerSegment: string;

  preferredSalesChannel?: string;

  status: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const customerTypes = [
  "Retail",
  "Wholesale",
  "Corporate",
];

const customerSegments = [
  "New",
  "Regular",
  "Loyal",
  "VIP",
];

const genders = [
  "Male",
  "Female",
  "Other",
];

const salesChannels = [
  "Store",
  "Online",
  "Mobile",
  "Phone",
  "Other",
];

// ============================================================
// COMPONENT
// ============================================================

const Customers: React.FC = () => {
  // ==========================================================
  // DATA
  // ==========================================================

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================================
  // SEARCH / FILTER / SORT
  // ==========================================================

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSegment, setFilterSegment] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("asc");

  // ==========================================================
  // DIALOG
  // ==========================================================

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [viewingCustomer, setViewingCustomer] =
    useState<Customer | null>(null);

  // ==========================================================
  // FORM
  // ==========================================================

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  const [customerType, setCustomerType] =
    useState("Retail");

  const [customerSegment, setCustomerSegment] =
    useState("New");

  const [preferredSalesChannel, setPreferredSalesChannel] =
    useState("");

  const [status, setStatus] = useState("Active");

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string>>({});

  // ==========================================================
  // SNACKBAR
  // ==========================================================

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // ==========================================================
  // SNACKBAR FUNCTION
  // ==========================================================

  const showSnackbar = (
    message: string,
    severity: "success" | "error"
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // ==========================================================
  // FETCH CUSTOMERS
  // ==========================================================

  const fetchCustomers = async () => {
    setLoading(true);

    try {
      const data = await getCustomers();

      setCustomers(data as Customer[]);
    } catch (error: any) {
      console.error(
        "Failed to fetch customers:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to fetch customers";

      showSnackbar(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ==========================================================
  // FILTER + SEARCH + SORT
  // ==========================================================

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (search.trim()) {
      const searchValue =
        search.toLowerCase().trim();

      result = result.filter((customer) => {
        const fullName =
          `${customer.firstName} ${customer.lastName}`
            .toLowerCase();

        return (
          fullName.includes(searchValue) ||
          (customer.email || "")
            .toLowerCase()
            .includes(searchValue) ||
          (customer.phone || "")
            .toLowerCase()
            .includes(searchValue) ||
          (customer.city || "")
            .toLowerCase()
            .includes(searchValue)
        );
      });
    }

    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    if (filterStatus) {
      result = result.filter(
        (customer) =>
          customer.status === filterStatus
      );
    }

    // --------------------------------------------------------
    // CUSTOMER TYPE
    // --------------------------------------------------------

    if (filterType) {
      result = result.filter(
        (customer) =>
          customer.customerType === filterType
      );
    }

    // --------------------------------------------------------
    // SEGMENT
    // --------------------------------------------------------

    if (filterSegment) {
      result = result.filter(
        (customer) =>
          customer.customerSegment === filterSegment
      );
    }

    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        const nameA =
          `${a.firstName} ${a.lastName}`.toLowerCase();

        const nameB =
          `${b.firstName} ${b.lastName}`.toLowerCase();

        comparison =
          nameA.localeCompare(nameB);
      }

      if (sortBy === "recently_added") {
        comparison =
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime();
      }

      if (sortBy === "segment") {
        comparison =
          a.customerSegment.localeCompare(
            b.customerSegment
          );
      }

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    customers,
    search,
    filterStatus,
    filterType,
    filterSegment,
    sortBy,
    sortOrder,
  ]);

  // ==========================================================
  // OPEN FORM
  // ==========================================================

  const handleOpenForm = (
    customer?: Customer
  ) => {
    setFieldErrors({});

    if (customer) {
      setEditingCustomer(customer);

      setFirstName(customer.firstName || "");
      setLastName(customer.lastName || "");

      setEmail(customer.email || "");
      setPhone(customer.phone || "");

      setAddress(customer.address || "");
      setCity(customer.city || "");
      setState(customer.state || "");
      setCountry(customer.country || "");
      setPostalCode(customer.postalCode || "");

      setDateOfBirth(
        customer.dateOfBirth || ""
      );

      setGender(customer.gender || "");

      setCustomerType(
        customer.customerType || "Retail"
      );

      setCustomerSegment(
        customer.customerSegment || "New"
      );

      setPreferredSalesChannel(
        customer.preferredSalesChannel || ""
      );

      setStatus(
        customer.status || "Active"
      );
    } else {
      setEditingCustomer(null);

      setFirstName("");
      setLastName("");

      setEmail("");
      setPhone("");

      setAddress("");
      setCity("");
      setState("");
      setCountry("");
      setPostalCode("");

      setDateOfBirth("");
      setGender("");

      setCustomerType("Retail");
      setCustomerSegment("New");

      setPreferredSalesChannel("");

      setStatus("Active");
    }

    setFormOpen(true);
  };

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCustomer(null);
    setFieldErrors({});
  };

  // ==========================================================
  // OPEN DETAILS
  // ==========================================================

  const handleOpenDetail = (
    customer: Customer
  ) => {
    setViewingCustomer(customer);
    setDetailOpen(true);
  };

  // ==========================================================
  // CLOSE DETAILS
  // ==========================================================

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setViewingCustomer(null);
  };

  // ==========================================================
  // SAVE CUSTOMER
  // ==========================================================

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!firstName.trim()) {
      errors.firstName =
        "First name is required";
    }

    if (!lastName.trim()) {
      errors.lastName =
        "Last name is required";
    }

    if (!email.trim()) {
      errors.email =
        "Email is required";
    }

    if (!phone.trim()) {
      errors.phone =
        "Phone number is required";
    } else if (!/^\d+$/.test(phone.trim())) {
      errors.phone =
        "Phone number must contain only digits";
    } else if (
      phone.trim().length < 10 ||
      phone.trim().length > 15
    ) {
      errors.phone =
        "Phone number must contain between 10 and 15 digits";
    }

    if (!address.trim()) {
      errors.address =
        "Address is required";
    }

    if (!city.trim()) {
      errors.city =
        "City is required";
    }

    if (!state.trim()) {
      errors.state =
        "State is required";
    }

    if (!country.trim()) {
      errors.country =
        "Country is required";
    }

    if (!postalCode.trim()) {
      errors.postalCode =
        "Postal code is required";
    }

    // --------------------------------------------------------
    // STOP IF ERRORS
    // --------------------------------------------------------

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // ========================================================
    // UPDATE
    // ========================================================

    if (editingCustomer) {
      const payload: CustomerUpdate = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),

        email: email.trim(),
        phone: phone.trim(),

        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),

        dateOfBirth:
          dateOfBirth || undefined,

        gender:
          gender || undefined,

        customerType,
        customerSegment,

        preferredSalesChannel:
          preferredSalesChannel.trim() ||
          undefined,

        status,
      };

      try {
        await updateCustomer(
          editingCustomer.id,
          payload
        );

        showSnackbar(
          "Customer updated successfully",
          "success"
        );

        handleCloseForm();

        await fetchCustomers();
      } catch (error: any) {
        console.error(
          "Failed to update customer:",
          error
        );

        const message =
          error?.response?.data?.detail ||
          "Failed to update customer";

        showSnackbar(message, "error");
      }

      return;
    }

    // ========================================================
    // CREATE
    // ========================================================

    const payload: CustomerCreate = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),

      email: email.trim(),
      phone: phone.trim(),

      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      postalCode: postalCode.trim(),

      dateOfBirth:
        dateOfBirth || undefined,

      gender:
        gender || undefined,

      customerType,
      customerSegment,

      preferredSalesChannel:
        preferredSalesChannel.trim() ||
        undefined,
    };

    try {
      await createCustomer(payload);

      showSnackbar(
        "Customer added successfully",
        "success"
      );

      handleCloseForm();

      await fetchCustomers();
    } catch (error: any) {
      console.error(
        "Failed to create customer:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to create customer";

      showSnackbar(message, "error");
    }
  };

  // ==========================================================
  // DELETE / SOFT DELETE
  // ==========================================================

  const handleDelete = async (
    customer: Customer
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${customer.firstName} ${customer.lastName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomer(customer.id);

      showSnackbar(
        "Customer deactivated successfully",
        "success"
      );

      await fetchCustomers();
    } catch (error: any) {
      console.error(
        "Failed to deactivate customer:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to deactivate customer";

      showSnackbar(message, "error");
    }
  };

  // ==========================================================
  // TOGGLE STATUS
  // ==========================================================

  const handleToggleStatus = async (
    customer: Customer
  ) => {
    try {
      if (customer.status === "Active") {
        await deactivateCustomer(
          customer.id
        );

        showSnackbar(
          "Customer deactivated successfully",
          "success"
        );
      } else {
        await activateCustomer(
          customer.id
        );

        showSnackbar(
          "Customer activated successfully",
          "success"
        );
      }

      await fetchCustomers();
    } catch (error: any) {
      console.error(
        "Failed to change customer status:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to change customer status";

      showSnackbar(message, "error");
    }
  };

  // ==========================================================
  // RETURN
  // ==========================================================

  return (
    <Box>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: "#0f172a",
              mb: 0.5,
              fontWeight: "bold",
            }}
          >
            Customer Master Data
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manage customers, customer segments,
            contact information and account status.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            handleOpenForm()
          }
          sx={{
            bgcolor: "#3b82f6",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: "bold",
            px: 3,
            py: 1,
            boxShadow:
              "0 4px 12px rgba(59, 130, 246, 0.3)",
            "&:hover": {
              bgcolor: "#1d4ed8",
            },
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* =====================================================
          FILTER PANEL
      ===================================================== */}

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: "16px",
          border:
            "1px solid #e2e8f0",
          boxShadow: "none",
        }}
      >
        <Grid
          container
          spacing={2}
          sx={{
            alignItems: "center",
          }}
        >
          {/* SEARCH */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          {/* STATUS */}

          <Grid
            size={{
              xs: 6,
              sm: 3,
              md: 2,
            }}
          >
            <FormControl
              size="small"
              fullWidth
            >
              <InputLabel>
                Status
              </InputLabel>

              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value
                  )
                }
              >
                <MenuItem value="">
                  All Statuses
                </MenuItem>

                <MenuItem value="Active">
                  Active
                </MenuItem>

                <MenuItem value="Inactive">
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* TYPE */}

          <Grid
            size={{
              xs: 6,
              sm: 3,
              md: 2,
            }}
          >
            <FormControl
              size="small"
              fullWidth
            >
              <InputLabel>
                Customer Type
              </InputLabel>

              <Select
                value={filterType}
                label="Customer Type"
                onChange={(e) =>
                  setFilterType(
                    e.target.value
                  )
                }
              >
                <MenuItem value="">
                  All Types
                </MenuItem>

                {customerTypes.map(
                  (type) => (
                    <MenuItem
                      key={type}
                      value={type}
                    >
                      {type}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* SEGMENT */}

          <Grid
            size={{
              xs: 6,
              sm: 3,
              md: 2,
            }}
          >
            <FormControl
              size="small"
              fullWidth
            >
              <InputLabel>
                Segment
              </InputLabel>

              <Select
                value={filterSegment}
                label="Segment"
                onChange={(e) =>
                  setFilterSegment(
                    e.target.value
                  )
                }
              >
                <MenuItem value="">
                  All Segments
                </MenuItem>

                {customerSegments.map(
                  (segment) => (
                    <MenuItem
                      key={segment}
                      value={segment}
                    >
                      {segment}
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* SORT */}

          <Grid
            size={{
              xs: 6,
              sm: 3,
              md: 2,
            }}
          >
            <FormControl
              size="small"
              fullWidth
            >
              <InputLabel>
                Sort By
              </InputLabel>

              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) =>
                  setSortBy(
                    e.target.value
                  )
                }
              >
                <MenuItem value="name">
                  Name
                </MenuItem>

                <MenuItem value="segment">
                  Segment
                </MenuItem>

                <MenuItem value="recently_added">
                  Recently Added
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* ACTIONS */}

          <Grid
            size={{
              xs: 12,
              sm: 3,
              md: 1,
            }}
            sx={{
              display: "flex",
              gap: 1,
            }}
          >
            <Tooltip
              title={
                sortOrder === "asc"
                  ? "Descending"
                  : "Ascending"
              }
            >
              <IconButton
                onClick={() =>
                  setSortOrder(
                    sortOrder === "asc"
                      ? "desc"
                      : "asc"
                  )
                }
                sx={{
                  border:
                    "1px solid #cbd5e1",
                }}
              >
                <SortIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchCustomers}
                sx={{
                  border:
                    "1px solid #cbd5e1",
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* =====================================================
          CUSTOMER TABLE
      ===================================================== */}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "16px",
          border:
            "1px solid #e2e8f0",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead
            sx={{
              bgcolor: "#f8fafc",
            }}
          >
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                Customer
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                Contact
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                Location
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                Type
              </TableCell>

              <TableCell
                sx={{
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                Segment
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  fontWeight: "bold",
                  color: "#475569",
                }}
              >
                Status
              </TableCell>

              <TableCell
                align="right"
                sx={{
                  fontWeight: "bold",
                  color: "#475569",
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
                  sx={{ py: 8 }}
                >
                  <CircularProgress
                    size={30}
                    sx={{
                      color: "#3b82f6",
                    }}
                  />

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5 }}
                  >
                    Fetching customers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    No customers found
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Adjust your filters or
                    add a new customer.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map(
                (row) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      "&:hover": {
                        bgcolor:
                          "#f8fafc",
                      },
                    }}
                  >
                    {/* CUSTOMER */}

                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {row.firstName}{" "}
                        {row.lastName}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: "#94a3b8",
                        }}
                      >
                        ID: {row.id}
                      </Typography>
                    </TableCell>

                    {/* CONTACT */}

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#334155",
                        }}
                      >
                        {row.email}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                        }}
                      >
                        {row.phone}
                      </Typography>
                    </TableCell>

                    {/* LOCATION */}

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#334155",
                        }}
                      >
                        {row.city}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748b",
                        }}
                      >
                        {row.state},{" "}
                        {row.country}
                      </Typography>
                    </TableCell>

                    {/* TYPE */}

                    <TableCell>
                      <Chip
                        label={
                          row.customerType
                        }
                        size="small"
                        sx={{
                          fontWeight: "bold",
                          bgcolor:
                            "#eff6ff",
                          color:
                            "#2563eb",
                          border:
                            "1px solid #bfdbfe",
                        }}
                      />
                    </TableCell>

                    {/* SEGMENT */}

                    <TableCell>
                      <Chip
                        label={
                          row.customerSegment
                        }
                        size="small"
                        sx={{
                          fontWeight: "bold",
                          bgcolor:
                            row.customerSegment ===
                            "VIP"
                              ? "#fef3c7"
                              : row.customerSegment ===
                                "Loyal"
                              ? "#ecfdf5"
                              : "#f1f5f9",

                          color:
                            row.customerSegment ===
                            "VIP"
                              ? "#92400e"
                              : row.customerSegment ===
                                "Loyal"
                              ? "#047857"
                              : "#475569",
                        }}
                      />
                    </TableCell>

                    {/* STATUS */}

                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          gap: 1,
                        }}
                      >
                        <Switch
                          size="small"
                          checked={
                            row.status ===
                            "Active"
                          }
                          onChange={() =>
                            handleToggleStatus(
                              row
                            )
                          }
                          color="success"
                        />

                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            fontSize:
                              "0.75rem",
                            fontWeight:
                              "bold",
                            bgcolor:
                              row.status ===
                              "Active"
                                ? "#ecfdf5"
                                : "#f1f5f9",
                            color:
                              row.status ===
                              "Active"
                                ? "#059669"
                                : "#64748b",
                            border:
                              row.status ===
                              "Active"
                                ? "1px solid #a7f3d0"
                                : "1px solid #cbd5e1",
                          }}
                        />
                      </Box>
                    </TableCell>

                    {/* ACTIONS */}

                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() =>
                            handleOpenDetail(
                              row
                            )
                          }
                          size="small"
                          sx={{
                            color:
                              "#64748b",
                            mr: 0.5,
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Customer">
                        <IconButton
                          onClick={() =>
                            handleOpenForm(
                              row
                            )
                          }
                          size="small"
                          sx={{
                            color:
                              "#3b82f6",
                            mr: 0.5,
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Deactivate Customer">
                        <IconButton
                          onClick={() =>
                            handleDelete(
                              row
                            )
                          }
                          size="small"
                          sx={{
                            color:
                              "#ef4444",
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* =====================================================
          ADD / EDIT CUSTOMER DIALOG
      ===================================================== */}

      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              p: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            color: "#0f172a",
          }}
        >
          {editingCustomer
            ? "Edit Customer"
            : "Add New Customer"}
        </DialogTitle>

        <form onSubmit={handleSave}>
          <DialogContent>
            <Grid
              container
              spacing={2}
            >
              {/* BASIC INFORMATION */}

              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    color: "#334155",
                    mb: 1,
                  }}
                >
                  Basic Information
                </Typography>
              </Grid>

              {/* FIRST NAME */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  autoFocus
                  label="First Name *"
                  fullWidth
                  value={firstName}
                  onChange={(e) =>
                    setFirstName(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.firstName
                  }
                  helperText={
                    fieldErrors.firstName
                  }
                />
              </Grid>

              {/* LAST NAME */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  label="Last Name *"
                  fullWidth
                  value={lastName}
                  onChange={(e) =>
                    setLastName(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.lastName
                  }
                  helperText={
                    fieldErrors.lastName
                  }
                />
              </Grid>

              {/* EMAIL */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  label="Email *"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.email
                  }
                  helperText={
                    fieldErrors.email
                  }
                />
              </Grid>

              {/* PHONE */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  label="Phone *"
                  fullWidth
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.phone
                  }
                  helperText={
                    fieldErrors.phone
                  }
                />
              </Grid>

              {/* DOB */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={dateOfBirth}
                  onChange={(e) =>
                    setDateOfBirth(
                      e.target.value
                    )
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>

              {/* GENDER */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <FormControl
                  fullWidth
                >
                  <InputLabel>
                    Gender
                  </InputLabel>

                  <Select
                    value={gender}
                    label="Gender"
                    onChange={(e) =>
                      setGender(
                        e.target.value
                      )
                    }
                  >
                    <MenuItem value="">
                      Not specified
                    </MenuItem>

                    {genders.map(
                      (item) => (
                        <MenuItem
                          key={item}
                          value={item}
                        >
                          {item}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* ADDRESS */}

              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    color: "#334155",
                    mt: 1,
                    mb: 1,
                  }}
                >
                  Address
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address *"
                  fullWidth
                  multiline
                  rows={2}
                  value={address}
                  onChange={(e) =>
                    setAddress(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.address
                  }
                  helperText={
                    fieldErrors.address
                  }
                />
              </Grid>

              {/* CITY */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  label="City *"
                  fullWidth
                  value={city}
                  onChange={(e) =>
                    setCity(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.city
                  }
                  helperText={
                    fieldErrors.city
                  }
                />
              </Grid>

              {/* STATE */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  label="State *"
                  fullWidth
                  value={state}
                  onChange={(e) =>
                    setState(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.state
                  }
                  helperText={
                    fieldErrors.state
                  }
                />
              </Grid>

              {/* COUNTRY */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  label="Country *"
                  fullWidth
                  value={country}
                  onChange={(e) =>
                    setCountry(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.country
                  }
                  helperText={
                    fieldErrors.country
                  }
                />
              </Grid>

              {/* POSTAL CODE */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  label="Postal Code *"
                  fullWidth
                  value={postalCode}
                  onChange={(e) =>
                    setPostalCode(
                      e.target.value
                    )
                  }
                  error={
                    !!fieldErrors.postalCode
                  }
                  helperText={
                    fieldErrors.postalCode
                  }
                />
              </Grid>

              {/* BUSINESS INFORMATION */}

              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    color: "#334155",
                    mt: 1,
                    mb: 1,
                  }}
                >
                  Customer Business Information
                </Typography>
              </Grid>

              {/* CUSTOMER TYPE */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <FormControl
                  fullWidth
                >
                  <InputLabel>
                    Customer Type
                  </InputLabel>

                  <Select
                    value={customerType}
                    label="Customer Type"
                    onChange={(e) =>
                      setCustomerType(
                        e.target.value
                      )
                    }
                  >
                    {customerTypes.map(
                      (item) => (
                        <MenuItem
                          key={item}
                          value={item}
                        >
                          {item}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* SEGMENT */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <FormControl
                  fullWidth
                >
                  <InputLabel>
                    Customer Segment
                  </InputLabel>

                  <Select
                    value={customerSegment}
                    label="Customer Segment"
                    onChange={(e) =>
                      setCustomerSegment(
                        e.target.value
                      )
                    }
                  >
                    {customerSegments.map(
                      (item) => (
                        <MenuItem
                          key={item}
                          value={item}
                        >
                          {item}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* SALES CHANNEL */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <FormControl
                  fullWidth
                >
                  <InputLabel>
                    Preferred Sales Channel
                  </InputLabel>

                  <Select
                    value={
                      preferredSalesChannel
                    }
                    label="Preferred Sales Channel"
                    onChange={(e) =>
                      setPreferredSalesChannel(
                        e.target.value
                      )
                    }
                  >
                    <MenuItem value="">
                      Not specified
                    </MenuItem>

                    {salesChannels.map(
                      (item) => (
                        <MenuItem
                          key={item}
                          value={item}
                        >
                          {item}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* STATUS */}

              {editingCustomer && (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <FormControl
                    fullWidth
                  >
                    <InputLabel>
                      Status
                    </InputLabel>

                    <Select
                      value={status}
                      label="Status"
                      onChange={(e) =>
                        setStatus(
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="Active">
                        Active
                      </MenuItem>

                      <MenuItem value="Inactive">
                        Inactive
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 2,
            }}
          >
            <Button
              onClick={handleCloseForm}
              sx={{
                color: "#64748b",
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: "#3b82f6",
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "bold",
                "&:hover": {
                  bgcolor: "#1d4ed8",
                },
              }}
            >
              {editingCustomer
                ? "Save Changes"
                : "Add Customer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* =====================================================
          CUSTOMER DETAILS
      ===================================================== */}

      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "16px",
              p: 1,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
            color: "#0f172a",
          }}
        >
          Customer Details
        </DialogTitle>

        <DialogContent>
          {viewingCustomer && (
            <Grid
              container
              spacing={2}
            >
              {/* NAME */}

              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    bgcolor: "#f8fafc",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "12px",
                    p: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Customer Name
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    {
                      viewingCustomer.firstName
                    }{" "}
                    {
                      viewingCustomer.lastName
                    }
                  </Typography>
                </Box>
              </Grid>

              {/* EMAIL */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Email
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {
                    viewingCustomer.email
                  }
                </Typography>
              </Grid>

              {/* PHONE */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Phone
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {
                    viewingCustomer.phone
                  }
                </Typography>
              </Grid>

              {/* DOB */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Date of Birth
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {
                    viewingCustomer.dateOfBirth ||
                    "—"
                  }
                </Typography>
              </Grid>

              {/* GENDER */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Gender
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {
                    viewingCustomer.gender ||
                    "—"
                  }
                </Typography>
              </Grid>

              {/* ADDRESS */}

              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Address
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {
                    viewingCustomer.address
                  }
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {
                    viewingCustomer.city
                  }
                  ,{" "}
                  {
                    viewingCustomer.state
                  }
                  ,{" "}
                  {
                    viewingCustomer.country
                  }{" "}
                  {
                    viewingCustomer.postalCode
                  }
                </Typography>
              </Grid>

              {/* TYPE */}

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Customer Type
                </Typography>

                <Chip
                  label={
                    viewingCustomer.customerType
                  }
                  size="small"
                  sx={{
                    mt: 0.5,
                    fontWeight: "bold",
                  }}
                />
              </Grid>

              {/* SEGMENT */}

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Segment
                </Typography>

                <Chip
                  label={
                    viewingCustomer.customerSegment
                  }
                  size="small"
                  sx={{
                    mt: 0.5,
                    fontWeight: "bold",
                  }}
                />
              </Grid>

              {/* STATUS */}

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Status
                </Typography>

                <Chip
                  label={
                    viewingCustomer.status
                  }
                  size="small"
                  sx={{
                    mt: 0.5,
                    fontWeight: "bold",
                    bgcolor:
                      viewingCustomer.status ===
                      "Active"
                        ? "#ecfdf5"
                        : "#f1f5f9",
                    color:
                      viewingCustomer.status ===
                      "Active"
                        ? "#059669"
                        : "#64748b",
                  }}
                />
              </Grid>

              {/* SALES CHANNEL */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Preferred Sales Channel
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {
                    viewingCustomer.preferredSalesChannel ||
                    "—"
                  }
                </Typography>
              </Grid>

              {/* CREATED */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Registered On
                </Typography>

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {viewingCustomer.createdAt
                    ? new Date(
                        viewingCustomer.createdAt
                      ).toLocaleString()
                    : "—"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
          }}
        >
          <Button
            onClick={handleCloseDetail}
            sx={{
              color: "#3b82f6",
              textTransform: "none",
              fontWeight: "bold",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* =====================================================
          SNACKBAR
      ===================================================== */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          onClose={() =>
            setSnackbar({
              ...snackbar,
              open: false,
            })
          }
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "8px",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers;

