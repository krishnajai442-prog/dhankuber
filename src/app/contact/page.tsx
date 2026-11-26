"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Loading } from "@/components/shared/Loading";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.length < 10) newErrors.message = "Message must be at least 10 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const announcements = {
    red: "Contact us for any inquiries or support.",
    green: "We typically respond within 24 hours.",
  };

  return (
    <div className="page-container">
      <Header announcements={announcements} />
      <main className="main-content" role="main">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
            <p className="text-gray-600">Have questions? We'd love to hear from you.</p>
          </header>

          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">support@onlinekhiwal.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-600">+91 XXXXX XXXXX</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <p className="text-gray-600">India</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Send a Message</h2>
              
              {submitStatus === "success" && (
                <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-3 text-success-700" role="alert">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Thank you for your message! We'll get back to you soon.</span>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700" role="alert">
                  Failed to send message. Please try again later.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <Input
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Your name"
                  required
                  disabled={isSubmitting}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="your@email.com"
                  required
                  disabled={isSubmitting}
                />
                <Input
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  placeholder="Subject"
                  required
                  disabled={isSubmitting}
                />
                <div>
                  <label htmlFor="message" className="label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={clsx(
                      "input resize-y min-h-[120px]",
                      errors.message && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                    )}
                    placeholder="Your message..."
                    required
                    disabled={isSubmitting}
                  />
                  {errors.message && <p className="mt-1.5 text-sm text-danger-600" role="alert">{errors.message}</p>}
                </div>
                <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
                  {isSubmitting ? <Loading size="sm" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}