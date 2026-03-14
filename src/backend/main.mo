import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type Restaurant = {
    id : Nat;
    name : Text;
    description : Text;
    cuisineType : Text;
    address : Text;
    city : Text;
    phone : Text;
    latitude : Float;
    longitude : Float;
    isActive : Bool;
    isApproved : Bool;
    ownerId : Principal;
  };

  var nextRestaurantId = 1;
  let restaurantsMap = Map.empty<Nat, Restaurant>();

  type MenuItem = {
    id : Nat;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
    isAvailable : Bool;
    restaurantId : Nat;
  };

  var nextMenuItemId = 1;
  let menuItemsMap = Map.empty<Nat, MenuItem>();

  type CartItem = {
    restaurantId : Nat;
    menuItemId : Nat;
    quantity : Nat;
  };

  // Carts are scoped by user and restaurant
  let cartsMap = Map.empty<Principal, Map.Map<Nat, CartItem>>();

  type OrderStatus = {
    #pending;
    #confirmed;
    #preparing;
    #outForDelivery;
    #delivered;
    #cancelled;
  };

  type DeliveryAddress = {
    address : Text;
    city : Text;
    phone : Text;
    latitude : Float;
    longitude : Float;
  };

  type FoodOrder = {
    id : Nat;
    customerId : Principal;
    restaurantId : Nat;
    items : [CartItem];
    totalAmount : Nat;
    deliveryAddress : DeliveryAddress;
    status : OrderStatus;
    createdAt : Time.Time;
  };

  var nextOrderId = 1;
  let ordersMap = Map.empty<Nat, FoodOrder>();

  module Restaurant {
    public func compare(r1 : Restaurant, r2 : Restaurant) : Order.Order {
      Nat.compare(r1.id, r2.id);
    };
  };

  module MenuItem {
    public func compare(m1 : MenuItem, m2 : MenuItem) : Order.Order {
      Nat.compare(m1.id, m2.id);
    };
  };

  // Restaurant management
  public shared ({ caller }) func createRestaurant(
    name : Text,
    description : Text,
    cuisineType : Text,
    address : Text,
    city : Text,
    phone : Text,
    latitude : Float,
    longitude : Float
  ) : async Nat {
    let id = nextRestaurantId;
    nextRestaurantId += 1;

    let restaurant : Restaurant = {
      id;
      name;
      description;
      cuisineType;
      address;
      city;
      phone;
      latitude;
      longitude;
      isActive = true;
      isApproved = false;
      ownerId = caller;
    };

    restaurantsMap.add(id, restaurant);
    id;
  };

  public query ({ caller }) func getRestaurant(restaurantId : Nat) : async Restaurant {
    switch (restaurantsMap.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant does not exist") };
      case (?restaurant) { restaurant };
    };
  };

  public query ({ caller }) func listRestaurants(onlyActive : Bool) : async [Restaurant] {
    let restaurants = restaurantsMap.values().toArray();

    let filtered = restaurants.filter(
      func(r) { not onlyActive or (r.isActive and r.isApproved) }
    );
    filtered.sort();
  };

  public shared ({ caller }) func updateRestaurantStatus(restaurantId : Nat, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update restaurant status");
    };

    switch (restaurantsMap.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant does not exist") };
      case (?restaurant) {
        let updated : Restaurant = {
          id = restaurant.id;
          name = restaurant.name;
          description = restaurant.description;
          cuisineType = restaurant.cuisineType;
          address = restaurant.address;
          city = restaurant.city;
          phone = restaurant.phone;
          latitude = restaurant.latitude;
          longitude = restaurant.longitude;
          isActive;
          isApproved = restaurant.isApproved;
          ownerId = restaurant.ownerId;
        };
        restaurantsMap.add(restaurantId, updated);
      };
    };
  };

  public shared ({ caller }) func approveRestaurant(restaurantId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve restaurants");
    };

    switch (restaurantsMap.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant does not exist") };
      case (?restaurant) {
        if (restaurant.isApproved) {
          Runtime.trap("Restaurant is already approved");
        };

        let updated : Restaurant = {
          id = restaurant.id;
          name = restaurant.name;
          description = restaurant.description;
          cuisineType = restaurant.cuisineType;
          address = restaurant.address;
          city = restaurant.city;
          phone = restaurant.phone;
          latitude = restaurant.latitude;
          longitude = restaurant.longitude;
          isActive = restaurant.isActive;
          isApproved = true;
          ownerId = restaurant.ownerId;
        };
        restaurantsMap.add(restaurantId, updated);
      };
    };
  };

  public query ({ caller }) func getRestaurantsByOwner(ownerId : Principal) : async [Restaurant] {
    restaurantsMap.values().toArray().filter(func(r) { r.ownerId == ownerId }).sort();
  };

  // Menu item management
  public shared ({ caller }) func createMenuItem(
    restaurantId : Nat,
    name : Text,
    description : Text,
    price : Nat,
    category : Text,
    isAvailable : Bool
  ) : async Nat {
    switch (restaurantsMap.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant does not exist") };
      case (?restaurant) {
        if (restaurant.ownerId != caller) {
          Runtime.trap("Unauthorized: Only the restaurant owner can add menu items");
        };

        let id = nextMenuItemId;
        nextMenuItemId += 1;

        let item : MenuItem = {
          id;
          name;
          description;
          price;
          category;
          isAvailable;
          restaurantId;
        };

        menuItemsMap.add(id, item);
        id;
      };
    };
  };

  public query ({ caller }) func getMenuItem(menuItemId : Nat) : async MenuItem {
    switch (menuItemsMap.get(menuItemId)) {
      case (null) { Runtime.trap("Menu item does not exist") };
      case (?item) { item };
    };
  };

  public query ({ caller }) func getMenuItemsByRestaurant(restaurantId : Nat) : async [MenuItem] {
    menuItemsMap.values().toArray().filter(func(i) { i.restaurantId == restaurantId }).sort();
  };

  // Shopping cart management
  public shared ({ caller }) func addToCart(menuItemId : Nat, quantity : Nat) : async () {
    if (quantity == 0) {
      Runtime.trap("Quantity must be greater than zero");
    };
    switch (menuItemsMap.get(menuItemId)) {
      case (null) { Runtime.trap("Menu item does not exist") };
      case (?item) {
        let userCart = switch (cartsMap.get(caller)) {
          case (null) {
            let newCart = Map.empty<Nat, CartItem>();
            cartsMap.add(caller, newCart);
            newCart;
          };
          case (?cart) { cart };
        };

        let cartItem : CartItem = {
          restaurantId = item.restaurantId;
          menuItemId;
          quantity;
        };
        userCart.add(menuItemId, cartItem);
      };
    };
  };

  public shared ({ caller }) func removeFromCart(menuItemId : Nat) : async () {
    switch (cartsMap.get(caller)) {
      case (null) { Runtime.trap("Cart does not exist") };
      case (?userCart) {
        if (not userCart.containsKey(menuItemId)) {
          Runtime.trap("Menu item is not in cart");
        };
        userCart.remove(menuItemId);

        if (userCart.isEmpty()) {
          cartsMap.remove(caller);
        };
      };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    switch (cartsMap.get(caller)) {
      case (null) { Runtime.trap("Cart does not exist") };
      case (?_) { cartsMap.remove(caller) };
    };
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    switch (cartsMap.get(caller)) {
      case (null) { [] };
      case (?userCart) { userCart.values().toArray() };
    };
  };

  // Order management
  public shared ({ caller }) func placeOrder(
    restaurantId : Nat,
    deliveryAddress : DeliveryAddress
  ) : async Nat {
    switch (restaurantsMap.get(restaurantId)) {
      case (null) { Runtime.trap("Restaurant does not exist") };
      case (?restaurant) {
        if (not restaurant.isActive or not restaurant.isApproved) {
          Runtime.trap("Restaurant is not available for orders");
        };

        switch (cartsMap.get(caller)) {
          case (null) { Runtime.trap("Cart does not exist") };
          case (?userCart) {
            if (userCart.isEmpty()) {
              Runtime.trap("Cart is empty");
            };

            let items = userCart.values().toArray();

            let filteredItems = items.filter(
              func(item) { item.restaurantId == restaurantId }
            );

            if (filteredItems.size() == 0) {
              Runtime.trap("No items in cart for this restaurant");
            };

            var totalAmount = 0;
            for (item in filteredItems.values()) {
              switch (menuItemsMap.get(item.menuItemId)) {
                case (null) { Runtime.trap("Menu item does not exist") };
                case (?menuItem) {
                  totalAmount += menuItem.price * item.quantity;
                };
              };
            };

            let orderId = nextOrderId;
            nextOrderId += 1;

            let order : FoodOrder = {
              id = orderId;
              customerId = caller;
              restaurantId;
              items = filteredItems;
              totalAmount;
              deliveryAddress;
              status = #pending;
              createdAt = Time.now();
            };

            ordersMap.add(orderId, order);

            // Clean up cart after ordering
            for (item in filteredItems.values()) {
              userCart.remove(item.menuItemId);
            };

            if (userCart.isEmpty()) {
              cartsMap.remove(caller);
            };

            orderId;
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateOrderStatus(
    orderId : Nat,
    newStatus : OrderStatus
  ) : async () {
    switch (ordersMap.get(orderId)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        switch (restaurantsMap.get(order.restaurantId)) {
          case (null) {
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Restaurant does not exist, only admins can update orders");
            };
          };
          case (?restaurant) {
            if (restaurant.ownerId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only restaurant owners or admins can update order status");
            };
          };
        };

        let updatedOrder : FoodOrder = {
          id = order.id;
          customerId = order.customerId;
          restaurantId = order.restaurantId;
          items = order.items;
          totalAmount = order.totalAmount;
          deliveryAddress = order.deliveryAddress;
          status = newStatus;
          createdAt = order.createdAt;
        };

        ordersMap.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrdersByCustomer(customerId : Principal) : async [FoodOrder] {
    ordersMap.values().toArray().filter(func(o) { o.customerId == customerId });
  };

  public query ({ caller }) func getOrdersByRestaurant(restaurantId : Nat) : async [FoodOrder] {
    ordersMap.values().toArray().filter(func(o) { o.restaurantId == restaurantId });
  };

  public query ({ caller }) func getAllOrders() : async [FoodOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    ordersMap.values().toArray();
  };
};
