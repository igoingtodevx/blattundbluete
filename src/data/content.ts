export interface KnowledgeArticle {
  id: string;
  title: string;
  summary: string;
  steps: string[];
}

export interface FaqItem {
  id: string;
  before: string;
  keyword: string;
  after: string;
  answer: string;
  steps?: string[];
}

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "cut",
    title: "Frisch anschneiden",
    summary:
      "Saubere Schnittflächen helfen den Stielen, wieder zuverlässig Wasser aufzunehmen.",
    steps: [
      "Ein scharfes, sauberes Messer oder eine saubere Gartenschere verwenden.",
      "Die Stiele zwei bis drei Zentimeter schräg anschneiden.",
      "Gequetschte oder weiche Stielenden großzügig entfernen."
    ]
  },
  {
    id: "vase",
    title: "Vase & Wasser",
    summary:
      "Eine saubere, passende Vase und regelmäßiger Wasserwechsel sind die beste Grundlage.",
    steps: [
      "Die Vase gründlich spülen.",
      "Blätter unterhalb der Wasserlinie entfernen.",
      "Wasser täglich prüfen und spätestens nach zwei Tagen wechseln."
    ]
  },
  {
    id: "place",
    title: "Der richtige Platz",
    summary:
      "Kühler und ruhig ist meist besser als direkt in Sonne, Heizungsluft oder Zugluft.",
    steps: [
      "Nicht direkt an ein sonniges Fenster stellen.",
      "Abstand zu Heizung und Obstschale halten.",
      "Nachts darf der Strauß gern etwas kühler stehen."
    ]
  },
  {
    id: "expectations",
    title: "Haltbarkeit realistisch sehen",
    summary:
      "Blumen sind Naturprodukte. Sorte, Reifegrad, Raumtemperatur und Pflege wirken zusammen.",
    steps: [
      "Welke Einzelblüten vorsichtig entfernen.",
      "Wasserstand und Stiele täglich kontrollieren.",
      "Bei Unsicherheit gern kurz im Laden nachfragen."
    ]
  }
];

export const occasions = [
  {
    title: "Geburtstag",
    text: "Fröhlich, farbig oder bewusst ruhig – passend zur Person."
  },
  {
    title: "Hochzeit",
    text: "Frühzeitig und persönlich über Stil, Menge, Termin und Budget sprechen."
  },
  {
    title: "Date",
    text: "Eine kleine, ehrliche Geste ist oft schöner als eine übergroße Inszenierung."
  },
  {
    title: "Mutter & Oma",
    text: "Vorlieben zählen mehr als Rollenbilder: Lieblingsfarbe oder Lieblingsblume helfen."
  },
  {
    title: "Dankeschön",
    text: "Ein handlicher Strauß, der sich unkompliziert mitnehmen lässt."
  },
  {
    title: "Trost",
    text: "Zurückhaltend, mitfühlend und ohne unpassende große Worte."
  }
];

export const faqItems: FaqItem[] = [
  {
    id: "water",
    before: "Wie oft wechsle ich das ",
    keyword: "Wasser",
    after: "?",
    answer:
      "Am besten täglich prüfen und spätestens alle ein bis zwei Tage vollständig wechseln.",
    steps: [
      "Altes Wasser vollständig ausleeren.",
      "Vase kurz ausspülen.",
      "Mit frischem, nicht eiskaltem Wasser auffüllen.",
      "Stiele bei Bedarf erneut anschneiden."
    ]
  },
  {
    id: "birthday",
    before: "Welche ",
    keyword: "Blumen zum Geburtstag",
    after: " passen gut?",
    answer:
      "Die Lieblingsfarben und der persönliche Stil sind wichtiger als eine feste Regel. Bunte Saisonblumen wirken fröhlich, zarte Ton-in-Ton-Sträuße eher ruhig."
  },
  {
    id: "call",
    before: "Wann sollte ich einen ",
    keyword: "Floristik-Wunsch telefonisch",
    after: " besprechen?",
    answer:
      "Bei Hochzeiten, größeren Tischdekorationen, ungewöhnlichen Blumenwünschen, engem Termin oder einem festen Budget lohnt sich ein kurzes Gespräch."
  },
  {
    id: "seasonal",
    before: "Was ist gerade ",
    keyword: "saisonal",
    after: "?",
    answer:
      "Das wechselt laufend und hängt vom aktuellen Einkauf ab. Der Demo-Bestand auf dieser Website ist keine Live-Auskunft – bitte für einen bestimmten Wunsch kurz anrufen."
  },
  {
    id: "sun",
    before: "Darf der Strauß in die ",
    keyword: "direkte Sonne",
    after: "?",
    answer:
      "Ein heller Standort ist schön, direkte Sonne und Heizungswärme lassen viele Schnittblumen aber schneller Wasser verlieren."
  },
  {
    id: "preference",
    before: "Welche Blumen eignen sich für meine ",
    keyword: "Freundin",
    after: "?",
    answer:
      "Am besten die Blumen, Farben und Formen, die sie persönlich mag. Wenn Sie uns ein paar Hinweise geben, stellen wir gern etwas Passendes zusammen – ohne Klischees."
  }
];

export const ageingNotes = [
  {
    title: "Blüten öffnen sich",
    text: "Manche Blüten zeigen erst später ihre ganze Form oder wirken etwas blasser."
  },
  {
    title: "Blätter verändern sich",
    text: "Einzelne Blätter können welken und werden vor dem Verkauf aussortiert."
  },
  {
    title: "Stiele werden weicher",
    text: "Der Zustand wird im Laden geprüft und kann je Produkt unterschiedlich sein."
  },
  {
    title: "Trocknen kann passen",
    text: "Einige Sorten eignen sich später für Trockenfloristik – aber längst nicht alle."
  },
  {
    title: "Ehrlich ausgewählt",
    text: "Stark beschädigte oder unhygienische Ware wird nicht angeboten."
  }
];
