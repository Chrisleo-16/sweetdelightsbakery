"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { User, ShoppingBag, Heart, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthContext } from "@/context/AuthContext"
import { getProfile } from "@/utils/api"
import { toast } from "sonner" // or your preferred toast system

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function AccountPage() {
  const router = useRouter()
  const { token, logout } = useContext(AuthContext)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.push("/account/login")
    } else {
      getProfile()
        .then((res) => {
          if (res?.user) setUser(res.user)
          else throw new Error("Invalid token or user not found")
        })
        .catch(() => {
          toast.error("Session expired. Please log in again.")
          logout()
          router.push("/account/login")
        })
        .finally(() => setLoading(false))
    }
  }, [token, router, logout])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600 text-lg">
        Loading your account...
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Account</h1>
        {user ? (
          <p className="text-gray-600 text-lg">
            Welcome back, <strong>{user.firstName} {user.lastName}</strong> 👋
          </p>
        ) : (
          <p className="text-gray-600 text-lg">Loading user info...</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-amber-600" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Update your personal information</p>
            <Link href="/account/profile">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">Manage Profile</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-amber-600" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">View your order history</p>
            <Link href="/account/orders">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">View Orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-amber-600" />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Manage your favorite items</p>
            <Link href="/favorites">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">View Favorites</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-amber-600" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Change your account settings</p>
            <Link href="/account/settings">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">Account Settings</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <LogOut className="h-5 w-5 mr-2 text-red-600" />
              Sign Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Sign out of your account</p>
            <Button
              variant="outline"
              className="w-full border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => {
                logout()
                router.push("/account/login")
              }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
