# Games Page Rules

- Static export: there is no server callback route. GitHub OAuth must redirect back to
  `window.location.href`, and the session is restored client-side (`getSession` on mount plus an
  `onAuthStateChange` subscription that is unsubscribed on unmount).
