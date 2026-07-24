import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ---------------- GET ALL SALES ----------------

export const getSales = async (
  params?: {
    search?: string;
    categoryId?: number;
    salesChannel?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }
) => {
  const response = await API.get("/sales", {
    params,
  });

  return response.data;
};

// ---------------- GET SINGLE SALE ----------------

export const getSaleById = async (id: number) => {
  const response = await API.get(`/sales/${id}`);

  return response.data;
};

// ---------------- CREATE SALE ----------------

export const createSale = async (data: any) => {
  const response = await API.post(
    "/sales",
    data
  );

  return response.data;
};

// ---------------- UPDATE SALE ----------------

export const updateSale = async (
  id: number,
  data: any
) => {
  const response = await API.put(
    `/sales/${id}`,
    data
  );

  return response.data;
};

// ---------------- DELETE SALE ----------------

export const deleteSale = async (
  id: number
) => {
  const response = await API.delete(
    `/sales/${id}`
  );

  return response.data;
};

// ---------------- DASHBOARD SUMMARY ----------------

export const getSalesDashboard = async () => {
  const response = await API.get(
    "/sales/dashboard"
  );

  return response.data;
};