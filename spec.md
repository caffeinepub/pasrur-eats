# Pasrur Eats - Food Delivery Marketplace

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Customer signup/login with phone number
- Restaurant listing page with search/filter
- Restaurant detail page with menu items and prices
- Add to cart functionality (per restaurant)
- Place order with cash on delivery payment
- Order status tracking (Pending, Confirmed, Preparing, Out for Delivery, Delivered)
- Restaurant dashboard: view/manage incoming orders, update order status
- Admin dashboard: manage restaurants (add, approve, disable), view all orders
- Role-based access: customer, restaurant_owner, admin
- Location display using static map embed (Google Maps iframe) for restaurant locations

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- User profiles with roles: customer, restaurant_owner, admin
- Restaurants: id, name, description, cuisine, address, location (lat/lng), phone, logo, isActive, ownerId
- MenuItems: id, restaurantId, name, description, price, category, isAvailable
- Cart: per-user, per-restaurant items
- Orders: id, customerId, restaurantId, items, totalAmount, status, deliveryAddress, phone, createdAt
- Order statuses: Pending, Confirmed, Preparing, OutForDelivery, Delivered, Cancelled
- APIs: register, login (phone-based), restaurant CRUD, menu CRUD, cart ops, order placement, order status updates

### Frontend
- Public pages: Home (restaurant listing), Restaurant detail + menu, Cart, Order tracking
- Auth pages: Customer signup/login by phone number
- Customer pages: My Orders, Order detail with status tracker
- Restaurant Owner pages: Dashboard with incoming orders, Update order status
- Admin pages: Manage restaurants (approve/disable), View all orders
- Navigation with role-aware links
- Google Maps iframe embed on restaurant detail page for location
