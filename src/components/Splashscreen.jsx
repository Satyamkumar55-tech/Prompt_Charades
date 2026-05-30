import { motion } from "framer-motion";
import logo from "<div styleName={} />
<public></public>/logo.png";

export default function SplashScreen() {
  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Animated Logo */}
      <motion.img
        src={logo}
        alt="Prompt Charades"
        className="logo"
        initial={{
          scale: 0.4,
          opacity: 0,
          rotate: -15,
        }}
        animate={{
          scale: [0.4, 1.1, 1],
          opacity: 1,
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 2.5,
          ease: "easeInOut",
        }}
      />

      {/* Animated Text */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 1,
          duration: 1,
        }}
      >
        Prompt Charades
      </motion.h1>
    </motion.div>
  );
}