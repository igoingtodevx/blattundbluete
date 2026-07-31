import { useCallback, useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { ProductModal } from "./components/ProductModal";
import { CataloguePage } from "./pages/CataloguePage";
import { HomePage } from "./pages/HomePage";
import { KnowledgePage } from "./pages/KnowledgePage";
import { ReservationPage } from "./pages/ReservationPage";
import { SalePage } from "./pages/SalePage";
import { AboutPage } from "./pages/AboutPage";
import type { PageId, Product } from "./types";

const pageToHash: Record<PageId, string> = {
  home: "#/",
  products: "#/blumen-straeusse",
  sale: "#/restposten",
  knowledge: "#/blumenwissen",
  about: "#/ueber-uns",
  reservation: "#/vorbestellen"
};

const readPage = (): PageId => {
  const hash = window.location.hash || "#/";
  const entry = Object.entries(pageToHash).find(([, value]) => value === hash);
  return (entry?.[0] as PageId | undefined) ?? "home";
};

export default function App() {
  const [page, setPage] = useState<PageId>(readPage);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setPage(readPage());
      setSelectedProduct(null);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((nextPage: PageId) => {
    const hash = pageToHash[nextPage];
    if (window.location.hash === hash) {
      setPage(nextPage);
      setSelectedProduct(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = hash;
  }, []);

  const reserveProduct = (product: Product) => {
    sessionStorage.setItem("bb-selected-product", product.id);
    setSelectedProduct(null);
    navigate("reservation");
  };

  return (
    <Layout activePage={page} onNavigate={navigate}>
      {page === "home" && (
        <HomePage
          onNavigate={navigate}
          onProduct={setSelectedProduct}
        />
      )}
      {page === "products" && (
        <CataloguePage
          onNavigate={navigate}
          onProduct={setSelectedProduct}
        />
      )}
      {page === "sale" && (
        <SalePage
          onNavigate={navigate}
          onProduct={setSelectedProduct}
        />
      )}
      {page === "knowledge" && <KnowledgePage />}
      {page === "about" && <AboutPage onNavigate={navigate} />}
      {page === "reservation" && <ReservationPage />}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onReserve={reserveProduct}
      />
    </Layout>
  );
}
