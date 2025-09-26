"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Lottie from "lottie-react";
import emailAnimation from "../../../public/Email.json";
import phone from "../../../public/Phone Call.json";

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.target);

    try {
      const res = await fetch("https://formspree.io/f/xjkaklbe", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        setSubmitted(true);
        e.target.reset();
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to send. Check your connection.");
    }
  }

  return (
    <section className="relative w-full min-h-[700px] flex flex-col md:flex-row justify-between items-center px-11 pt-24 z-10">
      
      {/* LEFT COLUMN: FORM + HEADING */}
      <div className="flex-1 max-w-md">
        <motion.h2
          className="md:text-5xl font-bold text-white mb-6 tracking-wide text-left [text-shadow:0_0_6px_#a394c9]"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Contact Us
        </motion.h2>

        {/* Contact Info */}
        <div className="flex items-center gap-3">
          <Image src="/gmail.svg" alt="Gmail Icon" width={24} height={24} />
          <span>Email:</span>
          <a
            href="mailto:acecore444@gmail.com"
            className="text-[#FCCC22] hover:underline"
          >
            acecore444@gmail.com
          </a>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Image src="/phone.svg" alt="Phone Icon" width={24} height={24} />
          <span>Phone:</span>
          <a
            href="tel:+966599553210"
            className="text-[#FCCC22] hover:underline text-lg"
          >
            +966 599 553 210
          </a>
        </div>

        {submitted ? (
          <motion.div
            className="md:text-2xl font-bold text-[#FCCC22] drop-shadow-[0_0_10px_#FCCC22] mb-6 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Your message has been sent successfully!
          </motion.div>
        ) : (
         <form onSubmit={handleSubmit} className="space-y-4">
  {/* NAME FIELD */}
  <div className="flex flex-col">
    <label htmlFor="name" className="text-white mb-1 text-sm font-semibold">
      Name
    </label>
    <input
      id="name"
      type="text"
      name="name"
      placeholder="Enter your name"
      className="w-full p-3 rounded-md bg-[#eee] text-black focus:outline-none focus:ring-2 focus:ring-[#FCCC22]"
      required
    />
  </div>

  {/* EMAIL FIELD */}
  <div className="flex flex-col">
    <label htmlFor="email" className="text-white mb-1 text-sm font-semibold">
      Email
    </label>
    <input
      id="email"
      type="email"
      name="email"
      placeholder="Enter your email"
      className="w-full p-3 rounded-md bg-[#eee] text-black focus:outline-none focus:ring-2 focus:ring-[#FCCC22]"
      required
    />
  </div>

  {/* MESSAGE FIELD */}
  <div className="flex flex-col">
    <label htmlFor="message" className="text-white mb-1 text-sm font-semibold">
     Message
    </label>
    <textarea
      id="message"
      name="message"
      placeholder="Type your message here..."
      rows={4}
      className="w-full p-3 rounded-md bg-[#eee] text-black focus:outline-none focus:ring-2 focus:ring-[#FCCC22]"
      required
    />
  </div>

  {error && <p className="text-red-400">{error}</p>}

  <button
    type="submit"
    className="bg-[#FCCC22] text-[#313166] font-bold px-6 py-3 rounded-lg shadow-[0_0_10px_#FCCC22] hover:shadow-[0_0_20px_#FCCC22] hover:scale-105 transition-all duration-200"
  >
    Send Message
  </button>
</form>

        )}
      </div>

     {/* RIGHT COLUMN: ANIMATIONS */}
<div className="flex-1 flex justify-center items-end gap-12 mt-27 translate-x-10">
  <div className="w-[300px] h-[300px] -rotate-6 translate-y-12">
    <Lottie animationData={emailAnimation} loop />
  </div>
  <div className="w-[300px] h-[300px] -rotate-12 translate-y-12">
    <Lottie animationData={phone} loop />
  </div>
</div>


    </section>
  );
}
