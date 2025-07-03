import { Star } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Regular Customer",
    content:
      "The pastries here are absolutely divine! I've tried bakeries all over the city, and Sweet Delights consistently has the best croissants and danishes. Everything is always fresh and the staff is so friendly.",
    rating: 5,
    image: "/placeholder.svg?height=64&width=64",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Food Blogger",
    content:
      "As someone who reviews bakeries professionally, I can say that Sweet Delights stands out for their attention to detail and quality ingredients. Their red velvet cake is the best I've ever had!",
    rating: 5,
    image: "/placeholder.svg?height=64&width=64",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Event Planner",
    content:
      "I've ordered custom cakes from Sweet Delights for multiple events, and they always exceed expectations. Not only are they beautiful, but they taste amazing too. My clients are always impressed!",
    rating: 5,
    image: "/placeholder.svg?height=64&width=64",
  },
]

export default function TestimonialSection() {
  return (
    <section className="py-16 bg-amber-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What Our Customers Say</h2>
          <div className="w-20 h-1 bg-amber-500 mb-6"></div>
          <p className="text-gray-600 text-center max-w-2xl">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg p-6 shadow-md flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-gray-700 italic flex-grow">{testimonial.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
