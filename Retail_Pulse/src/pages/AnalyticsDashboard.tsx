import { useEffect, useState } from "react";

import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
} from "@mui/material";

import {
  getDashboardSummary,
  getRevenueTrend,
  getTopProducts,
  getCategorySales,
  getPaymentMethods,
  getSalesChannel,
  getInventoryStatus,
  getLowStockProducts,
  getOutOfStockProducts,
  getInventoryValue,
  exportCSV,
  exportPDF,

  // Sales Analytics
  getSalesAnalyticsDashboard,
  getSalesAnalyticsGrowth,
  getSalesAnalyticsByChannel,
  getSalesAnalyticsByPaymentMethod,
} from "../services/analyticsService";

import DashboardFilters from "../components/analytics/DashboardFilters";
import RevenueChart from "../components/analytics/RevenueChart";
import TopProductsChart from "../components/analytics/TopProductsChart";
import CategoryChart from "../components/analytics/CategoryChart";
import PaymentChart from "../components/analytics/PaymentChart";
import SalesChannelChart from "../components/analytics/SalesChannelChart";
import InventoryChart from "../components/analytics/InventoryChart";
import LowStockChart from "../components/analytics/LowStockChart";
import OutOfStockTable from "../components/analytics/OutOfStockTable";
import InventoryValueChart from "../components/analytics/InventoryValueChart";

import SalesGrowthChart from "../components/analytics/SalesGrowthChart";
import SalesAnalyticsChannelChart from "../components/analytics/SalesAnalyticsChannelChart";
import SalesPaymentChart from "../components/analytics/SalesPaymentChart";


export default function AnalyticsDashboard() {

  // =====================================================
  // EXISTING ANALYTICS
  // =====================================================

  const [summary, setSummary] =
    useState<any>(null);

  const [revenueData, setRevenueData] =
    useState<any[]>([]);

  const [topProducts, setTopProducts] =
    useState<any[]>([]);

  const [categoryData, setCategoryData] =
    useState<any[]>([]);

  const [paymentData, setPaymentData] =
    useState<any[]>([]);

  const [salesChannelData, setSalesChannelData] =
    useState<any[]>([]);

  const [inventoryData, setInventoryData] =
    useState<any[]>([]);

  const [lowStockData, setLowStockData] =
    useState<any[]>([]);

  const [outOfStockData, setOutOfStockData] =
    useState<any[]>([]);

  const [inventoryValueData, setInventoryValueData] =
    useState<any[]>([]);


  // =====================================================
  // FILTERS
  // =====================================================

  const [salesChannel, setSalesChannel] =
    useState("All");

  const [paymentMethod, setPaymentMethod] =
    useState("All");


  // =====================================================
  // SALES ANALYTICS
  // =====================================================

  const [salesAnalytics, setSalesAnalytics] =
    useState<any>(null);

  const [salesGrowth, setSalesGrowth] =
    useState<any[]>([]);

  const [salesByChannel, setSalesByChannel] =
    useState<any[]>([]);

  const [salesByPayment, setSalesByPayment] =
    useState<any[]>([]);


  // =====================================================
  // LOAD DASHBOARD
  // =====================================================

  useEffect(() => {
    loadDashboard();
  }, []);


  const loadDashboard = async () => {

    try {

      // =================================================
      // EXISTING ANALYTICS
      // =================================================

      const summaryData =
        await getDashboardSummary();

      setSummary(summaryData);


      const revenue =
        await getRevenueTrend();

      setRevenueData(revenue);


      const products =
        await getTopProducts();

      setTopProducts(products);


      const category =
        await getCategorySales();

      setCategoryData(category);


      const payment =
        await getPaymentMethods();

      setPaymentData(payment);


      const channel =
        await getSalesChannel();

      setSalesChannelData(channel);


      const inventory =
        await getInventoryStatus();

      setInventoryData(inventory);


      const lowStock =
        await getLowStockProducts();

      setLowStockData(lowStock);


      const outOfStock =
        await getOutOfStockProducts();

      setOutOfStockData(outOfStock);


      const inventoryValue =
        await getInventoryValue();

      setInventoryValueData(
        inventoryValue
      );


      // =================================================
      // SALES ANALYTICS
      // =================================================

      const salesDashboard =
        await getSalesAnalyticsDashboard();

      setSalesAnalytics(
        salesDashboard
      );


      const growth =
        await getSalesAnalyticsGrowth();

      setSalesGrowth(growth);


      const channelAnalytics =
        await getSalesAnalyticsByChannel();

      setSalesByChannel(
        channelAnalytics
      );


      const paymentAnalytics =
        await getSalesAnalyticsByPaymentMethod();

      setSalesByPayment(
        paymentAnalytics
      );

    } catch (error) {

      console.error(
        "Analytics dashboard error:",
        error
      );

    }

  };


  // =====================================================
  // EXPORT CSV
  // =====================================================

  const downloadCSV = async () => {

    try {

      const blob =
        await exportCSV();

      const url =
        window.URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        "dashboard.csv";

      a.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(error);

    }

  };


  // =====================================================
  // EXPORT PDF
  // =====================================================

  const downloadPDF = async () => {

    try {

      const blob =
        await exportPDF();

      const url =
        window.URL.createObjectURL(blob);

      const a =
        document.createElement("a");

      a.href = url;

      a.download =
        "dashboard.pdf";

      a.click();

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(error);

    }

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (!summary) {

    return (
      <Typography>
        Loading...
      </Typography>
    );

  }


  return (

    <Box p={3}>

      {/* =================================================
          TITLE
      ================================================= */}

      <Typography
        variant="h4"
        mb={3}
      >
        Retail Analytics Dashboard
      </Typography>


      {/* =================================================
          EXPORT BUTTONS
      ================================================= */}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
        }}
      >

        <Button
          variant="contained"
          onClick={downloadCSV}
        >
          Export CSV
        </Button>


        <Button
          variant="contained"
          color="secondary"
          onClick={downloadPDF}
        >
          Export PDF
        </Button>

      </Box>


      {/* =================================================
          FILTERS
      ================================================= */}

      <DashboardFilters
        salesChannel={salesChannel}
        paymentMethod={paymentMethod}
        onSalesChannelChange={
          setSalesChannel
        }
        onPaymentMethodChange={
          setPaymentMethod
        }
      />


      {/* =================================================
          EXISTING KPI CARDS
      ================================================= */}

      <Grid
        container
        spacing={2}
      >

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Total Revenue
            </Typography>

            <Typography variant="h5">
              ₹ {summary.totalRevenue}
            </Typography>

          </Paper>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Total Orders
            </Typography>

            <Typography variant="h5">
              {summary.totalOrders}
            </Typography>

          </Paper>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Products Sold
            </Typography>

            <Typography variant="h5">
              {summary.totalProductsSold}
            </Typography>

          </Paper>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Average Order Value
            </Typography>

            <Typography variant="h5">
              ₹ {summary.averageOrderValue}
            </Typography>

          </Paper>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Total Inventory Value
            </Typography>

            <Typography variant="h5">
              ₹ {summary.totalInventoryValue}
            </Typography>

          </Paper>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Low Stock Products
            </Typography>

            <Typography variant="h5">
              {summary.lowStockProducts}
            </Typography>

          </Paper>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Out Of Stock Products
            </Typography>

            <Typography variant="h5">
              {summary.outOfStockProducts}
            </Typography>

          </Paper>

        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >

          <Paper sx={{ p: 2 }}>

            <Typography>
              Total Categories
            </Typography>

            <Typography variant="h5">
              {summary.totalCategories}
            </Typography>

          </Paper>

        </Grid>

      </Grid>


      {/* =================================================
          SALES ANALYTICS
      ================================================= */}

      {salesAnalytics && (

        <>

          <Typography
            variant="h5"
            sx={{
              mt: 5,
              mb: 2,
              fontWeight: 600,
            }}
          >
            Sales Analytics
          </Typography>


          <Grid
            container
            spacing={2}
          >

            {/* Sales Orders */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
            >

              <Paper sx={{ p: 3 }}>

                <Typography
                  color="text.secondary"
                >
                  Sales Orders
                </Typography>

                <Typography variant="h4">
                  {
                    salesAnalytics.totalOrders
                  }
                </Typography>

              </Paper>

            </Grid>


            {/* Sales Revenue */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
            >

              <Paper sx={{ p: 3 }}>

                <Typography
                  color="text.secondary"
                >
                  Sales Revenue
                </Typography>

                <Typography variant="h4">
                  ₹{" "}
                  {
                    salesAnalytics.totalRevenue
                  }
                </Typography>

              </Paper>

            </Grid>


            {/* Average Order Value */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
            >

              <Paper sx={{ p: 3 }}>

                <Typography
                  color="text.secondary"
                >
                  Average Order Value
                </Typography>

                <Typography variant="h4">
                  ₹{" "}
                  {
                    salesAnalytics.averageOrderValue
                  }
                </Typography>

              </Paper>

            </Grid>

          </Grid>

        </>

      )}


      {/* =================================================
          SALES GROWTH
      ================================================= */}

      <Box mt={5}>

        <SalesGrowthChart
          data={salesGrowth}
        />

      </Box>


      {/* =================================================
          SALES BY CHANNEL
      ================================================= */}

      <Box mt={5}>

        <SalesAnalyticsChannelChart
          data={salesByChannel}
        />

      </Box>


      {/* =================================================
          SALES BY PAYMENT METHOD
      ================================================= */}

      <Box mt={5}>

        <SalesPaymentChart
          data={salesByPayment}
        />

      </Box>


      {/* =================================================
          EXISTING REVENUE
      ================================================= */}

      <Box mt={5}>

        <RevenueChart
          data={revenueData}
        />

      </Box>


      {/* =================================================
          TOP PRODUCTS
      ================================================= */}

      <Box mt={5}>

        <TopProductsChart
          data={topProducts}
        />

      </Box>


      {/* =================================================
          CATEGORY SALES
      ================================================= */}

      <Box mt={5}>

        <CategoryChart
          data={categoryData}
        />

      </Box>


      {/* =================================================
          EXISTING PAYMENT CHART
      ================================================= */}

      <Box mt={5}>

        <PaymentChart
          data={paymentData}
        />

      </Box>


      {/* =================================================
          EXISTING SALES CHANNEL
      ================================================= */}

      <Box mt={5}>

        <SalesChannelChart
          data={salesChannelData}
        />

      </Box>


      {/* =================================================
          INVENTORY
      ================================================= */}

      <Box mt={5}>

        <InventoryChart
          data={inventoryData}
        />

      </Box>


      {/* =================================================
          LOW STOCK
      ================================================= */}

      <Box mt={5}>

        <LowStockChart
          data={lowStockData}
        />

      </Box>


      {/* =================================================
          OUT OF STOCK
      ================================================= */}

      <Box mt={5}>

        <OutOfStockTable
          data={outOfStockData}
        />

      </Box>


      {/* =================================================
          INVENTORY VALUE
      ================================================= */}

      <Box mt={5}>

        <InventoryValueChart
          data={inventoryValueData}
        />

      </Box>

    </Box>

  );
}