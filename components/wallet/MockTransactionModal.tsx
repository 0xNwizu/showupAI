'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ExternalLink, Shield, Zap, Clock } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { formatSOL, truncateAddress } from '@/lib/utils'
import { getMockExplorerUrl } from '@/lib/mock-solana/wallet'

type TxStep = 'confirm' | 'signing' | 'sending' | 'confirming' | 'success' | 'error'

interface MockTransactionModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<{ success: boolean; txHash: string }>
  fromAddress: string
  toAddress: string
  amount: number
  description: string
  purpose: string   // e.g. "Hangout deposit for Tech Crew Dinner"
}

const STEP_MESSAGES: Record<TxStep, string> = {
  confirm: 'Review and confirm your transaction',
  signing: 'Signing transaction...',
  sending: 'Broadcasting to network...',
  confirming: 'Waiting for confirmation...',
  success: 'Transaction confirmed!',
  error: 'Transaction failed',
}

const STEP_DURATION: Partial<Record<TxStep, number>> = {
  signing: 600,
  sending: 800,
  confirming: 1200,
}

export function MockTransactionModal({
  open,
  onClose,
  onConfirm,
  fromAddress,
  toAddress,
  amount,
  description,
  purpose,
}: MockTransactionModalProps) {
  const [step, setStep] = useState<TxStep>('confirm')
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setStep('confirm'); setTxHash(''); setError('') }, 300)
    }
  }, [open])

  const handleConfirm = async () => {
    setStep('signing')

    await sleep(STEP_DURATION.signing!)
    setStep('sending')

    await sleep(STEP_DURATION.sending!)
    setStep('confirming')

    try {
      const result = await onConfirm()
      if (result.success) {
        setTxHash(result.txHash)
        setStep('success')
      } else {
        setError('Transaction simulation failed')
        setStep('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  const isProcessing = ['signing', 'sending', 'confirming'].includes(step)

  return (
    <Modal
      open={open}
      onClose={isProcessing ? () => {} : onClose}
      showClose={!isProcessing}
      title={step === 'confirm' ? 'Confirm Transaction' : undefined}
      size="sm"
      className="border-solana-purple/20"
    >
      {step === 'confirm' && (
        <div className="space-y-4">
          {/* Mock badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-400">Mock transaction — no real SOL will be spent</p>
          </div>

          {/* Transaction details */}
          <div className="bg-dark-bg rounded-2xl p-4 space-y-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">You're committing</p>
              <p className="text-4xl font-bold text-solana-green">{formatSOL(amount, 4)}</p>
              <p className="text-xs text-gray-500 mt-1">≈ ${(amount * 150).toFixed(2)} USD</p>
            </div>

            <div className="h-px bg-dark-border" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">From</span>
                <span className="font-mono text-gray-300">{truncateAddress(fromAddress, 6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">To (Escrow)</span>
                <span className="font-mono text-gray-300">{truncateAddress(toAddress, 6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Network fee</span>
                <span className="text-gray-300">◎ 0.000005</span>
              </div>
              <div className="h-px bg-dark-border" />
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-300">Total</span>
                <span className="text-white">{formatSOL(amount + 0.000005, 6)}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-xl p-3">
            <p className="text-xs text-brand-purple-light">📌 {purpose}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="w-3.5 h-3.5" />
            <span>Funds locked in escrow. Returned if you show up, split if you flake.</span>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="solana" onClick={handleConfirm} className="flex-1">
              Confirm & Lock
            </Button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Animated solana logo */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-solana opacity-20 animate-ping absolute inset-0" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-solana-purple to-solana-green flex items-center justify-center relative">
              <span className="text-3xl font-bold text-dark-bg">◎</span>
            </div>
          </div>

          {/* Steps */}
          <div className="w-full space-y-2">
            {(['signing', 'sending', 'confirming'] as TxStep[]).map((s) => {
              const stepIndex = ['signing', 'sending', 'confirming'].indexOf(s)
              const currentIndex = ['signing', 'sending', 'confirming'].indexOf(step)
              const isDone = stepIndex < currentIndex
              const isCurrent = stepIndex === currentIndex

              return (
                <div key={s} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                  isCurrent ? 'bg-brand-purple/20 border border-brand-purple/30' :
                  isDone ? 'bg-emerald-500/10' : 'opacity-40'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDone ? 'bg-emerald-500' : isCurrent ? 'bg-brand-purple' : 'bg-dark-border'
                  }`}>
                    {isDone ? (
                      <CheckCircle className="w-3 h-3 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-3 h-3 text-white animate-spin" />
                    ) : null}
                  </div>
                  <span className={`text-sm capitalize ${
                    isDone ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-gray-600'
                  }`}>
                    {s === 'signing' ? 'Signing transaction' :
                     s === 'sending' ? 'Broadcasting to network' :
                     'Awaiting confirmation'}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="text-sm text-gray-400 animate-pulse">{STEP_MESSAGES[step]}</p>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-1">You're locked in! 🎉</h3>
            <p className="text-gray-400 text-sm">{description}</p>
            <p className="text-2xl font-bold text-solana-green mt-2">{formatSOL(amount, 4)}</p>
          </div>
          {txHash && (
            <a
              href={getMockExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-purple-light hover:text-brand-purple-light/80 transition-colors"
            >
              <span className="font-mono">{truncateAddress(txHash, 8)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Button variant="gradient" onClick={onClose} className="w-full mt-2">
            Awesome! Let's go
          </Button>
        </div>
      )}

      {step === 'error' && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-1">Transaction Failed</h3>
            <p className="text-gray-400 text-sm">{error || 'Something went wrong'}</p>
          </div>
          <div className="flex gap-3 w-full">
            <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
            <Button variant="primary" onClick={() => setStep('confirm')} className="flex-1">Try Again</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
