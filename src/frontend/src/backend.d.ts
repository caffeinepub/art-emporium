import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cart {
    totalPriceCents: bigint;
    items: Array<CartItem>;
}
export interface CartItem {
    productId: bigint;
    quantity: bigint;
}
export interface Product {
    id: bigint;
    stockQuantity: bigint;
    name: string;
    description: string;
    imageUrl: string;
    category: Category;
    priceCents: bigint;
}
export enum Category {
    accessories = "accessories",
    cards = "cards",
    pens = "pens",
    notebooks = "notebooks",
    giftSets = "giftSets"
}
export interface backendInterface {
    addItemToCart(productId: bigint, quantity: bigint): Promise<void>;
    addProduct(name: string, description: string, priceCents: bigint, category: Category, imageUrl: string, stockQuantity: bigint): Promise<Product>;
    clearCart(): Promise<void>;
    getCart(): Promise<Cart>;
    getProductById(id: bigint): Promise<Product>;
    getProductsByCategory(category: Category): Promise<Array<Product>>;
    listCategories(): Promise<Array<Category>>;
    listProducts(): Promise<Array<Product>>;
    removeItemFromCart(productId: bigint): Promise<void>;
    updateProductStock(productId: bigint, newStock: bigint): Promise<void>;
}
