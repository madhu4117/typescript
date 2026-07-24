import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Button,
} from "@mui/material";
import {
  Category as CategoryIcon,
  Inventory as ProductIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface SummaryData {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalCategories: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchSummary = async () => {
      try {
        const response = await api.get("/dashboard/summary");
        setSummary(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const cards = [
    {
      title: "Total Categories",
      value: summary?.totalCategories ?? 0,
      icon: <CategoryIcon sx={{ fontSize: 40, color: "#fff" }} />,
      gradient: "linear-gradient(135deg, #aa3bff, #7c3aed)",
      path: "/categories",
      shadow: "0 10px 20px -5px rgba(139, 92, 246, 0.4)",
    },
    {
      title: "Total Products",
      value: summary?.totalProducts ?? 0,
      icon: <ProductIcon sx={{ fontSize: 40, color: "#fff" }} />,
      gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      path: "/products",
      shadow: "0 10px 20px -5px rgba(59, 130, 246, 0.4)",
    },
    {
      title: "Active Products",
      value: summary?.activeProducts ?? 0,
      icon: <ActiveIcon sx={{ fontSize: 40, color: "#fff" }} />,
      gradient: "linear-gradient(135deg, #10b981, #047857)",
      path: "/products?status=Active",
      shadow: "0 10px 20px -5px rgba(16, 185, 129, 0.4)",
    },
    {
      title: "Inactive Products",
      value: summary?.inactiveProducts ?? 0,
      icon: <InactiveIcon sx={{ fontSize: 40, color: "#fff" }} />,
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      path: "/products?status=Inactive",
      shadow: "0 10px 20px -5px rgba(245, 158, 11, 0.4)",
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Welcome Panel */}
      <Card
        sx={{
          mb: 4,
          borderRadius: "16px",
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          color: "#fff",
          p: 3,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <CardContent sx={{ p: "16px !important" }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
            Welcome Back, {user?.name || "Admin"}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 600 }}>
            Here is the current overview of your RetailPulse master data. Manage your categories, add products, keep track of catalog statuses, and monitor updates directly from your dashboard.
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h5" sx={{ mb: 3, color: "#0f172a", fontWeight: "bold" }}>
        System Summary
      </Typography>

      {/* Summary Cards Grid */}
      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            {loading ? (
              <Skeleton
                variant="rectangular"
                height={160}
                sx={{ borderRadius: "16px" }}
              />
            ) : (
              <Card
                onClick={() => navigate(card.path)}
                sx={{
                  height: "100%",
                  borderRadius: "16px",
                  background: card.gradient,
                  color: "#fff",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: card.shadow,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: card.shadow.replace("0.4", "0.6"),
                  },
                }}
              >
                {/* Decorative background circle */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                />

                <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "500" }}>
                      {card.title}
                    </Typography>
                    {card.icon}
                  </Box>
                  <Typography variant="h3" sx={{ mb: 1, fontWeight: "bold" }}>
                    {card.value}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: "auto", pt: 1, opacity: 0.8 }}>
                    <Typography variant="caption" sx={{ fontWeight: "500" }}>
                      Manage Module
                    </Typography>
                    <ChevronRightIcon fontSize="small" sx={{ ml: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        ))}
      </Grid>

      {/* Quick Links Section */}
      <Typography variant="h5" sx={{ mt: 5, mb: 3, color: "#0f172a", fontWeight: "bold" }}>
        Quick Management Controls
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
              p: 3,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: "#0f172a", fontWeight: "bold" }}>
                Category Directory
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure and edit target hierarchies, classify inventory groupings, and check totals under each classification.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/categories")}
                sx={{
                  bgcolor: "#aa3bff",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                  "&:hover": { bgcolor: "#8b27cf" },
                }}
              >
                Go to Categories
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            sx={{
              borderRadius: "16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e2e8f0",
              p: 3,
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: "#0f172a", fontWeight: "bold" }}>
                Product Master Catalog
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Register items, manage SKUs, track stock quantities, update brand details, and configure cost vs retail prices.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/products")}
                sx={{
                  bgcolor: "#3b82f6",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: "bold",
                  px: 3,
                  py: 1,
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                Go to Products
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
