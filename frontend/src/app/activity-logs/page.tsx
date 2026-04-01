"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { activityLogService } from "@/services/activity-log.service";
import { Navbar } from "@/components/layout/Navbar";
import { ActivityLog } from "@/types";

const actionLabels: Record<string, string> = {
  CUSTOMER_CREATED: "Customer Created",
  CUSTOMER_UPDATED: "Customer Updated",
  CUSTOMER_DELETED: "Customer Deleted",
  CUSTOMER_RESTORED: "Customer Restored",
  CUSTOMER_ASSIGNED: "Customer Assigned",
  NOTE_ADDED: "Note Added",
};

const actionColors: Record<string, string> = {
  CUSTOMER_CREATED: "bg-green-100 text-green-800",
  CUSTOMER_UPDATED: "bg-blue-100 text-blue-800",
  CUSTOMER_DELETED: "bg-red-100 text-red-800",
  CUSTOMER_RESTORED: "bg-purple-100 text-purple-800",
  CUSTOMER_ASSIGNED: "bg-yellow-100 text-yellow-800",
  NOTE_ADDED: "bg-indigo-100 text-indigo-800",
};

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: ["activity-logs", page],
    queryFn: () => activityLogService.getActivityLogs(page, limit),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track all activities and changes in your organization
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading activity logs...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            Error loading activity logs. Please try again.
          </div>
        )}

        {data && (
          <>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entity Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.data.map((log: ActivityLog) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              actionColors[log.action] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {actionLabels[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {log.entityType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {log.performedBy.name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {log.performedBy.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {log.metadata && (
                            <div className="max-w-xs">
                              {log.action === "CUSTOMER_RESTORED" && (
                                <div className="text-sm text-purple-700 font-medium">
                                  Restored customer
                                  {log.metadata.customerName
                                    ? `: ${log.metadata.customerName}`
                                    : ""}
                                </div>
                              )}
                              {log.action === "NOTE_ADDED" &&
                                log.metadata.notePreview && (
                                  <div>
                                    <span className="font-medium">Note:</span>{" "}
                                    {log.metadata.notePreview}
                                  </div>
                                )}
                              {log.action !== "CUSTOMER_RESTORED" &&
                                log.action !== "NOTE_ADDED" &&
                                log.metadata.customerName && (
                                  <div>
                                    <span className="font-medium">
                                      Customer:
                                    </span>{" "}
                                    {log.metadata.customerName}
                                  </div>
                                )}
                              {log.metadata.customerEmail && (
                                <div className="text-xs text-gray-400">
                                  {log.metadata.customerEmail}
                                </div>
                              )}
                              {log.metadata.assignedToName && (
                                <div>
                                  <span className="font-medium">
                                    Assigned to:
                                  </span>{" "}
                                  {log.metadata.assignedToName}
                                </div>
                              )}
                              {log.metadata.autoAssigned && (
                                <div className="text-xs text-green-600">
                                  Auto-assigned to creator
                                </div>
                              )}
                              {log.metadata.changes &&
                                Object.keys(log.metadata.changes).length >
                                  0 && (
                                  <div className="text-xs">
                                    <span className="font-medium">
                                      Changed:
                                    </span>{" "}
                                    {Object.entries(log.metadata.changes)
                                      .map(
                                        ([field, value]) =>
                                          `${field}: ${value.from ?? ""} → ${value.to ?? ""}`,
                                      )
                                      .join(", ")}
                                  </div>
                                )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.data.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No activity logs found.
                </div>
              )}
            </div>

            {data.meta.totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing page {page} of {data.meta.totalPages} (
                  {data.meta.total} total records)
                </div>
                <div className="flex space-x-2">
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
