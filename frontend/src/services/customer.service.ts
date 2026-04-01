import api from "./api";
import {
  Customer,
  PaginatedResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
  AssignCustomerInput,
} from "@/types";

export const customerService = {
  async getCustomers(
    page: number = 1,
    limit: number = 20,
    search?: string,
    includeDeleted: boolean = false,
  ): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append("search", search);
    }
    if (includeDeleted) {
      params.append("includeDeleted", "true");
    }
    const response = await api.get<PaginatedResponse<Customer>>(
      `/customers?${params.toString()}`,
    );
    return response.data;
  },

  async getCustomer(id: string): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(data: CreateCustomerInput): Promise<Customer> {
    const response = await api.post<Customer>("/customers", data);
    return response.data;
  },

  async updateCustomer(
    id: string,
    data: UpdateCustomerInput,
  ): Promise<Customer> {
    const response = await api.patch<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/customers/${id}`);
    return response.data;
  },

  async restoreCustomer(id: string): Promise<Customer> {
    const response = await api.post<Customer>(`/customers/${id}/restore`);
    return response.data;
  },

  async assignCustomer(
    id: string,
    data: AssignCustomerInput,
  ): Promise<Customer> {
    const response = await api.post<Customer>(`/customers/${id}/assign`, data);
    return response.data;
  },
};
