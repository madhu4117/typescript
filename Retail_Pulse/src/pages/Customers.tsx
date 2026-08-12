import React, { useState } from "react";
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
} from "@mui/material";

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 1,
      name: "Arun Kumar",
      email: "arun@gmail.com",
      phone: "9876543210",
      address: "Madurai",
      status: "Active",
    },
    {
      id: 2,
      name: "Priya",
      email: "priya@gmail.com",
      phone: "9876501234",
      address: "Chennai",
      status: "Active",
    },
  ]);

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "Active",
  });

  // Open Add Customer
  const handleAdd = () => {
    setEditingCustomer(null);

    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "Active",
    });

    setOpen(true);
  };

  // Open Edit Customer
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);

    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      status: customer.status,
    });

    setOpen(true);
  };

  // Delete Customer
  const handleDelete = (id: number) => {
    setCustomers(
      customers.filter((customer) => customer.id !== id)
    );
  };

  // Save Customer
  const handleSave = () => {
    if (
      !form.name ||
      !form.email ||
      !form.phone
    ) {
      return;
    }

    if (editingCustomer) {
      setCustomers(
        customers.map((customer) =>
          customer.id === editingCustomer.id
            ? {
                ...customer,
                ...form,
              }
            : customer
        )
      );
    } else {
      const newCustomer: Customer = {
        id: Date.now(),
        ...form,
      };

      setCustomers([
        ...customers,
        newCustomer,
      ]);
    }

    setOpen(false);
  };

  // Search
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      customer.email
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      customer.phone.includes(search)
  );

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
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
            Manage your customers
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{
            bgcolor: "#7c3aed",
            borderRadius: "10px",
            px: 2.5,
            py: 1.2,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              bgcolor: "#6d28d9",
            },
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Statistics */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Card
          sx={{
            borderRadius: "16px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Total Customers
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                mt: 1,
              }}
            >
              {customers.length}
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: "16px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Active Customers
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                mt: 1,
                color: "#16a34a",
              }}
            >
              {
                customers.filter(
                  (customer) =>
                    customer.status === "Active"
                ).length
              }
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: "16px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.05)",
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Search Results
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                mt: 1,
              }}
            >
              {filteredCustomers.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Customer Table */}
      <Card
        sx={{
          borderRadius: "16px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent>
          {/* Search */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 3,
            }}
          >
            <SearchIcon
              sx={{
                color: "#64748b",
              }}
            />

            <TextField
              fullWidth
              size="small"
              placeholder="Search customers..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: "#f8fafc",
                  }}
                >
                  <TableCell>
                    <b>Name</b>
                  </TableCell>

                  <TableCell>
                    <b>Email</b>
                  </TableCell>

                  <TableCell>
                    <b>Phone</b>
                  </TableCell>

                  <TableCell>
                    <b>Address</b>
                  </TableCell>

                  <TableCell>
                    <b>Status</b>
                  </TableCell>

                  <TableCell align="right">
                    <b>Actions</b>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                    >
                      <Typography
                        sx={{
                          py: 4,
                          color: "#64748b",
                        }}
                      >
                        No customers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map(
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
                            {customer.name}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {customer.email}
                        </TableCell>

                        <TableCell>
                          {customer.phone}
                        </TableCell>

                        <TableCell>
                          {customer.address}
                        </TableCell>

                        <TableCell>
                          <Box
                            sx={{
                              display:
                                "inline-block",
                              px: 1.5,
                              py: 0.5,
                              borderRadius:
                                "20px",
                              bgcolor:
                                customer.status ===
                                "Active"
                                  ? "#dcfce7"
                                  : "#fee2e2",
                              color:
                                customer.status ===
                                "Active"
                                  ? "#15803d"
                                  : "#dc2626",
                              fontSize:
                                "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            {customer.status}
                          </Box>
                        </TableCell>

                        <TableCell align="right">
                          <IconButton
                            onClick={() =>
                              handleEdit(
                                customer
                              )
                            }
                            sx={{
                              color:
                                "#7c3aed",
                            }}
                          >
                            <EditIcon />
                          </IconButton>

                          <IconButton
                            onClick={() =>
                              handleDelete(
                                customer.id
                              )
                            }
                            sx={{
                              color:
                                "#ef4444",
                            }}
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: "bold",
          }}
        >
          {editingCustomer
            ? "Edit Customer"
            : "Add Customer"}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Customer Name"
            margin="normal"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            label="Phone"
            margin="normal"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            label="Address"
            margin="normal"
            value={form.address}
            onChange={(e) =>
              setForm({
                ...form,
                address: e.target.value,
              })
            }
          />

          <TextField
            fullWidth
            select
            label="Status"
            margin="normal"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
          >
            <MenuItem value="Active">
              Active
            </MenuItem>

            <MenuItem value="Inactive">
              Inactive
            </MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              bgcolor: "#7c3aed",
              textTransform: "none",
              "&:hover": {
                bgcolor: "#6d28d9",
              },
            }}
          >
            {editingCustomer
              ? "Update"
              : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;