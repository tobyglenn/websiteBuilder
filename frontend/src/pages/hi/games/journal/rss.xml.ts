import rss from '@astrojs/rss';
import { entries, journalHref } from '../../../../lib/gameJournal.mjs';
import {translateText} from '../../../../lib/releaseLocale.js';
import messages from '../../../../data/locales/release-hi.json';
export function GET() {
 return rss({title:translateText('Building our games.',messages),description:translateText('Wild Rebellion and Monstrum World: creation stories, gameplay, and published release updates.',messages),site:'https://tobyonfitnesstech.com',customData:'<language>hi</language>',items:entries.map(entry=>({title:translateText(entry.title,messages),description:translateText(entry.summary,messages),pubDate:new Date(`${entry.date}T12:00:00Z`),link:'/hi'+journalHref(entry)}))});
}
