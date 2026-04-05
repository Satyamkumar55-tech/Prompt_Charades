# 🎭 Prompt Charades

**[Play the Game Live Here!](https://prompt-charades.vercel.app/)**

Welcome to **Prompt Charades** — an interactive, AI-powered twist on the classic party game! Instead of you guessing what your friends are acting out, the roles are reversed: **you give the verbal hints, and an AI Voice Agent tries to guess the word!**

![Prompt Charades Banner](https://via.placeholder.com/800x400/1e1b4b/ffffff?text=Prompt+Charades)

## ✨ Features
- **🗣️ AI Voice Agent:** Connects directly to your browser's microphone using the Web Speech API and talks back to you in real-time using Speech Synthesis.
- **⚡ Fast-Paced Gameplay:** You have exactly 90 seconds to rattle off as many hints as you can. Get the AI to guess correctly to stack up your score!
- **🎨 Premium UI/UX:** Stunning glassmorphism design, fluid animations powered by Framer Motion, and fully responsive layouts.
- **🌓 Light & Dark Mode:** Carefully crafted aesthetics that look incredible in both light and dark themes.
- **📚 Curated Categories:** Challenge the AI across multiple fun categories like *Bollywood Actors*, *Hollywood Actors*, and *South Indian Actors*.

## 🕹️ How to Play
1. **Sign In/Sign Up:** Create a quick local profile.
2. **Choose a Category:** Pick your favorite topic.
3. **Connect the Voice Agent:** Hit the microphone button to start the 90-second countdown.
4. **Give Hints:** Describe the word on the screen *without* saying the exact word.
5. **Score Points:**
   - Tap **Correct (+100 pts)** if the AI nails it.
   - Tap **Wrong (-50 pts)** if the AI completely misses or if you accidentally say the word!
   - Tap **Skip** if the word is too tough.

## 🛠️ Technology Stack
- **Frontend Framework:** React (Vite)
- **Styling:** Vanilla CSS (Glassmorphic Design, Custom Themes)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Voice APIs:** Browser Native `SpeechRecognition` and `SpeechSynthesisUtterance`

## 🚀 Running Locally
Want to test and modify the game on your own machine? It's simple!

```bash
# 1. Clone the repository
git clone https://github.com/your-username/prompt-charades.git

# 2. Navigate to the directory
cd prompt-charades

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

> **Note:** Because this app relies on the Web Speech API, it works best on modern browsers like **Google Chrome** or **Microsoft Edge**.

## 🤝 Contributing
Contributions, bug reports, and exciting new category ideas are always welcome! Feel free to open an issue or submit a pull request.

---
*Built with ❤️ for rapid-fire fun!*