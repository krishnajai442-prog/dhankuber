import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Disclaimer for Dhan Kuber website",
};

export default function DisclaimerPage() {
  const announcements = {
    red: "Important: Please read this disclaimer carefully before using our website.",
    green: "Notice: This website is for informational purposes only.",
  };

  return (
    <div className="page-container">
      <Header announcements={announcements} />
      <main className="main-content" role="main">
        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Disclaimer</h1>
            <p className="text-gray-600">Last updated: November 24, 2024</p>
          </header>

          <div className="prose prose-gray max-w-none space-y-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-yellow-800 mb-2">DISCLAIMER</h3>
              <p className="text-yellow-800">
                This website is an independent media portal for informational and journalistic purposes only. As a non-transactional service, we are not affiliated with any entity mentioned. Users are solely responsible for complying with all applicable laws in their jurisdiction.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Informational Purpose Only</h2>
              <p>The content provided on Dhan Kuber website is for informational and journalistic purposes only. We do not promote, encourage, or facilitate any form of gambling, betting, or illegal activities. This website serves as an independent media portal and informational archive.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Non-Transactional Service</h2>
              <p>This website does not offer any gambling, betting, or lottery services. We only display results and charts that are publicly available from various sources. We are not a lottery operator, bookmaker, or gambling platform. We do not facilitate or accept any form of financial exchanges between users or third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. No Affiliation</h2>
              <p>We are not affiliated with any entity, organization, or individual mentioned on this website. Any references to specific markets, draws, or entities are for informational and archival purposes only.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Accuracy of Information</h2>
              <p>While we strive to provide accurate and up-to-date information, we do not guarantee the absolute accuracy, timeliness, or completeness of any results, charts, or data displayed on this website. The data provided is informational in nature. Users should verify information from official sources.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Legal Compliance</h2>
              <p>Users are solely responsible for complying with all applicable local, state, and national laws in their jurisdiction. It is your sole and absolute responsibility to ensure that your access to and use of this website is not in violation of any applicable law or regulation in your jurisdiction.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Age Restriction</h2>
              <p>This website is intended for users who are of the legal age of majority in their jurisdiction. By accessing this website, you confirm that you meet the age requirements in your jurisdiction.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. No Financial Advice</h2>
              <p>Nothing on this website should be considered financial, investment, or legal advice. The information provided is not intended as advice of any kind. Any decisions you make based on information from this website are at your own risk.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
              <p>We shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use this website, including but not limited to financial losses. Our aggregate liability shall not exceed one hundred U.S. dollars (U.S. $100.00).</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Intellectual Property</h2>
              <p>The Services and their original content, features, and functionality are and will remain the exclusive property of us and our licensors, protected by copyright, trademark, and other laws of the United States and foreign countries.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to Disclaimer</h2>
              <p>We reserve the right to modify this disclaimer at any time. Continued use of the website constitutes acceptance of any changes.</p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}