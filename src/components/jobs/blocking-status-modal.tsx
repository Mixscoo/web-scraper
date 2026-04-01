"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface BlockingStatusModalProps {
  open: boolean;
  title: string;
  description: string;
  hint: string;
}

export function BlockingStatusModal({
  open,
  title,
  description,
  hint,
}: BlockingStatusModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-black/[0.08] bg-white text-black shadow-2xl dark:border-white/10 dark:bg-neutral-950 dark:text-white"
            role="alertdialog"
            aria-modal="true"
            aria-live="assertive"
          >
            <div className="border-b border-black/[0.08] px-6 py-5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.03] dark:border-white/10 dark:bg-white/5">
                  <div className="h-3 w-3 rounded-full bg-black/75 dark:bg-white/80" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-neutral-500 dark:text-white/55">Please wait</p>
                  <h2 className="mt-1 text-xl font-semibold">{title}</h2>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{description}</p>
              <div className="overflow-hidden rounded-2xl bg-black/[0.06] p-1 dark:bg-white/5">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  className="h-1.5 w-1/2 rounded-full bg-black/70 dark:bg-white/70"
                />
              </div>
              <div className="rounded-2xl border border-black/[0.08] bg-black/[0.03] px-4 py-3 text-sm text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                {hint}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}