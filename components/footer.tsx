import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Footer() {
  return (
    <footer className="bg-amber-900 text-amber-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Sweet Delights</h3>
            <p className="text-amber-200 mb-4">
              Artisan bakery crafting delicious pastries, cakes, and treats using traditional methods and premium
              ingredients.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-amber-200 hover:text-white hover:bg-amber-800">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-amber-200 hover:text-white hover:bg-amber-800">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-amber-200 hover:text-white hover:bg-amber-800">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-amber-200 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-amber-200 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
{/*               <li>
                <Link href="/faq" className="text-amber-200 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-amber-200 hover:text-white transition-colors">
                  Blog
                </Link>
              </li> */}
              {/* <li>
                <Link href="/careers" className="text-amber-200 hover:text-white transition-colors">
                  Careers
                </Link>
              </li> */}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/category/pastries" className="text-amber-200 hover:text-white transition-colors">
                  Pastries
                </Link>
              </li>
              <li>
                <Link href="/category/cakes" className="text-amber-200 hover:text-white transition-colors">
                  Cakes
                </Link>
              </li>
              <li>
                <Link href="/category/beverages" className="text-amber-200 hover:text-white transition-colors">
                  Beverages
                </Link>
              </li>
              <li>
                <Link href="/category/cold-drinks" className="text-amber-200 hover:text-white transition-colors">
                  Cold Drinks
                </Link>
              </li>
              <li>
                <Link href="/category/creamery" className="text-amber-200 hover:text-white transition-colors">
                  Creamery
                </Link>
              </li>
              <li>
                <Link href="/category/ice-cream" className="text-amber-200 hover:text-white transition-colors">
                  Ice Cream
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <address className="not-italic text-amber-200 space-y-2">
              <p>Utawala</p>
              <p>Nairobi,Kenya</p>
              <p>Phone: (555) 123-4567</p>
              <p>Email: info@sweetdelights.com</p>
            </address>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Hours</h4>
              <p className="text-amber-200">Mon-Fri: 7am - 7pm</p>
              <p className="text-amber-200">Sat-Sun: 8am - 8pm</p>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-amber-200 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Sweet Delights Bakery. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-amber-200 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-amber-200 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/shipping" className="text-amber-200 hover:text-white text-sm transition-colors">
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
