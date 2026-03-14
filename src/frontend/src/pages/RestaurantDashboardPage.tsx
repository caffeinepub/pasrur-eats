import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  PackageOpen,
  Plus,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OrderStatus } from "../backend";
import type { FoodOrder, Restaurant } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.pending]: "Pending",
  [OrderStatus.confirmed]: "Confirmed",
  [OrderStatus.preparing]: "Preparing",
  [OrderStatus.outForDelivery]: "Out for Delivery",
  [OrderStatus.delivered]: "Delivered",
  [OrderStatus.cancelled]: "Cancelled",
};

const NEXT_STATUS: Record<string, OrderStatus | null> = {
  [OrderStatus.pending]: OrderStatus.confirmed,
  [OrderStatus.confirmed]: OrderStatus.preparing,
  [OrderStatus.preparing]: OrderStatus.outForDelivery,
  [OrderStatus.outForDelivery]: OrderStatus.delivered,
  [OrderStatus.delivered]: null,
  [OrderStatus.cancelled]: null,
};

const STATUS_COLORS: Record<string, string> = {
  [OrderStatus.pending]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.confirmed]: "bg-blue-100 text-blue-800",
  [OrderStatus.preparing]: "bg-orange-100 text-orange-800",
  [OrderStatus.outForDelivery]: "bg-purple-100 text-purple-800",
  [OrderStatus.delivered]: "bg-green-100 text-green-800",
  [OrderStatus.cancelled]: "bg-red-100 text-red-800",
};

function CreateRestaurantDialog({ onCreated }: { onCreated: () => void }) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    cuisineType: "",
    address: "",
    city: "Pasrur",
    phone: "",
    latitude: "31.0",
    longitude: "74.6",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      actor!.createRestaurant(
        form.name,
        form.description,
        form.cuisineType,
        form.address,
        form.city,
        form.phone,
        Number.parseFloat(form.latitude),
        Number.parseFloat(form.longitude),
      ),
    onSuccess: () => {
      toast.success("Restaurant registered! Awaiting admin approval.");
      setOpen(false);
      onCreated();
    },
    onError: () => toast.error("Failed to register restaurant"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="dashboard.create_restaurant.open_modal_button"
          className="gap-1"
        >
          <Plus className="w-4 h-4" /> Register Restaurant
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="dashboard.create_restaurant.dialog">
        <DialogHeader>
          <DialogTitle>Register Your Restaurant</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {(
            ["name", "description", "cuisineType", "address", "phone"] as const
          ).map((field) => (
            <div key={field}>
              <Label htmlFor={field} className="capitalize">
                {field === "cuisineType" ? "Cuisine Type" : field}
              </Label>
              {field === "description" ? (
                <Textarea
                  id={field}
                  value={form[field]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  data-ocid={`dashboard.restaurant_${field}.textarea`}
                />
              ) : (
                <Input
                  id={field}
                  value={form[field]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  data-ocid={`dashboard.restaurant_${field}.input`}
                />
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Latitude</Label>
              <Input
                value={form.latitude}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, latitude: e.target.value }))
                }
                data-ocid="dashboard.restaurant_lat.input"
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                value={form.longitude}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, longitude: e.target.value }))
                }
                data-ocid="dashboard.restaurant_lng.input"
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={
              !form.name || !form.cuisineType || createMutation.isPending
            }
            data-ocid="dashboard.create_restaurant.submit_button"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Restaurant"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMenuItemDialog({
  restaurantId,
  onAdded,
}: { restaurantId: bigint; onAdded: () => void }) {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isAvailable: true,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      actor!.createMenuItem(
        restaurantId,
        form.name,
        form.description,
        BigInt(Number.parseInt(form.price) || 0),
        form.category,
        form.isAvailable,
      ),
    onSuccess: () => {
      toast.success("Menu item added!");
      setOpen(false);
      setForm({
        name: "",
        description: "",
        price: "",
        category: "",
        isAvailable: true,
      });
      onAdded();
    },
    onError: () => toast.error("Failed to add menu item"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          data-ocid="dashboard.add_menu_item.open_modal_button"
          className="gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="dashboard.add_menu_item.dialog">
        <DialogHeader>
          <DialogTitle>Add Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              data-ocid="dashboard.menu_name.input"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              placeholder="e.g. Burgers, Rice"
              data-ocid="dashboard.menu_category.input"
            />
          </div>
          <div>
            <Label>Price (Rs.)</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
              data-ocid="dashboard.menu_price.input"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              data-ocid="dashboard.menu_description.textarea"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isAvailable}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, isAvailable: v }))
              }
              id="avail"
              data-ocid="dashboard.menu_available.switch"
            />
            <Label htmlFor="avail">Available</Label>
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={!form.name || !form.price || createMutation.isPending}
            data-ocid="dashboard.add_menu_item.submit_button"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Item"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RestaurantDashboardPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: myRestaurants,
    isLoading: rLoading,
    refetch: refetchRestaurants,
  } = useQuery({
    queryKey: ["myRestaurants", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getRestaurantsByOwner(identity!.getPrincipal()),
    enabled: !!actor && !!identity,
  });

  const restaurant: Restaurant | undefined = myRestaurants?.[0];

  const {
    data: orders,
    isLoading: oLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["restaurantOrders", restaurant?.id.toString()],
    queryFn: () => actor!.getOrdersByRestaurant(restaurant!.id),
    enabled: !!actor && !!restaurant,
  });

  const { data: menuItems, refetch: refetchMenu } = useQuery({
    queryKey: ["menu", restaurant?.id.toString()],
    queryFn: () => actor!.getMenuItemsByRestaurant(restaurant!.id),
    enabled: !!actor && !!restaurant,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      status,
    }: { orderId: bigint; status: OrderStatus }) =>
      actor!.updateOrderStatus(orderId, status),
    onSuccess: () => {
      refetchOrders();
      toast.success("Order status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const filteredOrders = (orders ?? [])
    .filter(
      (o: FoodOrder) => statusFilter === "all" || o.status === statusFilter,
    )
    .sort(
      (a: FoodOrder, b: FoodOrder) => Number(b.createdAt) - Number(a.createdAt),
    );

  if (!identity) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">
          Please sign in to access the restaurant dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">
          Restaurant Dashboard
        </h1>
        {!rLoading && !restaurant && (
          <CreateRestaurantDialog onCreated={() => refetchRestaurants()} />
        )}
      </div>

      {rLoading ? (
        <Skeleton className="h-32 w-full" data-ocid="dashboard.loading_state" />
      ) : !restaurant ? (
        <div
          className="text-center py-16"
          data-ocid="dashboard.no_restaurant.empty_state"
        >
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-lg">
            No restaurant registered yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Register your restaurant to get started
          </p>
        </div>
      ) : (
        <>
          {/* Restaurant Info */}
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{restaurant.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {restaurant.cuisineType} • {restaurant.address}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                {restaurant.isApproved ? (
                  <Badge className="bg-green-100 text-green-800">
                    Approved
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </Badge>
                )}
                {restaurant.isActive ? (
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="orders">
            <TabsList data-ocid="dashboard.tabs">
              <TabsTrigger value="orders" data-ocid="dashboard.orders.tab">
                Orders
              </TabsTrigger>
              <TabsTrigger value="menu" data-ocid="dashboard.menu.tab">
                Menu Items
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Incoming Orders</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    className="w-44"
                    data-ocid="dashboard.orders_filter.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {oLoading ? (
                <div
                  data-ocid="dashboard.orders.loading_state"
                  className="space-y-3"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div
                  className="text-center py-12"
                  data-ocid="dashboard.orders.empty_state"
                >
                  <PackageOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              ) : (
                <div className="space-y-3" data-ocid="dashboard.orders.list">
                  {filteredOrders.map((order: FoodOrder, idx: number) => {
                    const nextStatus = NEXT_STATUS[order.status];
                    return (
                      <Card
                        key={order.id.toString()}
                        data-ocid={`dashboard.order.item.${idx + 1}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">
                                  Order #{order.id.toString()}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}
                                >
                                  {STATUS_LABELS[order.status]}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {order.items.length} item(s) • Rs.{" "}
                                {order.totalAmount.toString()}
                              </p>
                              <p className="text-sm mt-0.5">
                                <span className="text-muted-foreground">
                                  To:{" "}
                                </span>
                                {order.deliveryAddress.address} •{" "}
                                {order.deliveryAddress.phone}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap justify-end">
                              {nextStatus && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      orderId: order.id,
                                      status: nextStatus,
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  data-ocid="dashboard.order_advance.button"
                                >
                                  {STATUS_LABELS[nextStatus]}
                                </Button>
                              )}
                              {order.status !== OrderStatus.cancelled &&
                                order.status !== OrderStatus.delivered && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        orderId: order.id,
                                        status: OrderStatus.cancelled,
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    data-ocid="dashboard.order_cancel.delete_button"
                                  >
                                    Cancel
                                  </Button>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Menu Tab */}
            <TabsContent value="menu" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Menu Items</h3>
                <AddMenuItemDialog
                  restaurantId={restaurant.id}
                  onAdded={() => refetchMenu()}
                />
              </div>
              {!menuItems || menuItems.length === 0 ? (
                <div
                  className="text-center py-12"
                  data-ocid="dashboard.menu.empty_state"
                >
                  <UtensilsCrossed className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No menu items yet</p>
                </div>
              ) : (
                <div className="space-y-2" data-ocid="dashboard.menu.list">
                  {menuItems.map((item, idx) => (
                    <Card
                      key={item.id.toString()}
                      data-ocid={`dashboard.menu.item.${idx + 1}`}
                    >
                      <CardContent className="flex items-center justify-between p-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.category} • Rs. {item.price.toString()}
                          </p>
                        </div>
                        <Badge
                          variant={item.isAvailable ? "default" : "secondary"}
                        >
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
