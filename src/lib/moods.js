// Custom mood set for diary entries. Using our own SVG icons (not native
// emoji) keeps moods looking identical on every device — Samsung, iPhone, web —
// and matches Kaban's clean line-art style.
//
// Each mood has: id (stored value), label, an accent color, and a `face`
// describing the mouth/brow so the MoodIcon component can draw it.

export const MOODS = [
  { id: 'great', label: 'Great', color: '#059669' }, // wide smile
  { id: 'good', label: 'Good', color: '#0891b2' }, // soft smile
  { id: 'okay', label: 'Okay', color: '#64748b' }, // neutral
  { id: 'down', label: 'Down', color: '#7c3aed' }, // slight frown
  { id: 'stressed', label: 'Stressed', color: '#dc2626' }, // tense
  { id: 'tired', label: 'Tired', color: '#d97706' }, // sleepy
];

export function moodById(id) {
  return MOODS.find((m) => m.id === id) || null;
}
