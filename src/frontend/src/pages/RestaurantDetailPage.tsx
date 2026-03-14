import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Page } from "../App";
import type { MenuItem } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  id: string;
  onNavigate: (page: Page) => void;
}

export default function RestaurantDetailPage({ id, onNavigate }: Props) {
  const restaurantId = BigInt(id);
  const { actor } = useActor();
  const { identity, login } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { data: restaurant, isLoading: rLoading } = useQuery({
    queryKey: ["restaurant", id],
    queryFn: () => actor!.getRestaurant(restaurantId),
    enabled: !!actor,
  });

  const { data: menuItems, isLoading: mLoading } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => actor!.getMenuItemsByRestaurant(restaurantId),
    enabled: !!actor,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ menuItemId, qty }: { menuItemId: bigint; qty: number }) =>
      actor!.addToCart(menuItemId, BigInt(qty)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart!");
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const updateQty = (itemId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] ?? 1) + delta),
    }));
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!identity) {
      login();
      return;
    }
    const qty = quantities[item.id.toString()] ?? 1;
    addToCartMutation.mutate({ menuItemId: item.id, qty });
  };

  const grouped = (menuItems ?? []).reduce(
    (acc: Record<string, MenuItem[]>, item: MenuItem) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {},
  );

  const isLoading = rLoading || mLoading;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate({ name: "home" })}
        className="mb-4 gap-1"
        data-ocid="restaurant.back.button"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {isLoading ? (
        <div data-ocid="restaurant.loading_state" className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : restaurant ? (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="secondary">{restaurant.cuisineType}</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {restaurant.address}, {restaurant.city}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                {restaurant.phone}
              </span>
            </div>
            {restaurant.description && (
              <p className="text-muted-foreground mt-2">
                {restaurant.description}
              </p>
            )}
          </div>

          {restaurant.latitude !== 0 && restaurant.longitude !== 0 && (
            <div
              className="mb-6 rounded-xl overflow-hidden border border-border"
              data-ocid="restaurant.map_marker"
            >
              <iframe
                src={`https://maps.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}&z=15&output=embed`}
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                title="Restaurant location"
              />
            </div>
          )}

          <div className="space-y-8">
            {Object.keys(grouped).length === 0 ? (
              <div
                className="text-center py-12"
                data-ocid="restaurant.menu.empty_state"
              >
                <p className="text-muted-foreground">
                  No menu items available yet
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="text-xl font-display font-semibold mb-3 pb-2 border-b">
                    {category}
                  </h2>
                  <div className="space-y-3">
                    {(items as MenuItem[])
                      .filter((item) => item.isAvailable)
                      .map((item: MenuItem, idx: number) => (
                        <Card
                          key={item.id.toString()}
                          data-ocid={`restaurant.menu.item.${idx + 1}`}
                        >
                          <CardContent className="flex items-center justify-between gap-4 p-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-primary font-bold mt-1">
                                Rs. {item.price.toString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateQty(item.id.toString(), -1)
                                  }
                                  data-ocid="restaurant.qty_minus.button"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">
                                  {quantities[item.id.toString()] ?? 1}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    updateQty(item.id.toString(), 1)
                                  }
                                  data-ocid="restaurant.qty_plus.button"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                disabled={addToCartMutation.isPending}
                                data-ocid="restaurant.add_to_cart.button"
                                className="gap-1"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                Add
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div data-ocid="restaurant.error_state" className="text-center py-12">
          <p className="text-muted-foreground">Restaurant not found</p>
        </div>
      )}
    </div>
  );
}
