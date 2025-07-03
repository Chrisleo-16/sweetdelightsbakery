"use client"
// pages/index.tsx
import { useEffect, useState } from "react";
import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategorySection from "@/components/category-section";
import FeaturedProducts from "@/components/featured-products";
// import TestimonialSection from "@/components/testimonial-section";
// import NewsletterSection from "@/components/newsletter-section";
import ProductRecommendations from "@/components/product-recommendations";

const Home: NextPage = () => {
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  // const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // setIsLoaded(true);
  }, []);
  // if (!isLoaded) return null

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // framer-motion variants
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] sm:h-[700px] md:h-[800px] w-full overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/bf41aa06c779b8e46de8c784de052b49.jpg"
            alt="Delicious bakery items"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={fadeUpVariant}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Artisan Baked Goods Made With Love
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl text-white/90 mb-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={fadeUpVariant}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Discover our handcrafted pastries, cakes, and treats made fresh daily with premium ingredients
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={fadeUpVariant}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link href="/products" passHref>
                <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
                  <p className="flex items-center">
                    Shop Now <ShoppingBag className="ml-2 h-5 w-5" />
                  </p>
                </Button>
              </Link>
              <Link href="/products" passHref>
                <Button variant="outline" asChild className="border-white/30 text-white hover:bg-white/20 bg-white/10">
                  View Menu
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              className="w-full md:w-1/2 relative h-64 md:h-80 lg:h-96"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                hidden: { opacity: 0, x: -50 },
                visible: { opacity: 1, x: 0 },
              }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Image
                src="/ef845826de8a8e12574692fef99cfd44.jpg"
                alt="About Us"
                fill
                className="object-cover rounded-2xl shadow-lg"
              />
            </motion.div>
            <motion.div
              className="w-full md:w-1/2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                hidden: { opacity: 0, x: 50 },
                visible: { opacity: 1, x: 0 },
              }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-4">About Us</h2>
              <p className="mb-4 text-gray-700">
                At <span className="font-semibold">Sweet Delights</span>, we believe in the power of tradition and the joy of artisan craftsmanship. Our mission has always been to bring the finest baked goods to our community, using only premium ingredients and time-honored techniques. From our early morning sourdough loaves to our decadent pastries, every item is made with care and passion.
              </p>
              <p className="text-gray-700">
                Our team of bakers wakes up before dawn each day to ensure freshness and quality. We source locally whenever possible, supporting farmers and producers in the region. Beyond baking, we strive to create a warm, welcoming environment in our shop and online. Thank you for being part of our story.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <motion.div
        className="container mx-auto px-4 py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <CategorySection />
      </motion.div>

      {/* Featured Products */}
      <motion.div
        className="container mx-auto px-4 py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <FeaturedProducts />
      </motion.div>

      {/* Recently Viewed / Recommendations (optional) */}
      {/*
      <motion.section
        className="container mx-auto px-4 py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <ProductRecommendations type="recently-viewed" title="Continue Shopping" maxItems={4} />
      </motion.section>
      */}

      {/* Optional Testimonial or Newsletter */}
      {/*
      <motion.div
        className="container mx-auto px-4 py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <TestimonialSection />
      </motion.div>
      <motion.div
        className="container mx-auto px-4 py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUpVariant}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <NewsletterSection />
      </motion.div>
      */}


      {/* Scroll-to-Top Button */}
      {showScrollTop && (
        <motion.button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-full shadow-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </div>
  );
};

export default Home;
