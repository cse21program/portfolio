import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { CART_CHANGED, emptyCart, type Cart, type CartItemKind } from "@/types/cart";

type CartContextValue = {
  cart: Cart;
  loading: boolean;
  reload: () => Promise<void>;
  addItem: (input: { kind: CartItemKind; slug: string; packageName?: string }) => Promise<Cart>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function asCart(payload: { cart?: Cart } | Cart | undefined): Cart {
  if (!payload) {
    return emptyCart;
  }
  if ("items" in payload && "summary" in payload) {
    return payload;
  }
  return payload.cart ?? emptyCart;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(Boolean(user));

  const reload = useCallback(async () => {
    if (!user) {
      setCart(emptyCart);
      setLoading(false);
      return;
    }
    try {
      const payload = await apiGet<{ cart: Cart }>("/cart", { cache: "no-store" });
      setCart(asCart(payload));
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    function onChange() {
      void reload();
    }
    window.addEventListener(CART_CHANGED, onChange);
    return () => window.removeEventListener(CART_CHANGED, onChange);
  }, [reload]);

  const addItem = useCallback(
    async (input: { kind: CartItemKind; slug: string; packageName?: string }) => {
      const payload = await apiPost<{ cart: Cart }>("/cart/items", {
        kind: input.kind,
        slug: input.slug,
        packageName: input.packageName ?? "",
      });
      const next = asCart(payload);
      setCart(next);
      return next;
    },
    [],
  );

  const removeItem = useCallback(async (id: string) => {
    const payload = await apiDelete<{ cart: Cart }>(`/cart/items/${id}`);
    setCart(asCart(payload));
  }, []);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    const payload = await apiPatch<{ cart: Cart }>(`/cart/items/${id}`, { quantity });
    setCart(asCart(payload));
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const payload = await apiPost<{ cart: Cart }>("/cart/coupon", { code });
    setCart(asCart(payload));
  }, []);

  const removeCoupon = useCallback(async () => {
    const payload = await apiDelete<{ cart: Cart }>("/cart/coupon");
    setCart(asCart(payload));
  }, []);

  const clear = useCallback(async () => {
    const payload = await apiDelete<{ cart: Cart }>("/cart");
    setCart(asCart(payload));
  }, []);

  const value = useMemo(
    () => ({
      cart,
      loading,
      reload,
      addItem,
      removeItem,
      updateQuantity,
      applyCoupon,
      removeCoupon,
      clear,
    }),
    [cart, loading, reload, addItem, removeItem, updateQuantity, applyCoupon, removeCoupon, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export function useOptionalCart() {
  return useContext(CartContext);
}
