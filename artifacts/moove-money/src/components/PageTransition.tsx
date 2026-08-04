import { motion } from "framer-motion";

export function PageTransition({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`min-h-[100dvh] w-full bg-white relative flex flex-col ${className}`}
    >
      {children}
    </motion.div>
  );
}
