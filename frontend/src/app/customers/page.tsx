"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { customerService } from "@/services/customer.service";
import { useDebounce } from "@/hooks/useDebounce";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/auth.store";

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "deleted">(
    "all",
  );
  const debouncedSearch = useDebounce(search, 500);

  const includeDeleted = user?.role === "ADMIN" && activeTab !== "active";

  const { data, isLoading, error } = useQuery<
    import("@/types").PaginatedResponse<import("@/types").Customer>,
    Error
  >({
    queryKey: ["customers", page, debouncedSearch, activeTab],
    queryFn: () =>
      customerService.getCustomers(page, 20, debouncedSearch, includeDeleted),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 3,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => customerService.restoreCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500">
              (Admins see deleted customers and can restore)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 text-sm font-medium focus:outline-none ${
                  activeTab === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All Customers
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`px-4 py-2 text-sm font-medium focus:outline-none ${
                  activeTab === "active"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Active
              </button>
              {user?.role === "ADMIN" && (
                <button
                  onClick={() => setActiveTab("deleted")}
                  className={`px-4 py-2 text-sm font-medium focus:outline-none ${
                    activeTab === "deleted"
                      ? "bg-red-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Deleted
                </button>
              )}
            </div>
            <button
              onClick={() => router.push("/customers/create")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Add Customer
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            Error loading customers. Please try again.
          </div>
        )}

        {data && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {activeTab === "all" &&
                  "Showing all customers (including deleted)."}
                {activeTab === "active" && "Showing only active customers."}
                {activeTab === "deleted" &&
                  "Showing only deleted (soft-deleted) customers."}
              </p>
            </div>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(activeTab === "all"
                    ? data.data
                    : activeTab === "active"
                      ? data.data.filter((customer) => !customer.deletedAt)
                      : data.data.filter((customer) => !!customer.deletedAt)
                  ).map((customer) => (
                    <tr
                      key={customer.id}
                      className={`${
                        customer.deletedAt
                          ? "bg-red-50 opacity-80 cursor-default "
                          : "hover:bg-gray-50 cursor-pointer "
                      }`}
                      onClick={() => {
                        if (!customer.deletedAt) {
                          router.push(`/customers/${customer.id}`);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.phone || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.assignedTo?.name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer._count?.notes || 0}
                      </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {!customer.deletedAt && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/customers/${customer.id}`);
                              }}
                              className="text-gray-600 hover:text-gray-900 mr-4"
                              title="View customer details"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 inline"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/customers/${customer.id}/edit`);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                          </>
                        )}
                        {user?.role === "ADMIN" && customer.deletedAt && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await restoreMutation.mutateAsync(customer.id);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.data.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No customers found.
                </div>
              )}
            </div>

            {data.meta.totalPages > 1 && (
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {page} of {data.meta.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.meta.totalPages, p + 1))
                  }
                  disabled={page === data.meta.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
