import rss from '@astrojs/rss';
import { entries, journalHref } from '../../../lib/gameJournal.mjs';
export function GET() {
  return rss({title:'Building Our Games',description:'Wild Rebellion and Monstrum World: development stories and published updates.',site:'https://tobyonfitnesstech.com',items:entries.map(entry=>({title:entry.title,description:entry.summary,pubDate:new Date(`${entry.date}T12:00:00Z`),link:journalHref(entry)}))});
}
