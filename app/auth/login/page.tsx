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
  BadgeCheck,
  Building2,
  Check,
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
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import FieldError from '@/components/ui/FieldError'

type LoginMode = 'password' | 'magic'

type FieldErrors = Partial<
  Record<'email' | 'password' | 'magicEmail', string>
>

const BRAND = {
  dark: '#053528',
  primary: '#085041',
  green: '#1D9E75',
  mint: '#E1F5EE',
  lightMint: '#F4FBF8',
}

const BENEFITS = [
  {
    icon: Search,
    title: 'Discover African businesses',
    description:
      'Find restaurants, grocery stores, fashion, beauty, wellness, and services.',
  },
  {
    icon: MapPin,
    title: 'Find businesses near you',
    description:
      'Search by city, category, product, or service and get directions.',
  },
  {
    icon: Heart,
    title: 'Save and support favorites',
    description:
      'Keep your favorite businesses together and share trusted reviews.',
  },
  {
    icon: Building2,
    title: 'Manage your business',
    description:
      'Update your listing, products, photos, reviews, and business details.',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [mode, setMode] =
    useState<LoginMode>('password')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] =
    useState(false)

  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] =
    useState(false)

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({})

  const [error, setError] = useState('')
  const [magicError, setMagicError] = useState('')

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] =
    useState(false)
  const [magicLoading, setMagicLoading] =
    useState(false)

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

  function validateEmail(
    value: string,
    field: 'email' | 'magicEmail',
  ) {
    const normalizedValue = value.trim()

    if (!normalizedValue) {
      setFieldError(field, 'Enter your email address.')
      return false
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedValue,
      )
    ) {
      setFieldError(
        field,
        'Enter a valid email address.',
      )
      return false
    }

    clearFieldError(field)
    return true
  }

  function validatePassword(value: string) {
    if (!value) {
      setFieldError(
        'password',
        'Enter your password.',
      )
      return false
    }

    clearFieldError('password')
    return true
  }

  function changeMode(nextMode: LoginMode) {
    setMode(nextMode)
    setError('')
    setMagicError('')
    setFieldErrors({})
  }

  async function handlePasswordLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const emailValid = validateEmail(
      email,
      'email',
    )

    const passwordValid =
      validatePassword(password)

    if (!emailValid || !passwordValid) {
      return
    }

    if (loading) {
      return
    }

    setLoading(true)

    try {
      const {
        data,
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (!data.user) {
        throw new Error(
          'Your account could not be verified. Please try again.',
        )
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role, business_id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) {
        console.error(
          'Profile lookup failed:',
          profileError,
        )
      }

      const destination =
        profile?.role === 'owner'
          ? '/dashboard'
          : profile?.role === 'admin'
            ? '/admin'
            : '/search'

      router.replace(destination)
      router.refresh()
    } catch (loginError) {
      setError(getFriendlyAuthError(loginError))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    if (googleLoading) {
      return
    }

    setGoogleLoading(true)
    setError('')
    setMagicError('')

    try {
      const callbackUrl = new URL(
        '/auth/callback',
        window.location.origin,
      )

      callbackUrl.searchParams.set(
        'intent',
        'login',
      )

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl.toString(),
          },
        })

      if (oauthError) {
        throw oauthError
      }
    } catch (oauthError) {
      setError(getFriendlyAuthError(oauthError))
      setGoogleLoading(false)
    }
  }

  async function handleMagicLink(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setMagicError('')

    if (
      !validateEmail(
        magicEmail,
        'magicEmail',
      )
    ) {
      return
    }

    if (magicLoading) {
      return
    }

    setMagicLoading(true)

    try {
      const callbackUrl = new URL(
        '/auth/callback',
        window.location.origin,
      )

      callbackUrl.searchParams.set(
        'intent',
        'login',
      )

      const { error: otpError } =
        await supabase.auth.signInWithOtp({
          email: magicEmail
            .trim()
            .toLowerCase(),

          options: {
            emailRedirectTo:
              callbackUrl.toString(),

            shouldCreateUser: false,
          },
        })

      if (otpError) {
        throw otpError
      }

      setMagicSent(true)
    } catch (otpError) {
      setMagicError(
        getFriendlyAuthError(otpError),
      )
    } finally {
      setMagicLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8F7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl shadow-[#053528]/5 lg:grid-cols-[410px_minmax(0,1fr)]">
        <BrandPanel />

        <section className="flex min-w-0 flex-col">
          <MobileHeader />

          <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-9 lg:px-14">
            <div className="w-full max-w-md">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.14em]"
                  style={{ color: BRAND.green }}
                >
                  Welcome back
                </p>

                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-950">
                  Sign in to Markeetee
                </h1>

                <p className="mt-3 text-sm leading-7 text-gray-500">
                  Access your saved businesses,
                  reviews, recommendations, or
                  business dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                    style={{
                      color: BRAND.green,
                    }}
                  />
                ) : (
                  <GoogleIcon />
                )}

                {googleLoading
                  ? 'Connecting to Google…'
                  : 'Continue with Google'}
              </button>

              <Divider />

              <LoginModeSwitcher
                mode={mode}
                onChange={changeMode}
              />

              {mode === 'password' ? (
                <PasswordLoginForm
                  email={email}
                  password={password}
                  showPassword={showPassword}
                  fieldErrors={fieldErrors}
                  error={error}
                  loading={loading}
                  onEmailChange={(value) => {
                    setEmail(value)
                    clearFieldError('email')
                    setError('')
                  }}
                  onPasswordChange={(value) => {
                    setPassword(value)
                    clearFieldError('password')
                    setError('')
                  }}
                  onEmailBlur={() =>
                    validateEmail(email, 'email')
                  }
                  onPasswordBlur={() =>
                    validatePassword(password)
                  }
                  onTogglePassword={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  onDismissError={() =>
                    setError('')
                  }
                  onSubmit={handlePasswordLogin}
                />
              ) : (
                <MagicLinkForm
                  email={magicEmail}
                  sent={magicSent}
                  error={magicError}
                  fieldError={
                    fieldErrors.magicEmail
                  }
                  loading={magicLoading}
                  onEmailChange={(value) => {
                    setMagicEmail(value)
                    clearFieldError(
                      'magicEmail',
                    )
                    setMagicError('')
                  }}
                  onEmailBlur={() =>
                    validateEmail(
                      magicEmail,
                      'magicEmail',
                    )
                  }
                  onDismissError={() =>
                    setMagicError('')
                  }
                  onReset={() => {
                    setMagicEmail('')
                    setMagicSent(false)
                    setMagicError('')
                    clearFieldError(
                      'magicEmail',
                    )
                  }}
                  onSubmit={handleMagicLink}
                />
              )}

              <p className="mt-7 text-center text-sm text-gray-500">
                New to Markeetee?{' '}
                <Link
                  href="/auth/signup"
                  className="font-bold hover:underline"
                  style={{
                    color: BRAND.primary,
                  }}
                >
                  Create a free account
                </Link>
              </p>

              <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck size={14} />

                <span>
                  Secure authentication powered
                  by Supabase
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function PasswordLoginForm({
  email,
  password,
  showPassword,
  fieldErrors,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onEmailBlur,
  onPasswordBlur,
  onTogglePassword,
  onDismissError,
  onSubmit,
}: {
  email: string
  password: string
  showPassword: boolean
  fieldErrors: FieldErrors
  error: string
  loading: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onEmailBlur: () => void
  onPasswordBlur: () => void
  onTogglePassword: () => void
  onDismissError: () => void
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void
}) {
  return (
    <div className="mt-5">
      {error ? (
        <ErrorAlert
          message={error}
          onDismiss={onDismissError}
        />
      ) : null}

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5"
      >
        <FormField
          label="Email address"
          error={fieldErrors.email}
        >
          <InputWithIcon
            icon={Mail}
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={onEmailChange}
            onBlur={onEmailBlur}
          />
        </FormField>

        <FormField
          label="Password"
          error={fieldErrors.password}
        >
          <PasswordField
            value={password}
            visible={showPassword}
            onChange={onPasswordChange}
            onBlur={onPasswordBlur}
            onToggle={onTogglePassword}
          />
        </FormField>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              name="remember"
              className="h-4 w-4 rounded border-gray-300 accent-emerald-700"
            />

            Keep me signed in
          </label>

          <Link
            href="/auth/forgot-password"
            className="text-xs font-bold hover:underline"
            style={{ color: BRAND.primary }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: BRAND.primary,
          }}
        >
          {loading ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
              />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

function MagicLinkForm({
  email,
  sent,
  error,
  fieldError,
  loading,
  onEmailChange,
  onEmailBlur,
  onDismissError,
  onReset,
  onSubmit,
}: {
  email: string
  sent: boolean
  error: string
  fieldError?: string
  loading: boolean
  onEmailChange: (value: string) => void
  onEmailBlur: () => void
  onDismissError: () => void
  onReset: () => void
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void
}) {
  if (sent) {
    return (
      <div className="mt-6 rounded-3xl border border-emerald-100 bg-[#F4FBF8] px-6 py-8 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: BRAND.mint }}
        >
          <Mail
            size={27}
            style={{ color: BRAND.primary }}
          />
        </div>

        <h2 className="mt-5 text-xl font-extrabold text-gray-950">
          Check your email
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-500">
          We sent a secure sign-in link to{' '}
          <strong className="break-all text-gray-800">
            {email}
          </strong>
          . Open the message and click the link
          to access your account.
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white p-4 text-left">
          <BadgeCheck
            size={18}
            className="mt-0.5 shrink-0"
            style={{ color: BRAND.green }}
          />

          <p className="text-xs leading-5 text-gray-500">
            The link expires after a limited
            period. Check your spam or promotions
            folder if it does not appear.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-6 text-sm font-bold hover:underline"
          style={{ color: BRAND.primary }}
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5">
      {error ? (
        <ErrorAlert
          message={error}
          onDismiss={onDismissError}
        />
      ) : null}

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-5"
      >
        <FormField
          label="Email address"
          error={fieldError}
        >
          <InputWithIcon
            icon={Mail}
            type="email"
            value={email}
            placeholder="you@example.com"
            autoComplete="email"
            onChange={onEmailChange}
            onBlur={onEmailBlur}
          />
        </FormField>

        <div
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: BRAND.lightMint,
            borderColor: '#C7E9DD',
          }}
        >
          <div className="flex items-start gap-3">
            <Sparkles
              size={18}
              className="mt-0.5 shrink-0"
              style={{ color: BRAND.green }}
            />

            <div>
              <p
                className="text-sm font-bold"
                style={{
                  color: BRAND.primary,
                }}
              >
                Sign in without a password
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                We will email you a secure,
                one-time link that signs you into
                your existing account.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: BRAND.primary,
          }}
        >
          {loading ? (
            <>
              <Loader2
                size={16}
                className="animate-spin"
              />
              Sending sign-in link…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Send magic link
            </>
          )}
        </button>
      </form>
    </div>
  )
}

function LoginModeSwitcher({
  mode,
  onChange,
}: {
  mode: LoginMode
  onChange: (mode: LoginMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Login method"
      className="grid grid-cols-2 rounded-xl bg-gray-100 p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'password'}
        onClick={() => onChange('password')}
        className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition"
        style={
          mode === 'password'
            ? {
                backgroundColor: '#FFFFFF',
                color: BRAND.primary,
                boxShadow:
                  '0 1px 3px rgba(0,0,0,0.08)',
              }
            : {
                color: '#9CA3AF',
              }
        }
      >
        <Lock size={13} />
        Password
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={mode === 'magic'}
        onClick={() => onChange('magic')}
        className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold transition"
        style={
          mode === 'magic'
            ? {
                backgroundColor: '#FFFFFF',
                color: BRAND.primary,
                boxShadow:
                  '0 1px 3px rgba(0,0,0,0.08)',
              }
            : {
                color: '#9CA3AF',
              }
        }
      >
        <Sparkles size={13} />
        Magic link
      </button>
    </div>
  )
}

function BrandPanel() {
  return (
    <aside
      className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col"
      style={{
        background:
          'linear-gradient(160deg, #053528 0%, #085041 62%, #1D9E75 100%)',
      }}
    >
      <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-white/5" />

      <div className="absolute -bottom-40 -left-28 h-80 w-80 rounded-full bg-[#9FE1CB]/10" />

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
          Your community marketplace
        </p>

        <h2 className="mt-5 text-4xl font-extrabold leading-tight">
          Welcome back to the African diaspora
          marketplace.
        </h2>

        <p className="mt-5 text-sm leading-7 text-emerald-50/75">
          Discover community businesses, support
          local owners, and manage your Markeetee
          account in one place.
        </p>

        <div className="mt-10 space-y-6">
          {BENEFITS.map((benefit) => {
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
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-[#9FE1CB]"
          />

          <div>
            <p className="text-sm font-bold">
              Secure account access
            </p>

            <p className="mt-2 text-xs leading-5 text-emerald-50/70">
              Choose password, Google, or a secure
              email link to access your account.
            </p>
          </div>
        </div>
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
        className="inline-flex items-center gap-2.5"
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            backgroundColor: BRAND.mint,
          }}
        >
          <Store
            size={18}
            style={{
              color: BRAND.primary,
            }}
          />
        </div>

        <div>
          <p className="text-lg font-extrabold text-gray-950">
            Markeetee
          </p>

          <p
            className="mt-0.5 text-[10px] font-semibold"
            style={{
              color: BRAND.green,
            }}
          >
            Africa is here. Find it.
          </p>
        </div>
      </Link>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
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
  onChange,
  onBlur,
  onToggle,
}: {
  value: string
  visible: boolean
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
        placeholder="Enter your password"
        autoComplete="current-password"
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
      className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
        !
      </div>

      <p className="min-w-0 flex-1 text-sm leading-6 text-red-700">
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
        or sign in with email
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

function getFriendlyAuthError(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : 'Unable to sign in. Please try again.'

  const lowerMessage = message.toLowerCase()

  if (
    lowerMessage.includes(
      'invalid login credentials',
    )
  ) {
    return 'The email or password is incorrect. Check your details and try again.'
  }

  if (
    lowerMessage.includes(
      'email not confirmed',
    )
  ) {
    return 'Confirm your email address before signing in. Check your inbox for the confirmation message.'
  }

  if (
    lowerMessage.includes(
      'user not found',
    )
  ) {
    return 'We could not find an account with that email address.'
  }

  if (
    lowerMessage.includes(
      'rate limit',
    ) ||
    lowerMessage.includes(
      'too many requests',
    )
  ) {
    return 'Too many attempts were made. Wait a few minutes and try again.'
  }

  if (
    lowerMessage.includes(
      'failed to fetch',
    )
  ) {
    return 'Markeetee could not reach the authentication service. Check your connection and try again.'
  }

  return message
}

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'