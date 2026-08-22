import { Outlet } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageViewport } from "@/components/layout/PageViewport";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { TrackPageview } from "@/features/analytics/TrackPageview";
import { SearchProvider } from "@/features/search/SearchContext";
import { SearchModal } from "@/features/search/SearchModal";

export function PublicLayout() {
  return (
    <SearchProvider>
      <PageViewport>
        <TrackPageview />
        <div className="flex min-h-full flex-col">
          <SkipToContent />
          <Header />
          <main id="main-content" className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </PageViewport>
      <SearchModal />
    </SearchProvider>
  );
}
