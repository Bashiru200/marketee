export const metadata = {
  title: 'Terms of Service — Markeetee',
}

export default function TermsPage() {
  const sections = [
    {
      title: '1. Agreement to These Terms',
      body: 'Welcome to Markeetee. These Terms of Service ("Terms") govern your access to and use of the Markeetee website, mobile web application, business listings, and related services. By accessing or using Markeetee, you agree to these Terms. If you do not agree, please discontinue use of the platform.',
    },
    {
      title: '2. About Markeetee',
      body: 'Markeetee is a marketplace and discovery platform designed to connect customers with African-owned businesses. We provide business listings, search tools, maps, reviews, business management tools, and promotional features. Markeetee does not own, operate, or control the businesses listed on the platform unless explicitly stated.',
    },
    {
      title: '3. Eligibility',
      body: 'You must be at least 18 years old or have the legal capacity to enter into a binding agreement to create an account, list a business, purchase subscriptions, or use services intended for business owners.',
    },
    {
      title: '4. User Accounts',
      body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate information and keep your profile up to date.',
    },
    {
      title: '5. Business Listings',
      body: 'Business owners are responsible for ensuring that all information provided—including business name, address, phone number, operating hours, products, menus, pricing, photos, and descriptions—is accurate and current. Markeetee may edit, suspend, reject, or remove listings that violate these Terms or applicable laws.',
    },
    {
      title: '6. Claiming a Business',
      body: 'If a business already exists on Markeetee, an owner may request ownership by completing the verification process. Markeetee reserves the right to request additional documentation before granting ownership.',
    },
    {
      title: '7. Reviews and Ratings',
      body: 'Users may submit reviews based on genuine experiences. Reviews must be truthful, respectful, and free from harassment, discrimination, spam, or misleading information. Businesses may not post fake reviews or offer incentives in exchange for positive ratings. Markeetee reserves the right to moderate or remove content that violates these standards.',
    },
    {
      title: '8. Acceptable Use',
      body: 'You agree not to misuse Markeetee by submitting false information, impersonating another person or business, attempting unauthorized access, interfering with platform security, distributing malware, scraping data without permission, or engaging in fraudulent or illegal activities.',
    },
    {
      title: '9. Paid Plans and Subscriptions',
      body: 'Certain features require a paid subscription. Subscription fees are billed according to the selected plan. Unless otherwise stated, subscriptions automatically renew until cancelled. You may upgrade, downgrade, or cancel your subscription through your dashboard. Downgrading may remove access to premium features.',
    },
    {
      title: '10. Payments',
      body: 'Payments are securely processed by our payment provider. Markeetee does not store your complete payment card information. Failed payments may result in suspension of premium features until payment is successfully processed.',
    },
    {
      title: '11. Intellectual Property',
      body: 'The Markeetee name, logo, branding, website design, software, graphics, content, and technology are owned by Markeetee and protected by intellectual property laws. You may not reproduce, distribute, modify, or commercially exploit our content without prior written permission.',
    },
    {
      title: '12. User Content',
      body: 'You retain ownership of the content you submit, including business information, reviews, images, menus, and product descriptions. By submitting content, you grant Markeetee a worldwide, non-exclusive, royalty-free license to display, distribute, and promote that content as part of operating and marketing the platform.',
    },
    {
      title: '13. Third-Party Services',
      body: 'Markeetee integrates with third-party services such as Google Maps, Supabase, Algolia, Stripe, Resend, and other providers. These services operate under their own terms and privacy policies. Markeetee is not responsible for the availability or performance of third-party services.',
    },
    {
      title: '14. Availability',
      body: 'We strive to provide reliable service but cannot guarantee uninterrupted access. Markeetee may perform maintenance, updates, or improvements that temporarily affect platform availability.',
    },
    {
      title: '15. Disclaimer',
      body: 'Markeetee provides information submitted by businesses and users. We do not guarantee the accuracy, completeness, legality, availability, quality, pricing, safety, or suitability of any listed business, product, or service. Customers should exercise their own judgment before making purchases or visiting businesses.',
    },
    {
      title: '16. Limitation of Liability',
      body: 'To the fullest extent permitted by law, Markeetee and its owners, employees, affiliates, and partners shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising from your use of the platform or interactions with listed businesses.',
    },
    {
      title: '17. Account Suspension and Termination',
      body: 'We may suspend or terminate accounts that violate these Terms, engage in fraudulent activity, abuse the platform, manipulate reviews, or otherwise threaten the safety or integrity of Markeetee or its community.',
    },
    {
      title: '18. Privacy',
      body: 'Your use of Markeetee is also governed by our Privacy Policy, which explains how we collect, use, and protect your information.',
    },
    {
      title: '19. Changes to These Terms',
      body: 'We may update these Terms periodically to reflect changes in our services, legal requirements, or business practices. Continued use of Markeetee after changes become effective constitutes acceptance of the revised Terms.',
    },
    {
      title: '20. Governing Law',
      body: 'These Terms shall be governed by and interpreted in accordance with the laws of the State in which Markeetee operates, without regard to conflict of law principles.',
    },
    {
      title: '21. Contact Us',
      body: 'If you have questions regarding these Terms of Service, please contact us at legal@markeetee.com or through the Contact page on Markeetee.',
    },
  ]

  return (
    <div className="bg-[#F8FAF9] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Terms of Service
          </h1>

          <p className="mt-3 text-gray-500">
            Last updated: July 2026
          </p>

          <p className="mt-6 text-gray-600 leading-8">
            These Terms of Service govern your use of Markeetee and describe the
            rights and responsibilities of customers, business owners, and
            visitors using our platform.
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

        <div
          className="mt-16 rounded-3xl p-8 text-white"
          style={{ background: '#085041' }}
        >
          <h3 className="text-2xl font-bold mb-3">
            Questions about these Terms?
          </h3>

          <p className="leading-7 mb-6" style={{ color: '#C5EADB' }}>
            If you have questions about these Terms of Service or your use of
            Markeetee, our team is here to help.
          </p>

          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-white font-semibold"
            style={{ color: '#085041' }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}