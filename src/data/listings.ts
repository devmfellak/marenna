import type { ImageName, VideoName } from './media.generated'

export type Kind = 'stay' | 'yacht' | 'experience'
export type Unit = 'night' | 'week' | 'person'

/** A bookable room type at a hotel. `inventory` is how many identical rooms the hotel has. */
export type Room = { id: string; name: string; size: number; beds: string; guests: number; price: number; inventory: number }

/** A departure time for an experience, with the seats each departure holds. */
export type Slot = { time: string; label: string; seats: number }

export type Listing = {
  slug: string
  kind: Kind
  name: string
  destination: string
  tagline: string
  description: string
  images: ImageName[]
  film?: VideoName
  price: number
  unit: Unit
  rating: number
  reviews: number
  guests: number
  minNights: number
  facts: { label: string; value: string }[]
  highlights: string[]
  included: string[]
  featured?: string
  stars?: 4 | 5
  rooms?: Room[]
  slots?: Slot[]
  /** Length of an experience, for calendar invites. */
  hours?: number
}

export const kindLabels: Record<Kind, string> = { stay: 'Stay', yacht: 'Yacht', experience: 'Experience' }
export const unitLabels: Record<Unit, string> = { night: 'night', week: 'week', person: 'person' }

const imagesFor = (slug: string, count: number) => Array.from({ length: count }, (_, i) => `${slug}-${i + 1}`) as ImageName[]
const idOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

type RoomSpec = [name: string, size: number, beds: string, guests: number, price: number, inventory: number]

type HotelSpec = Omit<Listing, 'kind' | 'images' | 'price' | 'unit' | 'guests' | 'rooms' | 'facts'> & {
  stars: 4 | 5
  rooms: RoomSpec[]
  facts: [string, string][]
}

function hotel(h: HotelSpec): Listing {
  const rooms = h.rooms.map(([name, size, beds, guests, price, inventory]) => ({ id: idOf(name), name, size, beds, guests, price, inventory }))
  return {
    ...h,
    kind: 'stay',
    unit: 'night',
    images: imagesFor(h.slug, 3),
    rooms,
    price: Math.min(...rooms.map((r) => r.price)),
    guests: Math.max(...rooms.map((r) => r.guests)),
    facts: [...h.facts.map(([label, value]) => ({ label, value })), { label: 'Check-in / out', value: '15:00 / 11:00' }],
  }
}

type ExperienceSpec = Omit<Listing, 'kind' | 'images' | 'unit' | 'minNights' | 'facts' | 'slots' | 'guests'> & {
  slots: [time: string, label: string, seats: number][]
  facts: [string, string][]
  guests?: number
}

function experience(e: ExperienceSpec): Listing {
  return {
    ...e,
    kind: 'experience',
    unit: 'person',
    minNights: 0,
    guests: e.guests ?? 8,
    images: imagesFor(e.slug, 2),
    slots: e.slots.map(([time, label, seats]) => ({ time, label, seats })),
    facts: e.facts.map(([label, value]) => ({ label, value })),
  }
}

type YachtSpec = Omit<Listing, 'kind' | 'images' | 'unit' | 'minNights' | 'facts'> & { facts: [string, string][] }

function yacht(y: YachtSpec): Listing {
  return { ...y, kind: 'yacht', unit: 'week', minNights: 7, images: imagesFor(y.slug, 2), facts: y.facts.map(([label, value]) => ({ label, value })) }
}

const hotels: Listing[] = [
  // Amalfi Coast
  hotel({
    slug: 'casa-limonaia', name: 'Casa Limonaia', destination: 'amalfi-coast', stars: 5, featured: 'Editor\'s pick',
    tagline: 'A clifftop villa hotel above Praiano',
    description: 'Four terraces of lemon trees step down to a saltwater pool, with Positano glittering across the bay. The chef will take you to the morning market if you ask the night before.',
    rating: 4.9, reviews: 128, minNights: 2,
    facts: [['Rooms', '14'], ['Pool', 'Saltwater, 14 m'], ['To the sea', '220 steps']],
    highlights: ['Boat pick-up from Marina di Praia', 'Trailhead for the Path of the Gods', 'Lemon-grove breakfast terrace'],
    included: ['Daily breakfast', 'Afternoon limoncello on the terrace', 'Beach-club sunbeds'],
    rooms: [['Lemon Grove Room', 30, 'King', 2, 690, 6], ['Sea View Junior Suite', 45, 'King', 3, 980, 4], ['Terrace Suite with Plunge Pool', 70, 'King + sofa bed', 4, 1620, 2]],
  }),
  hotel({
    slug: 'scogliera-bianca', name: 'Scogliera Bianca', destination: 'amalfi-coast', stars: 5,
    tagline: 'White terraces stacked above Positano',
    description: 'Every room faces the sea, and the lift from reception drops straight to a private swimming platform. Dinner is served under vines while the town lights up below.',
    rating: 4.8, reviews: 211, minNights: 2,
    facts: [['Rooms', '28'], ['Restaurant', 'Vine-covered terrace'], ['Beach', 'Private platform']],
    highlights: ['Every room has a sea view', 'Private swimming platform', 'Boat trips to Capri from the jetty'],
    included: ['Daily breakfast', 'Platform sunbeds and towels', 'Welcome prosecco'],
    rooms: [['Classic Sea View', 26, 'Queen', 2, 540, 10], ['Deluxe Balcony Room', 34, 'King', 2, 760, 8], ['Positano Suite', 58, 'King + sofa bed', 4, 1290, 3]],
  }),
  // Cinque Terre
  hotel({
    slug: 'locanda-pescatori', name: 'Locanda dei Pescatori', destination: 'cinque-terre', stars: 4,
    tagline: 'A fisherman\'s house in Manarola harbour',
    description: 'Six rooms in a tall painted house above the boat ramp, with windows that open onto the swimming rocks. Breakfast is focaccia from the bakery next door.',
    rating: 4.8, reviews: 342, minNights: 2,
    facts: [['Rooms', '6'], ['Built', '18th century'], ['To the train', '4 min on foot']],
    highlights: ['Harbour-view windows', 'Swimming rocks below', 'Host who fishes at dawn'],
    included: ['Daily breakfast', 'Cinque Terre trail card', 'Luggage carry from the station'],
    rooms: [['Harbour Room', 18, 'Double', 2, 260, 3], ['Sea View Room', 22, 'Double', 2, 340, 2], ['Rooftop Attic', 30, 'Queen + single', 3, 460, 1]],
  }),
  hotel({
    slug: 'villa-vigneto', name: 'Villa Vigneto', destination: 'cinque-terre', stars: 4,
    tagline: 'A vineyard estate above Corniglia',
    description: 'Dry-stone terraces of Bosco grapes fall away to the sea, and the pool hangs at the edge of them. The estate\'s own Sciacchetrà dessert wine is poured at dusk.',
    rating: 4.7, reviews: 187, minNights: 2,
    facts: [['Rooms', '12'], ['Vineyard', '3 hectares'], ['Pool', 'Infinity, sea view']],
    highlights: ['Wine tasting in the cellar', 'Path straight down to Corniglia', 'Vineyard pool'],
    included: ['Daily breakfast', 'One tasting per stay', 'Shuttle to the station'],
    rooms: [['Vineyard Room', 24, 'Queen', 2, 310, 5], ['Sea View Room', 28, 'King', 2, 420, 4], ['Winemaker\'s Suite', 50, 'King + sofa bed', 4, 690, 2]],
  }),
  // Santorini
  hotel({
    slug: 'kaldera-house', name: 'Kaldera House', destination: 'santorini', stars: 5,
    tagline: 'Cave suites carved into Imerovigli',
    description: 'Seven whitewashed suites face due west over the caldera, each with its own plunge pool. Skaros Rock is a ten-minute walk away.',
    rating: 4.8, reviews: 214, minNights: 2,
    facts: [['Suites', '7'], ['Faces', 'West, over the caldera'], ['Policy', 'Adults only']],
    highlights: ['Sunset terrace', 'Volcanic wine tasting', 'Private plunge pools'],
    included: ['Breakfast on your terrace', 'Port or airport transfers', 'Daily sunset aperitivo'],
    rooms: [['Cave Suite', 35, 'King', 2, 780, 3], ['Caldera Suite with Plunge Pool', 48, 'King', 2, 1080, 3], ['Two-Bedroom Cave Villa', 90, '2 Kings', 4, 1980, 1]],
  }),
  hotel({
    slug: 'oia-moon', name: 'Oia Moon Suites', destination: 'santorini', stars: 5, featured: 'Sunset seats',
    tagline: 'Suites on the cliff at the tip of Oia',
    description: 'Blue doors and white domes stacked beside the windmills, where the whole island comes to watch the sun go down. Your terrace has the best seat without the crowd.',
    rating: 4.9, reviews: 163, minNights: 2,
    facts: [['Suites', '11'], ['View', 'Windmills and caldera'], ['Pool', 'Heated infinity pool']],
    highlights: ['Sunset from your own terrace', 'Heated infinity pool', 'Boat day to the hot springs'],
    included: ['Daily breakfast', 'Airport transfers', 'Evening canapés'],
    rooms: [['Windmill View Suite', 32, 'Queen', 2, 690, 4], ['Honeymoon Suite with Hot Tub', 45, 'King', 2, 1150, 4], ['Oia Villa', 85, '2 Kings', 4, 2100, 1]],
  }),
  // Venice
  hotel({
    slug: 'ca-lumen', name: 'Ca\' Lumen', destination: 'venice', stars: 5,
    tagline: 'A Gothic palazzo on a quiet canal',
    description: 'Fifteenth-century windows, terrazzo floors and a private water door in Cannaregio. Your water taxi from the airport pulls up at the steps.',
    rating: 4.8, reviews: 176, minNights: 2,
    facts: [['Rooms', '12'], ['Arrival', 'Private water door'], ['Built', '15th century']],
    highlights: ['Canal-view breakfast room', 'Private guide to Burano and Murano', 'Evening rowing lesson'],
    included: ['Daily breakfast', 'Water taxi arrival', 'Welcome spritz'],
    rooms: [['Courtyard Room', 22, 'Queen', 2, 420, 5], ['Canal View Deluxe', 32, 'King', 2, 640, 4], ['Piano Nobile Suite', 65, 'King + sofa bed', 4, 1240, 2]],
  }),
  hotel({
    slug: 'fondaco-sereno', name: 'Fondaco Sereno', destination: 'venice', stars: 4,
    tagline: 'A merchant\'s warehouse on the Giudecca',
    description: 'A converted spice warehouse with a garden on the lagoon and the Redentore next door. The vaporetto stop is outside, and the crowds are on the other side of the water.',
    rating: 4.7, reviews: 248, minNights: 2,
    facts: [['Rooms', '20'], ['Garden', 'Lagoon-front'], ['To San Marco', '6 min by boat']],
    highlights: ['Lagoon garden bar', 'Rooftop with St Mark\'s view', 'Bikes for the Lido'],
    included: ['Daily breakfast', 'Vaporetto pass', 'Garden aperitivo'],
    rooms: [['Garden Room', 24, 'Queen', 2, 360, 8], ['Lagoon View Room', 28, 'King', 2, 520, 6], ['Loft Suite', 55, 'King + sofa bed', 4, 880, 2]],
  }),
  // Dubrovnik
  hotel({
    slug: 'stradun-house', name: 'Stradun House', destination: 'dubrovnik', stars: 5,
    tagline: 'A stone townhouse inside the walls',
    description: 'A seventeenth-century residence a lane away from the Stradun, with a roof terrace looking over the terracotta. Go up the walls at opening time; you\'re already inside them.',
    rating: 4.8, reviews: 152, minNights: 2,
    facts: [['Rooms', '9'], ['Built', '17th century'], ['To the walls', '2 min on foot']],
    highlights: ['Roof terrace over the old town', 'Early walls access', 'Boat to Lokrum'],
    included: ['Daily breakfast', 'Porter from the Pile Gate', 'Walls tickets'],
    rooms: [['Old Town Room', 20, 'Queen', 2, 380, 4], ['Terrace Room', 28, 'King', 2, 560, 3], ['Rector\'s Suite', 48, 'King + sofa bed', 4, 920, 2]],
  }),
  hotel({
    slug: 'lapad-bay-villa', name: 'Lapad Bay Villa', destination: 'dubrovnik', stars: 4,
    tagline: 'A pine-shaded villa with its own swimming rocks',
    description: 'A 1920s summer house on the Lapad peninsula, with steps down through the pines to the Adriatic. The old town is a short ride away when you want it.',
    rating: 4.7, reviews: 201, minNights: 2,
    facts: [['Rooms', '16'], ['Beach', 'Private rocks'], ['To the old town', '12 min']],
    highlights: ['Private swimming rocks', 'Sunset terrace bar', 'Kayaks and paddleboards'],
    included: ['Daily breakfast', 'Old-town shuttle', 'Kayak use'],
    rooms: [['Garden Room', 22, 'Queen', 2, 290, 7], ['Sea View Room', 26, 'King', 2, 410, 6], ['Villa Suite', 52, 'King + sofa bed', 4, 760, 2]],
  }),
  // Mallorca
  hotel({
    slug: 'finca-tramuntana', name: 'Finca Tramuntana', destination: 'mallorca', stars: 5, featured: 'New this year',
    tagline: 'An olive estate above Deià',
    description: 'A sixteenth-century finca in a valley of thousand-year-old olive trees, with the sea glinting below. The kitchen presses its own oil and grows most of what it serves.',
    rating: 4.9, reviews: 96, minNights: 3,
    facts: [['Rooms', '18'], ['Estate', '40 hectares'], ['To Deià', '10 min']],
    highlights: ['Olive-grove pool', 'Farm-to-table restaurant', 'Guided Tramuntana hikes'],
    included: ['Daily breakfast', 'Oil tasting', 'Shuttle to Cala Deià'],
    rooms: [['Olive Grove Room', 30, 'King', 2, 520, 7], ['Valley Junior Suite', 42, 'King', 3, 740, 5], ['Finca Suite with Garden', 70, 'King + sofa bed', 4, 1180, 2]],
  }),
  hotel({
    slug: 'can-olivera', name: 'Can Olivera', destination: 'mallorca', stars: 4,
    tagline: 'A townhouse hotel in Valldemossa',
    description: 'Honey-coloured stone, potted geraniums and a courtyard pool in the village where Chopin spent a winter. The mountain trails start at the end of the street.',
    rating: 4.7, reviews: 233, minNights: 2,
    facts: [['Rooms', '15'], ['Pool', 'Courtyard'], ['To Palma', '25 min']],
    highlights: ['Courtyard pool', 'Village bakery breakfasts', 'E-bikes for the coast road'],
    included: ['Daily breakfast', 'E-bike hire', 'Parking'],
    rooms: [['Village Room', 20, 'Queen', 2, 240, 6], ['Courtyard Room', 26, 'King', 2, 330, 6], ['Mountain View Suite', 45, 'King + sofa bed', 4, 560, 2]],
  }),
  // Algarve
  hotel({
    slug: 'casa-ponta-dourada', name: 'Casa Ponta Dourada', destination: 'algarve', stars: 5,
    tagline: 'A clifftop hotel near Ponta da Piedade',
    description: 'Low white buildings on the headland above Lagos, with a pool facing the golden sea stacks. A path from the garden leads down to a cove you can swim from.',
    rating: 4.8, reviews: 178, minNights: 2,
    facts: [['Rooms', '24'], ['Pool', 'Clifftop infinity'], ['To Lagos', '5 min']],
    highlights: ['Clifftop infinity pool', 'Path to a private cove', 'Grotto trips by kayak'],
    included: ['Daily breakfast', 'Kayak tour per stay', 'Beach towels and bags'],
    rooms: [['Garden Room', 28, 'King', 2, 380, 8], ['Ocean View Room', 32, 'King', 2, 520, 8], ['Cliff Suite', 60, 'King + sofa bed', 4, 940, 2]],
  }),
  hotel({
    slug: 'benagil-cliff', name: 'Benagil Cliff House', destination: 'algarve', stars: 4,
    tagline: 'Six rooms above the famous sea cave',
    description: 'A small guesthouse on the cliff path between Benagil and Marinha, two of Portugal\'s best beaches. Walk the Seven Hanging Valleys trail straight from the gate.',
    rating: 4.8, reviews: 121, minNights: 2,
    facts: [['Rooms', '6'], ['Trail', 'Seven Hanging Valleys'], ['To Benagil cave', '8 min on foot']],
    highlights: ['Dawn paddle to Benagil cave', 'Cliff path from the gate', 'Rooftop sunset deck'],
    included: ['Daily breakfast', 'Picnic for the trail', 'Parking'],
    rooms: [['Patio Room', 22, 'Queen', 2, 220, 3], ['Sea View Room', 26, 'King', 2, 310, 2], ['Rooftop Suite', 40, 'King + sofa bed', 4, 480, 1]],
  }),
  // Lake Como
  hotel({
    slug: 'villa-glicine', name: 'Villa Glicine', destination: 'lake-como', stars: 5, featured: 'Most romantic',
    tagline: 'A wisteria-covered villa at the water\'s edge',
    description: 'A nineteenth-century villa near Tremezzo, with a lido, a floating pool and wisteria over the boathouse. Lunch arrives by boat if you ask.',
    rating: 4.9, reviews: 143, minNights: 2,
    facts: [['Rooms', '22'], ['Lido', 'Floating pool'], ['To Bellagio', '15 min by boat']],
    highlights: ['Floating pool on the lake', 'Vintage Riva boat trips', 'Garden of camellias and azaleas'],
    included: ['Daily breakfast', 'Lake taxi to Bellagio', 'Lido sunbeds'],
    rooms: [['Garden Room', 28, 'King', 2, 640, 8], ['Lake View Room', 34, 'King', 2, 890, 8], ['Boathouse Suite', 75, 'King + sofa bed', 4, 1750, 2]],
  }),
  hotel({
    slug: 'bellagio-lakehouse', name: 'Bellagio Lakehouse', destination: 'lake-como', stars: 4,
    tagline: 'A lakefront townhouse at the point of Bellagio',
    description: 'Shuttered windows over the ferry landing, cobbled lanes behind and the lake on three sides. The terrace restaurant does a very good risotto with perch.',
    rating: 4.7, reviews: 266, minNights: 2,
    facts: [['Rooms', '18'], ['To the ferry', '1 min'], ['Restaurant', 'Lakefront terrace']],
    highlights: ['Front-row lake views', 'Ferry hops to Varenna', 'Terrace restaurant'],
    included: ['Daily breakfast', 'Ferry day pass', 'Welcome drink'],
    rooms: [['Village Room', 20, 'Queen', 2, 310, 7], ['Lake View Room', 26, 'King', 2, 450, 7], ['Corner Suite', 45, 'King + sofa bed', 4, 780, 2]],
  }),
  // Dolomites
  hotel({
    slug: 'braies-lodge', name: 'Braies Boathouse Lodge', destination: 'dolomites', stars: 5,
    tagline: 'Timber suites on an alpine lake',
    description: 'Larch-clad suites look down the valley to the Croda del Becco, and the wood-fired sauna sits right at the water\'s edge. Take a rowing boat out before the first bus arrives.',
    rating: 4.9, reviews: 143, minNights: 2,
    facts: [['Suites', '14'], ['Altitude', '1,496 m'], ['Sauna', 'Lakeside, wood-fired']],
    highlights: ['Mountain guide on call', 'Outdoor bed terrace', 'South Tyrolean tasting menu'],
    included: ['Half board', 'Boat hire at dawn', 'Valley shuttle pass'],
    rooms: [['Forest Room', 28, 'King', 2, 420, 6], ['Lake View Suite', 45, 'King', 3, 640, 6], ['Panorama Chalet Suite', 80, '2 Kings', 4, 1150, 2]],
  }),
  hotel({
    slug: 'rifugio-alba', name: 'Rifugio Alba Chalets', destination: 'dolomites', stars: 4,
    tagline: 'Private chalets on an alpine meadow',
    description: 'Eight wooden chalets on the Alpe di Siusi, Europe\'s largest high meadow, each with a hot tub facing the Sassolungo. Ski from the door in winter.',
    rating: 4.8, reviews: 119, minNights: 2,
    facts: [['Chalets', '8'], ['Altitude', '1,850 m'], ['Ski', 'In and out in winter']],
    highlights: ['Hot tub on every deck', 'Ski-in, ski-out', 'Breakfast basket at your door'],
    included: ['Breakfast basket', 'Lift-pass booking', 'Sledges and snowshoes'],
    rooms: [['Meadow Chalet', 45, 'King', 2, 480, 4], ['Family Chalet', 70, 'King + bunks', 4, 690, 3], ['Summit Chalet', 95, '2 Kings', 4, 980, 1]],
  }),
  // Zermatt
  hotel({
    slug: 'chalet-gornerblick', name: 'Chalet Gornerblick', destination: 'zermatt', stars: 5, featured: 'Matterhorn view',
    tagline: 'A larch chalet facing the Matterhorn',
    description: 'Every balcony frames the peak, and the spa\'s indoor-outdoor pool looks straight at it too. An electric taxi meets you at the station.',
    rating: 4.9, reviews: 132, minNights: 2,
    facts: [['Rooms', '24'], ['Spa', 'Indoor-outdoor pool'], ['To the lifts', '4 min']],
    highlights: ['Matterhorn from every balcony', 'Indoor-outdoor pool', 'Ski valet'],
    included: ['Daily breakfast', 'Station transfer', 'Afternoon tea and cake'],
    rooms: [['Alpine Room', 26, 'King', 2, 720, 8], ['Matterhorn Junior Suite', 40, 'King', 3, 1080, 8], ['Penthouse Suite', 90, '2 Kings', 4, 2400, 1]],
  }),
  hotel({
    slug: 'matterblick-lodge', name: 'Matterblick Lodge', destination: 'zermatt', stars: 4,
    tagline: 'A stone-and-timber lodge in the old village',
    description: 'Built around a sixteenth-century granary in Hinterdorf, with fondue by the fire and a sauna in the cellar. The Gornergrat train is a short walk away.',
    rating: 4.7, reviews: 214, minNights: 2,
    facts: [['Rooms', '16'], ['Built around', '16th-century granary'], ['To Gornergrat train', '6 min']],
    highlights: ['Fireside fondue nights', 'Cellar sauna', 'Ski storage with boot warmers'],
    included: ['Daily breakfast', 'Sauna access', 'Village taxi from the station'],
    rooms: [['Village Room', 20, 'Queen', 2, 380, 6], ['Matterhorn View Room', 26, 'King', 2, 520, 6], ['Granary Suite', 48, 'King + sofa bed', 4, 890, 2]],
  }),
  // Paris
  hotel({
    slug: 'hotel-des-quais', name: 'Hôtel des Quais', destination: 'paris', stars: 5, featured: 'Eiffel Tower view',
    tagline: 'A Haussmann building on the Left Bank',
    description: 'Balconies over the Seine and the bouquinistes, with the Eiffel Tower framed in the upper rooms. Breakfast is croissants from the bakery that won the city\'s butter prize.',
    rating: 4.8, reviews: 309, minNights: 2,
    facts: [['Rooms', '36'], ['Built', '1880s'], ['To the Louvre', '8 min on foot']],
    highlights: ['Seine-view balconies', 'Eiffel Tower suites', 'Hidden courtyard bar'],
    included: ['Daily breakfast', 'Welcome champagne', 'Late checkout on request'],
    rooms: [['Courtyard Room', 20, 'Queen', 2, 480, 12], ['Seine View Room', 26, 'King', 2, 720, 12], ['Eiffel Tower Suite', 55, 'King + sofa bed', 4, 1560, 2]],
  }),
  hotel({
    slug: 'maison-montmartre', name: 'Maison Montmartre', destination: 'paris', stars: 4,
    tagline: 'A townhouse hotel below Sacré-Cœur',
    description: 'Twenty rooms in a former painters\' house on a cobbled lane, with a garden of fig trees. Climb the steps for sunrise over the rooftops of Paris.',
    rating: 4.7, reviews: 275, minNights: 2,
    facts: [['Rooms', '20'], ['Garden', 'Fig trees'], ['To Sacré-Cœur', '5 min on foot']],
    highlights: ['Garden breakfasts', 'Rooftop views from the top floor', 'Artist-led walking tours'],
    included: ['Daily breakfast', 'Walking tour per stay', 'Metro tickets'],
    rooms: [['Atelier Room', 16, 'Double', 2, 260, 8], ['Garden Room', 22, 'Queen', 2, 340, 8], ['Rooftop Suite', 40, 'King + sofa bed', 4, 610, 2]],
  }),
  // Iceland
  hotel({
    slug: 'glacier-view-lodge', name: 'Glacier View Lodge', destination: 'iceland', stars: 5,
    tagline: 'A lodge between the ice cap and the sea',
    description: 'Floor-to-ceiling windows face Vatnajökull, and the hot tubs sit out on the lava field. The front desk will wake you if the aurora shows.',
    rating: 4.9, reviews: 188, minNights: 2,
    facts: [['Rooms', '26'], ['Hot tubs', 'Outdoor, geothermal'], ['To Jökulsárlón', '40 min']],
    highlights: ['Aurora wake-up calls', 'Geothermal hot tubs', 'Glacier hikes from the door'],
    included: ['Daily breakfast', 'Aurora alert service', 'Crampons and boots on loan'],
    rooms: [['Lava Field Room', 24, 'King', 2, 460, 10], ['Glacier View Room', 30, 'King', 3, 640, 10], ['Panorama Suite', 55, 'King + sofa bed', 4, 1080, 2]],
  }),
  hotel({
    slug: 'basalt-coast', name: 'Basalt Coast Hotel', destination: 'iceland', stars: 4,
    tagline: 'A black-sand beach hotel near Vík',
    description: 'A low, grass-roofed hotel above Reynisfjara\'s basalt columns and sea stacks. Seljalandsfoss and Skógafoss are both an easy drive west.',
    rating: 4.7, reviews: 241, minNights: 2,
    facts: [['Rooms', '30'], ['Beach', 'Reynisfjara, 5 min'], ['Roof', 'Turf-covered']],
    highlights: ['Sea-stack views', 'Waterfall day routes', 'Lamb soup by the fire'],
    included: ['Daily breakfast', 'Route planning', 'Parking and EV charging'],
    rooms: [['Turf Room', 20, 'Queen', 2, 320, 12], ['Sea View Room', 24, 'King', 2, 430, 12], ['Family Suite', 42, 'King + bunks', 4, 690, 3]],
  }),
  // Maldives
  hotel({
    slug: 'lagoon-nine', name: 'Lagoon Nine', destination: 'maldives', stars: 5, featured: 'Most wanted',
    tagline: 'Overwater villas in Baa Atoll',
    description: 'Villas on a curving boardwalk with glass floor panels and steps straight into the reef. The house reef starts about ten metres from your deck.',
    rating: 5, reviews: 92, minNights: 4,
    facts: [['Villas', '24'], ['Transfer', 'Seaplane, 35 min'], ['House reef', '10 m from deck']],
    highlights: ['Hanifaru Bay manta trips in season', 'Private sandbank dinner', 'Resident marine biologist'],
    included: ['Full board', 'Return seaplane', 'Snorkel gear and guide'],
    rooms: [['Beach Villa', 90, 'King', 3, 1450, 8], ['Overwater Villa', 110, 'King', 3, 2100, 10], ['Overwater Pool Residence', 220, '2 Kings', 5, 4200, 2]],
  }),
  hotel({
    slug: 'coral-veli', name: 'Coral Veli Retreat', destination: 'maldives', stars: 5,
    tagline: 'A barefoot island in South Ari Atoll',
    description: 'Veli means sand in Dhivehi, and there are no shoes here at all. Whale sharks feed off the outer reef all year, and the sandbank dinners are lit by lanterns.',
    rating: 4.9, reviews: 154, minNights: 4,
    facts: [['Villas', '36'], ['Transfer', 'Seaplane, 25 min'], ['Wildlife', 'Year-round whale sharks']],
    highlights: ['Whale shark snorkel trips', 'No-shoes island', 'Lantern-lit sandbank dinners'],
    included: ['Half board', 'Return seaplane', 'Daily snorkel trip'],
    rooms: [['Jungle Beach Villa', 85, 'King', 3, 1180, 10], ['Sunset Water Villa', 105, 'King', 3, 1720, 12], ['Two-Bedroom Reef Villa', 180, '2 Kings', 5, 3300, 2]],
  }),
  // Seychelles
  hotel({
    slug: 'anse-granite', name: 'Anse Granite Villas', destination: 'seychelles', stars: 5, featured: 'Hidden gem',
    tagline: 'Pool villas among La Digue\'s boulders',
    description: 'Ten villas tucked between granite boulders and takamaka trees, a short cycle from Anse Source d\'Argent. Giant tortoises wander the garden.',
    rating: 4.9, reviews: 84, minNights: 3,
    facts: [['Villas', '10'], ['Transport', 'Bicycles and ox cart'], ['To Anse Source d\'Argent', '10 min by bike']],
    highlights: ['Private plunge pools', 'Bikes for the island', 'Resident giant tortoises'],
    included: ['Daily breakfast', 'Bicycles', 'Ferry transfer from Praslin'],
    rooms: [['Garden Pool Villa', 80, 'King', 2, 980, 5], ['Ocean Pool Villa', 95, 'King', 3, 1340, 4], ['Granite Residence', 160, '2 Kings', 4, 2450, 1]],
  }),
  hotel({
    slug: 'la-digue-palm', name: 'La Digue Palm House', destination: 'seychelles', stars: 4,
    tagline: 'A Creole plantation house by the sea',
    description: 'A restored colonial house with wide verandas, a pool under the palms and a beach across the road. Dinner is fish curry and grilled breadfruit.',
    rating: 4.7, reviews: 167, minNights: 3,
    facts: [['Rooms', '14'], ['Built', '19th century'], ['Beach', 'Across the road']],
    highlights: ['Veranda dining', 'Creole cooking class', 'Snorkel trips to Coco Island'],
    included: ['Daily breakfast', 'Bicycles', 'Snorkel gear'],
    rooms: [['Plantation Room', 26, 'Queen', 2, 380, 6], ['Veranda Room', 32, 'King', 3, 520, 6], ['Palm Suite', 55, 'King + sofa bed', 4, 860, 2]],
  }),
  // Bali
  hotel({
    slug: 'rumah-sawah', name: 'Rumah Sawah', destination: 'bali', stars: 5,
    tagline: 'A thatched retreat in the Ubud rice fields',
    description: 'Rumah sawah means rice-field house, and the pool sits level with the paddies. Mornings begin with temple offerings and strong Kintamani coffee.',
    rating: 4.9, reviews: 301, minNights: 3,
    facts: [['Villas', '11'], ['Setting', 'Working rice terraces'], ['To Ubud', '15 min']],
    highlights: ['Open-air spa pavilion', 'Farm-to-table restaurant', 'Morning yoga shala'],
    included: ['Daily breakfast', 'One Balinese massage per stay', 'Shuttle to Ubud'],
    rooms: [['Rice Field Room', 40, 'King', 2, 320, 6], ['Pool Villa', 85, 'King', 3, 540, 6], ['Two-Bedroom Jungle Villa', 150, '2 Kings', 5, 980, 2]],
  }),
  hotel({
    slug: 'uluwatu-pavilions', name: 'Uluwatu Cliff Pavilions', destination: 'bali', stars: 5,
    tagline: 'Pavilions on the cliffs above the surf',
    description: 'Open-sided pavilions sit seventy metres above the Indian Ocean, with a lift down to a hidden beach. Uluwatu temple\'s fire dance is ten minutes away at sunset.',
    rating: 4.8, reviews: 212, minNights: 3,
    facts: [['Pavilions', '18'], ['Height', '70 m above the sea'], ['Beach', 'Private, by lift']],
    highlights: ['Cliff-edge infinity pool', 'Lift to a hidden beach', 'Surf lessons for all levels'],
    included: ['Daily breakfast', 'Sunset Kecak dance tickets', 'Beach club access'],
    rooms: [['Garden Pavilion', 60, 'King', 2, 420, 8], ['Ocean Pool Pavilion', 95, 'King', 3, 760, 8], ['Cliff Residence', 200, '2 Kings', 5, 1650, 2]],
  }),
  // Krabi
  hotel({
    slug: 'railay-karst', name: 'Railay Karst Villas', destination: 'krabi', stars: 5,
    tagline: 'Villas under the cliffs of Railay',
    description: 'Reached only by long-tail boat, with Phra Nang beach and its cave shrine a short walk through the trees. Climbers come for the limestone; everyone else comes for the sunset.',
    rating: 4.8, reviews: 197, minNights: 3,
    facts: [['Villas', '22'], ['Access', 'By boat only'], ['To Phra Nang beach', '5 min on foot']],
    highlights: ['Boat-only peninsula', 'Rock-climbing school', 'Sunset long-tail trips'],
    included: ['Daily breakfast', 'Boat transfer from Ao Nang', 'Kayaks'],
    rooms: [['Garden Villa', 48, 'King', 2, 340, 8], ['Pool Villa', 72, 'King', 3, 560, 8], ['Cliff View Residence', 130, '2 Kings', 5, 1080, 2]],
  }),
  hotel({
    slug: 'hong-sea-house', name: 'Hong Sea House', destination: 'krabi', stars: 4,
    tagline: 'A stilt-house hotel on Koh Yao Noi',
    description: 'Teak houses on stilts over a quiet bay, with the karsts of Phang Nga lined up across the water. Breakfast is mango sticky rice on the jetty.',
    rating: 4.7, reviews: 158, minNights: 2,
    facts: [['Rooms', '16'], ['Built on', 'Teak stilts'], ['To the Hong Islands', '25 min by boat']],
    highlights: ['Jetty breakfasts', 'Karst views across the bay', 'Cooking class with the family'],
    included: ['Daily breakfast', 'Kayaks and bikes', 'Pier transfer'],
    rooms: [['Bay Room', 28, 'Queen', 2, 190, 6], ['Stilt House', 40, 'King', 3, 280, 6], ['Family Stilt House', 60, 'King + bunks', 4, 420, 2]],
  }),
  // Kyoto
  hotel({
    slug: 'hoshi-an', name: 'Hoshi-an', destination: 'kyoto', stars: 5,
    tagline: 'A machiya townhouse in Higashiyama',
    description: 'A restored wooden townhouse with tatami, a cedar bath and a moss garden, a short walk from Yasaka Pagoda. Kaiseki dinner comes to your room.',
    rating: 4.9, reviews: 87, minNights: 2,
    facts: [['Rooms', '5'], ['Bath', 'Hinoki cedar'], ['To Yasaka Pagoda', '6 min on foot']],
    highlights: ['In-room kaiseki dinner', 'Private tea ceremony', 'Early temple access'],
    included: ['Japanese breakfast', 'Yukata and slippers', 'Concierge bookings'],
    rooms: [['Garden Tatami Room', 30, 'Futon for 2', 2, 520, 2], ['Cedar Bath Room', 40, 'Futon for 3', 3, 690, 2], ['Machiya Suite', 65, 'Futon for 4', 4, 1180, 1]],
  }),
  hotel({
    slug: 'arashiyama-ryokan', name: 'Arashiyama River Ryokan', destination: 'kyoto', stars: 5, featured: 'Onsen ryokan',
    tagline: 'A riverside ryokan reached by boat',
    description: 'A private boat carries you up the Hozu river to rooms that open onto maple-covered hills. The onsen baths look over the water, and the bamboo grove is a walk downstream.',
    rating: 4.9, reviews: 118, minNights: 2,
    facts: [['Rooms', '25'], ['Arrival', 'By private boat'], ['Baths', 'Natural onsen']],
    highlights: ['Boat arrival up the river', 'Private onsen in suites', 'Dawn bamboo grove walk'],
    included: ['Kaiseki dinner and breakfast', 'Boat transfer', 'Onsen access'],
    rooms: [['River View Room', 38, 'Futon for 2', 2, 780, 8], ['Room with Private Onsen', 52, 'Low beds', 3, 1180, 6], ['Maple Suite', 90, 'Low beds for 4', 4, 2100, 2]],
  }),
  // Cappadocia
  hotel({
    slug: 'fairy-chimney-suites', name: 'Fairy Chimney Cave Suites', destination: 'cappadocia', stars: 5, featured: 'Balloon terrace',
    tagline: 'Cave suites carved into Göreme\'s rock',
    description: 'Arched rooms cut into the soft tuff, with kilims, hammam baths and a terrace that fills with balloons every calm morning. Breakfast is served right on the roof.',
    rating: 4.9, reviews: 276, minNights: 2,
    facts: [['Suites', '15'], ['Carved', 'Into volcanic tuff'], ['To the launch field', '5 min']],
    highlights: ['Balloon-view breakfast terrace', 'Cave hammam', 'Sunset at Rose Valley'],
    included: ['Daily breakfast', 'Hammam ritual', 'Airport transfer'],
    rooms: [['Cave Room', 28, 'Queen', 2, 260, 5], ['Deluxe Cave Suite', 45, 'King', 3, 410, 6], ['Fairy Chimney Suite', 70, 'King + sofa bed', 4, 720, 2]],
  }),
  hotel({
    slug: 'uchisar-stone-house', name: 'Uçhisar Stone House', destination: 'cappadocia', stars: 4,
    tagline: 'A stone mansion below Uçhisar castle',
    description: 'An old Greek merchant\'s house with courtyard gardens, vaulted rooms and a view across Pigeon Valley. The castle, the region\'s highest point, is a short climb away.',
    rating: 4.7, reviews: 198, minNights: 2,
    facts: [['Rooms', '12'], ['Built', '19th century'], ['View', 'Pigeon Valley']],
    highlights: ['Courtyard gardens', 'Valley-view terrace', 'Pottery class in Avanos'],
    included: ['Daily breakfast', 'Valley hike with a guide', 'Parking'],
    rooms: [['Stone Room', 24, 'Queen', 2, 180, 5], ['Vaulted Room', 32, 'King', 3, 260, 5], ['Merchant\'s Suite', 55, 'King + sofa bed', 4, 420, 2]],
  }),
  // Dubai
  hotel({
    slug: 'sahra-desert-retreat', name: 'Sahra Desert Retreat', destination: 'dubai', stars: 5, featured: 'Desert pool villas',
    tagline: 'Pool villas among the dunes',
    description: 'Tented villas with private pools, deep in a desert conservation reserve where oryx and gazelles come to the waterholes. Dinner is under the stars after a dune drive.',
    rating: 4.9, reviews: 211, minNights: 2,
    facts: [['Villas', '40'], ['Reserve', 'Desert conservation area'], ['To downtown', '50 min']],
    highlights: ['Private pool villas', 'Falconry and camel treks', 'Stargazing dinners'],
    included: ['Full board', 'Two desert activities per day', 'City transfers'],
    rooms: [['Bedouin Suite', 75, 'King', 2, 980, 12], ['Pool Villa', 110, 'King', 3, 1450, 12], ['Royal Desert Villa', 260, '2 Kings', 6, 3900, 1]],
  }),
  hotel({
    slug: 'marina-sky-suites', name: 'Marina Sky Suites', destination: 'dubai', stars: 5,
    tagline: 'High-floor suites over Dubai Marina',
    description: 'Glass-walled suites from the fortieth floor up, with the Palm and the sea on one side and the skyline on the other. The rooftop pool turns into a bar at sunset.',
    rating: 4.7, reviews: 342, minNights: 2,
    facts: [['Suites', '120'], ['Floors', '40 to 62'], ['To the beach', '5 min']],
    highlights: ['Rooftop infinity pool', 'Floor-to-ceiling views', 'Beach club access'],
    included: ['Daily breakfast', 'Beach club entry', 'Airport transfer'],
    rooms: [['Skyline Room', 42, 'King', 2, 420, 30], ['Marina View Suite', 70, 'King + sofa bed', 3, 640, 25], ['Penthouse Suite', 180, '2 Kings', 5, 1950, 2]],
  }),
  // Marrakech
  hotel({
    slug: 'dar-atlas', name: 'Dar Atlas', destination: 'marrakech', stars: 5,
    tagline: 'A desert-edge retreat facing the High Atlas',
    description: 'Daybeds line a long terrace looking toward the snow on the High Atlas, with the medina forty minutes away. Evenings end around a fire pit under the stars.',
    rating: 4.7, reviews: 159, minNights: 2,
    facts: [['Suites', '16'], ['To the medina', '40 min'], ['Hammam', 'Traditional, on site']],
    highlights: ['Atlas-view terrace', 'Camel trek in Agafay', 'Fire-pit dinners'],
    included: ['Daily breakfast', 'Airport transfer', 'One hammam ritual'],
    rooms: [['Desert Room', 32, 'King', 2, 320, 6], ['Atlas View Suite', 55, 'King', 3, 480, 6], ['Pool Pavilion', 90, 'King + sofa bed', 4, 820, 2]],
  }),
  hotel({
    slug: 'riad-zellige', name: 'Riad Zellige', destination: 'marrakech', stars: 4, featured: 'Medina riad',
    tagline: 'A tiled courtyard riad in the medina',
    description: 'Behind a plain wooden door near the Bahia Palace, a courtyard of orange trees, hand-cut zellige and a plunge pool. Mint tea is poured on the roof at sunset.',
    rating: 4.8, reviews: 288, minNights: 2,
    facts: [['Rooms', '8'], ['Courtyard', 'Orange trees and pool'], ['To Jemaa el-Fna', '8 min on foot']],
    highlights: ['Rooftop mint tea', 'Souk walk with a guide', 'Cooking class in the courtyard'],
    included: ['Daily breakfast', 'Airport transfer', 'Guided souk walk'],
    rooms: [['Courtyard Room', 20, 'Queen', 2, 190, 4], ['Rooftop Room', 26, 'King', 2, 260, 2], ['Pasha Suite', 45, 'King + sofa bed', 4, 420, 2]],
  }),
  // Serengeti
  hotel({
    slug: 'seronera-tented-camp', name: 'Seronera Tented Camp', destination: 'serengeti', stars: 5, featured: 'Once in a lifetime',
    tagline: 'Canvas suites in the heart of the Serengeti',
    description: 'Twelve canvas suites with copper bathtubs and decks over the plains, in the area with the most resident big cats. Lions are often heard, and sometimes seen, from bed.',
    rating: 5, reviews: 102, minNights: 3,
    facts: [['Tents', '12'], ['Area', 'Central Seronera'], ['Airstrip', '20 min']],
    highlights: ['Big-cat territory', 'Bush breakfasts', 'Sundowners on a kopje'],
    included: ['Full board and drinks', 'Two game drives daily', 'Park fees'],
    rooms: [['Plains Tent', 60, 'King', 2, 1450, 6], ['Family Tent', 90, 'King + twins', 4, 2200, 3], ['Honeymoon Tent with Plunge Pool', 85, 'King', 2, 2050, 2]],
  }),
  hotel({
    slug: 'kopje-ridge-lodge', name: 'Kopje Ridge Lodge', destination: 'serengeti', stars: 4,
    tagline: 'A stone lodge built into a granite outcrop',
    description: 'Rooms wrap around the boulders of a kopje, with a pool carved into the rock and views across the migration route. Rock hyraxes sun themselves on the walls.',
    rating: 4.8, reviews: 176, minNights: 3,
    facts: [['Rooms', '20'], ['Built into', 'Granite kopje'], ['Migration', 'Passes Dec to Mar']],
    highlights: ['Rock-carved pool', 'Migration views', 'Walking safaris'],
    included: ['Full board', 'Daily game drive', 'Park fees'],
    rooms: [['Kopje Room', 40, 'King', 2, 890, 8], ['Plains View Suite', 60, 'King', 3, 1240, 8], ['Family Suite', 90, 'King + twins', 4, 1780, 2]],
  }),
  // Cape Town
  hotel({
    slug: 'clifton-sea-house', name: 'Clifton Sea House', destination: 'cape-town', stars: 5,
    tagline: 'A glass house above Clifton\'s beaches',
    description: 'Wide decks face the Atlantic and the Twelve Apostles ridge, with steps down to Clifton\'s Fourth Beach. Table Mountain is a fifteen-minute drive.',
    rating: 4.8, reviews: 129, minNights: 2,
    facts: [['Rooms', '10'], ['Beach', 'Clifton Fourth'], ['To the V&A Waterfront', '15 min']],
    highlights: ['Atlantic sunset decks', 'Steps to the beach', 'Wine-route chauffeur'],
    included: ['Daily breakfast', 'Sundowner on the deck', 'Airport transfer'],
    rooms: [['Mountain View Room', 30, 'King', 2, 420, 4], ['Ocean Room', 38, 'King', 2, 590, 4], ['Atlantic Suite', 70, 'King + sofa bed', 4, 1100, 2]],
  }),
  hotel({
    slug: 'constantia-vineyard-lodge', name: 'Constantia Vineyard Lodge', destination: 'cape-town', stars: 5, featured: 'Wine estate',
    tagline: 'A Cape Dutch manor among the vines',
    description: 'Gabled white buildings on one of South Africa\'s oldest wine estates, with the mountain behind. Tastings in the cellar, then dinner in the vines.',
    rating: 4.9, reviews: 158, minNights: 2,
    facts: [['Rooms', '18'], ['Estate', 'Working vineyard'], ['To the city', '25 min']],
    highlights: ['Cellar tastings', 'Vineyard pool', 'Cycle routes through the vines'],
    included: ['Daily breakfast', 'Wine tasting', 'Bicycles'],
    rooms: [['Vineyard Room', 32, 'King', 2, 360, 7], ['Manor Suite', 50, 'King', 3, 540, 6], ['Winemaker\'s Cottage', 90, '2 Kings', 4, 980, 2]],
  }),
  // Bora Bora
  hotel({
    slug: 'otemanu-overwater', name: 'Otemanu Overwater', destination: 'bora-bora', stars: 5, featured: 'Mountain-view bungalows',
    tagline: 'Overwater bungalows facing Mount Otemanu',
    description: 'Thatched bungalows on a motu, with glass floors, ladders into the lagoon and the island\'s peak straight ahead. Breakfast arrives by outrigger canoe.',
    rating: 5, reviews: 117, minNights: 3,
    facts: [['Bungalows', '40'], ['View', 'Mount Otemanu'], ['Transfer', 'Boat from the airport motu']],
    highlights: ['Canoe breakfast delivery', 'Glass-floor bungalows', 'Lagoon snorkel trail'],
    included: ['Daily breakfast', 'Boat transfers', 'Snorkel gear and paddleboards'],
    rooms: [['Beach Bungalow', 70, 'King', 3, 1350, 10], ['Overwater Bungalow', 85, 'King', 3, 1980, 16], ['Otemanu Overwater Villa', 180, '2 Kings', 5, 4600, 2]],
  }),
  hotel({
    slug: 'motu-hana', name: 'Motu Hana Bungalows', destination: 'bora-bora', stars: 4,
    tagline: 'Garden bungalows on a quiet islet',
    description: 'Palm-thatched bungalows set in a coconut grove on a small motu, steps from a white-sand beach and the coral garden. Simple, barefoot and very Polynesian.',
    rating: 4.7, reviews: 143, minNights: 3,
    facts: [['Bungalows', '18'], ['Beach', 'White sand, 30 m'], ['Coral garden', 'Off the beach']],
    highlights: ['Coral garden snorkelling', 'Polynesian dance nights', 'Outrigger canoe lessons'],
    included: ['Daily breakfast', 'Boat transfers', 'Kayaks and snorkel gear'],
    rooms: [['Garden Bungalow', 40, 'Queen', 2, 520, 8], ['Beach Bungalow', 48, 'King', 3, 740, 6], ['Family Fare', 70, 'King + twins', 4, 980, 2]],
  }),
  // Tulum
  hotel({
    slug: 'casa-cenote', name: 'Casa Cenote Jungle Villas', destination: 'tulum', stars: 5, featured: 'Private cenote',
    tagline: 'Jungle villas around a private cenote',
    description: 'Concrete-and-palapa villas hidden in the forest, each a short path from the hotel\'s own cenote. Mornings are for swimming in the clear water before anyone else arrives.',
    rating: 4.9, reviews: 166, minNights: 3,
    facts: [['Villas', '14'], ['Cenote', 'Private'], ['To the ruins', '15 min']],
    highlights: ['Private cenote swims', 'Temazcal ceremony', 'Bikes to the beach'],
    included: ['Daily breakfast', 'Bicycles', 'Cenote snorkel gear'],
    rooms: [['Jungle Villa', 55, 'King', 2, 480, 6], ['Plunge Pool Villa', 75, 'King', 3, 690, 6], ['Treehouse Suite', 90, 'King + sofa bed', 4, 980, 2]],
  }),
  hotel({
    slug: 'cabanas-sian', name: 'Cabañas Sian', destination: 'tulum', stars: 4,
    tagline: 'Beach cabanas by the Sian Ka\'an reserve',
    description: 'Palapa-roofed cabanas on the sand at the start of the biosphere reserve, lit by lanterns at night. Spot dolphins from the breakfast table.',
    rating: 4.7, reviews: 204, minNights: 2,
    facts: [['Cabanas', '20'], ['Beach', 'On the sand'], ['To Sian Ka\'an', '5 min']],
    highlights: ['Beachfront cabanas', 'Lagoon boat trips', 'Lantern-lit dinners'],
    included: ['Daily breakfast', 'Kayaks', 'Yoga each morning'],
    rooms: [['Garden Cabana', 28, 'Queen', 2, 260, 8], ['Ocean Cabana', 34, 'King', 2, 380, 8], ['Beach Suite', 55, 'King + sofa bed', 4, 610, 2]],
  }),
  // Banff
  hotel({
    slug: 'moraine-shore-lodge', name: 'Moraine Shore Lodge', destination: 'banff', stars: 5, featured: 'Lakefront cabins',
    tagline: 'Log cabins on a turquoise glacier lake',
    description: 'Cedar cabins with fireplaces on the shore beneath the Valley of the Ten Peaks. Paddle out at dawn, when the water is glass and the tour buses are still hours away.',
    rating: 4.9, reviews: 138, minNights: 2,
    facts: [['Cabins', '32'], ['Lake', 'Glacier-fed'], ['Season', 'June to October']],
    highlights: ['Dawn canoe on the lake', 'Fireplace in every cabin', 'Guided hikes to Larch Valley'],
    included: ['Daily breakfast', 'Canoe use', 'Afternoon tea'],
    rooms: [['Forest Cabin', 32, 'King', 2, 620, 10], ['Lakeview Cabin', 40, 'King', 3, 880, 10], ['Ten Peaks Suite', 70, '2 Queens', 4, 1350, 2]],
  }),
  hotel({
    slug: 'bow-river-chalets', name: 'Bow River Chalets', destination: 'banff', stars: 4,
    tagline: 'Timber chalets beside the Bow River',
    description: 'A riverside chalet hotel a short walk from Banff town, with hot tubs facing Mount Rundle. Ski Sunshine Village in winter, hike Johnston Canyon in summer.',
    rating: 4.7, reviews: 257, minNights: 2,
    facts: [['Chalets', '24'], ['To Banff town', '8 min on foot'], ['Hot tubs', 'Outdoor, mountain view']],
    highlights: ['Mountain-view hot tubs', 'Ski shuttle in winter', 'Elk often on the lawn'],
    included: ['Daily breakfast', 'Ski shuttle', 'Hot springs passes'],
    rooms: [['River Room', 28, 'Queen', 2, 290, 8], ['Rundle View Chalet', 45, 'King', 3, 420, 8], ['Family Chalet', 70, 'King + bunks', 5, 640, 3]],
  }),
]

const yachts: Listing[] = [
  yacht({
    slug: 'my-aurelia', name: 'M/Y Aurelia', destination: 'amalfi-coast', featured: 'Yacht of the season',
    tagline: '47 m motor yacht, Naples to Capri and the Aeolians',
    description: 'A classic tri-deck with a teak sun deck and a chef who shops the Capri market each morning. The usual route runs Naples, Capri, Positano and Stromboli, but the captain will change it over breakfast.',
    price: 185000, rating: 4.9, reviews: 41, guests: 12,
    facts: [['Length', '47 m'], ['Cabins', '6'], ['Crew', '11']],
    highlights: ['Jet tenders and seabobs', 'Sun deck jacuzzi', 'Chef-led market mornings'],
    included: ['Full crew and chef', 'Water toys', 'Itinerary planning'],
  }),
  yacht({
    slug: 'my-nocturne', name: 'M/Y Nocturne', destination: 'santorini',
    tagline: '62 m explorer in the Cyclades',
    description: 'A long-range superyacht with a beach club at the waterline and a spa on the lower deck. A week takes in the caldera, Milos and the quiet anchorages of Folegandros.',
    price: 420000, rating: 5, reviews: 18, guests: 12,
    facts: [['Length', '62 m'], ['Cabins', '6'], ['Crew', '19']],
    highlights: ['Waterline beach club', 'Helipad', 'Resident spa therapist'],
    included: ['Full crew and chef', 'Spa treatments', 'Tenders and water toys'],
  }),
  yacht({
    slug: 'sy-meltemi', name: 'S/Y Meltemi', destination: 'venice',
    tagline: '24 m sailing yacht in the northern Adriatic',
    description: 'Named for the summer wind and rigged for a small crew, Meltemi leaves Venice for the lagoon islands and Istria. Lend a hand on the sheets or leave it to the skipper.',
    price: 42000, rating: 4.8, reviews: 36, guests: 6,
    facts: [['Length', '24 m'], ['Cabins', '3'], ['Crew', '3']],
    highlights: ['Beginner-friendly sailing', 'Lagoon and Istria route', 'On-deck cooking'],
    included: ['Skipper, mate and cook', 'Paddleboards', 'Marina fees'],
  }),
  yacht({
    slug: 'gulet-zora', name: 'Gulet Zora', destination: 'dubrovnik', featured: 'Island hopping',
    tagline: '32 m wooden gulet through the Elaphiti Islands',
    description: 'A traditional two-masted gulet with a shaded aft deck for long lunches. A week runs from Dubrovnik to Mljet, Korčula and Hvar, swimming off the boat in a different cove every afternoon.',
    price: 38000, rating: 4.9, reviews: 64, guests: 12,
    facts: [['Length', '32 m'], ['Cabins', '6'], ['Crew', '5']],
    highlights: ['Six islands in a week', 'Long lunches on deck', 'Swim stops every day'],
    included: ['Crew and cook', 'Breakfast and lunch', 'Kayaks and snorkel gear'],
  }),
  yacht({
    slug: 'my-solene', name: 'M/Y Solène', destination: 'mallorca',
    tagline: '40 m motor yacht around the Balearics',
    description: 'From Palma to the coves of the Tramuntana, Formentera\'s white sand and Ibiza\'s sunsets. The sun deck has a pool, and the chef cooks with produce from Mallorcan farms.',
    price: 160000, rating: 4.8, reviews: 29, guests: 10,
    facts: [['Length', '40 m'], ['Cabins', '5'], ['Crew', '9']],
    highlights: ['Sun deck pool', 'Formentera and Ibiza route', 'Island-farm menus'],
    included: ['Full crew and chef', 'Water toys', 'Itinerary planning'],
  }),
  yacht({
    slug: 'my-amirante', name: 'M/Y Amirante', destination: 'seychelles', featured: 'Remote islands',
    tagline: '36 m expedition yacht in the Inner Islands',
    description: 'Built for long passages, with dive gear and two tenders. Spend a week between La Digue, Curieuse\'s giant tortoises and marine parks where hawksbill turtles nest.',
    price: 95000, rating: 4.9, reviews: 22, guests: 10,
    facts: [['Length', '36 m'], ['Cabins', '5'], ['Crew', '8']],
    highlights: ['On-board dive centre', 'Turtle nesting beaches', 'Two fast tenders'],
    included: ['Crew, chef and dive guide', 'Diving and fishing gear', 'Marine park fees'],
  }),
  yacht({
    slug: 'cat-tiare', name: 'Catamaran Tiare', destination: 'bora-bora',
    tagline: '20 m sailing catamaran in the Society Islands',
    description: 'A stable, roomy catamaran for sailing between Bora Bora, Taha\'a\'s vanilla farms and Huahine\'s quiet lagoons. Anchor in water so clear the hull seems to float in air.',
    price: 48000, rating: 4.8, reviews: 38, guests: 8,
    facts: [['Length', '20 m'], ['Cabins', '4'], ['Crew', '3']],
    highlights: ['Taha\'a vanilla farms', 'Snorkel straight off the stern', 'Trampoline nets for sunbathing'],
    included: ['Skipper, host and cook', 'Snorkel gear and paddleboards', 'Mooring fees'],
  }),
  yacht({
    slug: 'my-zephyr', name: 'M/Y Zephyr', destination: 'krabi',
    tagline: '26 m flybridge among the Andaman karsts',
    description: 'Fast and shallow-drafted, ideal for slipping between Phang Nga\'s limestone islands. A week covers the Hong Islands, Koh Yao Noi and the Similan dive sites.',
    price: 68000, rating: 4.8, reviews: 52, guests: 8,
    facts: [['Length', '26 m'], ['Cabins', '4'], ['Crew', '5']],
    highlights: ['Sea kayaks', 'Dive instructor on request', 'Flybridge dining'],
    included: ['Crew and Thai chef', 'Kayaks and snorkel gear', 'National park fees'],
  }),
]

const experiences: Listing[] = [
  experience({
    slug: 'goreme-sunrise', name: 'Göreme Sunrise Balloon', destination: 'cappadocia', featured: 'Top rated', film: 'balloon-drift',
    tagline: 'One hour over the fairy chimneys', hours: 3,
    description: 'Collection is before dawn, with coffee while the burners fire up. You drift at rooftop height through Love Valley, climb with the sun and land to a glass of sparkling wine.',
    price: 320, rating: 4.9, reviews: 842, guests: 8,
    facts: [['Duration', '3 hours, 1 in the air'], ['Basket', '16 people maximum'], ['Rebooking', 'Free if winds ground the flight']],
    highlights: ['Licensed pilot', 'Hotel pick-up', 'Flight certificate'],
    included: ['Transfers', 'Breakfast', 'Landing toast'],
    slots: [['05:15', 'Sunrise flight', 16], ['06:30', 'Second wave', 16]],
  }),
  experience({
    slug: 'hong-lagoon', name: 'Hong Islands by Long-tail', destination: 'krabi',
    tagline: 'A private boat to a hidden lagoon', hours: 7,
    description: 'Your skipper times the tide so the Hong lagoon is open and nearly empty. Snorkel off Koh Lao Lading, have lunch on a sandbar and return as the sun drops behind the karsts.',
    price: 240, rating: 4.8, reviews: 516, guests: 8,
    facts: [['Duration', '7 hours'], ['Boat', 'Private long-tail'], ['Departs', 'Ao Nang or Railay']],
    highlights: ['Tide-timed route', 'Sandbar lunch', 'Snorkelling stops'],
    included: ['Skipper and guide', 'Lunch and drinks', 'National park fee'],
    slots: [['08:00', 'Early tide', 8], ['10:30', 'Late morning', 8]],
  }),
  experience({
    slug: 'hanifaru-mantas', name: 'Mantas of Hanifaru Bay', destination: 'maldives', film: 'snorkel',
    tagline: 'Snorkel with a marine biologist', hours: 4,
    description: 'Hanifaru Bay funnels plankton into a shallow pool, drawing some of the world\'s largest manta gatherings. Numbers in the bay are capped, so you go in small groups with a biologist.',
    price: 390, rating: 5, reviews: 228, guests: 6,
    facts: [['Duration', '4 hours'], ['Season', 'June to November'], ['Group', '6 people maximum']],
    highlights: ['Biosphere Reserve access', 'Marine biologist guide', 'Manta ID photography'],
    included: ['Speedboat', 'Snorkel gear', 'Park permit'],
    slots: [['07:30', 'Morning tide', 6], ['13:00', 'Afternoon tide', 6]],
  }),
  experience({
    slug: 'aurora-south-coast', name: 'Aurora and the South Coast', destination: 'iceland',
    tagline: 'Waterfalls by day, the night sky after dinner', hours: 14,
    description: 'A super-jeep follows the clearest forecast along the south coast, from Seljalandsfoss to the black sand at Reynisfjara. After dinner your guide drives out beyond the farm lights to wait for the aurora.',
    price: 680, rating: 4.9, reviews: 377, guests: 6,
    facts: [['Duration', '14 hours'], ['Vehicle', 'Super-jeep, 6 seats'], ['Aurora season', 'September to April']],
    highlights: ['Forecast-led route', 'Tripod and camera help', 'Free retry if clouded out'],
    included: ['Guide and transport', 'Dinner', 'Hot chocolate under the stars'],
    slots: [['09:00', 'Full day and night', 6], ['17:00', 'Aurora only', 6]],
  }),
  experience({
    slug: 'migration-drive', name: 'The Great Migration Game Drive', destination: 'serengeti', featured: 'Once in a lifetime', film: 'zebra-waterhole',
    tagline: 'A full day with the herds', hours: 10,
    description: 'Leave camp at first light with a Tanzanian guide who has followed the herds for decades. Open-sided cruiser, lunch under an acacia, no plan beyond where the animals are.',
    price: 1150, rating: 5, reviews: 164, guests: 6,
    facts: [['Duration', '10 hours'], ['Vehicle', 'Open-sided cruiser'], ['Group', '6 people maximum']],
    highlights: ['Private vehicle and guide', 'Bush lunch', 'Sundowner on a kopje'],
    included: ['Park fees', 'Lunch and drinks', 'Binoculars'],
    slots: [['06:00', 'Full day', 6], ['14:30', 'Afternoon and sunset', 6]],
  }),
  experience({
    slug: 'dawn-gondola', name: 'Dawn on the Grand Canal', destination: 'venice',
    tagline: 'A private gondola before the city wakes', hours: 1.5,
    description: 'Meet your gondolier in the blue hour by the Rialto and glide toward the Salute as the delivery boats start to run. It ends at a neighbourhood bar with cicchetti and coffee.',
    price: 180, rating: 4.8, reviews: 439, guests: 5,
    facts: [['Duration', '90 minutes'], ['Boat', 'Private gondola'], ['Meets', 'Near the Rialto']],
    highlights: ['Blue-hour departure', 'Local gondolier stories', 'Hidden canals of San Polo'],
    included: ['Private gondola', 'Coffee and cicchetti', 'Rain blankets'],
    slots: [['06:30', 'Blue hour', 5], ['07:30', 'Sunrise', 5], ['19:00', 'Evening glow', 5]],
  }),
  experience({
    slug: 'braies-dawn-row', name: 'Lago di Braies at First Light', destination: 'dolomites',
    tagline: 'A wooden boat, then a guided ridge walk', hours: 6,
    description: 'Row out on the jade water before the car parks fill, then climb through larch forest to a rifugio for a late breakfast. Your mountain guide knows the quiet route up.',
    price: 210, rating: 4.9, reviews: 298, guests: 6,
    facts: [['Duration', '6 hours'], ['Walk', '9 km, moderate'], ['Season', 'June to October']],
    highlights: ['First boat of the day', 'Certified mountain guide', 'Rifugio breakfast'],
    included: ['Boat hire', 'Guide', 'Breakfast'],
    slots: [['05:45', 'First boat', 6], ['08:00', 'Morning', 6]],
  }),
  experience({
    slug: 'seine-dinner', name: 'Seine by Night', destination: 'paris', film: 'hero-paris',
    tagline: 'A four-course dinner cruise past the lit monuments', hours: 2.5,
    description: 'A glass-roofed boat slides past Notre-Dame, the Louvre and the Musée d\'Orsay as the city lights come on, timed to pass the Eiffel Tower as it sparkles on the hour.',
    price: 190, rating: 4.7, reviews: 1204, guests: 6,
    facts: [['Duration', '2.5 hours'], ['Boat', 'Glass-roofed'], ['Boards at', 'Port de la Bourdonnais']],
    highlights: ['Eiffel Tower sparkle on the hour', 'Window tables', 'Live jazz trio'],
    included: ['Four-course dinner', 'Champagne', 'Wine pairing'],
    slots: [['18:30', 'Sunset sitting', 24], ['21:00', 'Late sitting', 24]],
  }),
  experience({
    slug: 'dunes-golden-hour', name: 'Dunes at Golden Hour', destination: 'dubai', film: 'hero-dunes',
    tagline: 'A vintage Land Rover drive into the red dunes', hours: 6,
    description: 'Ride out in a restored 1950s Land Rover to a Bedouin-style camp, watch a falcon fly at sunset and eat under the stars, with no quad bikes and no crowds.',
    price: 260, rating: 4.9, reviews: 688, guests: 6,
    facts: [['Duration', '6 hours'], ['Vehicle', 'Vintage Land Rover'], ['Group', '6 per vehicle']],
    highlights: ['Falconry display', 'Stargazing with a telescope', 'Hotel pick-up'],
    included: ['Transfers', 'Dinner and drinks', 'Henna and camel ride'],
    slots: [['05:30', 'Sunrise drive', 12], ['15:30', 'Golden hour and dinner', 18]],
  }),
  experience({
    slug: 'table-mountain-heli', name: 'Table Mountain by Helicopter', destination: 'cape-town',
    tagline: 'Twelve Apostles, Camps Bay and the Cape Peninsula', hours: 1,
    description: 'Lift off from the V&A Waterfront and fly over Table Mountain, along the Twelve Apostles and down the Atlantic coast toward Hout Bay, with the doors-off option on clear days.',
    price: 330, rating: 4.9, reviews: 512, guests: 4,
    facts: [['Duration', '30 minutes in the air'], ['Departs', 'V&A Waterfront'], ['Seats', 'Window for everyone']],
    highlights: ['Over Table Mountain', 'Twelve Apostles coastline', 'Doors-off on request'],
    included: ['Flight', 'Safety briefing', 'Waterfront parking'],
    slots: [['09:00', 'Morning calm', 5], ['12:00', 'Midday', 5], ['17:00', 'Golden hour', 5]],
  }),
  experience({
    slug: 'tulum-cenotes', name: 'Cenotes before the Crowds', destination: 'tulum',
    tagline: 'Swim three jungle cenotes with a cave diver', hours: 5,
    description: 'A certified cave diver takes you to three cenotes, from an open turquoise pool to a cavern lit by shafts of sunlight. Snorkel over stalactites in water clear enough to forget it\'s there.',
    price: 140, rating: 4.9, reviews: 734, guests: 8,
    facts: [['Duration', '5 hours'], ['Cenotes', '3'], ['Level', 'Confident swimmers']],
    highlights: ['First entry of the day', 'Cavern snorkelling', 'Maya lunch in a village'],
    included: ['Guide', 'Gear and wetsuit', 'Lunch and entry fees'],
    slots: [['07:30', 'First entry', 8], ['11:00', 'Late morning', 8]],
  }),
  experience({
    slug: 'moraine-canoe', name: 'Sunrise Canoe on Moraine Lake', destination: 'banff',
    tagline: 'Glass-still water under the Ten Peaks', hours: 3,
    description: 'Paddle a cedar canoe across the turquoise lake as first light hits the Valley of the Ten Peaks, then warm up with coffee and cinnamon buns on the rockpile.',
    price: 160, rating: 4.9, reviews: 403, guests: 6,
    facts: [['Duration', '3 hours'], ['Season', 'June to September'], ['Level', 'No experience needed']],
    highlights: ['First light on the peaks', 'Guided paddle', 'Rockpile photo stop'],
    included: ['Shuttle from Lake Louise', 'Canoe and guide', 'Coffee and pastries'],
    slots: [['05:30', 'Sunrise', 12], ['08:00', 'Morning', 12]],
  }),
  experience({
    slug: 'lagoon-outrigger', name: 'Lagoon by Outrigger', destination: 'bora-bora',
    tagline: 'Rays, reef sharks and a motu picnic', hours: 5,
    description: 'Paddle and motor an outrigger canoe around the lagoon, snorkel with gentle stingrays and blacktip reef sharks, then lunch on a private motu with your feet in the sand.',
    price: 230, rating: 4.9, reviews: 455, guests: 8,
    facts: [['Duration', '5 hours'], ['Boat', 'Polynesian outrigger'], ['Group', '10 people maximum']],
    highlights: ['Swim with stingrays', 'Coral garden snorkel', 'Motu picnic'],
    included: ['Guide', 'Snorkel gear', 'Polynesian lunch'],
    slots: [['08:30', 'Morning lagoon', 10], ['12:30', 'Afternoon lagoon', 10]],
  }),
  experience({
    slug: 'gornergrat-sunrise', name: 'Gornergrat at Sunrise', destination: 'zermatt',
    tagline: 'The first train up to 3,089 m', hours: 3,
    description: 'Ride the cog railway above the clouds to watch the sun hit the Matterhorn and twenty-nine four-thousand-metre peaks, then eat breakfast at the summit hotel.',
    price: 150, rating: 4.8, reviews: 389, guests: 8,
    facts: [['Duration', '3 hours'], ['Summit', '3,089 m'], ['Peaks in view', '29 over 4,000 m']],
    highlights: ['Sunrise on the Matterhorn', 'Summit breakfast', 'Glacier viewpoint'],
    included: ['Train tickets', 'Breakfast', 'Guide'],
    slots: [['06:10', 'First train', 20], ['07:00', 'Second train', 20]],
  }),
  experience({
    slug: 'walls-kayak', name: 'Sea Kayak under the City Walls', destination: 'dubrovnik',
    tagline: 'Paddle to Lokrum and a hidden cave beach', hours: 3,
    description: 'Launch below the walls and paddle around to Lokrum island, stopping at Betina cave beach for a swim and a snack. The sunset paddle ends with the old town glowing pink.',
    price: 75, rating: 4.8, reviews: 921, guests: 8,
    facts: [['Duration', '3 hours'], ['Distance', '6 km'], ['Level', 'Beginners welcome']],
    highlights: ['Views of the walls from the sea', 'Betina cave beach', 'Snorkel stop'],
    included: ['Kayak and guide', 'Snorkel gear', 'Snack and water'],
    slots: [['09:00', 'Morning', 14], ['17:30', 'Sunset paddle', 14]],
  }),
  experience({
    slug: 'benagil-boat', name: 'Benagil Cave by Boat', destination: 'algarve',
    tagline: 'Inside the cathedral of the sea', hours: 1.5,
    description: 'A small boat from Portimão follows the cliffs past arches and grottoes to Benagil, where the cave roof opens to the sky above a hidden beach.',
    price: 45, rating: 4.7, reviews: 1388, guests: 8,
    facts: [['Duration', '90 minutes'], ['Caves', '15 along the way'], ['Departs', 'Portimão marina']],
    highlights: ['Inside Benagil cave', 'Ponta do Altar lighthouse', 'Dolphins in season'],
    included: ['Skipper and guide', 'Life jackets', 'Water'],
    slots: [['10:00', 'Morning light', 12], ['13:00', 'Midday', 12], ['16:00', 'Afternoon', 12]],
  }),
  experience({
    slug: 'como-riva', name: 'Lake Como by Vintage Riva', destination: 'lake-como',
    tagline: 'Villas, gardens and an aperitivo on the water', hours: 2,
    description: 'Cruise in a mahogany 1960s Riva past Villa del Balbianello, Bellagio and the gardens of Tremezzo, with prosecco on the way back as the light turns gold.',
    price: 210, rating: 4.9, reviews: 312, guests: 6,
    facts: [['Duration', '2 hours'], ['Boat', '1960s mahogany Riva'], ['Group', '6 people maximum']],
    highlights: ['Villa del Balbianello from the water', 'Bellagio point', 'Prosecco aperitivo'],
    included: ['Skipper', 'Prosecco and snacks', 'Hotel jetty pick-up'],
    slots: [['10:00', 'Morning', 6], ['15:00', 'Afternoon', 6], ['18:00', 'Aperitivo cruise', 6]],
  }),
  experience({
    slug: 'la-digue-bike', name: 'La Digue by Bike', destination: 'seychelles',
    tagline: 'Anse Source d\'Argent and the island\'s secret coves', hours: 5,
    description: 'Cycle the island\'s quiet lanes past vanilla plantations and giant tortoises to Anse Source d\'Argent, then swim at coves most visitors never reach.',
    price: 95, rating: 4.8, reviews: 266, guests: 8,
    facts: [['Duration', '5 hours'], ['Distance', '14 km, flat'], ['Beaches', '4']],
    highlights: ['Anse Source d\'Argent', 'Vanilla plantation', 'Creole lunch'],
    included: ['Bike and guide', 'Park entry', 'Lunch'],
    slots: [['08:30', 'Morning', 10], ['13:30', 'Afternoon and sunset', 10]],
  }),
  experience({
    slug: 'fushimi-dawn', name: 'Fushimi Inari before Dawn', destination: 'kyoto',
    tagline: 'Ten thousand torii gates and no crowds', hours: 3,
    description: 'Climb through the vermilion gates in lantern light with a guide who grew up nearby, reaching the summit as the sun rises over Kyoto, then share breakfast at a tea house.',
    price: 120, rating: 4.9, reviews: 587, guests: 8,
    facts: [['Duration', '3 hours'], ['Climb', '233 m, steady'], ['Group', '8 people maximum']],
    highlights: ['Torii gates by lantern light', 'Sunrise over Kyoto', 'Tea-house breakfast'],
    included: ['Guide', 'Breakfast', 'Taxi back to your hotel'],
    slots: [['05:00', 'Before dawn', 8], ['06:30', 'Early morning', 8]],
  }),
  experience({
    slug: 'tramuntana-olive', name: 'Olive Groves of the Tramuntana', destination: 'mallorca',
    tagline: 'A hike, a press and a long lunch', hours: 6,
    description: 'Walk an old cobbled mule path between ancient olive terraces above Sóller, visit a family press for a tasting, then sit down to lunch in the farm courtyard.',
    price: 130, rating: 4.8, reviews: 198, guests: 8,
    facts: [['Duration', '6 hours'], ['Walk', '8 km, moderate'], ['Group', '10 people maximum']],
    highlights: ['Ancient olive terraces', 'Family oil press tasting', 'Farm lunch'],
    included: ['Guide', 'Tasting and lunch', 'Transfers from Palma'],
    slots: [['09:00', 'Morning start', 10]],
  }),
]

export const listings: Listing[] = [...hotels, ...yachts, ...experiences]

export const listingBySlug = (slug: string) => listings.find((l) => l.slug === slug)
export const listingsIn = (destination: string) => listings.filter((l) => l.destination === destination)

/** Cheapest nightly or per-person price at a destination, ignoring weekly yacht rates. */
export const fromPrice = (destination: string) => {
  const nightly = listingsIn(destination).filter((l) => l.unit !== 'week')
  return nightly.length ? Math.min(...nightly.map((l) => l.price)) : null
}
