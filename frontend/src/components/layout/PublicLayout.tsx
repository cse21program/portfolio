import { Outlet } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageViewport } from "@/components/layout/PageViewport";

export function PublicLayout() {
  return (
    <PageViewport>
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </PageViewport>
  );
}
