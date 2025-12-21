import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Minus, Plus, Ruler, Loader2, X, PlayCircle } from "lucide-react";
import { toast } from "sonner"; 
import { useCart } from "@/pages/CartContext";
import { storeService } from "@/services/api";
import Chart from "@/assets/Chart.jpeg";
// ✅ 1. ADDED IMPORT
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // FETCH DATA
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const data = await storeService.getProductBySlug(slug);
        setProduct(data);
        setSelectedMediaIndex(0);
        setSelectedSize(null);
        setQuantity(1);
      } catch (err) {
        console.error("Fetch failed", err);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // --- MERGE IMAGES AND VIDEOS INTO ONE LIST ---
  const mediaList = useMemo(() => {
    if (!product) return [];
    
    const list = [];
    
    // Add Images
    if (product.images && Array.isArray(product.images)) {
        product.images.forEach((url: string) => list.push({ type: 'image', url }));
    }

    // Add Videos
    if (product.videos && Array.isArray(product.videos)) {
        product.videos.forEach((url: string) => list.push({ type: 'video', url }));
    }

    return list;
  }, [product]);

  // --- DYNAMIC PRICE CALCULATION ---
  const currentPriceInfo = useMemo(() => {
    if (!product) return { price: 0, original: 0 };

    let basePrice = parseFloat(product.price);
    let original = parseFloat(product.originalPrice || 0);

    // Find the selected variant object
    if (selectedSize && product.variants) {
      const variant = product.variants.find((v: any) => v.size === selectedSize);
      if (variant && variant.additional_price) {
        const extra = parseFloat(variant.additional_price);
        basePrice += extra;
        if (original > 0) original += extra;
      }
    }

    return { price: basePrice, original: original };
  }, [product, selectedSize]);

  // Format Currency
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const discount = currentPriceInfo.original
    ? Math.round(((currentPriceInfo.original - currentPriceInfo.price) / currentPriceInfo.original) * 100)
    : 0;

  // --- HANDLERS ---

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size", { description: "Choose a size before adding to cart" });
      return;
    }

    addToCart({
      id: product.id,
      title: product.title,
      price: currentPriceInfo.price,
      image: product.images[0],
      size: selectedSize,
      quantity: quantity,
      sku: product.sku,
    });
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.error("Please select a size", { description: "Choose a size before proceeding" });
      return;
    }

    addToCart({
      id: product.id,
      title: product.title,
      price: currentPriceInfo.price,
      image: product.images[0],
      size: selectedSize,
      quantity: quantity,
      sku: product.sku,
    });

    navigate("/checkout");
  };

  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!product) return (
    <div className="min-h-screen pt-32 text-center">
      <h1 className="text-2xl font-serif">Product not found</h1>
      <button onClick={() => navigate("/")} className="mt-4 text-primary underline">Return to Home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 md:pt-32 pb-16">
        <div className="container mx-auto px-4">
          
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground mb-6"
          >
            <span onClick={() => navigate("/")} className="hover:text-foreground cursor-pointer">Home</span>
            <span className="mx-2">/</span>
            <span onClick={() => navigate("/all-products")} className="hover:text-foreground cursor-pointer">Products</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">{product.title}</span>
          </motion.nav>

          {/* Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* --- MEDIA GALLERY (Images + Video) --- */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col-reverse md:flex-row gap-4"
            >
              {/* Thumbnails */}
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                {mediaList.map((item: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`flex-shrink-0 w-20 h-24 md:w-24 md:h-28 border-2 transition-all overflow-hidden relative flex items-center justify-center bg-gray-100 ${
                      selectedMediaIndex === index
                        ? "border-foreground"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img src={item.url} alt={`View ${index}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <PlayCircle className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-medium uppercase">Video</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Main Media Display */}
              <div className="flex-1 relative overflow-hidden bg-secondary h-[400px] md:h-[600px]">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                    {product.isNew && (
                        <span className="bg-black text-white px-3 py-1 text-xs font-bold tracking-widest uppercase shadow-md">
                            New Arrival
                        </span>
                    )}
                    {product.badge && (
                        <span className="bg-[#440504] text-white px-3 py-1 text-xs font-bold tracking-widest uppercase shadow-md">
                            {product.badge}
                        </span>
                    )}
                </div>

                <AnimatePresence mode="wait">
                  {mediaList[selectedMediaIndex]?.type === 'image' ? (
                    // ✅ 2. WRAPPED IMAGE IN TRANSFORM COMPONENT FOR ZOOM
                    <motion.div
                      key={`img-${selectedMediaIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full cursor-grab active:cursor-grabbing"
                    >
                      <TransformWrapper initialScale={1} minScale={1} maxScale={4}>
                        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
                          <img 
                            src={mediaList[selectedMediaIndex].url} 
                            alt={product.title} 
                            className="w-full h-full object-cover" 
                          />
                        </TransformComponent>
                      </TransformWrapper>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`vid-${selectedMediaIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full bg-black flex items-center justify-center"
                    >
                      <video controls autoPlay className="w-full h-full object-contain">
                          <source src={mediaList[selectedMediaIndex]?.url} type="video/mp4" />
                          Your browser does not support the video tag.
                      </video>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* --- PRODUCT INFO --- */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Title & SKU */}
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-normal tracking-wide text-foreground mb-2">
                  {product.title}
                </h1>
                <p className="text-sm text-muted-foreground tracking-wider">
                  {product.sku}
                </p>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  {currentPriceInfo.original > 0 && (
                    <span className="text-muted-foreground line-through text-lg">
                      {formatPrice(currentPriceInfo.original)}
                    </span>
                  )}
                  <span className="text-2xl font-medium text-foreground">
                    {formatPrice(currentPriceInfo.price)}
                  </span>
                  {discount > 0 && (
                    <span className="text-sm font-medium text-green-600">
                      Save {discount}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Inclusive of all Taxes.</p>
              </div>

                            {/* Size Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium tracking-wider text-foreground">SIZE</span>
                  <button 
                    onClick={() => setShowSizeChart(true)} 
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Ruler className="w-4 h-4" />
                    <span className="underline">Size Chart</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants?.map((variant: any) => {
                    const isOutOfStock = variant.stock === 0;
                    const isSelected = selectedSize === variant.size;
                    
                    return (
                      <button
                        key={variant.id || variant.size}
                        onClick={() => !isOutOfStock && setSelectedSize(variant.size)}
                        disabled={isOutOfStock}
                        className={`min-w-[48px] px-4 py-2.5 text-sm font-medium border transition-all ${
                          isOutOfStock
                            ? "border-border text-muted-foreground line-through opacity-50 cursor-not-allowed"
                            : isSelected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border hover:border-foreground text-foreground"
                        }`}
                        title={isOutOfStock ? `${variant.size} - Out of Stock` : undefined}
                      >
                        {variant.size}
                        {isOutOfStock && <span className="ml-1 text-xs">(0)</span>}
                      </button>
                    );
                  })}
                </div>
                {selectedSize && (
                  <p className="text-xs text-green-600 font-medium">
                    ✅ {selectedSize} selected 
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <span className="text-sm font-medium tracking-wider text-foreground">QUANTITY</span>
                <div className="flex items-center border border-border w-fit">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-muted transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-2 text-center min-w-[60px] font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-muted transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 border-2 border-foreground text-foreground py-4 text-sm font-medium tracking-[0.2em] hover:bg-[#440504] hover:text-white transition-all"
                >
                  ADD TO CART
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-[#440504] text-white py-4 text-sm font-medium tracking-[0.2em] hover:bg-[#5a0807] transition-all"
                >
                  BUY IT NOW
                </button>
              </div>

              {/* Product Details (Fabric, Color, Wash Care) */}
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed pb-2">{product.description}</p>
                
                <ul className="space-y-2 text-sm text-foreground">
                  {product.fabric && (
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span><strong>Fabric:</strong> {product.fabric}</span>
                    </li>
                  )}
                  {product.color && (
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span><strong>Color:</strong> {product.color}</span>
                    </li>
                  )}
                  {product.washCare && (
                    <li className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span><strong>Wash care:</strong> {product.washCare}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Accordions */}
              <div className="space-y-0 border-t border-border">
                
                {/* Disclaimer */}
                <div className="border-b border-border">
                  <button
                    onClick={() => toggleAccordion("disclaimer")}
                    className="w-full flex items-center justify-between py-4 text-sm font-medium tracking-wider hover:text-muted-foreground transition-colors"
                  >
                    DISCLAIMER
                    {openAccordion === "disclaimer" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {openAccordion === "disclaimer" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">
                          {product.disclaimer || "Product color may slightly vary due to photographic lighting or your device settings."}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Manufacturer Info */}
                <div className="border-b border-border">
                  <button
                    onClick={() => toggleAccordion("manufacturer")}
                    className="w-full flex items-center justify-between py-4 text-sm font-medium tracking-wider hover:text-muted-foreground transition-colors"
                  >
                    MANUFACTURER INFO
                    {openAccordion === "manufacturer" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {openAccordion === "manufacturer" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                          <div className="pb-4 text-sm text-muted-foreground leading-relaxed space-y-2">
                          <p><strong>Manufactured by:</strong> {product.manufacturer_name || "VINSARAA"}</p>
                          <p><strong>Address:</strong> {product.manufacturer_address || "Andhra Pradesh, India"}</p>
                          <p><strong>Country of Origin:</strong> {product.country_of_origin || "India"}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </main>

      {/* Size Chart Modal */}
      <AnimatePresence>
        {showSizeChart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSizeChart(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-4xl max-h-[90vh] bg-background rounded-lg shadow-2xl flex flex-col pointer-events-auto"
              >
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h2 className="text-xl font-serif">Size Chart</h2>
                  <button onClick={() => setShowSizeChart(false)} className="p-2 hover:bg-muted rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                  <img src={Chart} alt="Size Chart" className="max-w-full max-h-full object-contain" />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;