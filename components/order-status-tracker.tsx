"use client"

import { Clock, Package, Truck } from "lucide-react"

interface OrderStatusTrackerProps {
  currentStatus: "processing" | "shipped" | "delivered"
  orderDate: string
  estimatedDelivery?: string
  compact?: boolean
}

export default function OrderStatusTracker({
  currentStatus,
  orderDate,
  estimatedDelivery,
  compact = false,
}: OrderStatusTrackerProps) {
  const statuses = [
    {
      key: "processing",
      label: "Processing",
      icon: Clock,
      description: "Order is being prepared",
    },
    {
      key: "shipped",
      label: "Shipped",
      icon: Package,
      description: "Order is on its way",
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: Truck,
      description: "Order has been delivered",
    },
  ]

  const getCurrentStatusIndex = () => {
    return statuses.findIndex((status) => status.key === currentStatus)
  }

  const currentIndex = getCurrentStatusIndex()

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {statuses.map((status, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const Icon = status.icon

          return (
            <div key={status.key} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-6 h-6 rounded-full border-2
                ${
                  isCompleted ? "bg-green-500 border-green-500 text-white" : "bg-gray-100 border-gray-300 text-gray-400"
                }
              `}
              >
                <Icon className="w-3 h-3" />
              </div>
              {index < statuses.length - 1 && (
                <div
                  className={`
                  w-8 h-0.5 mx-1
                  ${isCompleted ? "bg-green-500" : "bg-gray-300"}
                `}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        {statuses.map((status, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const Icon = status.icon

          return (
            <div key={status.key} className="flex flex-col items-center flex-1">
              <div
                className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2
                ${
                  isCompleted ? "bg-green-500 border-green-500 text-white" : "bg-gray-100 border-gray-300 text-gray-400"
                }
                ${isCurrent ? "ring-2 ring-green-200" : ""}
              `}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`
                text-sm font-medium
                ${isCompleted ? "text-green-600" : "text-gray-400"}
              `}
              >
                {status.label}
              </span>
              <span
                className={`
                text-xs text-center
                ${isCompleted ? "text-gray-600" : "text-gray-400"}
              `}
              >
                {status.description}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-300 -z-10" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-green-500 -z-10 transition-all duration-500"
          style={{ width: `${(currentIndex / (statuses.length - 1)) * 100}%` }}
        />
      </div>

      {/* Additional Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>Order placed: {new Date(orderDate).toLocaleDateString()}</p>
        {estimatedDelivery && currentStatus !== "delivered" && (
          <p>Estimated delivery: {new Date(estimatedDelivery).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  )
}
