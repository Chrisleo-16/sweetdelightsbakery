"use client"
// pages/contact.tsx
import { useState } from "react";
import { NextPage } from "next";
import Head from "next/head";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Contact: NextPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Basic front-end validation
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Name is required.";
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email.trim())
    ) {
      newErrors.email = "Invalid email address.";
    }
    if (!subject.trim()) newErrors.subject = "Subject is required.";
    if (!message.trim()) newErrors.message = "Message is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong.");
      }
      // success
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setErrors({});
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us</title>
      </Head>

      <motion.div
        className="container mx-auto px-4 py-16"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          className="text-3xl sm:text-4xl font-bold text-center mb-8"
          variants={fieldVariants}
        >
          Contact Us
        </motion.h1>

        <motion.p
          className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
          variants={fieldVariants}
        >
          Have questions or feedback? Fill out the form below and we’ll get back to you shortly.
        </motion.p>

        <motion.form
          className="max-w-xl mx-auto space-y-6"
          onSubmit={handleSubmit}
          variants={containerVariants}
        >
          {/* Name */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-invalid={errors.name ? "true" : "false"}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <motion.p
                className="mt-1 text-sm text-red-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.name}
              </motion.p>
            )}
          </motion.div>

          {/* Email */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={errors.email ? "true" : "false"}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <motion.p
                className="mt-1 text-sm text-red-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.email}
              </motion.p>
            )}
          </motion.div>

          {/* Subject */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              aria-invalid={errors.subject ? "true" : "false"}
              className={errors.subject ? "border-red-500" : ""}
            />
            {errors.subject && (
              <motion.p
                className="mt-1 text-sm text-red-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.subject}
              </motion.p>
            )}
          </motion.div>

          {/* Message */}
          <motion.div variants={fieldVariants}>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={5}
              aria-invalid={errors.message ? "true" : "false"}
              className={errors.message ? "border-red-500" : ""}
            />
            {errors.message && (
              <motion.p
                className="mt-1 text-sm text-red-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {errors.message}
              </motion.p>
            )}
          </motion.div>

          {/* Submission feedback */}
          {submitError && (
            <motion.p
              className="text-center text-red-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {submitError}
            </motion.p>
          )}
          {success && (
            <motion.p
              className="text-center text-green-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Thank you! Your message has been sent.
            </motion.p>
          )}

          {/* Submit Button */}
          <motion.div
            className="flex justify-center"
            variants={fieldVariants}
          >
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </>
  );
};

export default Contact;
