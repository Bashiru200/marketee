export const metadata = {
  title: 'Privacy Policy — Markeetee',
}

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Introduction',
      body: 'Markeetee ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you use Markeetee, including our website, mobile web application, and business listing platform.',
    },
    {
      title: '2. Information We Collect',
      body: 'We collect information that you voluntarily provide when creating an account, listing a business, contacting us, or interacting with our platform. This may include your name, email address, phone number, business information, profile photo, business photos, website, social media links, country of origin, and other information necessary to provide our services. We also collect limited technical information such as IP address, browser type, device information, and pages visited.',
    },
    {
      title: '3. Business Listing Information',
      body: 'Information you publish as part of your business profile—including your business name, address, phone number, operating hours, website, images, menu, products, and customer reviews—is intended to be publicly visible to help customers discover your business.',
    },
    {
      title: '4. Google Sign-In and Authentication',
      body: 'If you choose to sign in using Google, we receive basic profile information such as your name, email address, and profile picture. Authentication is securely handled through Google and Supabase. We never receive or store your Google password.',
    },
    {
      title: '5. Location Information',
      body: 'Markeetee uses location information to help users discover nearby businesses. If you allow location access, we may use your approximate or precise location to improve search results, provide map directions, and recommend nearby businesses. You can disable location permissions at any time through your device or browser settings.',
    },
    {
      title: '6. Cookies and Similar Technologies',
      body: 'We use cookies and similar technologies to keep you signed in, remember your preferences, improve website performance, measure usage, and enhance security. Some third-party services integrated into Markeetee may also use cookies to provide their functionality.',
    },
    {
      title: '7. How We Use Your Information',
      body: 'We use your information to create and manage your account, display business listings, process subscriptions, respond to customer enquiries, send important account notifications, improve our platform, personalize your experience, prevent fraud, monitor security, and comply with legal obligations.',
    },
    {
      title: '8. Reviews and User Content',
      body: 'Any reviews, ratings, photos, or other content you submit may become publicly visible. Please avoid posting sensitive personal information in reviews or public comments. We reserve the right to remove content that violates our Terms of Service.',
    },
    {
      title: '9. Payments and Subscriptions',
      body: 'Paid subscriptions are securely processed by our payment providers. Markeetee does not store your full payment card information. Billing information is handled according to the payment provider’s security standards.',
    },
    {
      title: '10. Third-Party Services',
      body: 'To operate Markeetee, we use trusted third-party providers including Supabase (authentication and database), Google Maps Platform (maps and location services), Algolia (search), Resend (email delivery), Stripe (subscription payments), and Vercel (website hosting). These providers only process information necessary to deliver their services.',
    },
    {
      title: '11. Analytics',
      body: 'We collect anonymous and aggregated usage information to understand how users interact with Markeetee. This helps us improve search results, business visibility, website performance, and user experience. Analytics data is not used to personally identify visitors.',
    },
    {
      title: '12. How We Share Information',
      body: 'We do not sell your personal information. We may share information with trusted service providers who help us operate Markeetee, when required by law, to protect our legal rights, or during a business merger, acquisition, or sale.',
    },
    {
      title: '13. Data Security',
      body: 'We use industry-standard administrative, technical, and physical safeguards to protect your information. This includes encrypted HTTPS connections, secure authentication, access controls, and regular security monitoring. While we strive to protect your information, no online system can guarantee absolute security.',
    },
    {
      title: '14. Data Retention',
      body: 'We retain your information for as long as your account remains active or as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account at any time.',
    },
    {
      title: '15. Your Privacy Rights',
      body: 'Depending on your location, you may have the right to access, update, correct, download, or delete your personal information. You may also object to certain processing activities or withdraw consent where applicable. We will respond to verified requests within a reasonable timeframe.',
    },
    {
      title: '16. Children’s Privacy',
      body: 'Markeetee is intended for individuals who are at least 18 years old or the age required by applicable law to operate a business. We do not knowingly collect personal information from children.',
    },
    {
      title: '17. International Users',
      body: 'Markeetee primarily serves users in the United States while connecting African-owned businesses and communities around the world. Your information may be processed and stored in countries where our service providers operate.',
    },
    {
      title: '18. Changes to This Privacy Policy',
      body: 'We may update this Privacy Policy periodically to reflect changes to our services, legal requirements, or business practices. When we make material changes, we will update the "Last Updated" date and, where appropriate, notify users through the platform or by email.',
    },
    {
      title: '19. Contact Us',
      body: 'If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at privacy@markeetee.com or visit our Contact page at https://markeetee.com/contact.',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900">
          Privacy Policy
        </h1>

        <p className="mt-3 text-gray-500">
          Last updated: July 2026
        </p>

        <p className="mt-6 text-gray-600 leading-8">
          Your privacy matters to us. This Privacy Policy explains how
          Markeetee collects, uses, stores, shares, and protects your
          information when you use our platform to discover, support,
          or manage African-owned businesses.
        </p>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {section.title}
            </h2>

            <p className="text-gray-600 leading-8">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}