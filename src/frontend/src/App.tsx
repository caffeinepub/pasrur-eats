import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { UserRole } from "./backend";
import Navbar from "./components/Navbar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import CartPage from "./pages/CartPage";
import HomePage from "./pages/HomePage";
import OrdersPage from "./pages/OrdersPage";
import RestaurantDashboardPage from "./pages/RestaurantDashboardPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";

export type Page =
  | { name: "home" }
  | { name: "restaurant"; id: string }
  | { name: "cart" }
  | { name: "orders" }
  | { name: "dashboard" }
  | { name: "admin" };

export const NavigationContext = {
  navigate: (_page: Page) => {},
};

export default function App() {
  const [page, setPage] = useState<Page>({ name: "home" });
  NavigationContext.navigate = setPage;

  const { identity } = useInternetIdentity();
  const { actor } = useActor();

  const { data: role } = useQuery({
    queryKey: ["userRole", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerUserRole(),
    enabled: !!actor && !!identity,
  });

  const isAdmin = role === UserRole.admin;

  const renderPage = () => {
    switch (page.name) {
      case "home":
        return <HomePage onNavigate={setPage} />;
      case "restaurant":
        return <RestaurantDetailPage id={page.id} onNavigate={setPage} />;
      case "cart":
        return <CartPage onNavigate={setPage} />;
      case "orders":
        return <OrdersPage />;
      case "dashboard":
        return <RestaurantDashboardPage />;
      case "admin":
        return isAdmin ? (
          <AdminDashboardPage />
        ) : (
          <HomePage onNavigate={setPage} />
        );
      default:
        return <HomePage onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage={page} onNavigate={setPage} />
      <main>{renderPage()}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
