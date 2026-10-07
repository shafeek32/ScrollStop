# ScrollStop

A minimal, quiet attention-reset web application designed to help you stop doomscrolling, regain mental clarity, and return to what you actually came to do.

## Features

- **Pure Minimal Canvas**: Intentional, distraction-free typography on a pure white screen with zero clutter or gamification.
- **Upward-Only Scroll Challenge**: 30 seconds of active upward scrolling interaction to physicalize and interrupt passive feed consumption.
- **Reflective Pauses**: Thought-provoking quotes selected to break unconscious digital loops.
- **Conscious Goal Setting**: Clarifies your intent and reinforces commitment through mindful confirmation.
- **Brain Reset Activities**:
  - **Urge Surfing** (Featured): 60-second mindfulness wave exercise for observing impulses without acting on them.
  - **Breathe**: Multi-minute rhythmic box breathing.
  - **Focus**: Sustained single-point attention training.
  - **Number Hunt**: 1–10 sequential memory exercise.
- **Final Commitment Check**: Conscious exit confirmation prompting you to put the phone down and begin.
- **Admin Dashboard & Usage Analytics**:
  - Accessible via `/admin` (invisible in public UI).
  - Strictly anonymous telemetry (no PII, no goal text stored).
  - Real-time active visitors, funnel drop-off analysis, Brain Reset usage metrics, and time filtering.

## Tech Stack

- **React 19**
- **TypeScript**
- **Vite 8**
- **Oxlint**

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

## License

MIT License. See [LICENSE](LICENSE) for details.
