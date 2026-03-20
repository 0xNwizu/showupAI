'use client'

import { useState } from 'react'
import { Copy, Check, Share2, Link2, MessageCircle, MessageSquare } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils'
import { toast } from 'sonner'

interface InviteModalProps {
  open: boolean
  onClose: () => void
  groupName: string
  inviteCode: string
  groupId: string
}

export function InviteModal({ open, onClose, groupName, inviteCode, groupId }: InviteModalProps) {
  const [copied, setCopied] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(inviteUrl)
    if (ok) {
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyCode = async () => {
    const ok = await copyToClipboard(inviteCode)
    if (ok) toast.success('Invite code copied!')
  }

  const handleCopyMessage = async () => {
    const msg = `Hey! I'm planning a hangout on ShowUp AI and want you in the squad.\n\n📍 Squad: ${groupName}\n🔑 Code: ${inviteCode.toUpperCase().slice(0, 6)}\n🔗 Link: ${inviteUrl}\n\nJoin and lock in your spot — everyone commits a small deposit so we actually show up 😄`
    const ok = await copyToClipboard(msg)
    if (ok) {
      setCopiedMsg(true)
      toast.success('Message copied! Paste it to your friend.')
      setTimeout(() => setCopiedMsg(false), 2500)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${groupName} on ShowUp AI`,
          text: `Hey! Join our hangout group "${groupName}" on ShowUp AI. Use this link:`,
          url: inviteUrl,
        })
      } catch {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Friends"
      description={`Invite friends to join ${groupName}`}
      size="md"
    >
      <div className="space-y-5">
        {/* Invite code */}
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">Invite Code</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-3 font-mono text-xl font-bold text-brand-purple-light tracking-[0.3em] text-center">
              {inviteCode.toUpperCase().slice(0, 6)}
            </div>
            <Button variant="outline" size="md" onClick={handleCopyCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-1.5 text-center">Friends can enter this code in the app</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-dark-border" />
          <span className="text-xs text-gray-600 font-medium">OR SHARE LINK</span>
          <div className="flex-1 h-px bg-dark-border" />
        </div>

        {/* Invite link */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2.5 flex items-center gap-2 overflow-hidden">
              <Link2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-400 truncate">{inviteUrl}</span>
            </div>
            <Button
              variant={copied ? 'secondary' : 'outline'}
              size="md"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={handleShare}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Share
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const msg = encodeURIComponent(`Hey! Join "${groupName}" on ShowUp AI 🎉 ${inviteUrl}`)
              window.open(`sms:?body=${msg}`)
            }}
            leftIcon={<MessageCircle className="w-4 h-4" />}
          >
            SMS
          </Button>
        </div>

        {/* Copy ready-to-send message */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleCopyMessage}
          leftIcon={copiedMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4" />}
        >
          {copiedMsg ? 'Message copied!' : 'Copy invite message'}
        </Button>

        <div className="bg-dark-bg rounded-xl p-3">
          <p className="text-xs text-gray-500 text-center">
            Friends enter the code on the <span className="text-gray-400 font-medium">My Squads</span> page, or open the invite link directly.
          </p>
        </div>
      </div>
    </Modal>
  )
}
