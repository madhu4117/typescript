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

import NotificationCenter from "./components/notifications/NotificationCenter";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            LOGIN
        ===================================================== */}

        <Route
          path="/"
          element={<Login />}
        />

        {/* =====================================================
            DASHBOARD LAYOUT
        ===================================================== */}

        <Route element={<DashboardLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/inventory"
            element={<Inventory />}
          />

          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/sales"
            element={<Sales />}
          />

          <Route
            path="/analytics"
            element={<AnalyticsDashboard />}
          />

          <Route
            path="/demand-forecasting"
            element={<DemandForecasting />}
          />

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

          <Route
            path="/data-import"
            element={<DataImport />}
          />

          {/* =================================================
              TASK 14 - NOTIFICATION CENTER
          ================================================= */}

          <Route
            path="/notifications"
            element={<NotificationCenter />}
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