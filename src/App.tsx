import { useCallback, useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { ProductModal } from "./components/ProductModal";
import { ChatWidget } from "./components/ChatWidget";
import { CataloguePage } from "./pages/CataloguePage";
import { HomePage } from "./pages/HomePage";
import { KnowledgePage } from "./pages/KnowledgePage";
import { ReservationPage } from "./pages/ReservationPage";
import { SalePage } from "./pages/SalePage";
import { AboutPage } from "./pages/AboutPage";
import { products } from "./data/products";
import {
  buildReservationPrefill,
  safeReadReservationPrefill,
  safeWriteReservationPrefill
} from "./utils/chat";
import type {
  CapturedPreferences,
  ChatProductSuggestion,
  ChatReservationPrefill,
  PageId,
  Product
} from "./types";

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

const productSuggestion = (product: Product): ChatProductSuggestion => ({
  productId: product.id,
  label: product.name
});

export default function App() {
  const [page, setPage] = useState<PageId>(readPage);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatPreferences, setChatPreferences] = useState<CapturedPreferences>({});
  const [reservationPrefill, setReservationPrefill] =
    useState<ChatReservationPrefill | null>(() => safeReadReservationPrefill());

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

  const startReservation = useCallback(
    (prefill: ChatReservationPrefill) => {
      safeWriteReservationPrefill(prefill);
      setReservationPrefill(prefill);
      setSelectedProduct(null);
      navigate("reservation");
    },
    [navigate]
  );

  const reserveProduct = useCallback(
    (product: Product) => {
      const action = {
        type: "reserve" as const,
        label: "Vorbestellung vorbereiten",
        page: "reservation" as const,
        productId: product.id
      };
      startReservation(
        buildReservationPrefill(chatPreferences, [productSuggestion(product)], action)
      );
    },
    [chatPreferences, startReservation]
  );

  const openChatProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (product) setSelectedProduct(product);
  };

  return (
    <Layout activePage={page} onNavigate={navigate}>
      {page === "home" && (
        <HomePage
          onNavigate={navigate}
          onProduct={setSelectedProduct}
          onReserve={reserveProduct}
        />
      )}
      {page === "products" && (
        <CataloguePage
          onNavigate={navigate}
          onProduct={setSelectedProduct}
          onReserve={reserveProduct}
        />
      )}
      {page === "sale" && (
        <SalePage
          onNavigate={navigate}
          onProduct={setSelectedProduct}
          onReserve={reserveProduct}
        />
      )}
      {page === "knowledge" && <KnowledgePage />}
      {page === "about" && <AboutPage onNavigate={navigate} />}
      {page === "reservation" && (
        <ReservationPage
          prefill={reservationPrefill}
          onPrefillConsumed={() => setReservationPrefill(null)}
        />
      )}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onReserve={reserveProduct}
      />
      <ChatWidget
        onNavigate={navigate}
        onProduct={openChatProduct}
        onStartReservation={startReservation}
        onPreferencesChange={setChatPreferences}
      />
    </Layout>
  );
}
