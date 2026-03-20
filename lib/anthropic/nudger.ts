import { anthropic, CLAUDE_MODEL, SHOWUP_SYSTEM_PROMPT } from './client'
import type { Group, User, NudgeType, AIPlan } from '@/types'
import { formatDate, getCountdown } from '@/lib/utils'

// ─── Nudge Types and Context ──────────────────────────────────────────────────

export interface NudgeContext {
  group: Group
  targetUser: User
  nudgeType: NudgeType
  additionalContext?: Record<string, unknown>
}

// ─── Generate Personalized Nudge ─────────────────────────────────────────────

export async function generateNudge(context: NudgeContext): Promise<string> {
  const { group, targetUser, nudgeType, additionalContext } = context
  const plan = group.ai_plan as AIPlan | null

  const nudgePrompts: Record<NudgeType, string> = {
    reminder: `Write a friendly reminder to ${targetUser.display_name} to submit their availability for the "${group.name}" hangout.
The group is waiting on them. Keep it fun and not passive-aggressive.`,

    commitment_push: `Write an encouraging message to ${targetUser.display_name} to lock in their SOL deposit for the "${group.name}" hangout.
${additionalContext?.committed_count} out of ${additionalContext?.total_count} people have already committed.
${plan ? `The plan is: ${plan.title} on ${plan.date}` : ''}
Make them feel like they'd be missing out. Keep it friendly.`,

    event_reminder: `Write a hype message to ${targetUser.display_name} for the upcoming "${group.name}" hangout.
${plan ? `Plan: ${plan.title}` : ''}
${group.event_date ? `Event countdown: ${getCountdown(group.event_date)}` : ''}
Get them excited! Mention any important logistics they should know.`,

    post_event: `Write a warm message to ${targetUser.display_name} after the "${group.name}" hangout.
${additionalContext?.checked_in ?
  `They showed up! Let them know their SOL deposit is being returned.` :
  `They didn't make it. Let them know gently that their deposit was distributed to those who showed up.`}
Keep it positive and look forward to the next hangout.`,

    flake_warning: `Write a gentle but direct warning to ${targetUser.display_name} about their reliability.
They've been showing signs of possibly flaking on the "${group.name}" hangout.
${group.event_date ? `The event is ${getCountdown(group.event_date)}.` : ''}
Remind them their deposit is at stake. Be firm but friendly.`,

    last_call: `Write an urgent "last call" message to ${targetUser.display_name}.
The "${group.name}" hangout is happening ${group.event_date ? getCountdown(group.event_date) : 'very soon'}.
They need to confirm NOW. Their SOL deposit is at risk.
Make it feel urgent but not threatening.`,
  }

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 200,
    system: SHOWUP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: nudgePrompts[nudgeType],
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : getDefaultNudge(nudgeType, targetUser.display_name, group.name)
}

// ─── Batch Nudge Generation ───────────────────────────────────────────────────

export async function generateBatchNudges(
  contexts: NudgeContext[]
): Promise<Array<{ userId: string; message: string }>> {
  const results = await Promise.allSettled(
    contexts.map(async ctx => ({
      userId: ctx.targetUser.id,
      message: await generateNudge(ctx),
    }))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<{ userId: string; message: string }> => r.status === 'fulfilled')
    .map(r => r.value)
}

// ─── Event Summary Generation ─────────────────────────────────────────────────

export async function generateEventSummary(
  group: Group,
  attendees: User[],
  noShows: User[]
): Promise<string> {
  const plan = group.ai_plan as AIPlan | null

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    system: SHOWUP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a fun post-event summary for the "${group.name}" hangout.
${plan ? `What happened: ${plan.title} - ${plan.summary}` : ''}
Who showed up (${attendees.length}): ${attendees.map(u => u.display_name).join(', ')}
${noShows.length > 0 ? `Who didn't make it (${noShows.length}): ${noShows.map(u => u.display_name).join(', ')}` : 'Everyone showed up! 🎉'}

Write a celebratory summary. Include the reliability scores update. Keep it fun and encourage them to plan the next hangout.`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : `${group.name} is done! Thanks to everyone who showed up.`
}

// ─── Commitment Check-in Reminder ─────────────────────────────────────────────

export async function generateCheckInReminder(
  group: Group,
  user: User
): Promise<string> {
  const plan = group.ai_plan as AIPlan | null

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 150,
    system: SHOWUP_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Write a short, exciting "time to check in!" message to ${user.display_name}.
The "${group.name}" hangout is happening RIGHT NOW.
${plan ? `You're at: ${plan.location.name}` : ''}
Tell them to open ShowUp AI and check in to get their SOL back!
2-3 sentences max.`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text'
    ? content.text
    : `Hey ${user.display_name}! The hangout is happening now! Open ShowUp AI to check in and get your deposit back! 🎉`
}

// ─── Default Fallback Nudges ──────────────────────────────────────────────────

function getDefaultNudge(type: NudgeType, name: string, groupName: string): string {
  const defaults: Record<NudgeType, string> = {
    reminder: `Hey ${name}! Don't forget to submit your availability for ${groupName}. The crew's waiting! ⏰`,
    commitment_push: `${name}, lock in your deposit for ${groupName}! Most of the crew is already in 🔒`,
    event_reminder: `${name}! ${groupName} is coming up soon. Get hyped! 🎉`,
    post_event: `Thanks for being part of ${groupName}, ${name}! Hope it was amazing 🌟`,
    flake_warning: `${name}, don't forget you've got the ${groupName} hangout coming up. Your deposit is on the line! 💸`,
    last_call: `LAST CALL ${name}! ${groupName} is happening soon. Confirm NOW! 🚨`,
  }
  return defaults[type]
}
