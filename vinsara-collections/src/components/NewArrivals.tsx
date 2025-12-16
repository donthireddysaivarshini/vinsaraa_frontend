import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { storeService } from "@/services/api";
import ProductCard from "./ProductCard";

const NewArrivals = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    storeService.getProducts({ is_new: true }) // Fetch only new items
      .then(data => setProducts(data.slice(0, 5))) // Limit to 5
      .catch(err => console.error("New arrivals failed", err));
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
           <h2 className="text-2xl mb-6 font-light tracking-[0.3em] text-[#440504]">New Arrivals</h2>
           <Link to="/all-products" className="inline-block hover:bg-[#440504] hover:text-white border border-[#440504] px-6 py-2 transition">View All</Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              id={product.slug} // Use slug for links
              image={product.images[0]}
              title={product.title}
              price={parseFloat(product.price)}
              sizes={product.variants?.map((v:any) => v.size) || []}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;