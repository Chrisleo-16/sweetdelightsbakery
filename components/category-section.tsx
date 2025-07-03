import Link from "next/link"
import { Button } from "@/components/ui/button"

const categories = [
  {
    name: "Pastries",
    description: "Freshly baked croissants, danishes, and more",
    image: "/1000028657.jpg",
    href: "/category/pastries",
  },
  {
    name: "Cakes",
    description: "Celebration cakes and everyday treats",
    image: "/9e5a1628e8630abc6600feea279f2eb7.jpg",
    href: "/category/cakes",
  },
  {
    name: "Beverages",
    description: "Coffee, tea, and specialty drinks",
    image: "/1000028665.jpg",
    href: "/category/beverages",
  },
  {
    name: "Cold Drinks",
    description: "Refreshing iced drinks and smoothies",
    image: "/febe39f83445ee7258acd514ce60d418.jpg",
    href: "/category/cold-drinks",
  },
  {
    name: "Creamery",
    description: "Fresh cream, butter, and dairy products",
    image: "/1000028664.jpg",
    href: "/category/creamery",
  },
  {
    name: "Ice Cream",
    description: "Handcrafted ice creams and sorbets",
    image: "/1000028663.jpg",
    href: "/category/ice-cream",
  },
]

export default function CategorySection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Our Categories</h2>
          <div className="w-20 h-1 bg-amber-500 mb-6"></div>
          <p className="text-gray-600 text-center max-w-2xl">
            Explore our wide range of handcrafted bakery items and beverages
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category.name} href={category.href} className="group block">
              <div className="relative overflow-hidden rounded-lg shadow-md h-80 transition-transform group-hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />
                <img
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-white/80 mb-4">{category.description}</p>
                  <Button className="bg-amber-500 hover:bg-amber-600">Browse {category.name}</Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
