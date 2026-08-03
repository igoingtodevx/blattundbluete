import type { ChatChoice, ChatChoiceKey } from "../types.js";

const choiceSets: Record<ChatChoiceKey, ChatChoice[]> = {
  occasion: [
    { key: "occasion", value: "geburtstag", label: "Geburtstag" },
    { key: "occasion", value: "liebe", label: "Liebe & Date" },
    { key: "occasion", value: "dankeschön", label: "Dankeschön" },
    { key: "occasion", value: "trauer", label: "Trauer" },
    { key: "occasion", value: "hochzeit", label: "Hochzeit & Feier" }
  ],
  budget: [
    { key: "budget", value: "bis-15", label: "Bis 15 €" },
    { key: "budget", value: "16-25", label: "16–25 €" },
    { key: "budget", value: "26-40", label: "26–40 €" },
    { key: "budget", value: "41-60", label: "41–60 €" },
    { key: "budget", value: "60-plus", label: "Über 60 €" }
  ],
  style: [
    { key: "style", value: "natuerlich", label: "Natürlich & locker" },
    { key: "style", value: "romantisch", label: "Romantisch" },
    { key: "style", value: "bunt", label: "Bunt & fröhlich" },
    { key: "style", value: "ruhig", label: "Ruhig & elegant" }
  ],
  color: [
    { key: "color", value: "rose", label: "Rosé & Apricot" },
    { key: "color", value: "weiss", label: "Weiß & Creme" },
    { key: "color", value: "bunt", label: "Bunt" },
    { key: "color", value: "frei", label: "Überrasch mich" }
  ],
  pickup: [
    { key: "pickup", value: "heute", label: "Heute noch" },
    { key: "pickup", value: "morgen", label: "Morgen" },
    { key: "pickup", value: "spaeter", label: "Noch offen" }
  ]
};

export const getChatChoices = (key: ChatChoiceKey | null | undefined) =>
  key ? choiceSets[key] : [];
