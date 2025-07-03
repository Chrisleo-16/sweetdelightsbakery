"use client"
// pages/faqs.tsx
import { useState, useMemo } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LucideSearch } from "lucide-react";

type FAQ = {
  question: string;
  answer: string;
};

const faqList: FAQ[] = [
  {
    question: "How can I place an order?",
    answer:
      "You can place an order by visiting our Shop page, selecting items, and proceeding to checkout. If you have an account, signing in will speed up the process; otherwise, you can check out as guest.",
  },
  {
    question: "What are your delivery options?",
    answer:
      "We offer standard delivery within 3–5 business days and express delivery within 1–2 business days in supported areas. Shipping costs vary by location and order size.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes. After your order ships, you’ll receive a tracking number via email. Use that on the courier’s website to see real-time updates.",
  },
  {
    question: "What is your return/refund policy?",
    answer:
      "Since we sell perishable goods, we generally do not accept returns. However, if there is an issue (e.g., damaged item), contact us within 24 hours with photos, and we’ll work to make it right.",
  },
  {
    question: "Do you offer custom cakes or bulk orders?",
    answer:
      "Yes! For custom or bulk orders, please contact us at least 5 days in advance. Provide details (flavor, size, design) and we’ll confirm availability and pricing.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can use our Contact page to send us a message, or email support@yourbakery.com directly. We aim to respond within 24 hours on business days.",
  },
  {
    question: "Where can I find ingredient or allergen information?",
    answer:
      "We list basic allergen info on each product page. For detailed inquiries, contact us directly, and we can provide full ingredient lists.",
  },
  {
    question: "Do you have a newsletter?",
    answer:
      "Yes. Subscribe via the Newsletter section on our site to receive updates on new products, promotions, and events.",
  },
  // Add more FAQs as needed
];

const containerVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.4 },
  }),
};

const FAQPage: NextPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredFAQs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return faqList;
    return faqList.filter((faq) =>
      faq.question.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <>
      <Head>
        <title>FAQs</title>
      </Head>
      <motion.div
        className="container mx-auto px-4 py-16"
        initial="hidden"
        animate="visible"
        variants={containerVariant}
        custom={0}
      >
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-center mb-8"
          variants={containerVariant}
          custom={1}
        >
          Frequently Asked Questions
        </motion.h1>

        <motion.div
          className="max-w-md mx-auto mb-12"
          variants={containerVariant}
          custom={2}
        >
          <Label htmlFor="faq-search" className="sr-only">
            Search FAQs
          </Label>
          <div className="relative">
            <Input
              id="faq-search"
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
            <LucideSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </motion.div>

        {filteredFAQs.length === 0 ? (
          <motion.p
            className="text-center text-gray-600"
            variants={containerVariant}
            custom={3}
          >
            No matching questions found.
          </motion.p>
        ) : (
          <motion.div
            variants={containerVariant}
            custom={3}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg">
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={containerVariant}
                    custom={idx + 4}
                  >
                    <AccordionTrigger className="flex justify-between w-full px-4 py-3 text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-gray-700">
                      {faq.answer}
                    </AccordionContent>
                  </motion.div>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        )}
      </motion.div>
    </>
  );
};

export default FAQPage;
