export const metadata = { title: 'Privacy Policy — Markeetee' }

export default function PrivacyPage() {
  const sections = [
    { title:'1. Information we collect', body:'We collect information you provide directly, such as your name, email address, and business details when you register. We also collect usage data such as pages visited and searches performed to improve the platform.' },
    { title:'2. How we use your information', body:'We use your information to operate the platform, send account notifications (including review alerts and weekly summaries if you are a business owner), improve our services, and communicate updates. We do not sell your personal data to third parties.' },
    { title:'3. Data sharing', body:'We share data with trusted service providers including Supabase (database hosting), Resend (email delivery), Algolia (search), and Google Maps (location services). Each provider processes data only as necessary to deliver their service.' },
    { title:'4. Cookies', body:'Markeetee uses cookies to maintain your login session and remember your preferences. You can disable cookies in your browser settings, though this may affect platform functionality.' },
    { title:'5. Data retention', body:'We retain your account data for as long as your account is active. You can request deletion of your account and associated data at any time by contacting us.' },
    { title:'6. Security', body:'We use industry-standard security measures including encrypted connections (HTTPS) and secure authentication. Your password is never stored in plain text.' },
    { title:'7. Your rights', body:'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@markeetee.com.' },
    { title:'8. Contact', body:'For privacy questions, contact us at privacy@markeetee.com.' },
  ]
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
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