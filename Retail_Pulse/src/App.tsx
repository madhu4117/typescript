import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import AuditLogs from "./pages/AuditLogs";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import DemandForecasting from "./pages/DemandForecasting";
import Customers from "./pages/Customers";
import SalesAnalytics from "./pages/SalesAnalytics";
import InventoryForecast from "./pages/InventoryForecast";
import DataImport from "./pages/DataImport";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
        ===================================================== */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* =====================================================
            DASHBOARD LAYOUT
        ===================================================== */}

        <Route element={<DashboardLayout />}>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Categories */}
          <Route
            path="/categories"
            element={<Categories />}
          />

          {/* Products */}
          <Route
            path="/products"
            element={<Products />}
          />

          {/* Inventory */}
          <Route
            path="/inventory"
            element={<Inventory />}
          />

          {/* Customers */}
          <Route
            path="/customers"
            element={<Customers />}
          />

          {/* Sales */}
          <Route
            path="/sales"
            element={<Sales />}
          />

          {/* Analytics */}
          <Route
            path="/analytics"
            element={<AnalyticsDashboard />}
          />

          {/* Demand Forecasting */}
          <Route
            path="/demand-forecasting"
            element={<DemandForecasting />}
          />

          {/* Audit Logs */}
          <Route
            path="/audit-logs"
            element={<AuditLogs />}
          />
          <Route
            path="/inventory/forecast" 
            element={<InventoryForecast />}
            />

          <Route
            path="/analytics/sales"
            element={<SalesAnalytics />}
          />

          {/* Data Import & Integration Management */}
          <Route
            path="/data-import"
            element={<DataImport />}
          />

        </Route>

        {/* =====================================================
            UNKNOWN ROUTE
        ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;