'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Calendar, DollarSign, Sparkles, Car, ChevronRight, MapPin, Locate, Clock, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { VIBE_OPTIONS, BUDGET_OPTIONS } from '@/types'
import type { AvailabilityFormData, BudgetRange, AvailableDate } from '@/types'

interface AvailabilityFormProps {
  initialData?: Partial<AvailabilityFormData>
  onSubmit: (data: AvailabilityFormData) => Promise<void>
  isSubmitting?: boolean
  groupName: string
}

const TRANSPORT_OPTIONS = [
  { value: 'car', label: 'Car', emoji: '🚗' },
  { value: 'transit', label: 'Transit', emoji: '🚇' },
  { value: 'walk', label: 'Walk', emoji: '🚶' },
  { value: 'any', label: 'Any', emoji: '✨' },
]

const TRAVEL_TIME_OPTIONS = [15, 20, 30, 45, 60]

function formatTime(t: string) {
  // "14:30" → "2:30 PM"
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatEntryDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'EEE, MMM d yyyy')
  } catch {
    return dateStr
  }
}

// Default end time = start + 2 hours (capped at 23:00)
function defaultEndTime(startTime: string): string {
  if (!startTime) return ''
  const [h, m] = startTime.split(':').map(Number)
  const end = new Date(2000, 0, 1, h + 2, m)
  if (end.getDate() > 1) return '23:00' // wrapped past midnight
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
}

// min date = tomorrow
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const MIN_DATE = tomorrow.toISOString().split('T')[0]

export function AvailabilityForm({ initialData, onSubmit, isSubmitting, groupName }: AvailabilityFormProps) {
  const [step, setStep] = useState(0)

  // ── Date/Time state ──────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<AvailableDate[]>(initialData?.available_dates || [])
  const [newDate, setNewDate] = useState('')
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [dateError, setDateError] = useState('')

  // ── Other fields ─────────────────────────────────────────────────────────────
  const [budget, setBudget] = useState<BudgetRange>(initialData?.budget_range || 'moderate')
  const [vibes, setVibes] = useState<string[]>(initialData?.vibe_preferences || [])
  const [dietary, setDietary] = useState(initialData?.dietary_restrictions || '')
  const [transport, setTransport] = useState(initialData?.transport || 'any')
  const [travelTime, setTravelTime] = useState(initialData?.max_travel_time || 30)
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [detectingLocation, setDetectingLocation] = useState(false)

  const detectLocation = async () => {
    if (!navigator.geolocation) return
    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const country = data.address?.country || ''
          setLocation([city, country].filter(Boolean).join(', '))
        } catch {
          setLocation(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`)
        }
        setDetectingLocation(false)
      },
      () => setDetectingLocation(false)
    )
  }

  const handleAddEntry = () => {
    setDateError('')
    if (!newDate) { setDateError('Pick a date first'); return }
    if (!newStartTime) { setDateError('Set a start time'); return }

    const endTime = newEndTime || defaultEndTime(newStartTime)

    // Replace if same date already exists, otherwise append
    setEntries(prev => {
      const without = prev.filter(e => e.date !== newDate)
      return [...without, { date: newDate, start_time: newStartTime, end_time: endTime }]
        .sort((a, b) => a.date.localeCompare(b.date))
    })
    setNewDate('')
    setNewStartTime('')
    setNewEndTime('')
  }

  const removeEntry = (date: string) => {
    setEntries(prev => prev.filter(e => e.date !== date))
  }

  const toggleVibe = (vibe: string) => {
    setVibes(prev =>
      prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : prev.length < 5 ? [...prev, vibe] : prev
    )
  }

  const handleSubmit = async () => {
    await onSubmit({
      available_dates: entries,
      budget_range: budget,
      vibe_preferences: vibes,
      dietary_restrictions: dietary,
      transport,
      max_travel_time: travelTime,
      notes,
      location,
    })
  }

  const steps = [
    {
      title: "Where are you based?",
      subtitle: "Helps the AI pick a convenient meetup spot",
      icon: <MapPin className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Your city or postcode"
                placeholder="e.g. London, UK  or  SW1A 1AA"
                value={location}
                onChange={e => setLocation(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>
            <div className="pt-6">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={detectLocation}
                loading={detectingLocation}
                title="Use my current location"
              >
                <Locate className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">Only city-level precision — exact address never stored.</p>
        </div>
      ),
      isValid: location.trim().length > 0,
    },

    {
      title: "When can you make it?",
      subtitle: "Add each date and time window you're free",
      icon: <Calendar className="w-5 h-5" />,
      content: (
        <div className="space-y-4">

          {/* Picker row */}
          <div className="p-4 rounded-2xl bg-dark-bg border border-dark-border space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Add availability</p>

            {/* Date */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date</label>
              <input
                type="date"
                min={MIN_DATE}
                value={newDate}
                onChange={e => { setNewDate(e.target.value); setDateError('') }}
                className={cn(
                  'w-full rounded-xl border px-4 py-2.5 text-sm bg-dark-card text-white',
                  'border-dark-border focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 focus:outline-none',
                  '[color-scheme:dark]'
                )}
              />
            </div>

            {/* Time row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">From</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={e => { setNewStartTime(e.target.value); setDateError('') }}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm bg-dark-card text-white',
                    'border-dark-border focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 focus:outline-none',
                    '[color-scheme:dark]'
                  )}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To (optional)</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={e => setNewEndTime(e.target.value)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-2.5 text-sm bg-dark-card text-white',
                    'border-dark-border focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 focus:outline-none',
                    '[color-scheme:dark]'
                  )}
                />
              </div>
            </div>

            {dateError && <p className="text-xs text-red-400">{dateError}</p>}

            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={handleAddEntry}
              leftIcon={<Plus className="w-4 h-4" />}
              disabled={!newDate || !newStartTime}
            >
              Add this slot
            </Button>
          </div>

          {/* Added entries */}
          {entries.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">{entries.length} slot{entries.length > 1 ? 's' : ''} added:</p>
              {entries.map(entry => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-purple/10 border border-brand-purple/25"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-brand-purple-light flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{formatEntryDate(entry.date)}</p>
                      {entry.start_time && (
                        <p className="text-xs text-brand-cyan flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(entry.start_time)}
                          {entry.end_time && ` – ${formatTime(entry.end_time)}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.date)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-2">
              No slots added yet — use the picker above
            </p>
          )}
        </div>
      ),
      isValid: entries.length > 0,
    },

    {
      title: "What's your budget?",
      subtitle: "Pick what feels comfortable",
      icon: <DollarSign className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          {BUDGET_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setBudget(opt.value)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                budget === opt.value
                  ? 'border-brand-purple bg-brand-purple/20'
                  : 'border-dark-border hover:border-dark-border-light'
              )}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div className="flex-1">
                <p className={cn('font-semibold', budget === opt.value ? 'text-white' : 'text-gray-300')}>
                  {opt.label}
                </p>
                <p className="text-sm text-gray-500">{opt.range}</p>
              </div>
              {budget === opt.value && (
                <div className="w-5 h-5 rounded-full bg-brand-purple flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      ),
      isValid: true,
    },

    {
      title: "What's the vibe?",
      subtitle: "Pick up to 5 that sound good",
      icon: <Sparkles className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map(vibe => (
              <button
                key={vibe.value}
                onClick={() => toggleVibe(vibe.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
                  vibes.includes(vibe.value)
                    ? 'border-brand-purple bg-brand-purple/20 text-white'
                    : 'border-dark-border text-gray-400 hover:border-dark-border-light hover:text-gray-300',
                  vibes.length >= 5 && !vibes.includes(vibe.value) && 'opacity-40 cursor-not-allowed'
                )}
              >
                <span>{vibe.emoji}</span>
                <span>{vibe.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {vibes.length === 0 ? 'Select what sounds fun to you' : `${5 - vibes.length} more can be selected`}
          </p>
        </div>
      ),
      isValid: vibes.length > 0,
    },

    {
      title: "Anything else?",
      subtitle: "Help us plan better",
      icon: <Car className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">How will you get there?</p>
            <div className="grid grid-cols-4 gap-2">
              {TRANSPORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTransport(opt.value)}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl border transition-all',
                    transport === opt.value
                      ? 'border-brand-purple bg-brand-purple/20 text-white'
                      : 'border-dark-border text-gray-400 hover:border-dark-border-light'
                  )}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-xs mt-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Max travel time</p>
            <div className="flex gap-2 flex-wrap">
              {TRAVEL_TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTravelTime(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm transition-all',
                    travelTime === t
                      ? 'border-brand-purple bg-brand-purple/20 text-white'
                      : 'border-dark-border text-gray-400 hover:border-dark-border-light'
                  )}
                >
                  {t}min
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Dietary restrictions (optional)"
            placeholder="e.g. vegetarian, nut allergy, halal..."
            value={dietary}
            onChange={e => setDietary(e.target.value)}
          />

          <Textarea
            label="Anything else to note? (optional)"
            placeholder="e.g. I can't do super late nights, I know a great spot in SoHo..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      ),
      isValid: true,
    },
  ]

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i < step ? 'bg-brand-purple flex-1' :
              i === step ? 'bg-brand-purple-light flex-[2]' :
              'bg-dark-border flex-1'
            )}
          />
        ))}
      </div>

      {/* Step header */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-500 mb-1">Step {step + 1} of {steps.length} · {groupName}</p>
        <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
        <p className="text-sm text-gray-400 mt-1">{currentStep.subtitle}</p>
      </div>

      {/* Step content */}
      <div className="animate-fade-in">
        {currentStep.content}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">
            Back
          </Button>
        )}
        <Button
          variant={isLastStep ? 'gradient' : 'primary'}
          onClick={isLastStep ? handleSubmit : () => setStep(s => s + 1)}
          disabled={!currentStep.isValid}
          loading={isSubmitting && isLastStep}
          className="flex-1"
          rightIcon={!isLastStep ? <ChevronRight className="w-4 h-4" /> : undefined}
        >
          {isLastStep ? (isSubmitting ? 'Submitting...' : '🎉 Submit Availability') : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
