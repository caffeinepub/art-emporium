import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Category } from "../backend.d";
import type { Product } from "../backend.d";
import {
  useAddProduct,
  useListProducts,
  useUpdateProductStock,
} from "../hooks/useQueries";

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

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: Category.notebooks as Category,
  imageUrl: "",
  stock: "",
};

function StockRow({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [stockVal, setStockVal] = useState(
    String(Number(product.stockQuantity)),
  );
  const updateStock = useUpdateProductStock();

  const handleSave = async () => {
    const parsed = Number(stockVal);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid stock quantity");
      return;
    }
    try {
      await updateStock.mutateAsync({
        productId: product.id,
        newStock: BigInt(parsed),
      });
      toast.success(`Stock updated for "${product.name}"`);
    } catch {
      toast.error("Failed to update stock");
    }
  };

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-medium text-foreground truncate">
          {product.name}
        </p>
        <p className="font-body text-xs text-muted-foreground">
          {CATEGORY_LABELS[product.category as string] ?? product.category}
        </p>
      </div>
      <Input
        data-ocid={`admin.product.stock_input.${index}`}
        type="number"
        min="0"
        value={stockVal}
        onChange={(e) => setStockVal(e.target.value)}
        className="w-20 text-center h-8 font-body text-sm"
      />
      <Button
        data-ocid={`admin.product.save_button.${index}`}
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={updateStock.isPending}
        className="h-8 font-body text-xs"
      >
        {updateStock.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          "Save"
        )}
      </Button>
    </div>
  );
}

export function AdminPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const addProduct = useAddProduct();
  const { data: products = [] } = useListProducts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.description.trim() ||
      !form.price ||
      !form.stock
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const priceNum = Number.parseFloat(form.price);
    const stockNum = Number.parseInt(form.stock, 10);

    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      toast.error("Enter a valid stock quantity");
      return;
    }

    try {
      const product = await addProduct.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim(),
        priceCents: BigInt(Math.round(priceNum * 100)),
        category: form.category,
        imageUrl: form.imageUrl.trim(),
        stockQuantity: BigInt(stockNum),
      });
      toast.success(`"${product.name}" added to the store! 🎉`);
      setForm({ ...EMPTY_FORM });
    } catch {
      toast.error("Failed to add product");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        data-ocid="admin.sheet"
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 bg-background"
      >
        <SheetHeader className="px-6 py-5 border-b border-border flex-shrink-0">
          <SheetTitle className="font-display text-xl flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Admin Panel
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-8">
            {/* ── Add Product ── */}
            <section>
              <h3 className="font-display text-base font-semibold mb-4">
                Add New Product
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-name" className="font-body text-sm">
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-name"
                    data-ocid="admin.name_input"
                    placeholder="e.g. Botanical Washi Tape Set"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="font-body"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-desc" className="font-body text-sm">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="admin-desc"
                    data-ocid="admin.description_input"
                    placeholder="A beautiful description of the product…"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="font-body resize-none h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-price" className="font-body text-sm">
                      Price ($) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="admin-price"
                      data-ocid="admin.price_input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="9.99"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                      className="font-body"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-stock" className="font-body text-sm">
                      Stock Qty <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="admin-stock"
                      data-ocid="admin.stock_input"
                      type="number"
                      min="0"
                      placeholder="50"
                      value={form.stock}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, stock: e.target.value }))
                      }
                      className="font-body"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-category" className="font-body text-sm">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v as Category }))
                    }
                  >
                    <SelectTrigger
                      id="admin-category"
                      data-ocid="admin.category_select"
                      className="font-body"
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="font-body">
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-image" className="font-body text-sm">
                    Image URL
                    <span className="text-muted-foreground ml-1">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="admin-image"
                    data-ocid="admin.imageurl_input"
                    placeholder="https://example.com/image.jpg"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, imageUrl: e.target.value }))
                    }
                    className="font-body"
                  />
                </div>

                <Button
                  data-ocid="admin.submit_button"
                  type="submit"
                  className="w-full font-body tracking-wide"
                  disabled={addProduct.isPending}
                >
                  {addProduct.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding Product…
                    </>
                  ) : (
                    "Add Product"
                  )}
                </Button>
              </form>
            </section>

            <Separator />

            {/* ── Manage Stock ── */}
            <section>
              <h3 className="font-display text-base font-semibold mb-1">
                Manage Stock
              </h3>
              <p className="font-body text-xs text-muted-foreground mb-4">
                Update inventory quantities for existing products.
              </p>

              {products.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground text-center py-8">
                  No products yet. Add one above!
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {products.map((product, idx) => (
                    <StockRow
                      key={String(product.id)}
                      product={product}
                      index={idx + 1}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
