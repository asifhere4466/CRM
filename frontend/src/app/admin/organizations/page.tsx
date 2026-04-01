"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth.store";

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    users: number;
    customers: number;
    notes: number;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    notes: number;
  };
}

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedView, setSelectedView] = useState<
    "organizations" | "customers" | "notes"
  >("organizations");

  const { data: organizations, isLoading: loadingOrgs } = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: async () => {
      const response = await api.get<Organization[]>("/organizations");
      return response.data;
    },
    enabled: user?.role === "ADMIN",
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  const { data: allCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["admin-all-customers"],
    queryFn: async () => {
      const response = await api.get<Customer[]>(
        "/organizations/admin/customers",
      );
      return response.data;
    },
    enabled: selectedView === "customers" && user?.role === "ADMIN",
  });

  const { data: allNotes, isLoading: loadingNotes } = useQuery({
    queryKey: ["admin-all-notes"],
    queryFn: async () => {
      const response = await api.get("/organizations/admin/notes");
      return response.data;
    },
    enabled: selectedView === "notes" && user?.role === "ADMIN",
  });

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/customers");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all organizations - Admin only
          </p>
        </div>

        {/* View Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setSelectedView("organizations")}
              className={`${
                selectedView === "organizations"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Organizations
            </button>
            <button
              onClick={() => setSelectedView("customers")}
              className={`${
                selectedView === "customers"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Customers
            </button>
            <button
              onClick={() => setSelectedView("notes")}
              className={`${
                selectedView === "notes"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              All Notes
            </button>
          </nav>
        </div>

        {/* Organizations View */}
        {selectedView === "organizations" && (
          <>
            {loadingOrgs && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">Loading organizations...</p>
              </div>
            )}

            {organizations && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {org.name}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Users:</span>
                        <span className="font-medium text-gray-900">
                          {org._count.users}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Customers:</span>
                        <span className="font-medium text-gray-900">
                          {org._count.customers}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Notes:</span>
                        <span className="font-medium text-gray-900">
                          {org._count.notes}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-500">Created:</span>
                        <span className="text-gray-700">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* All Customers View */}
        {selectedView === "customers" && (
          <>
            {loadingCustomers && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">Loading customers...</p>
              </div>
            )}

            {allCustomers && (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {customer.organization.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.assignedTo?.name || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer._count.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {allCustomers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No customers found across all organizations.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* All Notes View */}
        {selectedView === "notes" && (
          <>
            {loadingNotes && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">Loading notes...</p>
              </div>
            )}

            {allNotes && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="space-y-4">
                  {allNotes.map((note: any) => (
                    <div
                      key={note.id}
                      className="border border-gray-200 rounded-md p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {note.organization.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{note.content}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Customer: {note.customer.name}</span>
                        <span className="mx-2">•</span>
                        <span>By: {note.createdBy.name}</span>
                      </div>
                    </div>
                  ))}

                  {allNotes.length === 0 && (
                    <p className="text-center text-gray-500">
                      No notes found across all organizations.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
