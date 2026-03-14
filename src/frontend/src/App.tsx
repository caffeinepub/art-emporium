import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  ChevronRight,
  Feather,
  Leaf,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { AnimatePresence, type Variants, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { Product } from "./backend.d";
import { Category } from "./backend.d";
import {
  useAddItemToCart,
  useClearCart,
  useGetCart,
  useListProducts,
  useRemoveItemFromCart,
} from "./hooks/useQueries";

// Suppress unused import warning
void Badge;

const CATEGORY_FALLBACK: Record<string, string> = {
  [Category.notebooks]: "/assets/generated/product-journal.dim_400x400.jpg",
  [Category.cards]: "/assets/generated/product-notecards.dim_400x400.jpg",
  [Category.pens]: "/assets/generated/product-pen-set.dim_400x400.jpg",
  [Category.giftSets]: "/assets/generated/product-gift-set.dim_400x400.jpg",
  [Category.accessories]: "/assets/generated/product-journal.dim_400x400.jpg",
};

const CATEGORY_LABELS: Record<string, string> = {
  [Category.notebooks]: "Notebooks",
  [Category.cards]: "Cards",
  [Category.pens]: "Pens",
  [Category.giftSets]: "Gift Sets",
  [Category.accessories]: "Accessories",
};

const ALL_CATEGORIES = [
  Category.notebooks,
  Category.pens,
  Category.cards,
  Category.giftSets,
  Category.accessories,
];

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"];
const CART_SKELETON_KEYS = ["csk1", "csk2", "csk3"];

function getProductImage(product: Product): string {
  if (product.imageUrl?.startsWith("http")) return product.imageUrl;
  return (
    CATEGORY_FALLBACK[product.category as string] ??
    "/assets/generated/product-journal.dim_400x400.jpg"
  );
}

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

// Stagger animation variants
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

// ── Product Card ──────────────────────────────────────────────────
function ProductCard({
  product,
  index,
  onSelect,
  onAddToCart,
}: {
  product: Product;
  index: number;
  onSelect: (p: Product) => void;
  onAddToCart: (p: Product) => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      data-ocid={`shop.item.${index}`}
      className="group bg-card rounded-sm overflow-hidden shadow-warm hover:shadow-warm-lg transition-shadow duration-300 flex flex-col"
    >
      <button
        type="button"
        className="relative overflow-hidden cursor-pointer aspect-square bg-muted w-full text-left"
        onClick={() => onSelect(product)}
        data-ocid="product.open_modal_button"
        aria-label={`View ${product.name} details`}
      >
        <img
          src={getProductImage(product)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="bg-background/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-full font-body tracking-wide">
            View Details
          </span>
        </div>
        {Number(product.stockQuantity) < 5 &&
          Number(product.stockQuantity) > 0 && (
            <div className="absolute top-3 left-3">
              <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full font-body">
                Only {Number(product.stockQuantity)} left
              </span>
            </div>
          )}
      </button>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-xs text-muted-foreground font-body tracking-widest uppercase mb-1">
            {CATEGORY_LABELS[product.category as string] ?? product.category}
          </p>
          <h3 className="font-display text-base font-semibold text-foreground leading-snug line-clamp-2">
            {product.name}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-body line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <span className="font-display text-lg font-semibold text-primary">
            {formatPrice(product.priceCents)}
          </span>
          <Button
            size="sm"
            className="font-body text-xs tracking-wide"
            onClick={() => onAddToCart(product)}
            disabled={Number(product.stockQuantity) === 0}
          >
            {Number(product.stockQuantity) === 0
              ? "Out of Stock"
              : "Add to Cart"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Product Detail Modal ──────────────────────────────────────────
function ProductModal({
  product,
  open,
  onClose,
  onAddToCart,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (p: Product, qty: number) => void;
}) {
  const [qty, setQty] = useState(1);

  const handleAdd = useCallback(() => {
    if (product) {
      onAddToCart(product, qty);
      onClose();
    }
  }, [product, qty, onAddToCart, onClose]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="product.dialog"
        className="max-w-2xl p-0 overflow-hidden bg-card"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square md:aspect-auto overflow-hidden bg-muted">
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-7 flex flex-col gap-4 justify-center">
            <DialogHeader>
              <p className="text-xs text-muted-foreground font-body tracking-widest uppercase">
                {CATEGORY_LABELS[product.category as string] ??
                  product.category}
              </p>
              <DialogTitle className="font-display text-2xl font-semibold leading-snug">
                {product.name}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              {product.description}
            </p>
            <div className="font-display text-2xl text-primary font-semibold">
              {formatPrice(product.priceCents)}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-body text-muted-foreground">
                Qty
              </span>
              <div
                className="flex items-center border border-border rounded-sm"
                data-ocid="product.select"
              >
                <button
                  type="button"
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-4 py-2 font-body text-sm font-medium min-w-[2.5rem] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() =>
                    setQty((q) =>
                      Math.min(Number(product.stockQuantity), q + 1),
                    )
                  }
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            {Number(product.stockQuantity) > 0 && (
              <p className="text-xs text-muted-foreground font-body">
                {Number(product.stockQuantity)} in stock
              </p>
            )}
            <Button
              data-ocid="product.add_button"
              size="lg"
              className="w-full font-body tracking-wide mt-2"
              onClick={handleAdd}
              disabled={Number(product.stockQuantity) === 0}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {Number(product.stockQuantity) === 0
                ? "Out of Stock"
                : "Add to Cart"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Cart Sheet ────────────────────────────────────────────────────
function CartSheet({
  open,
  onClose,
  products,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
}) {
  const { data: cart, isLoading } = useGetCart();
  const removeItem = useRemoveItemFromCart();
  const clearCart = useClearCart();

  const productMap = new Map(products.map((p) => [String(p.id), p]));

  const handleCheckout = useCallback(async () => {
    await clearCart.mutateAsync();
    onClose();
    toast.success("Thank you for your order! 🎉", {
      description: "Your beautiful stationery is on its way.",
    });
  }, [clearCart, onClose]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        data-ocid="cart.sheet"
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 bg-background"
      >
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="font-display text-xl flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {CART_SKELETON_KEYS.map((k) => (
                <div key={k} className="flex gap-3">
                  <Skeleton className="h-16 w-16 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div
              data-ocid="cart.empty_state"
              className="flex flex-col items-center justify-center h-full text-center py-16 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-display text-lg font-medium mb-1">
                  Your cart is empty
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  Add some beautiful stationery to get started.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item, idx) => {
                const product = productMap.get(String(item.productId));
                if (!product) return null;
                return (
                  <div
                    key={String(item.productId)}
                    data-ocid={`cart.item.${idx + 1}`}
                    className="flex gap-3 items-start"
                  >
                    <div className="w-16 h-16 rounded-sm overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold leading-snug line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        Qty: {Number(item.quantity)}
                      </p>
                      <p className="text-sm font-body font-medium text-primary mt-1">
                        {formatPrice(
                          BigInt(Number(item.quantity)) * product.priceCents,
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid={`cart.delete_button.${idx + 1}`}
                      onClick={() => removeItem.mutate(item.productId)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 mt-0.5"
                      aria-label={`Remove ${product.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-muted-foreground">
                Subtotal
              </span>
              <span className="font-display text-xl font-semibold">
                {formatPrice(cart.totalPriceCents)}
              </span>
            </div>
            <Button
              data-ocid="cart.submit_button"
              size="lg"
              className="w-full font-body tracking-wide"
              onClick={handleCheckout}
              disabled={clearCart.isPending}
            >
              {clearCart.isPending ? "Processing..." : "Checkout"}
              {!clearCart.isPending && (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center font-body">
              Free shipping on orders over $75
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [activeCategory, setActiveCategory] = useState<"all" | Category>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { data: products = [], isLoading } = useListProducts();
  const { data: cart } = useGetCart();
  const addToCart = useAddItemToCart();

  const cartCount =
    cart?.items.reduce((sum, i) => sum + Number(i.quantity), 0) ?? 0;

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const handleAddToCart = useCallback(
    async (product: Product, qty = 1) => {
      await addToCart.mutateAsync({
        productId: product.id,
        quantity: BigInt(qty),
      });
      toast.success(`${product.name} added to cart`, {
        description: `${qty > 1 ? `${qty} ×` : ""} ${formatPrice(product.priceCents)}`,
      });
    },
    [addToCart],
  );

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Feather className="h-5 w-5 text-primary" />
            <span className="font-display text-xl font-semibold tracking-tight">
              Art Emporium
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            <button
              type="button"
              data-ocid="nav.shop_link"
              onClick={() => scrollTo("shop")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
            >
              Shop
            </button>
            <button
              type="button"
              data-ocid="nav.about_link"
              onClick={() => scrollTo("about")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => scrollTo("contact")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
            >
              Contact
            </button>
          </nav>
          <button
            type="button"
            data-ocid="nav.cart_button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center font-body"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        <img
          src="/assets/generated/hero-stationery.dim_1200x600.jpg"
          alt="Art Emporium stationery collection"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/35" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <p className="font-body text-sm tracking-[0.25em] uppercase text-white/70 mb-4">
              Artisan Stationery
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Curated stationery for the{" "}
              <em className="italic font-normal">art of living</em>
            </h1>
            <p className="font-body text-lg text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
              Thoughtfully sourced paper goods, pens, and gifts for those who
              believe beautiful objects inspire beautiful thoughts.
            </p>
            <Button
              data-ocid="hero.primary_button"
              size="lg"
              className="font-body tracking-wider text-sm px-8 py-6 text-base bg-background text-foreground hover:bg-card"
              onClick={() => scrollTo("shop")}
            >
              Shop Now <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Shop ── */}
      <section id="shop" className="py-20 px-6">
        <div className="container max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3">
              Our Collection
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-foreground">
              Shop
            </h2>
          </motion.div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {(["all", ...ALL_CATEGORIES] as Array<"all" | Category>).map(
              (cat) => (
                <button
                  type="button"
                  key={cat}
                  data-ocid="shop.tab"
                  onClick={() => setActiveCategory(cat)}
                  className={`font-body text-sm px-5 py-2 rounded-full border transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "All" : CATEGORY_LABELS[cat as string]}
                </button>
              ),
            )}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div
              data-ocid="shop.loading_state"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            >
              {SKELETON_KEYS.map((k) => (
                <div key={k} className="space-y-3">
                  <Skeleton className="aspect-square rounded-sm" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              data-ocid="shop.empty_state"
              className="flex flex-col items-center justify-center py-20 gap-4 text-center"
            >
              <Leaf className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-display text-xl font-medium">
                No products found
              </p>
              <p className="text-sm text-muted-foreground font-body">
                Try a different category or check back soon.
              </p>
            </div>
          ) : (
            <motion.div
              data-ocid="shop.list"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            >
              {filteredProducts.map((product, idx) => (
                <ProductCard
                  key={String(product.id)}
                  product={product}
                  index={idx + 1}
                  onSelect={setSelectedProduct}
                  onAddToCart={(p) => handleAddToCart(p)}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── About ── */}
      <section
        id="about"
        data-ocid="about.section"
        className="py-24 px-6 bg-secondary"
      >
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
                Our Story
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">
                Crafted with a passion for paper
              </h2>
              <p className="font-body text-base text-muted-foreground leading-relaxed mb-5">
                Art Emporium was born from a belief that the right stationery
                can transform everyday moments into rituals worth savoring. We
                source our collection from artisan makers across the globe —
                paper mills in Japan, pen craftspeople in Germany, letterpress
                studios in the Pacific Northwest.
              </p>
              <p className="font-body text-base text-muted-foreground leading-relaxed mb-8">
                Every piece in our shop is chosen for its quality, its beauty,
                and the feeling it evokes when you hold it in your hands.
                Because we believe the tools you use to create and communicate
                say something about who you are.
              </p>
              <div className="flex gap-8">
                {[
                  { label: "Artisan Makers", value: "40+" },
                  { label: "Years Curating", value: "12" },
                  { label: "Happy Customers", value: "8k+" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-3xl font-bold text-primary">
                      {stat.value}
                    </p>
                    <p className="font-body text-xs text-muted-foreground tracking-wide uppercase mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-sm overflow-hidden shadow-warm-lg">
                <img
                  src="/assets/generated/product-journal.dim_400x400.jpg"
                  alt="Artisan journal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-5 rounded-sm shadow-warm max-w-[200px]">
                <div className="flex gap-0.5 mb-2">
                  {["s1", "s2", "s3", "s4", "s5"].map((k) => (
                    <Star key={k} className="h-3 w-3 fill-accent text-accent" />
                  ))}
                </div>
                <p className="font-body text-xs text-foreground leading-snug">
                  &ldquo;These notebooks changed how I approach my daily
                  practice.&rdquo;
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  — Sarah K.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20 px-6">
        <div className="container max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground mb-3">
              Get in Touch
            </p>
            <h2 className="font-display text-4xl font-semibold mb-4">
              We&apos;d love to hear from you
            </h2>
            <p className="font-body text-muted-foreground mb-2">
              hello@artemporium.co
            </p>
            <p className="font-body text-muted-foreground">
              Portland, Oregon · Mon–Fri 9am–5pm
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
        <div className="container max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Feather className="h-4 w-4 text-primary" />
              <span className="font-display text-lg font-semibold">
                Art Emporium
              </span>
            </div>
            <p className="font-body text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} Art Emporium. All rights
              reserved.
            </p>
            <p className="font-body text-xs text-muted-foreground">
              Built with ♥ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ── Product Modal ── */}
      <ProductModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* ── Cart Sheet ── */}
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        products={products}
      />
    </div>
  );
}
