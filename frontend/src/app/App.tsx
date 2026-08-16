import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { AboutProfileProvider } from "@/features/about/AboutProfileContext";
import { AuthProvider } from "@/features/auth/AuthContext";

export function App() {
  return (
    <AuthProvider>
      <AboutProfileProvider>
        <RouterProvider router={router} />
      </AboutProfileProvider>
    </AuthProvider>
  );
}
