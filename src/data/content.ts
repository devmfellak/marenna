import type { ImageName, VideoName } from './media.generated'

export type HeroSlide = {
  video: VideoName
  eyebrow: string
  title: [string, string]
  to: string
  cta: string
}

export const heroSlides: HeroSlide[] = [
  { video: 'hero-island', eyebrow: 'Indian Ocean', title: ['Wake up', 'over water.'], to: '/destinations/maldives', cta: 'Go to the Maldives' },
  { video: 'hero-balloons', eyebrow: 'Cappadocia at dawn', title: ['Rise with', 'the balloons.'], to: '/listing/goreme-sunrise', cta: 'Book a sunrise flight' },
  { video: 'hero-harbour', eyebrow: 'Private charters', title: ['The sea,', 'unhurried.'], to: '/explore?kind=yacht', cta: 'See the yachts' },
  { video: 'hero-seaplane', eyebrow: 'Arrive in style', title: ['Land on', 'the lagoon.'], to: '/explore?kind=stay', cta: 'Find an overwater stay' },
  { video: 'hero-dunes', eyebrow: 'Desert escapes', title: ['Golden hour,', 'all day long.'], to: '/destinations/dubai', cta: 'Explore Dubai' },
  { video: 'hero-paris', eyebrow: 'City of light', title: ['Paris,', 'after dark.'], to: '/destinations/paris', cta: 'Stay in Paris' },
]

export type Film = { video: VideoName; title: string; place: string; to: string }

export const films: Film[] = [
  { video: 'seaplane-lagoon', title: 'Touchdown', place: 'Seaplane, turquoise lagoon', to: '/destinations/maldives' },
  { video: 'rice-terraces', title: 'Green Steps', place: 'Rice terraces, Bali', to: '/destinations/bali' },
  { video: 'balloon-drift', title: 'Drift', place: 'Cappadocia, Türkiye', to: '/listing/goreme-sunrise' },
  { video: 'snorkel', title: 'Glass Water', place: 'Snorkelling over the reef', to: '/explore?kind=experience' },
  { video: 'dubai-night', title: 'Tallest Light', place: 'Burj Khalifa, Dubai', to: '/destinations/dubai' },
  { video: 'waterfall', title: 'Rainforest Falls', place: 'Waterfall in the forest', to: '/destinations' },
  { video: 'zebra-waterhole', title: 'The Waterhole', place: 'On safari', to: '/destinations/serengeti' },
  { video: 'pool-dusk', title: 'Last Swim', place: 'Infinity pool at dusk', to: '/explore?kind=stay' },
]

export const ways: {
  kind: string
  label: string
  title: string
  body: string
  video: VideoName
  to: string
}[] = [
  {
    kind: 'stay',
    label: 'Stay',
    title: 'Rooms with a reason to stay in.',
    body: 'Clifftop villas, overwater suites, ryokans and tented camps, each with live room availability you can book in a minute.',
    video: 'pool-deck',
    to: '/explore?kind=stay',
  },
  {
    kind: 'yacht',
    label: 'Sail',
    title: 'Your own coastline, for a week.',
    body: 'Crewed motor and sailing yachts, from the Adriatic to the Andaman Sea. You pick the bay; the captain handles the rest.',
    video: 'boat-turquoise',
    to: '/explore?kind=yacht',
  },
  {
    kind: 'experience',
    label: 'Go',
    title: 'The day you\'ll keep talking about.',
    body: 'Balloons before sunrise, a seaplane over the atolls, a full day out with the herds. Pick a time slot and see the seats left.',
    video: 'snorkel',
    to: '/explore?kind=experience',
  },
]

export const promises = [
  { title: 'Best rate, guaranteed', body: 'Find it cheaper within 24 hours and we will match the price and add a welcome gift.' },
  { title: 'Free changes for 14 days', body: 'Move or cancel at no charge until two weeks before you travel.' },
  { title: 'A person, not a queue', body: 'A local concierge answers around the clock, before and during your trip.' },
  { title: 'Handpicked, every one', body: 'If our team has not stayed there, sailed it or done it, it is not on the site.' },
]

export const sampleReviews: { quote: string; name: string; trip: string; to: string; image: ImageName }[] = [
  {
    quote: 'The skipper read the tide, turned left where every other boat turned right, and we had the whole lagoon to ourselves for an hour.',
    name: 'Amara O.',
    trip: 'Hong Islands by Long-tail',
    to: '/listing/hong-lagoon',
    image: 'hong-lagoon-1',
  },
  {
    quote: 'We came down the steps from the terrace on the first morning and just stood there. I have never been so quiet on a holiday.',
    name: 'Tomás R.',
    trip: 'Casa Limonaia, Amalfi Coast',
    to: '/listing/casa-limonaia',
    image: 'casa-limonaia-1',
  },
  {
    quote: 'Rained out on night one, so the guide simply kept driving east. At 1 a.m. the whole sky turned green and nobody said a word.',
    name: 'Ingrid S.',
    trip: 'Aurora and the South Coast',
    to: '/listing/aurora-south-coast',
    image: 'aurora-south-coast-1',
  },
  {
    quote: 'We never spoke to a call centre. One person planned the whole charter and she was on WhatsApp when the wind changed.',
    name: 'Daniel & Wei',
    trip: 'M/Y Aurelia',
    to: '/listing/my-aurelia',
    image: 'my-aurelia-1',
  },
]

export const menuItems: { label: string; to: string; image: ImageName }[] = [
  { label: 'Stays', to: '/explore?kind=stay', image: 'rumah-sawah-1' },
  { label: 'Yachts', to: '/explore?kind=yacht', image: 'my-nocturne-1' },
  { label: 'Experiences', to: '/explore?kind=experience', image: 'goreme-sunrise-1' },
  { label: 'Destinations', to: '/destinations', image: 'santorini-1' },
  { label: 'Films', to: '/#films', image: 'hanifaru-mantas-1' },
  { label: 'My trips', to: '/trips', image: 'maldives-2' },
  { label: 'Enquire', to: '/enquire', image: 'venice-3' },
]

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
