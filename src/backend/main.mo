import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

actor {
  // Product Types
  type Category = {
    #notebooks;
    #pens;
    #cards;
    #giftSets;
    #accessories;
  };

  let _productStore = Map.empty<Nat, Product>();
  var _nextProductId = 1;

  type Product = {
    id : Nat;
    name : Text;
    description : Text;
    priceCents : Nat;
    category : Category;
    imageUrl : Text;
    stockQuantity : Nat;
  };

  // Cart Types
  type CartItem = {
    productId : Nat;
    quantity : Nat;
  };

  module CartItem {
    public func compareByProductId(item1 : CartItem, item2 : CartItem) : Order.Order {
      Nat.compare(item1.productId, item2.productId);
    };
  };

  type Cart = {
    items : [CartItem];
    totalPriceCents : Nat;
  };

  // Carts Store
  let _cartStore = Map.empty<Principal, List.List<CartItem>>();

  func calculateTotal(items : [CartItem]) : Nat {
    var total = 0;
    for (item in items.values()) {
      let productOpt = _productStore.get(item.productId);
      switch (productOpt) {
        case (?product) { total += product.priceCents * item.quantity };
        case (null) {};
      };
    };
    total;
  };

  // Seed products
  let seedProducts = [
    {
      name = "Starry Night Notebook";
      description = "A5 dot grid notebook with Van Gogh's Starry Night cover";
      priceCents = 1599;
      category = #notebooks;
      imageUrl = "/starry-notebook.jpg";
      stockQuantity = 50;
    },
    {
      name = "Elegant Fountain Pen";
      description = "Brushed gold finish, smooth ink flow";
      priceCents = 2499;
      category = #pens;
      imageUrl = "/golden-pen.jpg";
      stockQuantity = 30;
    },
    {
      name = "Watercolor Cards Set";
      description = "Set of 12 blank watercolor greeting cards";
      priceCents = 1299;
      category = #cards;
      imageUrl = "/watercolor-cards.jpg";
      stockQuantity = 40;
    },
    {
      name = "Leather Journal";
      description = "Handmade leather cover, 200 pages";
      priceCents = 2899;
      category = #notebooks;
      imageUrl = "/leather-journal.jpg";
      stockQuantity = 15;
    },
    {
      name = "Calligraphy Ink Set";
      description = "8 vibrant colors, waterproof ink";
      priceCents = 3499;
      category = #accessories;
      imageUrl = "/ink-set.jpg";
      stockQuantity = 25;
    },
    {
      name = "Origami Gift Set";
      description = "Includes 100 sheets and instruction booklet";
      priceCents = 1799;
      category = #giftSets;
      imageUrl = "/origami-set.jpg";
      stockQuantity = 20;
    },
    {
      name = "Metallic Gel Pens";
      description = "Pack of 10 glitter gel pens";
      priceCents = 899;
      category = #pens;
      imageUrl = "/gel-pens.jpg";
      stockQuantity = 60;
    },
    {
      name = "Botanical Sketchbook";
      description = "High-quality paper for sketching";
      priceCents = 1999;
      category = #notebooks;
      imageUrl = "/sketchbook.jpg";
      stockQuantity = 35;
    },
    {
      name = "Washi Tape Pack";
      description = "Assorted colorful designs (10 rolls)";
      priceCents = 599;
      category = #accessories;
      imageUrl = "/washi-tape.jpg";
      stockQuantity = 80;
    },
    {
      name = "Vintage Postcard Set";
      description = "Retro travel postcard collection (24 pieces)";
      priceCents = 1599;
      category = #cards;
      imageUrl = "/postcards.jpg";
      stockQuantity = 30;
    },
    {
      name = "Art Gift Bundle";
      description = "Notebook, pens, designer tote bag";
      priceCents = 4999;
      category = #giftSets;
      imageUrl = "/gift-bundle.jpg";
      stockQuantity = 10;
    },
    {
      name = "Art Deco Pen Holder";
      description = "Handcrafted ceramic with gold accents";
      priceCents = 2199;
      category = #accessories;
      imageUrl = "/pen-holder.jpg";
      stockQuantity = 12;
    },
  ];

  for (seedProduct in seedProducts.values()) {
    _productStore.add(
      _nextProductId,
      {
        id = _nextProductId;
        name = seedProduct.name;
        description = seedProduct.description;
        priceCents = seedProduct.priceCents;
        category = seedProduct.category;
        imageUrl = seedProduct.imageUrl;
        stockQuantity = seedProduct.stockQuantity;
      },
    );
    _nextProductId += 1;
  };

  public query ({ caller }) func listProducts() : async [Product] {
    _productStore.values().toArray();
  };

  public query ({ caller }) func getProductById(id : Nat) : async Product {
    switch (_productStore.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func listCategories() : async [Category] {
    [#notebooks, #pens, #cards, #giftSets, #accessories];
  };

  public query ({ caller }) func getProductsByCategory(category : Category) : async [Product] {
    let filtered = _productStore.values().filter(func(product) { product.category == category });
    filtered.toArray();
  };

  public shared ({ caller }) func addProduct(
    name : Text,
    description : Text,
    priceCents : Nat,
    category : Category,
    imageUrl : Text,
    stockQuantity : Nat,
  ) : async Product {
    let product : Product = {
      id = _nextProductId;
      name;
      description;
      priceCents;
      category;
      imageUrl;
      stockQuantity;
    };
    _productStore.add(_nextProductId, product);
    _nextProductId += 1;
    product;
  };

  public shared ({ caller }) func updateProductStock(productId : Nat, newStock : Nat) : async () {
    switch (_productStore.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        let updatedProduct = { product with stockQuantity = newStock };
        _productStore.add(productId, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func addItemToCart(productId : Nat, quantity : Nat) : async () {
    switch (_productStore.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        let cartItems = switch (_cartStore.get(caller)) {
          case (null) { List.empty<CartItem>() };
          case (?items) { items };
        };
        let existing = cartItems.find(func(item) { item.productId == productId });
        switch (existing) {
          case (?_) {
            let updatedItems = cartItems.map<CartItem, CartItem>(
              func(item) {
                if (item.productId == productId) {
                  { item with quantity };
                } else {
                  item;
                };
              }
            );
            _cartStore.add(caller, updatedItems);
          };
          case (null) {
            cartItems.add({ productId; quantity });
            _cartStore.add(caller, cartItems);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeItemFromCart(productId : Nat) : async () {
    switch (_cartStore.get(caller)) {
      case (null) { Runtime.trap("Cart is empty") };
      case (?cartItems) {
        let filteredItems = cartItems.filter(func(item) { item.productId != productId });
        _cartStore.add(caller, filteredItems);
      };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    _cartStore.remove(caller);
  };

  public query ({ caller }) func getCart() : async Cart {
    let cartItems = switch (_cartStore.get(caller)) {
      case (null) { List.empty<CartItem>() };
      case (?items) { items };
    };
    let itemsArray = cartItems.toArray();
    {
      items = itemsArray;
      totalPriceCents = calculateTotal(itemsArray);
    };
  };
};
