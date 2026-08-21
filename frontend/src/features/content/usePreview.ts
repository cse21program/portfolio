import { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "@/features/auth/AuthContext";

export function usePreview() {
  const [params] = useSearchParams();
  const auth = useContext(AuthContext);
  return params.get("preview") === "1" && auth?.user?.role === "ADMIN";
}
