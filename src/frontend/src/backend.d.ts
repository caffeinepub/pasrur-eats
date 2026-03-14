import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MenuItem {
    id: bigint;
    name: string;
    isAvailable: boolean;
    description: string;
    restaurantId: bigint;
    category: string;
    price: bigint;
}
export type Time = bigint;
export interface CartItem {
    restaurantId: bigint;
    quantity: bigint;
    menuItemId: bigint;
}
export interface DeliveryAddress {
    latitude: number;
    city: string;
    longitude: number;
    address: string;
    phone: string;
}
export interface Restaurant {
    id: bigint;
    latitude: number;
    isApproved: boolean;
    ownerId: Principal;
    city: string;
    name: string;
    cuisineType: string;
    description: string;
    isActive: boolean;
    longitude: number;
    address: string;
    phone: string;
}
export interface FoodOrder {
    id: bigint;
    status: OrderStatus;
    deliveryAddress: DeliveryAddress;
    createdAt: Time;
    restaurantId: bigint;
    totalAmount: bigint;
    customerId: Principal;
    items: Array<CartItem>;
}
export enum OrderStatus {
    preparing = "preparing",
    cancelled = "cancelled",
    pending = "pending",
    outForDelivery = "outForDelivery",
    delivered = "delivered",
    confirmed = "confirmed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addToCart(menuItemId: bigint, quantity: bigint): Promise<void>;
    approveRestaurant(restaurantId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCart(): Promise<void>;
    createMenuItem(restaurantId: bigint, name: string, description: string, price: bigint, category: string, isAvailable: boolean): Promise<bigint>;
    createRestaurant(name: string, description: string, cuisineType: string, address: string, city: string, phone: string, latitude: number, longitude: number): Promise<bigint>;
    getAllOrders(): Promise<Array<FoodOrder>>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getMenuItem(menuItemId: bigint): Promise<MenuItem>;
    getMenuItemsByRestaurant(restaurantId: bigint): Promise<Array<MenuItem>>;
    getOrdersByCustomer(customerId: Principal): Promise<Array<FoodOrder>>;
    getOrdersByRestaurant(restaurantId: bigint): Promise<Array<FoodOrder>>;
    getRestaurant(restaurantId: bigint): Promise<Restaurant>;
    getRestaurantsByOwner(ownerId: Principal): Promise<Array<Restaurant>>;
    isCallerAdmin(): Promise<boolean>;
    listRestaurants(onlyActive: boolean): Promise<Array<Restaurant>>;
    placeOrder(restaurantId: bigint, deliveryAddress: DeliveryAddress): Promise<bigint>;
    removeFromCart(menuItemId: bigint): Promise<void>;
    updateOrderStatus(orderId: bigint, newStatus: OrderStatus): Promise<void>;
    updateRestaurantStatus(restaurantId: bigint, isActive: boolean): Promise<void>;
}
