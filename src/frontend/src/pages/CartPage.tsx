import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { CartItem, MenuItem } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  onNavigate: (page: Page) => void;
}

export default function CartPage({ onNavigate }: Props) {
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ["cart", identity?.getPrincipal().toString()],
    queryFn: () => actor!.getCart(),
    enabled: !!actor && !!identity,
  });

  const { data: menuItemsMap } = useQuery({
    queryKey: [
      "cartMenuItems",
      (cart ?? []).map((i: CartItem) => i.menuItemId.toString()).join(","),
    ],
    queryFn: async () => {
      const map: Record<string, MenuItem> = {};
      await Promise.all(
        (cart ?? []).map(async (cartItem: CartItem) => {
          const item = await actor!.getMenuItem(cartItem.menuItemId);
          map[cartItem.menuItemId.toString()] = item;
        }),
      );
      return map;
    },
    enabled: !!actor && !!cart && cart.length > 0,
  });

  const removeMutation = useMutation({
    mutationFn: (menuItemId: bigint) => actor!.removeFromCart(menuItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed");
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => actor!.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Cart cleared");
    },
  });

  const placeMutation = useMutation({
    mutationFn: async () => {
      if (!cart || cart.length === 0) throw new Error("Cart is empty");
      const rId = cart[0].restaurantId;
      return actor!.placeOrder(rId, {
        address: deliveryAddress,
        city: "Pasrur",
        phone: deliveryPhone,
        latitude: 0,
        longitude: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      toast.success("Order placed! Cash on delivery.");
      onNavigate({ name: "orders" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to place order"),
  });

  const total = (cart ?? []).reduce((sum: number, item: CartItem) => {
    const menuItem = menuItemsMap?.[item.menuItemId.toString()];
    return (
      sum + (menuItem ? Number(menuItem.price) * Number(item.quantity) : 0)
    );
  }, 0);

  if (!identity) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-lg font-medium mb-2">Sign in to view your cart</p>
        <Button onClick={login} data-ocid="cart.login.button">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold mb-6">Your Cart</h1>

      {cartLoading ? (
        <div data-ocid="cart.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !cart || cart.length === 0 ? (
        <div className="text-center py-16" data-ocid="cart.empty_state">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-lg">Your cart is empty</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onNavigate({ name: "home" })}
            data-ocid="cart.browse.button"
          >
            Browse Restaurants
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Items ({cart.length})</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                data-ocid="cart.clear.button"
                className="text-destructive hover:text-destructive gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.map((cartItem: CartItem, idx: number) => {
                const menuItem = menuItemsMap?.[cartItem.menuItemId.toString()];
                return (
                  <div
                    key={cartItem.menuItemId.toString()}
                    className="flex items-center justify-between gap-2"
                    data-ocid={`cart.item.${idx + 1}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {menuItem?.name ?? "Loading..."}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rs. {menuItem ? Number(menuItem.price) : "..."} ×{" "}
                        {cartItem.quantity.toString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">
                        Rs.{" "}
                        {menuItem
                          ? Number(menuItem.price) * Number(cartItem.quantity)
                          : "..."}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() =>
                          removeMutation.mutate(cartItem.menuItemId)
                        }
                        data-ocid={`cart.remove.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">Rs. {total}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="address">Delivery Address</Label>
                <Input
                  id="address"
                  placeholder="Street, Area"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  data-ocid="cart.address.input"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="03XX-XXXXXXX"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  data-ocid="cart.phone.input"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-accent rounded-lg">
                <Banknote className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">
                    Pay when your order arrives
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  COD
                </Badge>
              </div>
              <Button
                className="w-full"
                disabled={
                  !deliveryAddress || !deliveryPhone || placeMutation.isPending
                }
                onClick={() => placeMutation.mutate()}
                data-ocid="cart.place_order.submit_button"
              >
                {placeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order — Rs. ${total}`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
