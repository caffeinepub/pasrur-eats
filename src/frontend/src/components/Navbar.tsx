import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Shield,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import type { Page } from "../App";
import { UserRole } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { actor } = useActor();

  const { data: role } = useQuery({
    queryKey: ["userRole", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCallerUserRole(),
    enabled: !!actor && !!identity,
  });

  const { data: cart } = useQuery({
    queryKey: ["cart", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCart(),
    enabled: !!actor && !!identity,
  });

  const { data: myRestaurants } = useQuery({
    queryKey: ["myRestaurants", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getRestaurantsByOwner(identity!.getPrincipal()),
    enabled: !!actor && !!identity,
  });

  const cartCount =
    cart?.reduce((sum, item) => sum + Number(item.quantity), 0) ?? 0;
  const isAdmin = role === UserRole.admin;
  const isOwner = (myRestaurants?.length ?? 0) > 0;

  const handleLogout = () => {
    clear();
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          onClick={() => onNavigate({ name: "home" })}
          data-ocid="nav.home.link"
          className="flex items-center gap-2 group"
        >
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display text-xl font-bold text-foreground">
              Pasrur
            </span>
            <span className="font-display text-xl font-bold text-primary">
              {" "}
              Eats
            </span>
          </div>
        </button>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {identity && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate({ name: "orders" })}
                data-ocid="nav.orders.link"
              >
                My Orders
              </Button>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate({ name: "dashboard" })}
                  data-ocid="nav.dashboard.link"
                  className="gap-1"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              )}

              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate({ name: "admin" })}
                  data-ocid="nav.admin.link"
                  className="gap-1"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate({ name: "cart" })}
                data-ocid="nav.cart.link"
                className="gap-1"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart
                {cartCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </>
          )}

          {identity ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-ocid="nav.logout.button"
              className="gap-1"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              data-ocid="nav.login.button"
              className="gap-1"
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
