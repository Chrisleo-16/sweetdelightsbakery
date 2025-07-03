"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, User, Search, Menu, X, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useMobile } from "@/hooks/use-mobile"
import { useCart } from "@/lib/cart-context"

const navItems = [
  { name: "Home", href: "/" },
  { name: "Our Products", href: "/products" },
  { name: "Contact Us", href: "/contact" },
  { name: "About Us", href: "/about" },
  // { name: "Cold Drinks", href: "/category/cold-drinks" },
  // { name: "Creamery", href: "/category/creamery" },
  // { name: "Ice Cream", href: "/category/ice-cream" },
]

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useMobile()
  const { state } = useCart()

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-amber-600">Sweet Delights</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                    pathname === item.href ? "text-amber-600" : "text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/track-order"
                className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                  pathname === "/track-order" ? "text-amber-600" : "text-gray-700"
                }`}
              >
                Track Order
              </Link>
              {/* <Link
                href="/login"
                className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                  pathname === "/login" ? "text-amber-600" : "text-gray-700"
                }`}
              >
                Admin
              </Link> */}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              {isSearchOpen && !isMobile ? (
                <div className="absolute right-0 top-0 w-72 flex items-center">
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="w-full"
                    autoFocus
                    onBlur={() => setIsSearchOpen(false)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-gray-700 hover:text-amber-600"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Favorites */}
            <Link href="/favorites">
              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-amber-600">
                <Heart className="h-5 w-5" />
              </Button>
            </Link>

            {/* User Account */}
            <Link href="/account">
              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-amber-600">
                <User className="h-5 w-5" />
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-gray-700 hover:text-amber-600 relative">
                <ShoppingCart className="h-5 w-5" />
                {state.itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center p-0 min-w-[20px]">
                    {state.itemCount > 99 ? "99+" : state.itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-gray-700">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col h-full">
                    <div className="py-4">
                      <h2 className="text-lg font-semibold text-amber-600">Sweet Delights</h2>
                    </div>
                    <div className="py-4">
                      <Input type="search" placeholder="Search products..." className="w-full" />
                    </div>
                    <nav className="flex flex-col space-y-4 py-4">
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                            pathname === item.href ? "text-amber-600" : "text-gray-700"
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <Link
                        href="/track-order"
                        className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                          pathname === "/track-order" ? "text-amber-600" : "text-gray-700"
                        }`}
                      >
                        Track Order
                      </Link>
                      {/* <Link
                        href="/login"
                        className={`text-sm font-medium transition-colors hover:text-amber-600 ${
                          pathname === "/login" ? "text-amber-600" : "text-gray-700"
                        }`}
                      >
                        Admin
                      </Link> */}
                    </nav>
                    <div className="mt-auto py-4 space-y-4">
                      <Link href="/account/login">
                        <Button className="w-full bg-amber-500 hover:bg-amber-600">Sign In</Button>
                      </Link>
                      <Link href="/account/register">
                        <Button variant="outline" className="w-full">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
