import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Category } from "../backend.d";
import { useActor } from "./useActor";

export function useListProducts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCart() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      if (!actor) return { totalPriceCents: 0n, items: [] };
      return actor.getCart();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddItemToCart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: bigint;
      quantity: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addItemToCart(productId, quantity);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveItemFromCart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.removeItemFromCart(productId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useClearCart() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.clearCart();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export { Category };
