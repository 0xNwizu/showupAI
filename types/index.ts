// ============================================
// ShowUp AI - Global Types
// ============================================

// ─── Database Types ───────────────────────────────────────────────────────────

export type GroupStatus =
  | 'planning'
  | 'collecting_availability'
  | 'ai_planning'
  | 'plan_ready'
  | 'committing'
  | 'committed'
  | 'active'
  | 'completed'
  | 'cancelled'

export type EventType =
  | 'dinner'
  | 'drinks'
  | 'outdoor'
  | 'movie'
  | 'gaming'
  | 'sports'
  | 'travel'
  | 'party'
  | 'cafe'
  | 'concert'
  | 'other'

export type BudgetRange = 'budget' | 'moderate' | 'splurge' | 'no_limit'

export type CommitmentStatus = 'locked' | 'returned' | 'rewarded' | 'forfeited'

export type TransactionType = 'deposit' | 'return' | 'reward' | 'forfeit' | 'initial_airdrop'

export type NudgeType =
  | 'reminder'
  | 'commitment_push'
  | 'event_reminder'
  | 'post_event'
  | 'flake_warning'
  | 'last_call'

export type MessageType =
  | 'chat'
  | 'plan_generation'
  | 'nudge'
  | 'availability_collection'
  | 'event_summary'

// ─── Core Entity Types ────────────────────────────────────────────────────────

export interface User {
  id: string
  auth_id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string
  mock_wallet_address: string | null
  mock_sol_balance: number
  total_hangouts: number
  hangouts_attended: number
  reliability_score: number
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description: string
  emoji: string
  created_by: string
  status: GroupStatus
  event_date: string | null
  event_location: string | null
  event_type: EventType | null
  deposit_amount_sol: number
  ai_plan: AIPlan | null
  ai_plan_summary: string | null
  total_committed: number
  total_members: number
  invite_code: string
  max_members: number
  checkin_window_hours: number
  created_at: string
  updated_at: string
  // Joined relations
  creator?: User
  members?: GroupMemberWithUser[]
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  status: 'invited' | 'active' | 'left' | 'kicked'
  committed: boolean
  checked_in: boolean
  commitment_tx_mock: string | null
  committed_at: string | null
  checked_in_at: string | null
  availability_submitted: boolean
  joined_at: string
}

export interface GroupMemberWithUser extends GroupMember {
  user: User
}

export interface AvailabilityResponse {
  id: string
  group_id: string
  user_id: string
  available_dates: AvailableDate[]
  budget_range: BudgetRange | null
  budget_amount_usd: number | null
  vibe_preferences: string[]
  dietary_restrictions: string
  transport: string
  max_travel_time: number
  notes: string
  location: string | null
  created_at: string
  updated_at: string
}

export interface AvailableDate {
  date: string
  start_time?: string
  end_time?: string
  all_day?: boolean
}

export interface Commitment {
  id: string
  group_id: string
  user_id: string
  amount_sol: number
  status: CommitmentStatus
  tx_hash_mock: string
  commitment_slot_mock: number | null
  resolved_at: string | null
  resolution_note: string | null
  committed_at: string
}

export interface MockTransaction {
  id: string
  user_id: string
  group_id: string | null
  type: TransactionType
  amount_sol: number
  balance_after: number
  tx_hash: string
  status: 'pending' | 'confirmed' | 'failed'
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AIConversation {
  id: string
  group_id: string
  user_id: string | null
  role: 'user' | 'assistant' | 'system'
  content: string
  message_type: MessageType
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Nudge {
  id: string
  group_id: string
  user_id: string
  content: string
  type: NudgeType
  sent_by: string
  read: boolean
  read_at: string | null
  created_at: string
}

// ─── AI Plan Types ─────────────────────────────────────────────────────────────

export interface AIPlan {
  title: string
  summary: string
  date: string
  time: string
  duration_hours: number
  location: {
    name: string
    address: string
    google_maps_url?: string
    neighborhood?: string
  }
  activities: PlanActivity[]
  budget_breakdown: BudgetBreakdown
  vibe_tags: string[]
  why_this_plan: string
  alternatives: AlternativePlan[]
  logistics: string
  backup_plan: string
  generated_at: string
  member_votes?: MemberVote[]
}

export interface PlanActivity {
  time: string
  activity: string
  location?: string
  duration_minutes: number
  estimated_cost_usd: number
  notes?: string
}

export interface BudgetBreakdown {
  per_person_usd: number
  total_usd: number
  includes: string[]
  payment_note: string
}

export interface AlternativePlan {
  title: string
  summary: string
  why_different: string
}

export interface MemberVote {
  user_id: string
  vote: 'approve' | 'veto' | 'neutral'
  comment?: string
  voted_at: string
}

// ─── Mock Wallet Types ─────────────────────────────────────────────────────────

export interface MockWalletState {
  connected: boolean
  address: string | null
  balance: number
  network: 'mainnet-beta' | 'devnet' | 'testnet' | 'mock'
}

export interface MockTransactionResult {
  success: boolean
  txHash: string
  slot: number
  fee: number
  confirmations: number
}

// ─── UI / Form Types ──────────────────────────────────────────────────────────

export interface AvailabilityFormData {
  available_dates: AvailableDate[]
  budget_range: BudgetRange
  budget_amount_usd?: number
  vibe_preferences: string[]
  dietary_restrictions: string
  transport: string
  max_travel_time: number
  notes: string
  location: string
}

export interface CreateGroupFormData {
  name: string
  description: string
  emoji: string
  deposit_amount_sol: number
  max_members: number
  event_type?: EventType
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface GroupWithDetails extends Group {
  members: GroupMemberWithUser[]
  my_membership: GroupMember | null
  my_availability: AvailabilityResponse | null
  my_commitment: Commitment | null
  conversations: AIConversation[]
  recent_nudges: Nudge[]
  commitment_progress: CommitmentProgress
}

export interface CommitmentProgress {
  committed_count: number
  total_count: number
  percentage: number
  total_sol_locked: number
  committed_members: string[]  // user IDs
  uncommitted_members: string[] // user IDs
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const VIBE_OPTIONS = [
  { value: 'chill', label: 'Chill vibes', emoji: '😌' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🏔️' },
  { value: 'foodie', label: 'Foodie', emoji: '🍜' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🍸' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌿' },
  { value: 'cultural', label: 'Cultural', emoji: '🎭' },
  { value: 'sporty', label: 'Sporty', emoji: '⚽' },
  { value: 'cozy', label: 'Cozy & indoors', emoji: '🏠' },
  { value: 'luxury', label: 'Luxury', emoji: '✨' },
  { value: 'low_key', label: 'Low-key', emoji: '🎵' },
  { value: 'social', label: 'Big social', emoji: '🎊' },
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
]

export const BUDGET_OPTIONS: { value: BudgetRange; label: string; range: string; emoji: string }[] = [
  { value: 'budget', label: 'Budget', range: 'Under $20/person', emoji: '💚' },
  { value: 'moderate', label: 'Moderate', range: '$20–$60/person', emoji: '💛' },
  { value: 'splurge', label: 'Splurge', range: '$60–$150/person', emoji: '🧡' },
  { value: 'no_limit', label: 'No limit', range: 'Sky\'s the limit', emoji: '💜' },
]

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string; emoji: string }[] = [
  { value: 'dinner', label: 'Dinner', emoji: '🍽️' },
  { value: 'drinks', label: 'Drinks', emoji: '🍹' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { value: 'movie', label: 'Movie', emoji: '🎬' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'sports', label: 'Sports', emoji: '⚽' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'party', label: 'Party', emoji: '🎉' },
  { value: 'cafe', label: 'Cafe', emoji: '☕' },
  { value: 'concert', label: 'Concert', emoji: '🎵' },
  { value: 'other', label: 'Other', emoji: '🌟' },
]

export const GROUP_STATUS_LABELS: Record<GroupStatus, string> = {
  planning: 'Planning',
  collecting_availability: 'Collecting Availability',
  ai_planning: 'AI Planning...',
  plan_ready: 'Plan Ready',
  committing: 'Locking Deposits',
  committed: 'All In!',
  active: 'Happening Now!',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const GROUP_STATUS_COLORS: Record<GroupStatus, string> = {
  planning: 'text-blue-400 bg-blue-400/10',
  collecting_availability: 'text-yellow-400 bg-yellow-400/10',
  ai_planning: 'text-purple-400 bg-purple-400/10',
  plan_ready: 'text-cyan-400 bg-cyan-400/10',
  committing: 'text-orange-400 bg-orange-400/10',
  committed: 'text-green-400 bg-green-400/10',
  active: 'text-emerald-400 bg-emerald-400/10 animate-pulse',
  completed: 'text-gray-400 bg-gray-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
}
