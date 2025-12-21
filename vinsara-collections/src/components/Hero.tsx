import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { contentService } from "@/services/api"; // Import service

// Default Static Data (Fallback)
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";

const DEFAULT_SLIDES = [
  { image: hero1, title: "THE ART OF SHIBORI", subtitle: "Hand-dyed pieces that carry the beauty of tradition in every fold" },
  { image: hero2, title: "TIMELESS ELEGANCE", subtitle: "Discover our collection of handcrafted ethnic wear" },
  { image: hero3, title: "CONTEMPORARY TRADITIONS", subtitle: "Where modern design meets traditional craftsmanship" },
  { image: hero4, title: "ARTISAN CREATIONS", subtitle: "Each piece tells a story of heritage and skill" },
  { image: hero5, title: "LUXURY REDEFINED", subtitle: "Experience the finest in traditional textiles" }
];

const Hero = () => {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  // FETCH SLIDES FROM DJANGO
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const data = await contentService.getHeroSlides();
        if (data && data.length > 0) {
          // Map backend fields to frontend structure
          setSlides(data);
        }
      } catch (error) {
        console.error("Using default hero slides due to error:", error);
      }
    };
    loadSlides();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]); // Add dependency on slides.length

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 })
  };

  // Guard clause if slides empty (shouldn't happen due to default)
  if (!slides.length) return null; 

  return (
    <section className="relative h-[70vh] md:h-[75vh] w-full overflow-hidden pt-[56px] md:pt-[96px]">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-hero-overlay/60 via-hero-overlay/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-4 md:px-8 lg:px-16 pt-4 md:pt-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="max-w-2xl text-hero-text"
              >
                <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-5 tracking-wider leading-tight">
                  {slides[currentSlide].title}
                </h2>
                <p className="font-sans text-sm md:text-base lg:text-lg mb-5 md:mb-7 tracking-wide leading-relaxed max-w-xl">
                  {slides[currentSlide].subtitle}
                </p>
                <Link to="/all-products">
                  <button className="pointer-events-auto bg-transparent border-2 border-hero-text text-hero-text px-8 md:px-12 py-3 md:py-3.5 text-sm md:text-base font-semibold tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#440504] hover:border-[#440504] hover:text-white">
                    SHOP NOW
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicators */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-0.5 transition-all duration-300 ${index === currentSlide ? "w-10 bg-hero-text" : "w-6 bg-hero-text/40 hover:bg-hero-text/60"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;