import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { AboutProfileProvider } from "@/features/about/AboutProfileContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { CartProvider } from "@/features/cart/CartContext";
import { SiteAccessProvider } from "@/features/content/SiteAccessContext";

export function App() {
  return (
    <AuthProvider>
      <SiteAccessProvider>
        <CartProvider>
          <AboutProfileProvider>
            <RouterProvider router={router} />
          </AboutProfileProvider>
        </CartProvider>
      </SiteAccessProvider>
    </AuthProvider>
  );
}
