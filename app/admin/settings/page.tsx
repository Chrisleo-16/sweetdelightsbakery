"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Store, Bell, Shield, CreditCard, Mail, Smartphone, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import AdminLayout from "@/components/admin-layout"

interface StoreSettings {
  name: string
  description: string
  email: string
  phone: string
  address: string
  website: string
  currency: string
  timezone: string
  businessHours: {
    open: string
    close: string
  }
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  newOrders: boolean
  lowStock: boolean
  customerMessages: boolean
  dailyReports: boolean
}

interface SecuritySettings {
  twoFactorAuth: boolean
  sessionTimeout: number
  autoLogout: boolean
  loginAlerts: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: "Sweet Delights Bakery",
    description: "Artisanal baked goods made fresh daily with love and the finest ingredients.",
    email: "admin@sweetdelights.com",
    phone: "+1 (555) 123-4567",
    address: "123 Baker Street, Sweet City, SC 12345",
    website: "https://sweetdelights.com",
    currency: "USD",
    timezone: "America/New_York",
    businessHours: {
      open: "07:00",
      close: "19:00",
    },
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    newOrders: true,
    lowStock: true,
    customerMessages: true,
    dailyReports: false,
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 24,
    autoLogout: true,
    loginAlerts: true,
  })

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem("adminAuth")
    if (!adminAuth) {
      router.push("/login")
    }
  }, [router])

  const handleSaveSettings = async () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleResetToDefaults = () => {
    setStoreSettings({
      name: "Sweet Delights Bakery",
      description: "Artisanal baked goods made fresh daily with love and the finest ingredients.",
      email: "admin@sweetdelights.com",
      phone: "+1 (555) 123-4567",
      address: "123 Baker Street, Sweet City, SC 12345",
      website: "https://sweetdelights.com",
      currency: "USD",
      timezone: "America/New_York",
      businessHours: {
        open: "07:00",
        close: "19:00",
      },
    })

    setNotificationSettings({
      emailNotifications: true,
      smsNotifications: false,
      newOrders: true,
      lowStock: true,
      customerMessages: true,
      dailyReports: false,
    })

    setSecuritySettings({
      twoFactorAuth: false,
      sessionTimeout: 24,
      autoLogout: true,
      loginAlerts: true,
    })

    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your bakery's settings and preferences</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveSettings} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
              {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeSettings.name}
                  onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="storeEmail">Email Address</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="storeDescription">Store Description</Label>
              <Textarea
                id="storeDescription"
                value={storeSettings.description}
                onChange={(e) => setStoreSettings({ ...storeSettings, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storePhone">Phone Number</Label>
                <Input
                  id="storePhone"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="storeWebsite">Website</Label>
                <Input
                  id="storeWebsite"
                  value={storeSettings.website}
                  onChange={(e) => setStoreSettings({ ...storeSettings, website: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="storeAddress">Address</Label>
              <Input
                id="storeAddress"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={storeSettings.currency}
                  onValueChange={(value) => setStoreSettings({ ...storeSettings, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={storeSettings.timezone}
                  onValueChange={(value) => setStoreSettings({ ...storeSettings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Business Hours</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={storeSettings.businessHours.open}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        businessHours: { ...storeSettings.businessHours, open: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={storeSettings.businessHours.close}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        businessHours: { ...storeSettings.businessHours, close: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  </div>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Orders</Label>
                    <p className="text-sm text-gray-500">Get notified when new orders are placed</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newOrders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, newOrders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-gray-500">Get alerted when inventory is running low</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStock}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, lowStock: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Customer Messages</Label>
                    <p className="text-sm text-gray-500">Get notified of customer inquiries</p>
                  </div>
                  <Switch
                    checked={notificationSettings.customerMessages}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, customerMessages: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Reports</Label>
                    <p className="text-sm text-gray-500">Receive daily sales and performance reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.dailyReports}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, dailyReports: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Switch
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Logout</Label>
                <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
              </div>
              <Switch
                checked={securitySettings.autoLogout}
                onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, autoLogout: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Login Alerts</Label>
                <p className="text-sm text-gray-500">Get notified of login attempts</p>
              </div>
              <Switch
                checked={securitySettings.loginAlerts}
                onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, loginAlerts: checked })}
              />
            </div>

            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Select
                value={securitySettings.sessionTimeout.toString()}
                onValueChange={(value) =>
                  setSecuritySettings({ ...securitySettings, sessionTimeout: Number.parseInt(value) })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="72">3 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tax Rate (%)</Label>
                <Input type="number" step="0.01" defaultValue="8.25" />
              </div>
              <div>
                <Label>Processing Fee (%)</Label>
                <Input type="number" step="0.01" defaultValue="2.9" />
              </div>
            </div>

            <div>
              <Label>Accepted Payment Methods</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>Credit Cards</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch defaultChecked />
                  <Label>PayPal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch />
                  <Label>Apple Pay</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch />
                  <Label>Cash on Delivery</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
