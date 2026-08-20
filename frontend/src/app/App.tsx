import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { AboutProfileProvider } from "@/features/about/AboutProfileContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { CartProvider } from "@/features/cart/CartContext";

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AboutProfileProvider>
          <RouterProvider router={router} />
        </AboutProfileProvider>
      </CartProvider>
    </AuthProvider>
  );
}
