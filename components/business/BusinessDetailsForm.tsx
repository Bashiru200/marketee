'use client'
import { useState } from 'react'
import {
  Building2, MapPin, Phone, Mail, Globe, Home,
  Tag, DollarSign, Clock, Image as ImageIcon
} from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'
import { useFormValidation } from '@/lib/useFormValidation'
import FieldError from '@/components/ui/FieldError'

export const CATEGORIES = [
  { id: 'food',       label: 'Food & Groceries'  },
  { id: 'restaurant', label: 'Restaurant'         },
  { id: 'fashion',    label: 'Fashion & Fabric'   },
  { id: 'beauty',     label: 'Beauty & Hair'      },
  { id: 'herbs',      label: 'Herbs & Wellness'   },
  { id: 'music',      label: 'Music & Arts'       },
  { id: 'crafts',     label: 'Crafts & Decor'     },
  { id: 'services',   label: 'Services'           },
  { id: 'nightlife',  label: 'Bars & Nightlife'   },
]

export const SUBCATEGORIES: Record<string, string[]> = {
  food: [
    'Grocery store', 'African market', 'Online grocery',
    'Meal prep & delivery', 'Catering', 'Spices & herbs',
    'Butcher / halal meat', 'Snacks & confectionery',
  ],
  restaurant: [
    'Nigerian cuisine', 'Ghanaian cuisine', 'Ethiopian cuisine',
    'Senegalese cuisine', 'Cameroonian cuisine', 'Pan-African',
    'Fast food / takeaway', 'Fine dining', 'Café & brunch',
    'Food truck', 'Suya & grills', 'Jollof & rice dishes',
  ],
  fashion: [
    'African print / Ankara', 'Traditional attire', 'Ready-to-wear',
    'Custom tailoring', 'Accessories & jewellery', 'Footwear',
    'Online boutique', 'Fabric & textiles', 'Kids fashion',
  ],
  beauty: [
    'Hair braiding', 'Locs & dreadlocks', 'Wigs & extensions',
    'Natural hair salon', 'Barbershop', 'Nail technician',
    'Skincare & facials', 'Makeup artistry', 'Spa & massage',
  ],
  herbs: [
    'Traditional herbal medicine', 'Wellness supplements',
    'Natural skincare products', 'Aromatherapy', 'Holistic therapy',
    'African black soap', 'Shea butter & oils',
  ],
  music: [
    'Afrobeats & Afropop', 'Highlife', 'Amapiano', 'Gospel',
    'DJ services', 'Live band / performance', 'Music lessons',
    'Recording studio', 'Event entertainment',
  ],
  crafts: [
    'Home décor', 'African sculptures & art', 'Handmade jewellery',
    'Pottery & ceramics', 'Kente & woven goods', 'Paintings & prints',
    'Gift & souvenir shop', 'Interior design',
  ],
  services: [
    'Accounting & tax', 'Legal services', 'Real estate',
    'Immigration consultant', 'IT & tech support', 'Tutoring & education',
    'Cleaning services', 'Photography', 'Event planning',
    'Shipping & logistics', 'Financial services', 'Translation',
  ],
  nightlife: [
    'African bar & lounge', 'Nightclub', 'Sports bar',
    'Restaurant & bar combo', 'Live music venue', 'Shisha lounge',
  ],
}


export const COUNTRIES = [
  { code:'NG',          flag:'🇳🇬', name:'Nigeria'                },
  { code:'GH',          flag:'🇬🇭', name:'Ghana'                  },
  { code:'KE',          flag:'🇰🇪', name:'Kenya'                  },
  { code:'SN',          flag:'🇸🇳', name:'Senegal'                },
  { code:'ZA',          flag:'🇿🇦', name:'South Africa'           },
  { code:'ET',          flag:'🇪🇹', name:'Ethiopia'               },
  { code:'CM',          flag:'🇨🇲', name:'Cameroon'               },
  { code:'CI',          flag:'🇨🇮', name:"Côte d'Ivoire"          },
  { code:'OTHER',       flag:'🌍', name:'Other African country'   },
  { code:'NON_AFRICAN', flag:'🌐', name:'Not of African origin'   },
]

const PRICE_RANGES = [
  { value:'$',   label:'$ — Budget'      },
  { value:'$$',  label:'$$ — Moderate'   },
  { value:'$$$', label:'$$$ — Upscale'   },
]

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export interface BusinessFormValues {
  name:         string
  category:     string
  subcategory:  string
  description:  string
  country:      string
  street:       string
  city:         string
  state:        string
  zip:          string
  phone:        string
  email:        string
  website:      string
  price_range:  string
  tags:         string   // comma-separated, split on submit
  days_open:    string[]
  hours_open:   string
  cover_image:  string
  logo_url:     string
}

export const EMPTY_BUSINESS_FORM: BusinessFormValues = {
  name:'', category:'', subcategory:'', description:'',
  country:'', street:'', city:'', state:'', zip:'',
  phone:'', email:'', website:'',
  price_range:'', tags:'', days_open:[], hours_open:'',
  cover_image:'', logo_url:'',
}

interface Props {
  initialValues?: Partial<BusinessFormValues>
  onSubmit:       (values: BusinessFormValues) => void | Promise<void>
  loading?:       boolean
  submitLabel?:   string
  imageFolder?:   string
}

export default function BusinessDetailsForm({
  initialValues = {},
  onSubmit,
  loading = false,
  submitLabel = 'Save business',
  imageFolder = 'general',
}: Props) {
  const [form, setForm] = useState<BusinessFormValues>({
    ...EMPTY_BUSINESS_FORM,
    ...initialValues,
  })

  function upd<K extends keyof BusinessFormValues>(key: K, value: BusinessFormValues[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Inline UI validation — no native browser popups ─────────────────────
  const { errors, validate, validateAll, clearError } = useFormValidation({
    name:     { required: true, label: 'Business name' },
    category: { required: true, label: 'Category' },
    country:  { required: true, label: 'Country of origin' },
    city:     { required: true, label: 'City' },
    state:    { required: true, label: 'State' },
    phone:    { required: true, label: 'Phone number' },
  })

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      days_open: f.days_open.includes(day)
        ? f.days_open.filter(d => d !== day)
        : [...f.days_open, day],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const isValid = validateAll({
      name: form.name, category: form.category, country: form.country,
      city: form.city, state: form.state, phone: form.phone,
    })
    if (!isValid) return
    onSubmit(form)
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:border-transparent transition-all"
  const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5"
  const sectionCls = "text-xs font-bold uppercase tracking-wider mb-3 mt-6 first:mt-0"

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* ── Cover photo ── */}
      <ImageUpload bucket="businesses"
        folder={imageFolder}
        currentUrl={form.cover_image || null}
        onUpload={url => upd('cover_image', url)}
        onRemove={() => upd('cover_image', '')}
        label="Business cover photo (optional)" />

      {/* ══════════ Basic info ══════════ */}
      <p className={sectionCls} style={{ color:'#085041' }}>Basic information</p>

      <div>
        <label className={labelCls}>Business name *</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={form.name}
            onChange={e => { upd('name', e.target.value); clearError('name') }}
            onBlur={() => validate('name', form.name)}
            placeholder="Enter your business name" className={`${inputCls} pl-9`} />
        </div>
        {errors.name && <FieldError message={errors.name} />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Category *</label>
          <select value={form.category}
            onChange={e => { upd('category', e.target.value); upd('subcategory', ''); clearError('category') }}
            onBlur={() => validate('category', form.category)}
            className={inputCls}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          {errors.category && <FieldError message={errors.category} />}
        </div>
        <div>
          <label className={labelCls}>Subcategory <span className="font-normal normal-case text-gray-400">(optional)</span></label>
          {form.category && SUBCATEGORIES[form.category]?.length ? (
            <select
              value={form.subcategory}
              onChange={e => upd('subcategory', e.target.value)}
              className={inputCls}
            >
              <option value="">Select subcategory</option>
              {SUBCATEGORIES[form.category].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.subcategory}
              onChange={e => upd('subcategory', e.target.value)}
              placeholder={form.category ? 'Enter subcategory' : 'Select a category first'}
              disabled={!form.category}
              className={`${inputCls} ${!form.category ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          )}
        </div>
      </div>

      <div>
        <label className={labelCls}>Description <span className="font-normal normal-case text-gray-400">(optional)</span></label>
        <textarea value={form.description} onChange={e => upd('description', e.target.value)}
          placeholder="Tell customers about your business..." rows={3}
          className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className={labelCls}>Country of origin *</label>
        <select value={form.country}
          onChange={e => { upd('country', e.target.value); clearError('country') }}
          onBlur={() => validate('country', form.country)}
          className={inputCls}>
          <option value="">Select country</option>
          {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
        </select>
        {errors.country && <FieldError message={errors.country} />}
      </div>

      {/* ══════════ Location ══════════ */}
      <p className={sectionCls} style={{ color:'#085041' }}>Location</p>

      <div>
        <label className={labelCls}>Street address <span className="font-normal normal-case text-gray-400">(optional)</span></label>
        <div className="relative">
          <Home size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={form.street} onChange={e => upd('street', e.target.value)}
            placeholder="Enter your street address" className={`${inputCls} pl-9`} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className={labelCls}>City *</label>
          <input type="text" value={form.city}
            onChange={e => { upd('city', e.target.value); clearError('city') }}
            onBlur={() => validate('city', form.city)}
            placeholder="Enter city" className={inputCls} />
          {errors.city && <FieldError message={errors.city} />}
        </div>
        <div>
          <label className={labelCls}>State *</label>
          <input type="text" value={form.state}
            onChange={e => { upd('state', e.target.value); clearError('state') }}
            onBlur={() => validate('state', form.state)}
            placeholder="TX" maxLength={2} className={inputCls} />
          {errors.state && <FieldError message={errors.state} />}
        </div>
        <div>
          <label className={labelCls}>ZIP code <span className="font-normal normal-case text-gray-400">(optional)</span></label>
          <input type="text" value={form.zip} onChange={e => upd('zip', e.target.value)}
            placeholder="Enter ZIP code" maxLength={10} className={inputCls} />
        </div>
      </div>

      {/* ══════════ Contact ══════════ */}
      <p className={sectionCls} style={{ color:'#085041' }}>Contact</p>

      <div>
        <label className={labelCls}>Phone number *</label>
        <div className="relative">
          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="tel" value={form.phone}
            onChange={e => { upd('phone', e.target.value); clearError('phone') }}
            onBlur={() => validate('phone', form.phone)}
            placeholder="Enter phone number" className={`${inputCls} pl-9`} />
        </div>
        {errors.phone && <FieldError message={errors.phone} />}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Email <span className="font-normal normal-case text-gray-400">(optional)</span></label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="email" value={form.email} onChange={e => upd('email', e.target.value)}
              placeholder="business@example.com" className={`${inputCls} pl-9`} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Website <span className="font-normal normal-case text-gray-400">(optional)</span></label>
          <div className="relative">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="url" value={form.website} onChange={e => upd('website', e.target.value)}
              placeholder="Enter website URL" className={`${inputCls} pl-9`} />
          </div>
        </div>
      </div>

      {/* ══════════ Details ══════════ */}
      <p className={sectionCls} style={{ color:'#085041' }}>Additional details <span className="font-normal text-gray-400">(optional)</span></p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Price range</label>
          <div className="relative">
            <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select value={form.price_range} onChange={e => upd('price_range', e.target.value)}
              className={`${inputCls} pl-9`}>
              <option value="">Select</option>
              {PRICE_RANGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Logo</label>
          <ImageUpload bucket="businesses"
            folder={`${imageFolder}/logo`}
            currentUrl={form.logo_url || null}
            onUpload={url => upd('logo_url', url)}
            onRemove={() => upd('logo_url', '')}
            label="" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Tags <span className="font-normal normal-case text-gray-400">(comma-separated, e.g. jollof, catering, halal)</span></label>
        <div className="relative">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={form.tags} onChange={e => upd('tags', e.target.value)}
            placeholder="jollof, catering, halal" className={`${inputCls} pl-9`} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Opening hours</label>
        <div className="relative">
          <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={form.hours_open} onChange={e => upd('hours_open', e.target.value)}
            placeholder="e.g. 9:00 AM – 6:00 PM" className={`${inputCls} pl-9`} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Days open</label>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map(day => {
            const active = form.days_open.includes(day)
            return (
              <button key={day} type="button" onClick={() => toggleDay(day)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={active
                  ? { borderColor:'#1D9E75', background:'#f0faf6', color:'#085041' }
                  : { borderColor:'#E5E7EB', color:'#6B7280' }
                }>
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Submit ── */}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-60 mt-6"
        style={{ background: '#1D9E75' }}>
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}