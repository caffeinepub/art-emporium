# Art Emporium

## Current State
A stationery e-commerce store with product listing, category filtering, product detail modal, and a shopping cart sheet. No admin panel exists. The backend has `addProduct` and `updateProductStock` functions available.

## Requested Changes (Diff)

### Add
- Admin panel accessible via a hidden "Admin" link in the navbar (or a floating button)
- A form to add new products (name, description, price, category, stock quantity, image URL)
- A list of existing products in the admin panel with ability to update stock

### Modify
- Navbar: add an "Admin" button that opens the admin panel as a Sheet/Dialog

### Remove
- Nothing removed

## Implementation Plan
1. Add `useAddProduct` and `useUpdateProductStock` mutation hooks in `useQueries.ts`
2. Build an `AdminPanel` component as a Sheet with:
   - Add Product form (name, description, priceCents, category select, imageUrl, stockQuantity)
   - Product list with stock update inputs
3. Add "Admin" button to the navbar that opens the panel
