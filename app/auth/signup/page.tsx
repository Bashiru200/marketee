'use client'

import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  Users,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { AFRICAN_FLAGS } from '@/lib/africanFlags'

import FieldError from '@/components/ui/FieldError'
import BusinessDetailsForm, {
  type BusinessFormValues,
  EMPTY_BUSINESS_FORM,
} from '@/components/business/BusinessDetailsForm'

type Role = 'customer' | 'owner'
type Step = 0 | 1 | 2 | 3

type AccountForm = {
  name: string
  email: string
  password: string
  confirmPassword: string
  gender: string
  origin: string
  country: string
  city: string
  coverImage: string
}

type FieldErrors = Partial<
  Record<
    'name' | 'email' | 'password' | 'confirmPassword',
    string
  >
>

const BRAND = {
  dark: '#053528',
  primary: '#085041',
  green: '#1D9E75',
  mint: '#E1F5EE',
  lightMint: '#F4FBF8',
}

const INITIAL_FORM: AccountForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '',
  origin: '',
  country: '',
  city: '',
  coverImage: '',
}

const INTERESTS = [
  {
    icon: '🍲',
    label: 'Food & Groceries',
  },
  {
    icon: '🍽️',
    label: 'Restaurants',
  },
  {
    icon: '👗',
    label: 'Fashion & Fabric',
  },
  {
    icon: '💆🏾',
    label: 'Beauty & Hair',
  },
  {
    icon: '🌿',
    label: 'Herbs & Wellness',
  },
  {
    icon: '🎵',
    label: 'Music & Arts',
  },
  {
    icon: '🏺',
    label: 'Crafts & Decor',
  },
  {
    icon: '🧰',
    label: 'Services',
  },
]

const ROLE_OPTIONS = [
  {
    value: 'customer' as const,
    icon: User,
    title: 'Customer',
    description:
      'Discover, save, and review African-owned businesses.',
  },
  {
    value: 'owner' as const,
    icon: Building2,
    title: 'Business owner',
    description:
      'List your business and reach more customers.',
  },
]

const PANEL_CONTENT = {
  customer: {
    eyebrow: 'Discover your community',
    title: 'Find the businesses that feel like home.',
    description:
      'Explore African-owned restaurants, markets, fashion, beauty, wellness, and services across the United States.',
    benefits: [
      {
        icon: Search,
        title: 'Discover nearby businesses',
        description:
          'Search by city, category, product, or service.',
      },
      {
        icon: Heart,
        title: 'Save your favorites',
        description:
          'Keep the businesses you love in one place.',
      },
      {
        icon: Users,
        title: 'Support the community',
        description:
          'Leave reviews and help trusted businesses grow.',
      },
    ],
  },

  owner: {
    eyebrow: 'Grow your visibility',
    title: 'Help more customers discover your business.',
    description:
      'Create your Markeetee business profile and showcase your products, services, location, photos, and reviews.',
    benefits: [
      {
        icon: Store,
        title: 'Create your business profile',
        description:
          'Add your business details, photos, products, and hours.',
      },
      {
        icon: MapPin,
        title: 'Appear in map searches',
        description:
          'Help nearby customers find and navigate to you.',
      },
      {
        icon: Sparkles,
        title: 'Build customer trust',
        description:
          'Collect reviews and strengthen your online presence.',
      },
    ],
  },
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [role, setRole] = useState<Role | null>(null)
  const [step, setStep] = useState<Step>(0)

  const [form, setForm] =
    useState<AccountForm>(INITIAL_FORM)

  const [interests, setInterests] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({})

  const [showPassword, setShowPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationSent, setConfirmationSent] =
    useState(false)

  const selectedPanel =
    role === 'owner'
      ? PANEL_CONTENT.owner
      : PANEL_CONTENT.customer

  const totalSteps = role === 'owner' ? 3 : 3

  function updateForm<K extends keyof AccountForm>(
    key: K,
    value: AccountForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))

    setError('')

    if (
      key === 'name' ||
      key === 'email' ||
      key === 'password' ||
      key === 'confirmPassword'
    ) {
      clearFieldError(key)
    }
  }

  function setFieldError(
    field: keyof FieldErrors,
    message: string,
  ) {
    setFieldErrors((current) => ({
      ...current,
      [field]: message,
    }))
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function validateField(
    field: keyof FieldErrors,
    rawValue: string,
  ) {
    const value = rawValue.trim()

    if (field === 'name') {
      if (!value) {
        setFieldError('name', 'Enter your full name.')
        return false
      }

      if (value.length < 2) {
        setFieldError(
          'name',
          'Your name must contain at least 2 characters.',
        )
        return false
      }
    }

    if (field === 'email') {
      if (!value) {
        setFieldError('email', 'Enter your email address.')
        return false
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        setFieldError(
          'email',
          'Enter a valid email address.',
        )
        return false
      }
    }

    if (field === 'password') {
      if (!value) {
        setFieldError('password', 'Create a password.')
        return false
      }

      if (value.length < 8) {
        setFieldError(
          'password',
          'Your password must contain at least 8 characters.',
        )
        return false
      }
    }

    if (field === 'confirmPassword') {
      if (!value) {
        setFieldError(
          'confirmPassword',
          'Confirm your password.',
        )
        return false
      }

      if (value !== form.password) {
        setFieldError(
          'confirmPassword',
          'The passwords do not match.',
        )
        return false
      }
    }

    clearFieldError(field)
    return true
  }

  function validateAccountForm() {
    const results = [
      validateField('name', form.name),
      validateField('email', form.email),
      validateField('password', form.password),
      validateField(
        'confirmPassword',
        form.confirmPassword,
      ),
    ]

    return results.every(Boolean)
  }

  function toggleInterest(label: string) {
    setInterests((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    )
  }

  async function logAuthEvent(
    userId: string,
    eventType: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      await fetch('/api/auth-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          eventType,
          metadata,
        }),
      })
    } catch {
      // Analytics must never interrupt signup.
    }
  }

  async function handleGoogleSignup() {
    setError('')

    const selectedRole = role ?? 'customer'

    const callbackUrl = new URL(
      '/auth/callback',
      window.location.origin,
    )

    callbackUrl.searchParams.set('intent', 'signup')
    callbackUrl.searchParams.set('role', selectedRole)

    const { error: oauthError } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

    if (oauthError) {
      setError(oauthError.message)
    }
  }

  async function handleCreateAccount(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!role) {
      setError('Select how you will use Markeetee.')
      return
    }

    setError('')

    if (!validateAccountForm()) {
      return
    }

    if (loading) {
      return
    }

    setLoading(true)

    try {
      const callbackUrl = new URL(
        '/auth/callback',
        window.location.origin,
      )

      callbackUrl.searchParams.set('intent', 'signup')
      callbackUrl.searchParams.set('role', role)

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          emailRedirectTo: callbackUrl.toString(),

          data: {
            name: form.name.trim(),
            role,
            gender: form.gender || null,
            origin: form.origin || null,
            country: form.country || null,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (!data.user) {
        throw new Error(
          'The account could not be created. Please try again.',
        )
      }

      await logAuthEvent(data.user.id, 'signup', {
        role,
        gender: form.gender || null,
        origin: form.origin || null,
        country: form.country || null,
        requiresConfirmation: !data.session,
      })

      if (!data.session) {
        setConfirmationSent(true)
        setStep(2)
        return
      }

      const { error: profileError } =
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role,
          gender: form.gender || null,
          origin: form.origin || null,
          country: form.country || null,
        })

      if (profileError) {
        console.error(
          'Profile creation failed:',
          profileError,
        )
      }

      setStep(2)
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : 'Your account could not be created.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBusiness(
    values: BusinessFormValues,
  ) {
    if (loading) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Your session could not be verified. Please sign in again.',
        )
      }

      const coordinates =
        await geocodeBusinessAddress(values)

      const tags = values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      const {
        data: business,
        error: businessError,
      } = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          name: values.name.trim(),
          category: values.category,
          subcategory:
            values.subcategory?.trim() || null,
          description:
            values.description?.trim() || null,

          country: values.country || null,

          address: values.street?.trim() || null,
          street: values.street?.trim() || null,
          city: values.city?.trim() || null,
          state: values.state?.trim() || null,
          zip: values.zip?.trim() || null,

          phone: values.phone?.trim() || null,
          email: values.email?.trim() || null,
          website: values.website?.trim() || null,

          price_range: values.price_range || null,
          tags: tags.length ? tags : null,

          days_open: values.days_open.length
            ? values.days_open
            : null,

          hours_open: values.hours_open || null,
          cover_image: values.cover_image || null,
          logo_url: values.logo_url || null,

          lat: coordinates.lat,
          lng: coordinates.lng,

          verified: false,
          premium: false,
          featured: false,
          plan: 'free',
          status: 'active',
        })
        .select('id')
        .single()

      if (businessError) {
        throw businessError
      }

      const { error: profileUpdateError } =
        await supabase
          .from('profiles')
          .update({
            business_id: business.id,
            role: 'owner',
          })
          .eq('id', user.id)

      if (profileUpdateError) {
        throw profileUpdateError
      }

      await logAuthEvent(
        user.id,
        'business_created',
        {
          businessId: business.id,
          category: values.category,
          city: values.city || null,
        },
      )

      setStep(3)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Your business could not be saved.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePreferences() {
    if (loading) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(
          'Your session could not be verified. Please sign in again.',
        )
      }

      const { error: updateError } =
        await supabase
          .from('profiles')
          .update({
            interests,
            city: form.city.trim() || null,
          })
          .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      await logAuthEvent(
        user.id,
        'preferences_completed',
        {
          interests,
          city: form.city.trim() || null,
        },
      )

      setStep(3)
    } catch (preferencesError) {
      setError(
        preferencesError instanceof Error
          ? preferencesError.message
          : 'Your preferences could not be saved.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8F7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl shadow-[#053528]/5 lg:grid-cols-[410px_minmax(0,1fr)]">
        <BrandPanel
          role={role}
          content={selectedPanel}
        />

        <section className="flex min-w-0 flex-col">
          <MobileHeader />

          <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-9 lg:px-12">
            <div
              className={`w-full ${
                step === 2 &&
                role === 'owner' &&
                !confirmationSent
                  ? 'max-w-3xl'
                  : 'max-w-lg'
              }`}
            >
              {step < 3 && !confirmationSent ? (
                <StepIndicator
                  currentStep={step}
                  totalSteps={totalSteps}
                />
              ) : null}

              {error ? (
                <ErrorAlert
                  message={error}
                  onDismiss={() => setError('')}
                />
              ) : null}

              {step === 0 ? (
                <RoleSelectionStep
                  role={role}
                  onRoleChange={setRole}
                  onContinue={() => setStep(1)}
                  onGoogleSignup={handleGoogleSignup}
                />
              ) : null}

              {step === 1 ? (
                <AccountDetailsStep
                  form={form}
                  fieldErrors={fieldErrors}
                  role={role}
                  loading={loading}
                  showPassword={showPassword}
                  showConfirmPassword={
                    showConfirmPassword
                  }
                  onBack={() => setStep(0)}
                  onSubmit={handleCreateAccount}
                  onUpdate={updateForm}
                  onValidate={validateField}
                  onShowPassword={() =>
                    setShowPassword((current) => !current)
                  }
                  onShowConfirmPassword={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                />
              ) : null}

              {step === 2 &&
              confirmationSent ? (
                <ConfirmationStep
                  email={form.email}
                  onBack={() => {
                    setConfirmationSent(false)
                    setStep(1)
                  }}
                />
              ) : null}

              {step === 2 &&
              role === 'owner' &&
              !confirmationSent ? (
                <BusinessSetupStep
                  form={form}
                  loading={loading}
                  onBack={() => setStep(1)}
                  onSubmit={handleSaveBusiness}
                />
              ) : null}

              {step === 2 &&
              role === 'customer' &&
              !confirmationSent ? (
                <CustomerPreferencesStep
                  interests={interests}
                  city={form.city}
                  loading={loading}
                  onToggleInterest={toggleInterest}
                  onCityChange={(value) =>
                    updateForm('city', value)
                  }
                  onBack={() => setStep(1)}
                  onSubmit={handleSavePreferences}
                />
              ) : null}

              {step === 3 ? (
                <SuccessStep
                  role={role}
                  onContinue={() =>
                    router.push(
                      role === 'owner'
                        ? '/dashboard'
                        : '/search',
                    )
                  }
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function RoleSelectionStep({
  role,
  onRoleChange,
  onContinue,
  onGoogleSignup,
}: {
  role: Role | null
  onRoleChange: (role: Role) => void
  onContinue: () => void
  onGoogleSignup: () => void
}) {
  return (
    <>
      <FormHeading
        eyebrow="Create your account"
        title="How will you use Markeetee?"
        description="Choose the account type that best matches what you want to do."
      />

      <div className="mt-7 space-y-3">
        {ROLE_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = role === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onRoleChange(option.value)
              }
              aria-pressed={selected}
              className="relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              style={{
                borderColor: selected
                  ? BRAND.green
                  : '#E5E7EB',
                backgroundColor: selected
                  ? BRAND.lightMint
                  : '#FFFFFF',
              }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: BRAND.mint,
                }}
              >
                <Icon
                  size={21}
                  style={{ color: BRAND.primary }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-950">
                  {option.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {option.description}
                </p>
              </div>

              <SelectionIndicator
                selected={selected}
              />
            </button>
          )
        })}
      </div>

      <button
        type="button"
        disabled={!role}
        onClick={onContinue}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        style={{ backgroundColor: BRAND.primary }}
      >
        Continue
        <ArrowRight size={16} />
      </button>

      <Divider />

      <button
        type="button"
        onClick={onGoogleSignup}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-gray-50"
      >
        <GoogleIcon />

        {role === 'owner'
          ? 'Continue with Google as an owner'
          : 'Continue with Google'}
      </button>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-bold hover:underline"
          style={{ color: BRAND.primary }}
        >
          Sign in
        </Link>
      </p>
    </>
  )
}

interface AccountDetailsStepProps {
  form: AccountForm
  fieldErrors: FieldErrors
  role: Role | null
  loading: boolean
  showPassword: boolean
  showConfirmPassword: boolean
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUpdate: <K extends keyof AccountForm>(
    key: K,
    value: AccountForm[K],
  ) => void
  onValidate: (
    field: keyof FieldErrors,
    value: string,
  ) => boolean
  onShowPassword: () => void
  onShowConfirmPassword: () => void
}

function AccountDetailsStep({
  form,
  fieldErrors,
  role,
  loading,
  showPassword,
  showConfirmPassword,
  onBack,
  onSubmit,
  onUpdate,
  onValidate,
  onShowPassword,
  onShowConfirmPassword,
}: AccountDetailsStepProps) {
  const passwordsMatch =
    form.confirmPassword.length >= 8 &&
    form.password === form.confirmPassword

  return (
    <>
      <BackButton onClick={onBack} />

      <FormHeading
        eyebrow={
          role === 'owner'
            ? 'Business owner account'
            : 'Customer account'
        }
        title="Create your login details"
        description="Use this information to sign in and manage your Markeetee account."
      />

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-7 space-y-5"
      >
        <FormField
          label="Full name"
          required
          error={fieldErrors.name}
        >
          <InputWithIcon
            icon={User}
            type="text"
            value={form.name}
            placeholder="Enter your full name"
            autoComplete="name"
            onChange={(value) =>
              onUpdate('name', value)
            }
            onBlur={() =>
              onValidate('name', form.name)
            }
          />
        </FormField>

        <FormField
          label="Email address"
          required
          error={fieldErrors.email}
        >
          <InputWithIcon
            icon={Mail}
            type="email"
            value={form.email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(value) =>
              onUpdate('email', value)
            }
            onBlur={() =>
              onValidate('email', form.email)
            }
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Country or cultural origin"
            hint="Optional"
          >
            <select
              value={form.country}
              onChange={(event) =>
                onUpdate(
                  'country',
                  event.target.value,
                )
              }
              className={selectClassName}
            >
              <option value="">
                Select an option
              </option>

              <option value="pan_african">
                🌍 Pan-African
              </option>

              <option value="multiple">
                Multiple countries
              </option>

              {Object.entries(AFRICAN_FLAGS).map(
                ([code, flag]) => (
                  <option key={code} value={code}>
                    {flag} {code}
                  </option>
                ),
              )}

              <option value="other">Other</option>
              <option value="prefer_not_to_say">
                Prefer not to say
              </option>
            </select>
          </FormField>

          <FormField
            label="Background"
            hint="Optional"
          >
            <select
              value={form.origin}
              onChange={(event) =>
                onUpdate(
                  'origin',
                  event.target.value,
                )
              }
              className={selectClassName}
            >
              <option value="">
                Select an option
              </option>

              <option value="african">
                African
              </option>

              <option value="diaspora">
                African diaspora
              </option>

              <option value="non_african">
                Friend of the community
              </option>

              <option value="prefer_not_to_say">
                Prefer not to say
              </option>
            </select>
          </FormField>
        </div>

        <FormField
          label="Gender"
          hint="Optional"
        >
          <select
            value={form.gender}
            onChange={(event) =>
              onUpdate('gender', event.target.value)
            }
            className={selectClassName}
          >
            <option value="">
              Prefer not to say
            </option>

            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non_binary">
              Non-binary
            </option>
            <option value="self_describe">
              Prefer to self-describe
            </option>
          </select>
        </FormField>

        <FormField
          label="Password"
          required
          error={fieldErrors.password}
        >
          <PasswordField
            value={form.password}
            visible={showPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            onChange={(value) =>
              onUpdate('password', value)
            }
            onBlur={() =>
              onValidate(
                'password',
                form.password,
              )
            }
            onToggle={onShowPassword}
          />
        </FormField>

        <FormField
          label="Confirm password"
          required
          error={fieldErrors.confirmPassword}
        >
          <PasswordField
            value={form.confirmPassword}
            visible={showConfirmPassword}
            placeholder="Enter your password again"
            autoComplete="new-password"
            onChange={(value) =>
              onUpdate(
                'confirmPassword',
                value,
              )
            }
            onBlur={() =>
              onValidate(
                'confirmPassword',
                form.confirmPassword,
              )
            }
            onToggle={onShowConfirmPassword}
          />

          {passwordsMatch ? (
            <p
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: BRAND.green }}
            >
              <Check size={13} />
              Passwords match
            </p>
          ) : null}
        </FormField>

        <p className="text-xs leading-5 text-gray-400">
          By continuing, you agree to Markeetee&apos;s{' '}
          <Link
            href="/terms"
            className="font-semibold underline"
            style={{ color: BRAND.primary }}
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="font-semibold underline"
            style={{ color: BRAND.primary }}
          >
            Privacy Policy
          </Link>
          .
        </p>

        <PrimaryButton
          loading={loading}
          disabled={
            loading ||
            !form.name.trim() ||
            !form.email.trim() ||
            form.password.length < 8 ||
            form.password !== form.confirmPassword
          }
        >
          Continue
        </PrimaryButton>
      </form>
    </>
  )
}

function BusinessSetupStep({
  form,
  loading,
  onBack,
  onSubmit,
}: {
  form: AccountForm
  loading: boolean
  onBack: () => void
  onSubmit: (values: BusinessFormValues) => void
}) {
  return (
    <>
      <BackButton onClick={onBack} />

      <FormHeading
        eyebrow="Business profile"
        title="Tell us about your business"
        description="Add the details customers need to discover, understand, and contact your business. You can update everything later."
      />

      <div className="mt-7">
        <BusinessDetailsForm
          initialValues={{
            ...EMPTY_BUSINESS_FORM,
            country: form.country,
            cover_image: form.coverImage,
            email: form.email,
          }}
          onSubmit={onSubmit}
          loading={loading}
          submitLabel="Create my business listing"
          imageFolder={form.email.replace(
            /[^a-zA-Z0-9]/g,
            '_',
          )}
        />
      </div>
    </>
  )
}

function CustomerPreferencesStep({
  interests,
  city,
  loading,
  onToggleInterest,
  onCityChange,
  onBack,
  onSubmit,
}: {
  interests: string[]
  city: string
  loading: boolean
  onToggleInterest: (label: string) => void
  onCityChange: (value: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <>
      <BackButton onClick={onBack} />

      <FormHeading
        eyebrow="Personalize your experience"
        title="What are you interested in?"
        description="Select the categories you want to discover. You can change these preferences later."
      />

      <div className="mt-7 grid grid-cols-2 gap-3">
        {INTERESTS.map((interest) => {
          const selected = interests.includes(
            interest.label,
          )

          return (
            <button
              key={interest.label}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onToggleInterest(interest.label)
              }
              className="relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              style={{
                borderColor: selected
                  ? BRAND.green
                  : '#E5E7EB',
                backgroundColor: selected
                  ? BRAND.lightMint
                  : '#FFFFFF',
              }}
            >
              {selected ? (
                <span
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{
                    backgroundColor: BRAND.green,
                  }}
                >
                  <Check size={12} />
                </span>
              ) : null}

              <span className="text-2xl">
                {interest.icon}
              </span>

              <p className="mt-3 pr-5 text-xs font-bold leading-5 text-gray-800">
                {interest.label}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <FormField
          label="Your city"
          hint="Optional"
        >
          <InputWithIcon
            icon={MapPin}
            type="text"
            value={city}
            placeholder="e.g. Houston"
            onChange={onCityChange}
          />
        </FormField>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={onSubmit}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: BRAND.primary }}
      >
        {loading ? (
          <>
            <Loader2
              size={16}
              className="animate-spin"
            />
            Saving preferences…
          </>
        ) : (
          <>
            Finish creating my account
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={onSubmit}
        className="mt-3 w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600"
      >
        Skip for now
      </button>
    </>
  )
}

function ConfirmationStep({
  email,
  onBack,
}: {
  email: string
  onBack: () => void
}) {
  return (
    <div className="py-8 text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: BRAND.mint }}
      >
        <Mail
          size={32}
          style={{ color: BRAND.primary }}
        />
      </div>

      <h1 className="mt-6 text-2xl font-extrabold text-gray-950">
        Check your email
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
        We sent a confirmation link to{' '}
        <strong className="text-gray-800">
          {email}
        </strong>
        . Open the message and confirm your email address to
        activate your account.
      </p>

      <div
        className="mx-auto mt-7 max-w-sm rounded-2xl border p-4 text-left"
        style={{
          backgroundColor: BRAND.lightMint,
          borderColor: '#C7E9DD',
        }}
      >
        <p
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: BRAND.primary }}
        >
          <ShieldCheck size={17} />
          Didn&apos;t receive it?
        </p>

        <p className="mt-2 text-xs leading-5 text-gray-500">
          Check your spam or promotions folder. Make sure the
          email address above is correct before trying again.
        </p>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm font-bold hover:underline"
        style={{ color: BRAND.primary }}
      >
        Change email address
      </button>
    </div>
  )
}

function SuccessStep({
  role,
  onContinue,
}: {
  role: Role | null
  onContinue: () => void
}) {
  const owner = role === 'owner'

  const ownerBenefits = [
    {
      title: 'Business profile created',
      description:
        'Customers can now discover your listing.',
    },
    {
      title: 'Ready for customer reviews',
      description:
        'Share your profile and build your reputation.',
    },
    {
      title: 'Dashboard access enabled',
      description:
        'Manage your listing, photos, products, and insights.',
    },
  ]

  return (
    <div className="py-6 text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: BRAND.mint }}
      >
        <Check
          size={34}
          style={{ color: BRAND.green }}
        />
      </div>

      <h1 className="mt-6 text-2xl font-extrabold text-gray-950">
        {owner
          ? 'Your business profile is ready'
          : 'Welcome to Markeetee'}
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
        {owner
          ? 'You can now manage your business information and start building your visibility on Markeetee.'
          : 'Your account is ready. Start discovering African-owned businesses near you.'}
      </p>

      {owner ? (
        <div className="mt-7 space-y-3 text-left">
          {ownerBenefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{
                backgroundColor: BRAND.lightMint,
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: BRAND.mint,
                  color: BRAND.primary,
                }}
              >
                <Check size={14} />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  {benefit.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95"
        style={{ backgroundColor: BRAND.primary }}
      >
        {owner
          ? 'Go to my dashboard'
          : 'Explore businesses'}

        <ArrowRight size={16} />
      </button>
    </div>
  )
}

function BrandPanel({
  role,
  content,
}: {
  role: Role | null
  content: (typeof PANEL_CONTENT)[keyof typeof PANEL_CONTENT]
}) {
  return (
    <aside
      className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col"
      style={{
        background:
          'linear-gradient(160deg, #053528 0%, #085041 60%, #1D9E75 100%)',
      }}
    >
      <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-white/5" />

      <div className="absolute -bottom-36 -left-28 h-80 w-80 rounded-full bg-[#9FE1CB]/10" />

      <Link
        href="/"
        className="relative inline-flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Store size={22} />
        </div>

        <div>
          <p className="text-xl font-extrabold">
            Markeetee
          </p>

          <p className="mt-1 text-xs text-[#9FE1CB]">
            Africa is here. Find it.
          </p>
        </div>
      </Link>

      <div className="relative my-auto py-12">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9FE1CB]">
          {content.eyebrow}
        </p>

        <h2 className="mt-5 text-4xl font-extrabold leading-tight">
          {content.title}
        </h2>

        <p className="mt-5 text-sm leading-7 text-emerald-50/75">
          {content.description}
        </p>

        <div className="mt-10 space-y-6">
          {content.benefits.map((benefit) => {
            const Icon = benefit.icon

            return (
              <div
                key={benefit.title}
                className="flex items-start gap-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Icon
                    size={18}
                    className="text-[#9FE1CB]"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold">
                    {benefit.title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-emerald-50/65">
                    {benefit.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
        <p className="text-sm font-bold">
          {role === 'owner'
            ? 'Launch access available'
            : 'Built for the African diaspora'}
        </p>

        <p className="mt-2 text-xs leading-5 text-emerald-50/70">
          {role === 'owner'
            ? 'Early business owners can access every listing feature during the Markeetee launch period.'
            : 'One dedicated place to discover and support businesses connected to the community.'}
        </p>
      </div>

      <p className="relative mt-7 text-xs text-emerald-50/45">
        © {new Date().getFullYear()} Markeetee
      </p>
    </aside>
  )
}

function MobileHeader() {
  return (
    <div className="border-b border-gray-100 px-5 py-4 lg:hidden">
      <Link
        href="/"
        className="inline-flex items-center gap-2"
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: BRAND.mint }}
        >
          <Store
            size={18}
            style={{ color: BRAND.primary }}
          />
        </div>

        <span className="text-lg font-extrabold text-gray-950">
          Markeetee
        </span>
      </Link>
    </div>
  )
}

function FormHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <p
        className="text-xs font-bold uppercase tracking-[0.13em]"
        style={{ color: BRAND.green }}
      >
        {eyebrow}
      </p>

      <h1 className="mt-3 text-2xl font-extrabold leading-tight text-gray-950 sm:text-3xl">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-7 text-gray-500">
        {description}
      </p>
    </div>
  )
}

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        {Array.from({
          length: totalSteps,
        }).map((_, index) => {
          const active = index <= currentStep

          return (
            <div
              key={index}
              className="h-1.5 flex-1 rounded-full transition-all"
              style={{
                backgroundColor: active
                  ? BRAND.green
                  : '#E5E7EB',
              }}
            />
          )
        })}
      </div>

      <p className="mt-2 text-right text-[11px] font-semibold text-gray-400">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  )
}

function BackButton({
  onClick,
}: {
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 transition hover:text-gray-700"
    >
      <ChevronLeft size={16} />
      Back
    </button>
  )
}

function FormField({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}

        {required ? (
          <span className="ml-1 text-red-500">
            *
          </span>
        ) : null}

        {hint ? (
          <span className="ml-2 text-xs font-normal text-gray-400">
            {hint}
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <FieldError message={error} />
      ) : null}
    </div>
  )
}

function InputWithIcon({
  icon: Icon,
  value,
  type,
  placeholder,
  autoComplete,
  onChange,
  onBlur,
}: {
  icon: React.ElementType
  value: string
  type: React.HTMLInputTypeAttribute
  placeholder: string
  autoComplete?: string
  onChange: (value: string) => void
  onBlur?: () => void
}) {
  return (
    <div className="relative">
      <Icon
        size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) =>
          onChange(event.target.value)
        }
        onBlur={onBlur}
        className={`${inputClassName} pl-11`}
      />
    </div>
  )
}

function PasswordField({
  value,
  visible,
  placeholder,
  autoComplete,
  onChange,
  onBlur,
  onToggle,
}: {
  value: string
  visible: boolean
  placeholder: string
  autoComplete: string
  onChange: (value: string) => void
  onBlur: () => void
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <Lock
        size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type={visible ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) =>
          onChange(event.target.value)
        }
        onBlur={onBlur}
        className={`${inputClassName} pl-11 pr-12`}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={
          visible
            ? 'Hide password'
            : 'Show password'
        }
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
      >
        {visible ? (
          <EyeOff size={18} />
        ) : (
          <Eye size={18} />
        )}
      </button>
    </div>
  )
}

function PrimaryButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      style={{ backgroundColor: BRAND.primary }}
    >
      {loading ? (
        <>
          <Loader2
            size={16}
            className="animate-spin"
          />
          Creating account…
        </>
      ) : (
        <>
          {children}
          <ArrowRight size={16} />
        </>
      )}
    </button>
  )
}

function SelectionIndicator({
  selected,
}: {
  selected: boolean
}) {
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
      style={{
        borderColor: selected
          ? BRAND.green
          : '#D1D5DB',
        backgroundColor: selected
          ? BRAND.green
          : '#FFFFFF',
      }}
    >
      {selected ? (
        <Check size={13} className="text-white" />
      ) : null}
    </div>
  )
}

function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string
  onDismiss: () => void
}) {
  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
        !
      </div>

      <p className="flex-1 text-sm leading-6 text-red-700">
        {message}
      </p>

      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-bold text-red-600"
      >
        Dismiss
      </button>
    </div>
  )
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />

      <span className="text-xs font-medium text-gray-400">
        or
      </span>

      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  )
}

async function geocodeBusinessAddress(
  values: BusinessFormValues,
): Promise<{
  lat: number | null
  lng: number | null
}> {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const address = [
    values.street,
    values.city,
    values.state,
    values.zip,
    'USA',
  ]
    .filter(Boolean)
    .join(', ')

  if (!apiKey || !address) {
    return {
      lat: null,
      lng: null,
    }
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${apiKey}`,
    )

    if (!response.ok) {
      return {
        lat: null,
        lng: null,
      }
    }

    const result = await response.json()

    const location =
      result.results?.[0]?.geometry?.location

    return {
      lat:
        typeof location?.lat === 'number'
          ? location.lat
          : null,

      lng:
        typeof location?.lng === 'number'
          ? location.lng
          : null,
    }
  } catch {
    return {
      lat: null,
      lng: null,
    }
  }
}

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'

const selectClassName =
  'w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'