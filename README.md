# dev utility

a brutalist developer utility suite focused on efficiency and speed.

## features

- **GSAP 3D Card Visualizer:** Interactive cinematic UI for generated cards.
- **Mass BIN Generator:** Luhn-compliant algorithm for generating hundreds of test cards instantly.
- **Simulated Payment Gateway (Level 1):** Fast checker splitting cards into Live, Die, and Unknown buckets.
- **Advanced Deep Check (Level 2):** Secondary simulated auth engine that performs zero-auth & $1 charged tests yielding precise status codes (Auth Only, Charged, Insufficient Funds, Fraud).
- **Temporary Email Inbox:** Integrated 1secmail API for receiving live OTP payloads within the dashboard.
- **Session Persistence**: Complete `sessionStorage` integration. Results, check streams, and temp emails survive page reloads.
- **Keyboard-First Navigation:** Press `CMD+K` to quickly navigate the command palette.

## technical stack

- next.js 15
- react 19
- tailwind css v4
- gsap 3
- lucide icons

## local environment

npm install
npm run dev
