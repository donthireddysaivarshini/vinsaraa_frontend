import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeService } from "@/services/api"; // Import the service
import { Loader2 } from "lucide-react";

const CategorySection = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await storeService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // If no categories exist yet
  if (categories.length === 0) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-center text-xl md:text-2xl font-light tracking-[0.3em] text-foreground">
            COLLECTIONS
          </h1>
        </div>
      </header>

      {/* Category Section */}
      <main className="w-full py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Dynamic Grid: Adjusts cols based on number of categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                // DYNAMIC LINK: Points to the generic collection page
                to={`/collections/${category.slug}`} 
                className="group relative overflow-hidden cursor-pointer block animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-[500px] lg:h-[600px] overflow-hidden">
                  {/* Use image from backend, or a placeholder if missing */}
                  <img
                    src={category.image || "https://via.placeholder.com/600x800?text=No+Image"} 
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/10 transition-colors duration-500" />

                  {/* Category Label */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-background px-8 py-3 border border-border 
                        group-hover:bg-[#440504] group-hover:border-[#440504] transition-all duration-300">
                      <span className="text-sm tracking-[0.2em] font-medium text-foreground 
                          group-hover:text-white transition-colors duration-300 uppercase">
                        {category.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CategorySection;