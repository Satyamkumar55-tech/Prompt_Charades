import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Splashscreen.css";

const Splashscreen = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [startParticles, setStartParticles] = useState(false);

  // Split title into letters for calendar flip
  const titleText = "prompt charades";

  // Particle System logic
  useEffect(() => {
    // Delay particles until circuit line starts forming (~1.5s)
    const particleTimer = setTimeout(() => {
      setStartParticles(true);
    }, 1500);

    return () => clearTimeout(particleTimer);
  }, []);

  useEffect(() => {
    if (!startParticles) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    // Set high-DPI scaling
    const scale = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    const particles = [];
    const colors = [
      "rgba(255, 81, 0, ",   // Orange
      "rgba(236, 72, 153, ",  // Magenta
      "rgba(250, 204, 21, ",  // Yellow
      "rgba(138, 43, 226, "   // Violet/Purple
    ];

    class Particle {
      constructor() {
        // Spawn particles along the underline area (horizontally centered)
        const spawnWidth = 280; // width of circuit underline
        const leftBound = (width - spawnWidth) / 2;
        this.x = leftBound + Math.random() * spawnWidth;
        this.y = height / 2 + 10; // Start at the line level
        this.size = Math.random() * 2 + 0.8;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(Math.random() * 1.2 + 0.6); // Float upwards
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.008;
        this.colorTemplate = colors[Math.floor(Math.random() * colors.length)];
        this.wobble = Math.random() * Math.PI;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
      }

      update() {
        this.x += this.vx + Math.sin(this.wobble) * 0.2;
        this.y += this.vy;
        this.wobble += this.wobbleSpeed;
        this.alpha -= this.decay;
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Glowing drop shadow for particles
        ctx.shadowBlur = this.size * 4;
        ctx.shadowColor = this.colorTemplate.replace(", ", ")");
        ctx.fillStyle = `${this.colorTemplate}${this.alpha})`;
        ctx.fill();
        ctx.restore();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Spawn rate: controls the dusty density
      if (particles.length < 90) {
        particles.push(new Particle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.alpha <= 0 || p.y < 0) {
          particles.splice(i, 1);
        } else {
          p.draw();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [startParticles]);

  // Handle auto-transition to signup after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Framer Motion Variants for Calendar Flip
  const titleContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.6,
      },
    },
  };

  const letterVariants = {
    hidden: { 
      rotateX: 90, 
      opacity: 0, 
      transformOrigin: "center top",
    },
    visible: {
      rotateX: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 140,
        damping: 12,
      },
    },
  };

  return (
    <div className="splash-container">
      {/* Background radial glow */}
      <div className="splash-bg-glow" />

      {/* Main Container */}
      <div className="splash-content">
        
        {/* SVG Logo */}
        <svg viewBox="0 0 400 400" className="splash-logo-svg">
          <defs>
            {/* Gradients */}
            <linearGradient id="ring-grad-4" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00bfff" />
              <stop offset="100%" stopColor="#8a2be2" />
            </linearGradient>
            <linearGradient id="ring-grad-3" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8a2be2" />
              <stop offset="100%" stopColor="#da70d6" />
            </linearGradient>
            <linearGradient id="ring-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#da70d6" />
              <stop offset="100%" stopColor="#ff00ff" />
            </linearGradient>
            <linearGradient id="ring-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff00ff" />
              <stop offset="100%" stopColor="#ff5100" />
            </linearGradient>

            <linearGradient id="outer-p-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00bfff" />
              <stop offset="50%" stopColor="#8a2be2" />
              <stop offset="100%" stopColor="#ff00ff" />
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Concentric rings forming & rotating */}
          {/* Ring 4 (Outermost) */}
          <motion.circle
            cx="200"
            cy="200"
            r="90"
            stroke="url(#ring-grad-4)"
            strokeWidth="3"
            fill="none"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, rotate: [0, 360] }}
            transition={{
              pathLength: { duration: 1.6, ease: "easeOut" },
              rotate: { repeat: Infinity, duration: 18, ease: "linear" }
            }}
          />

          {/* Ring 3 */}
          <motion.circle
            cx="200"
            cy="200"
            r="78"
            stroke="url(#ring-grad-3)"
            strokeWidth="2.5"
            fill="none"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, rotate: [360, 0] }}
            transition={{
              pathLength: { duration: 1.5, ease: "easeOut", delay: 0.15 },
              rotate: { repeat: Infinity, duration: 14, ease: "linear" }
            }}
          />

          {/* Ring 2 */}
          <motion.circle
            cx="200"
            cy="200"
            r="66"
            stroke="url(#ring-grad-2)"
            strokeWidth="2"
            fill="none"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, rotate: [0, 360] }}
            transition={{
              pathLength: { duration: 1.4, ease: "easeOut", delay: 0.3 },
              rotate: { repeat: Infinity, duration: 10, ease: "linear" }
            }}
          />

          {/* Ring 1 (Innermost) */}
          <motion.circle
            cx="200"
            cy="200"
            r="54"
            stroke="url(#ring-grad-1)"
            strokeWidth="2"
            fill="none"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, rotate: [360, 0] }}
            transition={{
              pathLength: { duration: 1.3, ease: "easeOut", delay: 0.4 },
              rotate: { repeat: Infinity, duration: 7, ease: "linear" }
            }}
          />

          {/* P Logo Icon - Double Tube Glow */}
          {/* Outer P Shape */}
          <motion.path
            d="M 185 240 L 170 255 L 185 230 L 185 165 C 185 135, 225 135, 225 165 C 225 195, 185 195, 185 195"
            stroke="url(#outer-p-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.8, ease: "easeInOut", delay: 0.2 }}
          />

          {/* Inner P Loop */}
          <motion.path
            d="M 194 185 L 194 175 C 194 157, 214 157, 214 175 C 214 188, 194 188, 194 188"
            stroke="#ff00ff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#neon-glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut", delay: 0.4 }}
          />

          {/* Center core dot */}
          <motion.circle
            cx="204"
            cy="175"
            r="4.5"
            fill="#ffffff"
            filter="url(#neon-glow)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 1.2 }}
          />

          {/* Circle around core dot */}
          <motion.circle
            cx="204"
            cy="175"
            r="9"
            stroke="#ff00ff"
            strokeWidth="1.5"
            fill="none"
            filter="url(#neon-glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, delay: 1.4 }}
          />
        </svg>

        {/* Flipping Name: Staggered Letters with 3D RotateX */}
        <motion.div
          className="splash-title-wrapper"
          variants={titleContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {titleText.split("").map((char, index) => {
            if (char === " ") {
              return <span key={index} style={{ width: "12px" }} />;
            }
            return (
              <span key={index} className="flip-letter-container">
                <motion.span
                  className="flip-letter"
                  variants={letterVariants}
                >
                  {char}
                </motion.span>
              </span>
            );
          })}
        </motion.div>

        {/* Dusty Sparks Canvas behind line */}
        <canvas ref={canvasRef} className="particles-canvas" />

        {/* Underline container with circuit SVG */}
        <div className="underline-container">
          <svg viewBox="0 0 320 28" className="circuit-svg">
            <defs>
              <linearGradient id="circuit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#ff5100" />
                <stop offset="100%" stopColor="#ff2a00" />
              </linearGradient>
            </defs>

            {/* Circuit traces drawing themselves */}
            <motion.path
              d="M 15 14 L 305 14"
              stroke="url(#circuit-grad)"
              strokeWidth="2.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, ease: "easeOut", delay: 1.4 }}
            />
            
            {/* Top circuit branch */}
            <motion.path
              d="M 60 14 L 75 6 L 125 6 L 135 14"
              stroke="url(#circuit-grad)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 1.7 }}
            />
            <motion.circle
              cx="125"
              cy="6"
              r="2"
              fill="#ffffff"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2.8 }}
            />

            {/* Bottom circuit branch */}
            <motion.path
              d="M 180 14 L 195 22 L 245 22 L 255 14"
              stroke="url(#circuit-grad)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 1.9 }}
            />
            <motion.circle
              cx="195"
              cy="22"
              r="2"
              fill="#ffffff"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3.0 }}
            />
            <motion.circle
              cx="245"
              cy="22"
              r="2"
              fill="#ffffff"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 3.1 }}
            />
          </svg>
        </div>

        {/* Tagline showing up simultaneously with line */}
        <motion.p
          className="splash-tagline-text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 1.8 }}
        >
          charades meets ai: guess smarter, play faster!
        </motion.p>
      </div>

      {/* Skip Intro button */}
      <button className="skip-btn" onClick={onComplete}>
        skip intro
      </button>
    </div>
  );
};

export default Splashscreen;
