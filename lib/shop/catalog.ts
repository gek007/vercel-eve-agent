const entries: [string, string, string, number][] = [
  [
    "Audio",
    "Arc wireless headphones",
    "Immersive over-ear listening with active noise cancellation.",
    14900,
  ],
  [
    "Audio",
    "Pebble earbuds",
    "Pocket-sized sound with a comfortable, secure fit.",
    7900,
  ],
  [
    "Audio",
    "Room mini speaker",
    "Warm wireless sound for your favorite corner.",
    5900,
  ],
  [
    "Audio",
    "Studio USB microphone",
    "Clear voice calls and recordings, straight from your desk.",
    8900,
  ],
  [
    "Audio",
    "Loop wired headphones",
    "Everyday listening without another battery to charge.",
    3900,
  ],
  [
    "Audio",
    "Duo speaker set",
    "A balanced stereo pair for music and movies.",
    12900,
  ],
  [
    "Audio",
    "Quiet earplugs",
    "Reusable earplugs for focus and traveling.",
    1900,
  ],
  [
    "Audio",
    "Wave soundbar",
    "Compact desktop sound with an easy volume dial.",
    9900,
  ],
  [
    "Desk",
    "Rise laptop stand",
    "Bring your screen to a more comfortable height.",
    4900,
  ],
  [
    "Desk",
    "Fold monitor riser",
    "A clean workspace with storage under your screen.",
    6500,
  ],
  [
    "Desk",
    "Glow task lamp",
    "Adjustable warm light for focused evenings.",
    5500,
  ],
  [
    "Desk",
    "Grid desk mat",
    "A generous, smooth surface for your daily work.",
    2900,
  ],
  [
    "Desk",
    "Tidy desk organizer",
    "A home for pens, cables, and small essentials.",
    2400,
  ],
  [
    "Desk",
    "Form keyboard",
    "A quiet wireless keyboard with a compact layout.",
    7900,
  ],
  [
    "Desk",
    "Glide wireless mouse",
    "A comfortable everyday mouse with silent clicks.",
    3500,
  ],
  [
    "Desk",
    "Note desk pad",
    "Reusable writing pad for quick thoughts and plans.",
    1800,
  ],
  [
    "Charging",
    "Dock three-in-one charger",
    "One tidy station for your phone, watch, and earbuds.",
    8900,
  ],
  [
    "Charging",
    "Pocket 65W adapter",
    "Compact USB-C power for laptops and phones.",
    4500,
  ],
  [
    "Charging",
    "Link USB-C cable",
    "A durable two-meter cable for charging and data.",
    1500,
  ],
  [
    "Charging",
    "Reserve power bank",
    "10,000mAh portable power for days away.",
    3900,
  ],
  [
    "Charging",
    "Mag wireless pad",
    "An easy place to set down and charge your phone.",
    2900,
  ],
  [
    "Charging",
    "Port desktop charger",
    "Four ports to keep your everyday devices ready.",
    5900,
  ],
  [
    "Charging",
    "Travel plug kit",
    "Adaptable charging plugs for international trips.",
    2500,
  ],
  [
    "Charging",
    "Cable keeper set",
    "Reusable magnetic clips for a less tangled desk.",
    1200,
  ],
  [
    "Accessories",
    "Hub seven-port USB-C",
    "Connect displays, storage, and accessories with one hub.",
    6900,
  ],
  [
    "Accessories",
    "Clear webcam",
    "1080p video with a physical privacy cover.",
    5900,
  ],
  [
    "Accessories",
    "Shield laptop sleeve",
    "Soft, padded protection for a 13–14 inch laptop.",
    3200,
  ],
  [
    "Accessories",
    "Grip phone stand",
    "A stable, adjustable home for your phone.",
    1900,
  ],
  [
    "Accessories",
    "Pocket SSD 1TB",
    "Fast, portable storage in a durable enclosure.",
    11900,
  ],
  [
    "Accessories",
    "Screen care kit",
    "Gentle spray and a soft cloth for everyday screens.",
    1400,
  ],
  [
    "Accessories",
    "Click presenter",
    "A simple wireless remote for your next presentation.",
    2900,
  ],
  [
    "Accessories",
    "Key cable adapter set",
    "The small connectors that make your day easier.",
    2200,
  ],
  [
    "Travel",
    "Daypack commuter bag",
    "A considered everyday bag with a protected laptop pocket.",
    9900,
  ],
  [
    "Travel",
    "Nest tech pouch",
    "Keep your cables and small devices in one place.",
    3500,
  ],
  [
    "Travel",
    "Roam bottle",
    "An insulated steel bottle for your daily routine.",
    2800,
  ],
  ["Travel", "Rest neck pillow", "Packable comfort for longer journeys.", 3200],
  [
    "Travel",
    "Find luggage tag",
    "A discreet slot for your contact details.",
    1200,
  ],
  [
    "Travel",
    "Fold phone tripod",
    "A pocket-sized stand for calls and photos.",
    2500,
  ],
  [
    "Travel",
    "Pack packing cubes",
    "Three lightweight organizers for easier packing.",
    2900,
  ],
  [
    "Travel",
    "Pocket notebook trio",
    "Keep ideas close, wherever the day takes you.",
    1500,
  ],
];
export const shopCatalog = entries.map(
  ([category, name, description, priceCents], i) => ({
    sku: `CC-${String(i + 1).padStart(3, "0")}`,
    name,
    description,
    category,
    priceCents,
    visual: /headphone|earbud|earplug/.test(name)
      ? "headphones"
      : /speaker|soundbar|microphone/.test(name)
        ? "speaker"
        : /keyboard|pad|notebook/.test(name)
          ? "keyboard"
          : /lamp/.test(name)
            ? "lamp"
            : /charg|adapter|cable|power|plug/.test(name)
              ? "charger"
              : /bag|pouch|sleeve|cube|pillow/.test(name)
                ? "bag"
                : /mouse/.test(name)
                  ? "mouse"
                  : "stand",
    active: true,
  }),
);
