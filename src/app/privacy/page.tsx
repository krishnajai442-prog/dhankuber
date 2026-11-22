import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Dhan Kuber website",
};

export default function PrivacyPage() {
  const announcements = {
    red: "Your privacy is important to us. Please review our privacy practices.",
    green: "Updated: Privacy Policy last updated on January 1, 2025.",
  };

  return (
    <div className="page-container">
      <Header announcements={announcements} />
      <main className="main-content" role="main">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: January 1, 2025</p>
          </header>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you contact us through our contact form. We also collect certain information automatically when you visit our Website, including your IP address, browser type, and pages visited.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our Website, to respond to your inquiries, and to send you updates about our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cookies and Tracking</h2>
              <p>Our Website uses cookies and similar tracking technologies to track activity and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Third-Party Links</h2>
              <p>Our Website may contain links to third-party websites. We are not responsible for the privacy practices or content of these third-party sites.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Children's Privacy</h2>
              <p>Our Website is not intended for children under 18. We do not knowingly collect personal information from children under 18.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
              <p>You have the right to access, update, or delete your personal information. You can also object to or restrict the processing of your data.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us through our Contact page.</p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}