import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CheckCircle,
  ChefHat,
  PackageOpen,
  Truck,
  XCircle,
} from "lucide-react";
import { OrderStatus } from "../backend";
import type { FoodOrder } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  [OrderStatus.pending]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: PackageOpen,
  },
  [OrderStatus.confirmed]: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: Check,
  },
  [OrderStatus.preparing]: {
    label: "Preparing",
    color: "bg-orange-100 text-orange-800",
    icon: ChefHat,
  },
  [OrderStatus.outForDelivery]: {
    label: "Out for Delivery",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  [OrderStatus.cancelled]: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const ORDER_STEPS = [
  OrderStatus.pending,
  OrderStatus.confirmed,
  OrderStatus.preparing,
  OrderStatus.outForDelivery,
  OrderStatus.delivered,
];

function StatusTracker({ status }: { status: string }) {
  const currentIdx = ORDER_STEPS.indexOf(status as OrderStatus);
  if (currentIdx === -1 || status === OrderStatus.cancelled) return null;

  return (
    <div className="flex items-center gap-1 mt-3">
      {ORDER_STEPS.map((step, idx) => {
        const cfg = STATUS_CONFIG[step];
        const Icon = cfg.icon;
        const done = idx <= currentIdx;
        return (
          <>
            <div
              key={step}
              className="flex flex-col items-center gap-0.5 flex-1"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span
                className={`text-xs text-center leading-tight ${done ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                {cfg.label}
              </span>
            </div>
            {idx < ORDER_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded ${idx < currentIdx ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["myOrders", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getOrdersByCustomer(identity!.getPrincipal()),
    enabled: !!actor && !!identity,
  });

  const sorted = [...(orders ?? [])].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  if (!identity) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <PackageOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium mb-2">Sign in to view your orders</p>
        <Button onClick={login} data-ocid="orders.login.button">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold mb-6">My Orders</h1>

      {isLoading ? (
        <div data-ocid="orders.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16" data-ocid="orders.empty_state">
          <PackageOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-lg">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4" data-ocid="orders.list">
          {sorted.map((order: FoodOrder, idx: number) => {
            const cfg =
              STATUS_CONFIG[order.status] ?? STATUS_CONFIG[OrderStatus.pending];
            const Icon = cfg.icon;
            return (
              <Card
                key={order.id.toString()}
                data-ocid={`orders.item.${idx + 1}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Order #{order.id.toString()}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          Number(order.createdAt) / 1_000_000,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} item(s)
                    </p>
                    <p className="font-bold text-primary">
                      Rs. {order.totalAmount.toString()}
                    </p>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Delivery to: </span>
                    {order.deliveryAddress.address},{" "}
                    {order.deliveryAddress.city}
                  </p>
                  <StatusTracker status={order.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
