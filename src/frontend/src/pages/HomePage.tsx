import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ChefHat, MapPin, Phone, Search } from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import type { Restaurant } from "../backend";
import { useActor } from "../hooks/useActor";

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: () => actor!.listRestaurants(true),
    enabled: !!actor,
  });

  const filtered = (restaurants ?? []).filter((r: Restaurant) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisineType.toLowerCase().includes(search.toLowerCase());
    const matchCuisine = !cuisineFilter || r.cuisineType === cuisineFilter;
    return matchSearch && matchCuisine;
  });

  const cuisines = [
    ...new Set((restaurants ?? []).map((r: Restaurant) => r.cuisineType)),
  ].filter(Boolean);

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
              Pasrur <em className="not-italic">Eats</em>
            </h1>
            <p className="text-xl opacity-90 mb-2">کھانا آپ کے دروازے تک</p>
            <p className="opacity-80 mb-8">
              Fresh meals delivered fast across Pasrur city
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-foreground/60" />
              <Input
                placeholder="Search restaurants or cuisine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card text-foreground h-12 text-base"
                data-ocid="home.search_input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Cuisine Filters */}
        {cuisines.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge
              variant={!cuisineFilter ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCuisineFilter("")}
              data-ocid="home.cuisine_filter.tab"
            >
              All
            </Badge>
            {cuisines.map((c) => (
              <Badge
                key={c}
                variant={cuisineFilter === c ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCuisineFilter(c)}
                data-ocid="home.cuisine.tab"
              >
                {c}
              </Badge>
            ))}
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-2xl font-display font-semibold">
            {filtered.length} Restaurant{filtered.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="home.restaurants.loading_state"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-16"
            data-ocid="home.restaurants.empty_state"
          >
            <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-lg">
              No restaurants found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="home.restaurants.list"
          >
            {filtered.map((r: Restaurant, i: number) => (
              <button
                type="button"
                key={r.id.toString()}
                onClick={() =>
                  onNavigate({ name: "restaurant", id: r.id.toString() })
                }
                data-ocid={`home.restaurant.item.${i + 1}`}
                className="text-left"
              >
                <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {r.name}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {r.cuisineType}
                        </Badge>
                      </div>
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <ChefHat className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {r.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {r.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {r.address}, {r.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{r.phone}</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
