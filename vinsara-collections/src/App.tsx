import { useState, useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/pages/CartContext";

import ScrollToTop from "./components/ScrollToTop";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoaderScreen from "./components/Load";
// Change the import to point to the 'pages' folder where the new Profile code lives
import User from "./pages/User";
import Login from "./components/Login";
import About from "./components/About";
import Shipping from "./components/Shipping";
import Returns from "./components/Returns";
import Contact from "./components/Contact";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";
import Collection from "./pages/Collection";
import Index from "./pages/Index";
import AllProducts from "./pages/AllProducts";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

import Checkout from "./pages/Checkout";


const queryClient = new QueryClient();

// ----------------------
// UPDATED LAYOUT
// ----------------------
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const path = location.pathname;

  // Routes where header/footer should be hidden
  const noHeaderFooterRoutes = ["/", "/user", "/login", "/checkout"];
  const hideHeaderFooter = noHeaderFooterRoutes.includes(path);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Loader */}
      {isLoading && <LoaderScreen />}

      {/* Content after loading */}
      {!isLoading && (
        <>
          {/* Header hidden on certain routes */}
          {!hideHeaderFooter && <Header forceScrolled={true} />}

          <main className={!hideHeaderFooter ? "pt-16" : ""}>
            {children}
          </main>

          {/* Footer hidden on certain routes */}
          {!hideHeaderFooter && <Footer />}
        </>
      )}
    </>
  );
};

// ----------------------
// APP
// ----------------------
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <ScrollToTop />

          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/all-products" element={<AllProducts />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/collections/:categorySlug" element={<Collection />} />
              <Route path="/about" element={<About />} />
              <Route path="/user" element={<User />} />
              <Route path="/login" element={<Login />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/contact" element={<Contact />} /> 
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
