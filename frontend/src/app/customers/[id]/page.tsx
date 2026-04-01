"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService } from "@/services/customer.service";
import { noteService } from "@/services/note.service";
import { userService } from "@/services/user.service";
import { Navbar } from "@/components/layout/Navbar";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = params.id as string;

  const [noteContent, setNoteContent] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  // Reset modal state when component mounts or customerId changes
  useEffect(() => {
    setShowAssignModal(false);
    setSelectedUserId("");
    setError("");
  }, [customerId]);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customerService.getCustomer(customerId),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getUsers,
  });

  const createNoteMutation = useMutation({
    mutationFn: noteService.createNote,
    onSuccess: () => {
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) =>
      customerService.assignCustomer(customerId, { userId }),
    onSuccess: () => {
      setShowAssignModal(false);
      setSelectedUserId("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to assign customer");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerService.deleteCustomer(customerId),
    onSuccess: () => {
      router.push("/customers");
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    createNoteMutation.mutate({
      content: noteContent,
      customerId,
    });
  };

  const handleAssign = () => {
    if (!selectedUserId) return;
    assignMutation.mutate(selectedUserId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-red-600">Customer not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
          <div className="space-x-2">
            <button
              onClick={() => router.push(`/customers/${customerId}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Assign
            </button>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this customer?")) {
                  deleteMutation.mutate();
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="mt-1 text-lg text-gray-900">{customer.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-lg text-gray-900">{customer.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="mt-1 text-lg text-gray-900">
                {customer.phone || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Assigned To</p>
              <p className="mt-1 text-lg text-gray-900">
                {customer.assignedTo?.name || "Unassigned"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>

          <form onSubmit={handleAddNote} className="mb-6">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              rows={3}
            />
            <button
              type="submit"
              disabled={!noteContent.trim() || createNoteMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {createNoteMutation.isPending ? "Adding..." : "Add Note"}
            </button>
          </form>

          <div className="space-y-4">
            {customer.notes && customer.notes.length > 0 ? (
              customer.notes.map((note) => (
                <div
                  key={note.id}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <p className="text-gray-900">{note.content}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{note.createdBy.name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No notes yet.</p>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Assign Customer
            </h3>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="">Select user...</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>

            <div className="flex space-x-3">
              <button
                onClick={handleAssign}
                disabled={!selectedUserId || assignMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {assignMutation.isPending ? "Assigning..." : "Assign"}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUserId("");
                  setError("");
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
