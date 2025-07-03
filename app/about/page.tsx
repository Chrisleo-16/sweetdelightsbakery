"use client"
import React from 'react'
import { motion } from "framer-motion";
import Image from 'next/image';


const About = () => {
  return (
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
  )
}

export default About