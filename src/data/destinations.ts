import type { ImageName, VideoName } from './media.generated'

export const regions = ['Mediterranean', 'Europe & Alps', 'Indian Ocean', 'Asia & Pacific', 'Africa & Middle East', 'Americas'] as const

export type Destination = {
  slug: string
  name: string
  country: string
  region: (typeof regions)[number]
  tagline: string
  blurb: string
  lat: number
  lon: number
  /** Hero first, then the gallery. */
  images: ImageName[]
  film?: VideoName
  /** Zero-indexed months with the most reliable weather or the signature event. */
  bestMonths: number[]
  seasonNote: string
  airport: string
  currency: string
  language: string
  utc: string
  unesco?: string
}

type Spec = Omit<Destination, 'images'>

const spec: Spec[] = [
  {
    slug: 'amalfi-coast', name: 'Amalfi Coast', country: 'Italy', region: 'Mediterranean',
    tagline: 'Lemon terraces stacked above a green sea.',
    blurb: 'A road cut into limestone between Positano and Vietri sul Mare, with towns built to face the water. Arrive by boat if you can: the view from the sea is still the best one.',
    lat: 40.634, lon: 14.603, bestMonths: [4, 5, 8, 9],
    seasonNote: 'May, June, September and October bring warm water without the August crowds.',
    airport: 'Naples (NAP)', currency: 'Euro', language: 'Italian', utc: 'UTC+1', unesco: 'World Heritage Site since 1997',
  },
  {
    slug: 'cinque-terre', name: 'Cinque Terre', country: 'Italy', region: 'Mediterranean',
    tagline: 'Five fishing villages, no through road.',
    blurb: 'Painted houses cling to the Ligurian cliffs, linked by coastal footpaths and a small local railway. Manarola at dusk is the postcard; the vineyards above it are where the place makes sense.',
    lat: 44.107, lon: 9.729, bestMonths: [3, 4, 5, 8, 9],
    seasonNote: 'Spring and early autumn are ideal for walking the coastal paths.',
    airport: 'Genoa (GOA) or Pisa (PSA)', currency: 'Euro', language: 'Italian', utc: 'UTC+1', unesco: 'World Heritage Site since 1997',
  },
  {
    slug: 'santorini', name: 'Santorini', country: 'Greece', region: 'Mediterranean',
    tagline: 'A drowned volcano with whitewashed edges.',
    blurb: 'The caldera cliffs of Oia and Imerovigli look over a lagoon formed by one of the largest eruptions in recorded history. The volcanic soil also grows the island\'s crisp Assyrtiko.',
    lat: 36.393, lon: 25.461, bestMonths: [4, 5, 8, 9],
    seasonNote: 'Late spring and early autumn give you warm evenings and quieter paths.',
    airport: 'Santorini (JTR)', currency: 'Euro', language: 'Greek', utc: 'UTC+2',
  },
  {
    slug: 'venice', name: 'Venice', country: 'Italy', region: 'Mediterranean',
    tagline: 'A city that still moves at the speed of oars.',
    blurb: 'One hundred and eighteen small islands joined by hundreds of bridges. Stay past the last day-tripper train and the canals of Cannaregio go quiet enough to hear the water.',
    lat: 45.44, lon: 12.316, bestMonths: [3, 4, 8, 9],
    seasonNote: 'April, May, September and October are mild, with soft light on the lagoon.',
    airport: 'Venice Marco Polo (VCE)', currency: 'Euro', language: 'Italian', utc: 'UTC+1', unesco: 'World Heritage Site since 1987',
  },
  {
    slug: 'dubrovnik', name: 'Dubrovnik', country: 'Croatia', region: 'Mediterranean',
    tagline: 'Marble streets inside two kilometres of wall.',
    blurb: 'Walk the full circuit of the city walls at opening time, then take a boat to Lokrum or the Elaphiti islands. The old town\'s limestone glows pink at sunset from the cable car above.',
    lat: 42.641, lon: 18.108, bestMonths: [4, 5, 8, 9],
    seasonNote: 'May, June, September and October are warm without the cruise-ship peak.',
    airport: 'Dubrovnik (DBV)', currency: 'Euro', language: 'Croatian', utc: 'UTC+1', unesco: 'Old City listed in 1979',
  },
  {
    slug: 'mallorca', name: 'Mallorca', country: 'Spain', region: 'Mediterranean',
    tagline: 'Stone villages in the Tramuntana, coves below.',
    blurb: 'Beyond the beaches, the Serra de Tramuntana hides olive terraces, honey-stone villages like Deià and Valldemossa, and a corkscrew road down to Sa Calobra.',
    lat: 39.748, lon: 2.649, bestMonths: [4, 5, 8, 9],
    seasonNote: 'May, June, September and October suit hiking, cycling and swimming alike.',
    airport: 'Palma (PMI)', currency: 'Euro', language: 'Spanish, Catalan', utc: 'UTC+1', unesco: 'Serra de Tramuntana listed in 2011',
  },
  {
    slug: 'algarve', name: 'Algarve', country: 'Portugal', region: 'Mediterranean',
    tagline: 'Golden sea stacks and caves you can swim into.',
    blurb: 'Portugal\'s south coast breaks into arches and grottoes around Lagos and Ponta da Piedade. Benagil\'s sea cave, with its open roof, is best seen from a kayak at first light.',
    lat: 37.081, lon: -8.669, bestMonths: [3, 4, 5, 8, 9],
    seasonNote: 'April to June and September to October bring warm sun and calmer cave trips.',
    airport: 'Faro (FAO)', currency: 'Euro', language: 'Portuguese', utc: 'UTC+0',
  },
  {
    slug: 'lake-como', name: 'Lake Como', country: 'Italy', region: 'Europe & Alps',
    tagline: 'Villa gardens running down to deep blue water.',
    blurb: 'An upside-down Y of deep water beneath the first peaks of the Alps. Villas with terraced gardens line the shore at Bellagio, Varenna and Tremezzo, and the ferries still beat any road.',
    lat: 45.987, lon: 9.261, bestMonths: [3, 4, 5, 8],
    seasonNote: 'April to June and September, when the gardens bloom and the boats run full timetables.',
    airport: 'Milan Malpensa (MXP)', currency: 'Euro', language: 'Italian', utc: 'UTC+1',
  },
  {
    slug: 'dolomites', name: 'Dolomites', country: 'Italy', region: 'Europe & Alps',
    tagline: 'Pale rock towers above jade water.',
    blurb: 'South Tyrol, where Italian espresso meets Austrian dumplings. At sunrise the limestone turns the rose colour locals call enrosadira, and Lago di Braies holds the reflection.',
    lat: 46.694, lon: 12.085, bestMonths: [5, 6, 7, 8, 0, 1],
    seasonNote: 'June to September for hiking, January and February for skiing.',
    airport: 'Venice (VCE) or Innsbruck (INN)', currency: 'Euro', language: 'Italian, German, Ladin', utc: 'UTC+1', unesco: 'World Heritage Site since 2009',
  },
  {
    slug: 'zermatt', name: 'Zermatt', country: 'Switzerland', region: 'Europe & Alps',
    tagline: 'A car-free village under the Matterhorn.',
    blurb: 'Electric taxis, wooden chalets and a 4,478 metre peak at the end of the street. Cog railways and lifts climb to glaciers where you can ski even in summer.',
    lat: 46.02, lon: 7.749, bestMonths: [11, 0, 1, 2, 6, 7, 8],
    seasonNote: 'December to March for skiing, July to September for high trails.',
    airport: 'Zurich (ZRH) or Geneva (GVA)', currency: 'Swiss franc', language: 'German', utc: 'UTC+1',
  },
  {
    slug: 'paris', name: 'Paris', country: 'France', region: 'Europe & Alps',
    tagline: 'Zinc rooftops, river light and a table for two.',
    blurb: 'Stay on the Left Bank for bookshops and bistros, or up in Montmartre for the view. Walk the Seine at dusk when the Eiffel Tower starts its hourly sparkle.',
    lat: 48.857, lon: 2.352, bestMonths: [3, 4, 5, 8, 9],
    seasonNote: 'April to June and September to October are mild and full of terrace weather.',
    airport: 'Paris Charles de Gaulle (CDG)', currency: 'Euro', language: 'French', utc: 'UTC+1', unesco: 'Banks of the Seine listed in 1991',
  },
  {
    slug: 'iceland', name: 'Iceland', country: 'Iceland', region: 'Europe & Alps',
    tagline: 'Waterfalls by midnight sun, aurora by winter.',
    blurb: 'Along the south coast, black sand beaches, glacier lagoons and sixty-metre waterfalls sit an easy drive apart. In winter the sky may put on the best show of all.',
    lat: 63.616, lon: -19.989, bestMonths: [5, 6, 7, 8, 1, 2],
    seasonNote: 'June to September for long days, February and March for aurora with more daylight.',
    airport: 'Keflavík (KEF)', currency: 'Króna', language: 'Icelandic, English', utc: 'UTC+0',
  },
  {
    slug: 'maldives', name: 'Maldives', country: 'Maldives', region: 'Indian Ocean',
    tagline: 'More water than land, and all of it glass.',
    blurb: 'Twenty-six coral atolls strung across the equator, almost none of it more than two metres above the sea. Baa Atoll is a UNESCO Biosphere Reserve and one of the best places on Earth to swim with manta rays.',
    lat: 5.1, lon: 73.07, film: 'hero-seaplane', bestMonths: [0, 1, 2, 3, 11],
    seasonNote: 'December to April is the dry season. Baa Atoll\'s mantas peak from June to November.',
    airport: 'Velana, Malé (MLE)', currency: 'Rufiyaa', language: 'Dhivehi, English', utc: 'UTC+5',
  },
  {
    slug: 'seychelles', name: 'Seychelles', country: 'Seychelles', region: 'Indian Ocean',
    tagline: 'Granite boulders on powder-white sand.',
    blurb: 'On La Digue, ox carts and bicycles still outnumber cars, and Anse Source d\'Argent\'s sculpted granite looks hand-placed. Praslin\'s Vallée de Mai shelters the giant coco de mer palm.',
    lat: -4.359, lon: 55.839, bestMonths: [3, 4, 9, 10],
    seasonNote: 'April, May, October and November bring calm seas between the trade winds.',
    airport: 'Mahé (SEZ)', currency: 'Seychellois rupee', language: 'Seychellois Creole, English, French', utc: 'UTC+4', unesco: 'Vallée de Mai listed in 1983',
  },
  {
    slug: 'bali', name: 'Bali', country: 'Indonesia', region: 'Asia & Pacific',
    tagline: 'Temples, terraces and the smell of clove.',
    blurb: 'The subak rice terraces around Ubud are still run by a thousand-year-old water-sharing system, and the Uluwatu cliffs drop straight into surf. Go inland first; the coast will wait.',
    lat: -8.275, lon: 115.166, film: 'rice-terraces', bestMonths: [4, 5, 6, 7, 8],
    seasonNote: 'May to September is dry, with cooler evenings in the highlands.',
    airport: 'Ngurah Rai, Denpasar (DPS)', currency: 'Rupiah', language: 'Indonesian, Balinese', utc: 'UTC+8', unesco: 'Subak landscape listed in 2012',
  },
  {
    slug: 'krabi', name: 'Krabi', country: 'Thailand', region: 'Asia & Pacific',
    tagline: 'Limestone karsts rising straight out of the sea.',
    blurb: 'Railay can only be reached by boat, and the Hong Islands hide lagoons inside their cliffs. Long-tail skippers know which channel opens at which tide, which is the whole trick to having them to yourself.',
    lat: 8.012, lon: 98.838, bestMonths: [10, 11, 0, 1, 2, 3],
    seasonNote: 'November to April brings calm seas and clear water.',
    airport: 'Krabi (KBV)', currency: 'Baht', language: 'Thai', utc: 'UTC+7',
  },
  {
    slug: 'kyoto', name: 'Kyoto', country: 'Japan', region: 'Asia & Pacific',
    tagline: 'Wooden streets beneath a five-storey pagoda.',
    blurb: 'Japan\'s capital for more than a thousand years, with seventeen sites on the World Heritage list. Walk Higashiyama or the Arashiyama bamboo grove before the shops open and the lanes are nearly empty.',
    lat: 34.999, lon: 135.779, bestMonths: [2, 3, 9, 10],
    seasonNote: 'Late March for cherry blossom, November for the maples.',
    airport: 'Kansai (KIX)', currency: 'Yen', language: 'Japanese', utc: 'UTC+9', unesco: 'World Heritage Site since 1994',
  },
  {
    slug: 'bora-bora', name: 'Bora Bora', country: 'French Polynesia', region: 'Asia & Pacific',
    tagline: 'A green peak inside a ring of turquoise.',
    blurb: 'Mount Otemanu rises from the centre of a lagoon edged by sandy motu islets. Overwater bungalows look across the shallows, where rays and blacktip reef sharks glide past.',
    lat: -16.5, lon: -151.741, bestMonths: [4, 5, 6, 7, 8, 9],
    seasonNote: 'May to October is the dry season, with trade winds keeping it fresh.',
    airport: 'Bora Bora (BOB), via Tahiti (PPT)', currency: 'CFP franc', language: 'French, Tahitian', utc: 'UTC−10',
  },
  {
    slug: 'cappadocia', name: 'Cappadocia', country: 'Türkiye', region: 'Africa & Middle East',
    tagline: 'A hundred balloons over a stone forest.',
    blurb: 'Volcanic ash eroded into the fairy chimneys of Göreme, and people have carved homes and churches into them since Byzantine times. Sleep in a cave and be up before sunrise for the launch.',
    lat: 38.643, lon: 34.828, film: 'hero-balloons', bestMonths: [3, 4, 5, 8, 9],
    seasonNote: 'April to June and September to October offer the steadiest balloon weather.',
    airport: 'Kayseri (ASR) or Nevşehir (NAV)', currency: 'Lira', language: 'Turkish', utc: 'UTC+3', unesco: 'World Heritage Site since 1985',
  },
  {
    slug: 'dubai', name: 'Dubai', country: 'United Arab Emirates', region: 'Africa & Middle East',
    tagline: 'Desert dunes an hour from the tallest tower.',
    blurb: 'The 828 metre Burj Khalifa, the old creek with its wooden abra boats, and red dunes where camps light up after dark. Winter here is warm, dry and endlessly sunny.',
    lat: 25.197, lon: 55.274, film: 'dubai-night', bestMonths: [10, 11, 0, 1, 2],
    seasonNote: 'November to March is warm and dry. Summer is very hot.',
    airport: 'Dubai International (DXB)', currency: 'Dirham', language: 'Arabic, English', utc: 'UTC+4',
  },
  {
    slug: 'marrakech', name: 'Marrakech', country: 'Morocco', region: 'Africa & Middle East',
    tagline: 'Zellige courtyards with the Atlas on the horizon.',
    blurb: 'Behind the plain walls of the medina, riads open onto fountains and hand-cut tile. An hour south, the Agafay stone desert and the High Atlas change the subject entirely.',
    lat: 31.63, lon: -7.989, bestMonths: [2, 3, 4, 8, 9, 10],
    seasonNote: 'Spring and autumn are warm and dry, with snow still on the Atlas in March.',
    airport: 'Menara (RAK)', currency: 'Dirham', language: 'Arabic, Tamazight, French', utc: 'UTC+1', unesco: 'Medina listed in 1985',
  },
  {
    slug: 'serengeti', name: 'Serengeti', country: 'Tanzania', region: 'Africa & Middle East',
    tagline: 'Where a million wildebeest keep moving.',
    blurb: 'The Great Migration circles the Serengeti and Maasai Mara all year, following the rain. Plan around the herds: calving in the south early in the year, river crossings in the north from July.',
    lat: -2.333, lon: 34.833, bestMonths: [0, 1, 5, 6, 7, 8, 9],
    seasonNote: 'June to October for dry-season game viewing, January and February for calving.',
    airport: 'Kilimanjaro (JRO)', currency: 'Shilling', language: 'Swahili, English', utc: 'UTC+3', unesco: 'World Heritage Site since 1981',
  },
  {
    slug: 'cape-town', name: 'Cape Town', country: 'South Africa', region: 'Africa & Middle East',
    tagline: 'A flat-topped mountain between two oceans.',
    blurb: 'Table Mountain rises straight behind the city, with Camps Bay\'s beaches on one side and the Constantia vineyards on the other. Penguins nest at Boulders Beach, half an hour down the coast.',
    lat: -33.925, lon: 18.424, bestMonths: [10, 11, 0, 1, 2],
    seasonNote: 'November to March is dry and sunny, the best time for the mountain and the beaches.',
    airport: 'Cape Town (CPT)', currency: 'Rand', language: 'English, Afrikaans, Xhosa', utc: 'UTC+2', unesco: 'Cape Floral Region listed in 2004',
  },
  {
    slug: 'tulum', name: 'Tulum', country: 'Mexico', region: 'Americas',
    tagline: 'Maya ruins above a Caribbean beach.',
    blurb: 'The walled Maya city of Tulum stands on a cliff above the sea, and the jungle behind it is pocked with cenotes, freshwater sinkholes clear enough to see the bottom. Sian Ka\'an reserve starts just south.',
    lat: 20.211, lon: -87.465, bestMonths: [11, 0, 1, 2, 3],
    seasonNote: 'December to April is dry and breezy, before the summer heat and rains.',
    airport: 'Tulum (TQO) or Cancún (CUN)', currency: 'Peso', language: 'Spanish', utc: 'UTC−5', unesco: 'Sian Ka\'an listed in 1987',
  },
  {
    slug: 'banff', name: 'Banff', country: 'Canada', region: 'Americas',
    tagline: 'Glacier lakes the colour of a gemstone.',
    blurb: 'Canada\'s first national park, founded in 1885. Moraine Lake and Lake Louise glow turquoise from glacial flour, and the Icefields Parkway is one of the great drives on Earth.',
    lat: 51.178, lon: -115.571, bestMonths: [5, 6, 7, 8, 0, 1],
    seasonNote: 'June to September for lakes and hiking, January and February for skiing.',
    airport: 'Calgary (YYC)', currency: 'Canadian dollar', language: 'English', utc: 'UTC−7', unesco: 'Canadian Rocky Mountain Parks listed in 1984',
  },
]

export const destinations: Destination[] = spec.map((d) => ({
  ...d,
  images: [1, 2, 3].map((n) => `${d.slug}-${n}`) as ImageName[],
}))

export const destinationBySlug = (slug: string) => destinations.find((d) => d.slug === slug)

/** "Venice, Italy", but just "Maldives" where the place and the country share a name. */
export const placeName = (d: Destination) => (d.name === d.country ? d.name : `${d.name}, ${d.country}`)
