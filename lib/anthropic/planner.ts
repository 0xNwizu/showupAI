import { anthropic, CLAUDE_MODEL, SHOWUP_SYSTEM_PROMPT } from './client'
import type {
  Group,
  GroupMemberWithUser,
  AvailabilityResponse,
  AIPlan,
  BudgetRange,
} from '@/types'

// ─── Plan Generation ──────────────────────────────────────────────────────────

export interface PlanGenerationInput {
  group: Group
  members: GroupMemberWithUser[]
  availabilityResponses: AvailabilityResponse[]
  additionalContext?: string
}

export async function generateHangoutPlan(input: PlanGenerationInput): Promise<AIPlan> {
  const { group, members, availabilityResponses, additionalContext } = input

  // Build context from availability responses
  const memberContext = members.map(member => {
    const avail = availabilityResponses.find(r => r.user_id === member.user_id)
    return `
Member: ${member.user.display_name} (@${member.user.username})
- Location: ${avail?.location || 'Not provided'}
- Available dates: ${avail?.available_dates?.map(d => {
      if (d.all_day || (!d.start_time && !d.end_time)) return d.date
      return `${d.date} (${d.start_time}–${d.end_time})`
    }).join(', ') || 'Not submitted'}
- Budget: ${avail?.budget_range || 'Not specified'} ${avail?.budget_amount_usd ? `($${avail.budget_amount_usd}/person)` : ''}
- Vibes: ${avail?.vibe_preferences?.join(', ') || 'No preference'}
- Dietary: ${avail?.dietary_restrictions || 'None'}
- Transport: ${avail?.transport || 'Any'}
- Max travel time: ${avail?.max_travel_time || 30} minutes
- Notes: ${avail?.notes || 'None'}
`.trim()
  }).join('\n\n')

  // Summarise where members are based for location reasoning
  const memberLocations = availabilityResponses
    .map(r => r.location)
    .filter((l): l is string => !!l && l.trim().length > 0)
  const locationContext = memberLocations.length > 0
    ? `\nMember locations: ${memberLocations.join(' | ')}\nChoose a meetup location that minimises total travel for all members. If members are spread across different cities, pick the most central or well-connected city. Suggest real venues in that area.`
    : '\nNo location data provided — use a generic well-known city for the plan.'

  const budgetLevels: Record<BudgetRange, string> = {
    budget: 'Under $20/person',
    moderate: '$20-$60/person',
    splurge: '$60-$150/person',
    no_limit: 'No limit',
  }

  // Get the most common budget preference
  const budgetCounts = availabilityResponses.reduce((acc, r) => {
    if (r.budget_range) acc[r.budget_range] = (acc[r.budget_range] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const dominantBudget = Object.entries(budgetCounts).sort(([, a], [, b]) => b - a)[0]?.[0]

  const prompt = `
You are planning a hangout for the group "${group.name}" (${group.description || 'A friend group'}).
Group size: ${members.length} people
Event type preference: ${group.event_type || 'Any'}
${group.event_date ? `Target date: ${group.event_date}` : 'Date: TBD based on availability'}
${locationContext}

Here is each member's availability and preferences:

${memberContext}

${additionalContext ? `Additional context from the group: ${additionalContext}` : ''}

Please create a comprehensive hangout plan. Return a JSON object with this EXACT structure:
{
  "title": "Fun, catchy name for this hangout",
  "summary": "1-2 sentence summary of the plan",
  "date": "YYYY-MM-DD or 'TBD'",
  "time": "HH:MM (24hr) or 'TBD'",
  "duration_hours": 3,
  "location": {
    "name": "Venue/Area name",
    "address": "Full address or neighborhood",
    "neighborhood": "Neighborhood name",
    "google_maps_url": "https://maps.google.com/..."
  },
  "activities": [
    {
      "time": "HH:MM",
      "activity": "Description",
      "location": "Specific spot",
      "duration_minutes": 60,
      "estimated_cost_usd": 25,
      "notes": "Optional tip"
    }
  ],
  "budget_breakdown": {
    "per_person_usd": 45,
    "total_usd": 225,
    "includes": ["item1", "item2"],
    "payment_note": "How to handle payment"
  },
  "vibe_tags": ["tag1", "tag2"],
  "why_this_plan": "Explanation of why this plan works for this specific group",
  "alternatives": [
    {
      "title": "Alternative title",
      "summary": "Brief description",
      "why_different": "How this differs"
    }
  ],
  "logistics": "Important logistics info (parking, transit, etc.)",
  "backup_plan": "What to do if something goes wrong",
  "generated_at": "${new Date().toISOString()}"
}

Make it specific, fun, and tailored to THIS group's preferences. Include real-sounding venue names and addresses.
`

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system: SHOWUP_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  // Extract JSON — handle markdown code blocks and bare JSON
  let raw = content.text
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) {
    raw = codeBlock[1]
  } else {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse plan from Claude response')
    raw = jsonMatch[0]
  }

  // Strip trailing commas before } or ] (common Claude quirk)
  const cleaned = raw.replace(/,\s*([}\]])/g, '$1')

  const plan = JSON.parse(cleaned) as AIPlan
  return plan
}

// ─── Availability Collection Message ─────────────────────────────────────────

export async function generateAvailabilityRequest(
  groupName: string,
  memberName: string,
  otherMembers: string[]
): Promise<string> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    system: SHOWUP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a warm, friendly message asking ${memberName} for their availability for a group hangout called "${groupName}".
The other members are: ${otherMembers.join(', ')}.
Keep it under 3 sentences. Make it feel personal and exciting.`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : 'Hey! Fill in your availability so we can plan the perfect hangout.'
}

// ─── Plan Refinement Chat ─────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithPlanner(
  groupContext: string,
  messages: ChatMessage[],
  currentPlan?: AIPlan
): Promise<string> {
  const systemWithContext = `${SHOWUP_SYSTEM_PROMPT}

Current group context:
${groupContext}

${currentPlan ? `Current plan being discussed: ${JSON.stringify(currentPlan, null, 2)}` : ''}

Help the group refine their hangout plan. Be helpful, specific, and fun.`

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: systemWithContext,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  })

  const content = response.content[0]
  return content.type === 'text' ? content.text : 'I had trouble thinking of a response. Try asking again!'
}

// ─── Plan Vote Summary ────────────────────────────────────────────────────────

export async function generatePlanVoteSummary(
  plan: AIPlan,
  votes: Array<{ name: string; vote: string; comment?: string }>
): Promise<string> {
  const voteList = votes.map(v => `${v.name}: ${v.vote}${v.comment ? ` - "${v.comment}"` : ''}`).join('\n')

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    system: SHOWUP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `The group has voted on the hangout plan "${plan.title}". Here are the votes:
${voteList}

Generate a fun, brief summary (2-3 sentences) of the vote results and what happens next. Keep it positive and encouraging.`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : 'The votes are in!'
}
