import api from "./api";

// ============================================================
// CUSTOMER TYPE
// ============================================================

export interface Customer {
  id: number;
  companyId: number;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  dateOfBirth?: string | null;
  gender?: string | null;

  customerType: string;
  customerSegment: string;
  preferredSalesChannel?: string | null;

  status: string;

  createdAt: string;
  updatedAt: string;
}

// ============================================================
// CREATE CUSTOMER TYPE
// ============================================================

export interface CustomerCreate {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;

  dateOfBirth?: string;
  gender?: string;

  customerType?: string;
  customerSegment?: string;
  preferredSalesChannel?: string;
}

// ============================================================
// UPDATE CUSTOMER TYPE
// ============================================================

export interface CustomerUpdate {
  firstName?: string;
  lastName?: string;

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

  status?: string;
}

// ============================================================
// GET ALL CUSTOMERS
// ============================================================

export const getCustomers = async (
  search: string = "",
  status: string = ""
): Promise<Customer[]> => {
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
): Promise<Customer> => {
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
): Promise<Customer> => {
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
): Promise<Customer> => {
  const response = await api.put(
    `/customers/${customerId}`,
    data
  );

  return response.data;
};

// ============================================================
// DELETE / SOFT DELETE
// ============================================================

export const deleteCustomer = async (
  customerId: number
): Promise<{
  message: string;
  customerId: number;
  status: string;
}> => {
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
): Promise<Customer> => {
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
): Promise<Customer> => {
  const response = await api.patch(
    `/customers/${customerId}/deactivate`
  );

  return response.data;
};