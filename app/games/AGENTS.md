# Page UI & Interaction Rules: Games Page

This document defines the development rules, authentication flow, and layout specifications for the games list/lobby page (app/games/page.tsx).

## UI Styling Conventions

1. CRT Scanline Overlay:
   - Uses a viewport-sized fixed overlay with class name "scanline-overlay".
   - Simulates retro CRT monitor scanlines using repeating linear gradients.

2. Game Title:
   - Contains a Canvas displaying a rotating, neon-pink 3D title "GAME".
   - Uses postprocessing bloom. Emissive effects must be animated inside a useFrame hook.

## Supabase Authentication

This page handles user session tracking and login gates for gaming features:
1. Subscription:
   - Use `supabase.auth.onAuthStateChange` to listen to login and logout events.
   - Use `supabase.auth.getSession` on initial load to restore the user session.
   - Properly unsubscribe from the auth listener on component unmount.

2. OAuth Login:
   - GitHub OAuth is used for authentication.
   - `supabase.auth.signInWithOAuth` redirects users to the GitHub login flow, with redirectTo set to the current window location.

3. Logout:
   - `supabase.auth.signOut` clears local session data.
   - Reset the local user state to null after sign out.

## AngryButton3D Game Integration

- When the user is logged in, show the AngryButton3D game component (components/AngryButton3D.tsx).
- Pass the logged-in user ID to the component to enable cloud score saving, multi-run progression, and leaderboard features.
- If the user is logged out, block game access and display the GitHub login gate.
