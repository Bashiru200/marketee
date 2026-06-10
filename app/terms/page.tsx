export const metadata = { title: 'Terms of Service — Markeetee' }

export default function TermsPage() {
  const sections = [
    { title:'1. Acceptance of terms', body:'By accessing or using Markeetee, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.' },
    { title:'2. Use of the platform', body:'Markeetee provides a directory of African-owned businesses for informational purposes. You may use the platform to discover businesses, leave reviews, and list your own business. You agree not to misuse the platform, submit false information, or engage in fraudulent activity.' },
    { title:'3. Business listings', body:'Business owners are responsible for the accuracy of their listing information. Markeetee reserves the right to remove listings that are inaccurate, inappropriate, or violate our community guidelines.' },
    { title:'4. Reviews and content', body:'By submitting a review, you grant Markeetee a non-exclusive licence to display that content on the platform. Reviews must be genuine and based on real experiences. Fake, misleading, or defamatory reviews are prohibited.' },
    { title:'5. Intellectual property', body:'All content on Markeetee, including the logo, design, and software, is owned by Markeetee and protected by intellectual property laws. You may not reproduce or distribute our content without written permission.' },
    { title:'6. Limitation of liability', body:'Markeetee is a directory service and is not responsible for the quality, safety, or legality of the businesses listed. We do not guarantee the accuracy of any listing information. Use of the platform is at your own risk.' },
    { title:'7. Changes to terms', body:'We may update these terms from time to time. Continued use of the platform after changes are posted constitutes your acceptance of the new terms.' },
    { title:'8. Contact', body:'For questions about these terms, please contact us at legal@markeetee.com.' },
  ]
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>
      <div className="space-y-8">
        {sections.map(s => (
          <div key={s.title}>
            <h2 className="font-semibold text-gray-900 mb-2">{s.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}