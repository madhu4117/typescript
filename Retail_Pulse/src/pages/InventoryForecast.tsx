import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Button,
  Breadcrumbs,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { getProducts } from "../services/productService";
import {
  getInventoryForecast,
  getInventoryRecommendation,
  getStockProjection,
} from "../services/inventoryForecastService";

import type {
  ForecastItem,
  ForecastSummary,
  StockProjectionItem,
} from "../services/inventoryForecastService";

import ForecastSummaryCards from "../components/inventoryForecast/ForecastSummaryCards";
import ForecastFilters from "../components/inventoryForecast/ForecastFilters";
import ForecastTable from "../components/inventoryForecast/ForecastTable";
import RecommendationPanel from "../components/inventoryForecast/RecommendationPanel";
import StockProjectionChart from "../components/inventoryForecast/StockProjectionChart";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

const InventoryForecast = () => {
  const navigate = useNavigate();

  // =========================================================
  // LOOKUPS
  // =========================================================
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // =========================================================
  // STATE
  // =========================================================
  const [summary, setSummary] = useState<ForecastSummary>({
    totalProducts: 0,
    productsRequiringReorder: 0,
    productsAtStockoutRisk: 0,
    overstockedProducts: 0,
    healthyProducts: 0,
  });

  const [items, setItems] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters State
  const [risk, setRisk] = useState("");
  const [reorderRequired, setReorderRequired] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [productId, setProductId] = useState<number | "">("");
  const [sortBy, setSortBy] = useState("risk");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selection & Details State
  const [selectedItem, setSelectedItem] = useState<ForecastItem | null>(null);
  const [projectionData, setProjectionData] = useState<StockProjectionItem[]>([]);
  const [openRecommendation, setOpenRecommendation] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  // =========================================================
  // MASTER LOOKUPS LOAD
  // =========================================================
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [catRes, prodRes] = await Promise.allSettled([
          api.get("/categories"),
          getProducts(),
        ]);
        if (catRes.status === "fulfilled") {
          setCategories(catRes.value.data);
        }
        if (prodRes.status === "fulfilled") {
          setProducts(prodRes.value);
        }
      } catch (err) {
        console.error("Lookups load failed", err);
      }
    };
    fetchLookups();
  }, []);

  // =========================================================
  // LOAD FORECAST
  // =========================================================
  const loadForecast = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getInventoryForecast({
        stock_risk: risk || undefined,
        category_id: categoryId || undefined,
        product_id: productId || undefined,
        reorder_required:
          reorderRequired === ""
            ? undefined
            : reorderRequired === "true",
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      setSummary(data.summary);
      setItems(data.items);
    } catch (err) {
      console.error(err);
      setError("Unable to load inventory forecast. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger load when filters change
  useEffect(() => {
    loadForecast();
  }, [risk, reorderRequired, categoryId, productId, sortBy, sortOrder]);

  // =========================================================
  // RESET FILTERS
  // =========================================================
  const resetFilters = () => {
    setRisk("");
    setReorderRequired("");
    setCategoryId("");
    setProductId("");
    setSortBy("risk");
    setSortOrder("desc");
  };

  // =========================================================
  // SELECT PRODUCT
  // =========================================================
  const handleSelect = async (item: ForecastItem) => {
    try {
      setRecommendationError("");
      setRecommendationLoading(true);
      setOpenRecommendation(true);

      const [recommendation, projection] = await Promise.all([
        getInventoryRecommendation(item.productId),
        getStockProjection(item.productId),
      ]);

      setSelectedItem(recommendation);
      setProjectionData(projection);
    } catch (err) {
      console.error(err);
      setRecommendationError("Unable to load recommendation or projection for this product.");
      setSelectedItem(null);
      setProjectionData([]);
    } finally {
      setRecommendationLoading(false);
    }
  };

  // =========================================================
  // CLOSE RECOMMENDATION
  // =========================================================
  const handleCloseRecommendation = () => {
    setOpenRecommendation(false);
    setSelectedItem(null);
    setProjectionData([]);
    setRecommendationError("");
  };

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
        maxWidth: 1500,
        mx: "auto",
      }}
    >
      {/* HEADER BREADCRUMBS */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={() => navigate("/inventory")}
        >
          Inventory
        </Link>
        <Typography color="text.primary">Forecast</Typography>
      </Breadcrumbs>

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
          <Typography variant="h4" fontWeight={700} sx={{ color: "#0f172a" }}>
            Inventory Forecasting & Smart Replenishment
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Historical demand-based forecast modeling, days of stock remaining calculations, and safety thresholds.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => navigate("/inventory")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Back to Inventory
        </Button>
      </Box>

      {/* ERROR MESSAGE DISPLAY */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={loadForecast}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* FORECAST SUMMARY CARDS */}
      <ForecastSummaryCards summary={summary} loading={loading} />

      {/* FORECAST FILTER BAR */}
      <ForecastFilters
        risk={risk}
        setRisk={setRisk}
        reorderRequired={reorderRequired}
        setReorderRequired={setReorderRequired}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        productId={productId}
        setProductId={setProductId}
        categories={categories}
        products={products}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onReset={resetFilters}
      />

      {/* FORECAST DETAILS TABLE */}
      <ForecastTable items={items} loading={loading} onSelect={handleSelect} />

      {/* CHARTS VISUALIZATION */}
      <StockProjectionChart items={items} />

      {/* RECOMMENDATION DETAILS DIALOG */}
      <RecommendationPanel
        item={selectedItem}
        open={openRecommendation}
        loading={recommendationLoading}
        error={recommendationError}
        projection={projectionData}
        onClose={handleCloseRecommendation}
      />
    </Box>
  );
};

export default InventoryForecast;