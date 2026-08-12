import api from "./api";

export interface Customer {
  id: number;
  companyId?: number;

  firstName: string;
  lastName: string;

  email?: string | null;
  phone?: string | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;

  dateOfBirth?: string | null;
  gender?: string | null;

  customerType?: string | null;
  customerSegment?: string | null;
  preferredSalesChannel?: string | null;

  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerCreate {
  firstName: string;
  lastName: string;

  email?: string;
  phone?: string;

  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;

  dateOfBirth?: string;
  gender?: string;

  customerType?: string;
  customerSegment?: string;
  preferredSalesChannel?: string;
}

export interface CustomerUpdate
  extends Partial<CustomerCreate> {}

// ============================================================
// GET ALL CUSTOMERS
// ============================================================

export const getCustomers = async (
  search: string = "",
  status: string = ""
) => {
  const response = await api.get("/customers/", {
    params: {
      search: search || undefined,
      status: status || undefined,
    },
  });

  return response.data;
};

// ============================================================
// GET CUSTOMER BY ID
// ============================================================

export const getCustomer = async (
  customerId: number
) => {
  const response = await api.get(
    `/customers/${customerId}`
  );

  return response.data;
};

// ============================================================
// CREATE CUSTOMER
// ============================================================

export const createCustomer = async (
  data: CustomerCreate
) => {
  const response = await api.post(
    "/customers/",
    data
  );

  return response.data;
};

// ============================================================
// UPDATE CUSTOMER
// ============================================================

export const updateCustomer = async (
  customerId: number,
  data: CustomerUpdate
) => {
  const response = await api.put(
    `/customers/${customerId}`,
    data
  );

  return response.data;
};

// ============================================================
// DELETE / DEACTIVATE CUSTOMER
// ============================================================

export const deleteCustomer = async (
  customerId: number
) => {
  const response = await api.delete(
    `/customers/${customerId}`
  );

  return response.data;
};

// ============================================================
// ACTIVATE CUSTOMER
// ============================================================

export const activateCustomer = async (
  customerId: number
) => {
  const response = await api.patch(
    `/customers/${customerId}/activate`
  );

  return response.data;
};

// ============================================================
// DEACTIVATE CUSTOMER
// ============================================================

export const deactivateCustomer = async (
  customerId: number
) => {
  const response = await api.patch(
    `/customers/${customerId}/deactivate`
  );

  return response.data;
};