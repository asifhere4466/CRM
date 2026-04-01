"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">CRM System</h1>
            <div className="ml-10 flex space-x-4">
              <button
                onClick={() => router.push("/customers")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname?.startsWith("/customers")
                    ? "text-blue-700 border-b-2 border-blue-700"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Customers
              </button>
              <button
                onClick={() => router.push("/activity-logs")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname?.startsWith("/activity-logs")
                    ? "text-blue-700 border-b-2 border-blue-700"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Activity Logs
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => router.push("/users")}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname?.startsWith("/users")
                        ? "text-blue-700 border-b-2 border-blue-700"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => router.push("/admin/organizations")}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${pathname?.startsWith(
                      "/admin/organizations",
                    )
                    // ? "text-purple-700 border-b-2 border-purple-700"
                    // : "text-purple-700 hover:text-purple-900"
                    }`}
                  >
                    All Organizations
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <div className="flex items-center justify-end gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    isAdmin
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm font-medium text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
