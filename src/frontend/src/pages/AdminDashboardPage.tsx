import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle, PackageOpen, Store } from "lucide-react";
import { toast } from "sonner";
import { OrderStatus } from "../backend";
import type { FoodOrder, Restaurant } from "../backend";
import { useActor } from "../hooks/useActor";

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.pending]: "Pending",
  [OrderStatus.confirmed]: "Confirmed",
  [OrderStatus.preparing]: "Preparing",
  [OrderStatus.outForDelivery]: "Out for Delivery",
  [OrderStatus.delivered]: "Delivered",
  [OrderStatus.cancelled]: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  [OrderStatus.pending]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.confirmed]: "bg-blue-100 text-blue-800",
  [OrderStatus.preparing]: "bg-orange-100 text-orange-800",
  [OrderStatus.outForDelivery]: "bg-purple-100 text-purple-800",
  [OrderStatus.delivered]: "bg-green-100 text-green-800",
  [OrderStatus.cancelled]: "bg-red-100 text-red-800",
};

export default function AdminDashboardPage() {
  const { actor } = useActor();

  const {
    data: restaurants,
    isLoading: rLoading,
    refetch: refetchRestaurants,
  } = useQuery({
    queryKey: ["allRestaurants"],
    queryFn: () => actor!.listRestaurants(false),
    enabled: !!actor,
  });

  const { data: orders, isLoading: oLoading } = useQuery({
    queryKey: ["allOrders"],
    queryFn: () => actor!.getAllOrders(),
    enabled: !!actor,
  });

  const approveMutation = useMutation({
    mutationFn: (id: bigint) => actor!.approveRestaurant(id),
    onSuccess: () => {
      refetchRestaurants();
      toast.success("Restaurant approved!");
    },
    onError: () => toast.error("Failed to approve restaurant"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: bigint; active: boolean }) =>
      actor!.updateRestaurantStatus(id, active),
    onSuccess: () => {
      refetchRestaurants();
      toast.success("Status updated");
    },
  });

  const sortedOrders = [...(orders ?? [])].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="restaurants">
        <TabsList data-ocid="admin.tabs">
          <TabsTrigger value="restaurants" data-ocid="admin.restaurants.tab">
            Restaurants
          </TabsTrigger>
          <TabsTrigger value="orders" data-ocid="admin.orders.tab">
            All Orders
          </TabsTrigger>
        </TabsList>

        {/* Restaurants Tab */}
        <TabsContent value="restaurants" className="mt-4">
          {rLoading ? (
            <div
              data-ocid="admin.restaurants.loading_state"
              className="space-y-3"
            >
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !restaurants || restaurants.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.restaurants.empty_state"
            >
              <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No restaurants yet</p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="admin.restaurants.list">
              {restaurants.map((r: Restaurant, idx: number) => (
                <Card
                  key={r.id.toString()}
                  data-ocid={`admin.restaurant.item.${idx + 1}`}
                >
                  <CardContent className="flex items-center justify-between gap-4 p-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.cuisineType} • {r.city}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={r.isApproved ? "default" : "secondary"}>
                        {r.isApproved ? "Approved" : "Pending"}
                      </Badge>
                      {!r.isApproved && (
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(r.id)}
                          disabled={approveMutation.isPending}
                          data-ocid="admin.approve_restaurant.button"
                          className="gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={r.isActive}
                          onCheckedChange={(v) =>
                            toggleActiveMutation.mutate({ id: r.id, active: v })
                          }
                          data-ocid="admin.restaurant_active.switch"
                        />
                        <span className="text-sm">
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          {oLoading ? (
            <div data-ocid="admin.orders.loading_state" className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sortedOrders.length === 0 ? (
            <div
              className="text-center py-12"
              data-ocid="admin.orders.empty_state"
            >
              <PackageOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2" data-ocid="admin.orders.list">
              {sortedOrders.map((order: FoodOrder, idx: number) => (
                <Card
                  key={order.id.toString()}
                  data-ocid={`admin.order.item.${idx + 1}`}
                >
                  <CardContent className="flex items-center justify-between gap-4 p-4 flex-wrap">
                    <div>
                      <span className="font-semibold">
                        Order #{order.id.toString()}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          Number(order.createdAt) / 1_000_000,
                        ).toLocaleString()}{" "}
                        • {order.items.length} item(s)
                      </p>
                      <p className="text-sm">
                        {order.deliveryAddress.address},{" "}
                        {order.deliveryAddress.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">
                        Rs. {order.totalAmount.toString()}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
