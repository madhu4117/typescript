import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import InventoryDashboard from "../components/InventoryDashboard";
import InventoryTable from "../components/InventoryTable";
import StockAdjustmentDialog from "../components/StockAdjustmentDialog";
import InventoryMovementDialog from "../components/InventoryMovementDialog";

import {
  getInventory,
  getInventorySummary,
  getMovementHistory,
} from "../services/inventoryService";

import type { Inventory } from "../types/inventory";

const InventoryPage = () => {

  // -----------------------------
  // Inventory Data
  // -----------------------------

  const [inventory, setInventory] = useState<Inventory[]>([]);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalInventory: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  });

  // -----------------------------
  // Loading
  // -----------------------------

  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Search & Filters
  // -----------------------------

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // -----------------------------
  // Dialogs
  // -----------------------------

  const [selectedInventory, setSelectedInventory] =
    useState<Inventory | null>(null);

  const [movementType, setMovementType] = useState<
    "add" | "remove" | "adjust"
  >("add");

  const [openAdjustment, setOpenAdjustment] =
    useState(false);

  const [openHistory, setOpenHistory] =
    useState(false);

  const [movements, setMovements] =
    useState<any[]>([]);

  // -----------------------------
  // Load Inventory
  // -----------------------------

  const loadInventory = async () => {
    try {
      setLoading(true);

      const data = await getInventory({
        search,
        category,
        brand,
        stock_status: status,
      });

      setInventory(data);

      const dashboard =
        await getInventorySummary();

      setSummary(dashboard);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [search, category, brand, status]);

  return (
    <Box p={3}>
          {/* Search & Filters */}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Product / SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>

              <Select
                value={category}
                label="Category"
                onChange={(e) =>
                  setCategory(e.target.value)
                }
              >
                <MenuItem value="">
                  All
                </MenuItem>

                {categories.map((c) => (
                  <MenuItem
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </MenuItem>
                ))}
              </Select>

            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>

              <InputLabel>Brand</InputLabel>

              <Select
                value={brand}
                label="Brand"
                onChange={(e) =>
                  setBrand(e.target.value)
                }
              >
                <MenuItem value="">
                  All
                </MenuItem>

                {brands.map((b) => (
                  <MenuItem
                    key={b}
                    value={b}
                  >
                    {b}
                  </MenuItem>
                ))}

              </Select>

            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>

              <InputLabel>Status</InputLabel>

              <Select
                value={status}
                label="Status"
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >
                <MenuItem value="">
                  All
                </MenuItem>

                <MenuItem value="In Stock">
                  In Stock
                </MenuItem>

                <MenuItem value="Low Stock">
                  Low Stock
                </MenuItem>

                <MenuItem value="Out of Stock">
                  Out of Stock
                </MenuItem>

              </Select>

            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedInventory(null);
                setMovementType("adjust");
                setOpenAdjustment(true);
              }}
            >
              Adjust Stock
            </Button>
          </Grid>

        </Grid>
      </Paper>

      {/* Dashboard */}

      <InventoryDashboard
        summary={summary}
      />
            {/* Inventory Table */}

      <InventoryTable
        data={inventory}
        onAdd={(item) => {
          setSelectedInventory(item);
          setMovementType("add");
          setOpenAdjustment(true);
        }}
        onRemove={(item) => {
          setSelectedInventory(item);
          setMovementType("remove");
          setOpenAdjustment(true);
        }}
        onAdjust={(item) => {
          setSelectedInventory(item);
          setMovementType("adjust");
          setOpenAdjustment(true);
        }}
        onHistory={async (item) => {
          try {
            setSelectedInventory(item);

            const history =
              await getMovementHistory(item.id);

            setMovements(history);

            setOpenHistory(true);

          } catch (error) {
            console.error(error);
          }
        }}
      />

      {/* Loading */}

      {loading && (
        <Typography
          align="center"
          sx={{
            mt: 3,
            color: "text.secondary",
          }}
        >
          Loading inventory...
        </Typography>
      )}
            {/* Stock Adjustment Dialog */}

      <StockAdjustmentDialog
        open={openAdjustment}
        onClose={() => {
          setOpenAdjustment(false);
          setSelectedInventory(null);
        }}
        inventory={selectedInventory}
        movementType={movementType}
        onSuccess={() => {
          loadInventory();
          setOpenAdjustment(false);
          setSelectedInventory(null);
        }}
      />

      {/* Inventory Movement History */}

      <InventoryMovementDialog
        open={openHistory}
        onClose={() => {
          setOpenHistory(false);
        }}
        movements={movements}
      />

    </Box>
  );
};

export default InventoryPage;