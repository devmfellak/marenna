# Marenna

A cinematic travel booking site for stays, yacht charters and experiences, built as a portfolio piece. It takes cues from [TripShock](https://www.tripshock.com/) (search and trust signals), [Y.CO](https://y.co/) (filters, editorial films, moodboard), [Verholy](https://verholy.com/) (numbered chapters) and [Hotel Capo La Gala](https://www.hotelcapolagala.com/) (a persistent booking bar).

## Run it

```bash
npm install
npm run dev       # development server
npm test          # booking and date logic
npm run build     # typecheck and production build
npm run preview   # serve the production build
```

If `localhost` doesn't respond on your machine, run `npm run dev -- --host 127.0.0.1`.

## What's inside

- **Shader hero** (`src/three/HeroStage.ts`): five real video clips play as three.js textures, joined by a custom GLSL transition in which a tide line washes one scene into the next.
- **3D atlas** (`src/three/AtlasStage.ts`): a NASA-textured Earth you can drag, with day and night shading, an atmosphere, a pin for each destination and animated flight paths. It tours the destinations until the visitor takes over.
- **Animation**: pinned horizontal scrolling, masked headline reveals, scroll-driven text, parallax, clip-path image reveals and route curtains, using Motion and Lenis.
- **Slides**: Embla carousels for featured trips, listing galleries and guest stories.
- **Films index**: hovering a title swaps the full-bleed background film, so only one video plays at a time.
- **Booking flow**: search, filters kept in the URL, availability calendars, seasonal pricing, a three-step checkout, confirmation with a calendar file, cancellation and a saved moodboard.

Three.js is split into its own chunks and loads only when needed. Rendering and video pause when off screen. Visitors who ask for reduced motion, or whose browser lacks WebGL, get poster images and a working page.

## What's real and what isn't

- **Real**: the destinations and their facts (coordinates, airports, UNESCO status, best seasons), and all photos and films. Media is self-hosted in `public/media`, with sources listed in `public/media/CREDITS.md`.
- **Illustrative**: property names, prices, ratings and guest quotes. The site says so in its footer.
- **Not implemented**: there is no backend. Bookings and saved trips live in `localStorage`, availability comes from a repeatable hash in `src/lib/booking.ts`, and no payment details are collected. Enquiry and newsletter forms validate but send nothing.

## Going live

Replace `isBooked`, `addBooking` and the form submit handlers with calls to a real API, add a payment provider, and swap `src/data/listings.ts` for your own inventory. `netlify.toml` and `vercel.json` already handle client-side routes.
