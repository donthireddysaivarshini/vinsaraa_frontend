import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; // Import useParams
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";

import ProductCard from "@/components/ProductCard";
import { storeService } from "@/services/api"; // Import your API service

const Collection = () => {
  // 1. Get the category slug from the URL (e.g., 'sleeved')
  const { categorySlug } = useParams<{ categorySlug: string }>();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // 2. Fetch Data when the Category changes
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        // Pass the slug to your backend API
        const data = await storeService.getProducts({ category: categorySlug });
        setProducts(data);
        
        // Reset filters when changing categories
        setSearchQuery("");
        setSelectedSizes([]);
        setPriceRange({ min: "", max: "" });
      } catch (error) {
        console.error("Failed to load category products", error);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchCategoryProducts();
    }
  }, [categorySlug]);

  // 3. Get unique sizes dynamically from fetched products
  const availableSizes = useMemo(() => {
    const sizes = new Set();
    products.forEach(product => {
      // Check both 'sizes' array (old) and 'variants' (new)
      const variants = product.variants || []; 
      if (variants.length > 0) {
         variants.forEach((v: any) => sizes.add(v.size));
      } else if (product.sizes && Array.isArray(product.sizes)) {
         product.sizes.forEach((s: string) => sizes.add(s));
      }
    });
    return Array.from(sizes).sort();
  }, [products]);

  // 4. Client-side Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query)
      );
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product => parseFloat(product.price) >= Number(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => parseFloat(product.price) <= Number(priceRange.max));
    }

    // Size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(product => {
        const pSizes = product.variants?.map((v:any) => v.size) || product.sizes || [];
        return pSizes.some((size: string) => selectedSizes.includes(size));
      });
    }

    // Sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "name":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, sortBy, priceRange, selectedSizes]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPriceRange({ min: "", max: "" });
    setSelectedSizes([]);
    setSortBy("newest");
  };

  const hasActiveFilters = searchQuery || priceRange.min || priceRange.max || selectedSizes.length > 0;

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 md:pt-32 pb-16">
        <div className="container mx-auto px-4">
          
          {/* Dynamic Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 md:mb-16"
          >
            <h1 className="font-serif text-3xl md:text-5xl font-normal tracking-wide text-foreground mb-4 uppercase">
              {categorySlug} Collection
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Handcrafted {categorySlug} styles designed for elegance and comfort.
            </p>
          </motion.div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 border rounded-lg text-sm font-medium transition-all ${
                    showFilters || hasActiveFilters
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background border-border hover:border-foreground"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="bg-background text-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {(selectedSizes.length > 0 ? 1 : 0) + 
                       (priceRange.min || priceRange.max ? 1 : 0)}
                    </span>
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-background border border-border px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
              </div>
            </div>

            {/* Expanded Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-muted/30 border border-border rounded-lg p-6 space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground">Filter Options</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground">
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-foreground mb-3">Price Range</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"
                      />
                      <span>-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* Size Filter */}
                  <div className="w-full">
                    <label className="block text-sm font-medium text-foreground mb-3">Sizes</label>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size: any) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border ${
                            selectedSizes.includes(size)
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background border-border"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  id={product.slug} // Use slug for navigation
                  image={product.images?.[0] || ""}
                  title={product.title}
                  price={parseFloat(product.price)}
                  sizes={product.variants?.map((v:any) => v.size) || product.sizes || []}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">No products found in this collection.</p>
              <button onClick={clearFilters} className="text-sm underline">Clear filters</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Collection;