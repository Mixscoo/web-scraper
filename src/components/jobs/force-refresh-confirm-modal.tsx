"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RotateCw, X } from "lucide-react";

interface ForceRefreshConfirmModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ForceRefreshConfirmModal({
  open,
  loading = false,
  onClose,
  onConfirm,
}: ForceRefreshConfirmModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed inset-x-4 bottom-0 z-50 sm:inset-x-auto sm:left-1/2 sm:bottom-8 sm:w-full sm:max-w-lg sm:-translate-x-1/2"
          >
            <div className="overflow-hidden rounded-t-3xl border border-black/[0.06] bg-white shadow-2xl dark:border-white/[0.08] dark:bg-neutral-900 sm:rounded-3xl">
              <div className="border-b border-neutral-100 p-6 pb-4 dark:border-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-black dark:text-white">Force a live refresh?</h2>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        This skips the 5-minute cache and hits the job sources again right now.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Repeating this too often can trigger source rate limits, temporary blocks, or weaker source health results.
                </p>

                <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600 dark:bg-white/[0.04] dark:text-neutral-300">
                  Use this when you truly need fresh live data, not for rapid repeated clicks.
                </div>
              </div>

              <div className="flex gap-3 border-t border-neutral-100 p-6 pt-4 dark:border-white/5">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                >
                  {loading ? <RotateCw className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                  Continue refresh
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}