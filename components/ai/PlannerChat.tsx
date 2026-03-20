'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { LoadingDots } from '@/components/ui/spinner'
import { cn, timeAgo } from '@/lib/utils'
import type { AIConversation, Group } from '@/types'

interface PlannerChatProps {
  group: Group
  userId: string
  userName: string
  userAvatar?: string | null
  messages: AIConversation[]
  onSendMessage: (content: string) => Promise<void>
  onGeneratePlan: () => Promise<void>
  isGeneratingPlan: boolean
  canGeneratePlan: boolean
}

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
}

const QUICK_PROMPTS = [
  'Can we do something more budget-friendly?',
  "What if we push the date to next weekend?",
  'Suggest a backup indoor option',
  'Add more food options to the plan',
  'What time should we meet?',
  'Anyone have dietary restrictions?',
]

export function PlannerChat({
  group,
  userId,
  userName,
  userAvatar,
  messages,
  onSendMessage,
  onGeneratePlan,
  isGeneratingPlan,
  canGeneratePlan,
}: PlannerChatProps) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const mapped: DisplayMessage[] = messages
      .filter(m => m.message_type === 'chat' || m.message_type === 'plan_generation')
      .map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at,
      }))
    setDisplayMessages(mapped)
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])

  const handleSend = async () => {
    if (!input.trim() || isSending) return
    const text = input.trim()
    setInput('')
    setIsSending(true)

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const aiTempId = `ai-temp-${Date.now()}`
    setDisplayMessages(prev => [
      ...prev,
      { id: tempId, role: 'user', content: text, timestamp: new Date().toISOString() },
      { id: aiTempId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isStreaming: true },
    ])

    try {
      await onSendMessage(text)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const isEmpty = displayMessages.length === 0

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">ShowUp AI</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Online
            </p>
          </div>
        </div>
        {canGeneratePlan && (
          <Button
            variant="gradient"
            size="sm"
            onClick={onGeneratePlan}
            loading={isGeneratingPlan}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isGeneratingPlan ? 'Planning...' : 'Generate Plan'}
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center animate-float">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="text-center max-w-xs">
              <h3 className="font-bold text-white mb-1">Hey, I'm ShowUp AI! 👋</h3>
              <p className="text-sm text-gray-400">
                I'll help {group.name} plan the perfect hangout. Once everyone submits their availability,
                I'll suggest an amazing plan!
              </p>
            </div>
            {canGeneratePlan && (
              <Button
                variant="gradient"
                onClick={onGeneratePlan}
                loading={isGeneratingPlan}
                leftIcon={<Sparkles className="w-4 h-4" />}
                size="lg"
              >
                {isGeneratingPlan ? 'Generating plan...' : '✨ Generate Hangout Plan'}
              </Button>
            )}
            <div className="w-full max-w-xs">
              <p className="text-xs text-gray-600 text-center mb-2">Quick prompts</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.slice(0, 3).map(p => (
                  <button
                    key={p}
                    onClick={() => handleQuickPrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-full bg-dark-border text-gray-400 hover:text-white hover:bg-dark-border-light transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {displayMessages.map(msg => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isOwn={msg.role === 'user'}
                userName={userName}
                userAvatar={userAvatar}
              />
            ))}

            {/* Quick prompts after messages */}
            {!isSending && displayMessages.length < 4 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_PROMPTS.slice(0, 4).map(p => (
                  <button
                    key={p}
                    onClick={() => handleQuickPrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-full bg-dark-border text-gray-400 hover:text-white hover:bg-dark-border-light transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-dark-border">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask ShowUp AI anything about the plan..."
            className={cn(
              'flex-1 bg-dark-bg border border-dark-border rounded-xl',
              'px-4 py-2.5 text-sm text-white placeholder:text-gray-600',
              'focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20',
              'transition-all duration-200'
            )}
            disabled={isSending}
          />
          <Button
            variant="gradient"
            size="md"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({
  message,
  isOwn,
  userName,
  userAvatar,
}: {
  message: DisplayMessage
  isOwn: boolean
  userName: string
  userAvatar?: string | null
}) {
  const isAI = !isOwn

  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isAI ? (
          <div className="w-7 h-7 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        ) : (
          <Avatar src={userAvatar} name={userName} size="xs" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[75%] space-y-1', isOwn && 'items-end flex flex-col')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm',
            isAI
              ? 'bg-dark-card border border-dark-border text-gray-200 rounded-tl-sm'
              : 'bg-brand-purple text-white rounded-tr-sm'
          )}
        >
          {message.isStreaming && !message.content ? (
            <LoadingDots />
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
        </div>
        <span className="text-xs text-gray-600 px-1">{timeAgo(message.timestamp)}</span>
      </div>
    </div>
  )
}
