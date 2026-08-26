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
import AutoGraphIcon from "@mui/icons-material/AutoGraph";

import { useNavigate } from "react-router-dom";

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
  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigate = useNavigate();

  // =========================================================
  // INVENTORY STATE
  // =========================================================

  const [inventory, setInventory] = useState<Inventory[]>([]);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalInventory: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  });

  const [loading, setLoading] = useState(false);

  // =========================================================
  // FILTERS
  // =========================================================

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");

  // =========================================================
  // DROPDOWN DATA
  // =========================================================

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Prevent unused-state warnings while keeping
  // these ready for category/brand API integration.
  void setCategories;
  void setBrands;

  // =========================================================
  // DIALOG STATE
  // =========================================================

  const [selectedInventory, setSelectedInventory] =
    useState<Inventory | null>(null);

  const [movementType, setMovementType] =
    useState<"add" | "remove" | "adjust">("add");

  const [openAdjustment, setOpenAdjustment] =
    useState(false);

  const [openHistory, setOpenHistory] =
    useState(false);

  const [movements, setMovements] =
    useState<any[]>([]);

  // =========================================================
  // LOAD INVENTORY
  // =========================================================

  const loadInventory = async () => {
    try {
      setLoading(true);

      const inventoryData = await getInventory({
        search,
        category,
        brand,
        stock_status: status,
      });

      setInventory(inventoryData);

      const dashboard = await getInventorySummary();

      setSummary(dashboard);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD WHEN FILTERS CHANGE
  // =========================================================

  useEffect(() => {
    loadInventory();
  }, [search, category, brand, status]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Box
      sx={{
        p: 3,
        maxWidth: 1400,
        mx: "auto",
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
          >
            Inventory
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Manage current stock, movements and inventory levels
          </Typography>
        </Box>

        {/* =================================================
            INVENTORY FORECAST BUTTON
        ================================================= */}

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AutoGraphIcon />}
          onClick={() =>
            navigate("/inventory/forecast")
          }
        >
          Inventory Forecast
        </Button>
      </Box>

      {/* =====================================================
          SEARCH & FILTERS
      ===================================================== */}

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
        }}
      >
        <Grid container spacing={2}>
          {/* Search */}

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Search Product / SKU"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </Grid>

          {/* Category */}

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>
                Category
              </InputLabel>

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

          {/* Brand */}

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>
                Brand
              </InputLabel>

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

          {/* Status */}

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>
                Status
              </InputLabel>

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
                  Out Of Stock
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Forecast */}

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<AutoGraphIcon />}
              sx={{
                height: "56px",
              }}
              onClick={() =>
                navigate("/inventory/forecast")
              }
            >
              Forecast
            </Button>
          </Grid>

          {/* Adjust Stock */}

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                height: "56px",
              }}
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

      {/* =====================================================
          INVENTORY DASHBOARD
      ===================================================== */}

      <InventoryDashboard
        summary={summary}
      />

      {/* =====================================================
          INVENTORY TABLE
      ===================================================== */}

      <Box sx={{ mt: 3 }}>
        <InventoryTable
          data={inventory}

          /* ADD STOCK */

          onAdd={(item) => {
            setSelectedInventory(item);
            setMovementType("add");
            setOpenAdjustment(true);
          }}

          /* REMOVE STOCK */

          onRemove={(item) => {
            setSelectedInventory(item);
            setMovementType("remove");
            setOpenAdjustment(true);
          }}

          /* ADJUST STOCK */

          onAdjust={(item) => {
            setSelectedInventory(item);
            setMovementType("adjust");
            setOpenAdjustment(true);
          }}

          /* MOVEMENT HISTORY */

          onHistory={async (item) => {
            try {
              setSelectedInventory(item);

              const history =
                await getMovementHistory(item.id);

              setMovements(history);

              setOpenHistory(true);
            } catch (error) {
              console.error(
                "Failed to load movement history:",
                error
              );
            }
          }}
        />
      </Box>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <Typography
          align="center"
          sx={{
            py: 4,
            color: "text.secondary",
          }}
        >
          Loading inventory...
        </Typography>
      )}

      {/* =====================================================
          STOCK ADJUSTMENT DIALOG
      ===================================================== */}

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

      {/* =====================================================
          MOVEMENT HISTORY DIALOG
      ===================================================== */}

      <InventoryMovementDialog
        open={openHistory}
        onClose={() => {
          setOpenHistory(false);
          setSelectedInventory(null);
        }}
        movements={movements}
      />
    </Box>
  );
};

export default InventoryPage;