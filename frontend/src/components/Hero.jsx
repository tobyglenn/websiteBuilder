import React from 'react';
import { ArrowRight, BookOpen, Dumbbell, Play, TrendingDown, Users } from 'lucide-react';

const t = {
  en: {
    heading1: 'Serious fitness,',
    heading2: 'real results, zero hype',
    subtitle: "For the person who's done with performance and ready for actual progress.",
    liveStream: 'Upcoming Live Stream',
    featuredVideo: 'Featured Video',
    watchFeatured: 'Watch Featured',
    aboutMe: 'About Me',
    featured: 'FEATURED',
    pillars: [
      {
        name: 'Speediance User',
        description: '1,000,000+ lbs lifted. The definitive independent Speediance resource.',
      },
      {
        name: 'BJJ Insight',
        description: 'Thoughtful commentary on grappling culture and match analysis.',
      },
      { name: 'Transformation', description: '242 → 188 lbs. Real numbers, documented progress.' },
    ],
  },
  es: {
    heading1: 'Fitness serio,',
    heading2: 'resultados reales, cero humo',
    subtitle: 'Para quien ya dejó el show y quiere progreso real.',
    liveStream: 'Transmisión en vivo próxima',
    featuredVideo: 'Video destacado',
    watchFeatured: 'Ver destacado',
    aboutMe: 'Sobre mí',
    featured: 'DESTACADO',
    pillars: [
      {
        name: 'Usuario Speediance',
        description:
          'Más de 1,000,000 lbs levantadas. El recurso independiente definitivo de Speediance.',
      },
      {
        name: 'Análisis BJJ',
        description:
          'Comentarios reflexivos sobre la cultura del grappling y análisis de combates.',
      },
      {
        name: 'Transformación',
        description: '242 → 188 lbs. Números reales, progreso documentado.',
      },
    ],
  },
  de: {
    heading1: 'Ernsthaftes Fitness,',
    heading2: 'echte Ergebnisse, null Hype',
    subtitle: 'Für alle, die Show satt haben und echten Fortschritt wollen.',
    liveStream: 'Kommender Livestream',
    featuredVideo: 'Empfohlenes Video',
    watchFeatured: 'Empfohlenes ansehen',
    aboutMe: 'Über mich',
    featured: 'EMPFOHLEN',
    pillars: [
      {
        name: 'Speediance-Nutzer',
        description: 'Über 1.000.000 lbs gehoben. Die definitive unabhängige Speediance-Ressource.',
      },
      {
        name: 'BJJ-Einblicke',
        description: 'Durchdachte Kommentare zu Grappling-Kultur und Kampfanalysen.',
      },
      {
        name: 'Transformation',
        description: '242 → 188 lbs. Echte Zahlen, dokumentierter Fortschritt.',
      },
    ],
  },
  pt: {
    heading1: 'Fitness sério,',
    heading2: 'resultados reais, zero hype',
    subtitle: 'Para quem já cansou de show e quer progresso de verdade.',
    liveStream: 'Live em breve',
    featuredVideo: 'Vídeo em destaque',
    watchFeatured: 'Ver destaque',
    aboutMe: 'Sobre mim',
    featured: 'DESTAQUE',
    pillars: [
      {
        name: 'Usuário Speediance',
        description:
          'Mais de 1.000.000 lbs levantadas. O recurso independente definitivo sobre Speediance.',
      },
      {
        name: 'Análise BJJ',
        description: 'Comentários reflexivos sobre cultura de grappling e análise de lutas.',
      },
      {
        name: 'Transformação',
        description: '242 → 188 lbs. Números reais, progresso documentado.',
      },
    ],
  },
  hi: {
    heading1: 'गंभीर फिटनेस,',
    heading2: 'असली नतीजे, शून्य हाइप',
    subtitle: 'उन लोगों के लिए जो दिखावा छोड़कर असली प्रगति चाहते हैं।',
    liveStream: 'आगामी लाइव स्ट्रीम',
    featuredVideo: 'फ़ीचर्ड वीडियो',
    watchFeatured: 'फ़ीचर्ड देखें',
    aboutMe: 'मेरे बारे में',
    featured: 'फ़ीचर्ड',
    pillars: [
      {
        name: 'Speediance उपयोगकर्ता',
        description: '10 लाख+ lbs उठाए। Speediance का निश्चित स्वतंत्र संसाधन।',
      },
      {
        name: 'BJJ विश्लेषण',
        description: 'ग्रैपलिंग संस्कृति और मैच विश्लेषण पर विचारशील टिप्पणी।',
      },
      { name: 'ट्रांसफ़ॉर्मेशन', description: '242 → 188 lbs. असली नंबर, प्रलेखित प्रगति।' },
    ],
  },
};

const weeklyLabels = {
  en: {
    eyebrow: "This week's pick",
    cta: 'Read this week’s pick',
    latest: 'Watch my latest video',
    note: 'One useful read from my archive, changing every week.',
  },
  de: {
    eyebrow: 'Tipp der Woche',
    cta: 'Tipp der Woche lesen',
    latest: 'Mein neuestes Video ansehen',
    note: 'Ein hilfreicher Artikel aus meinem Archiv, jede Woche neu ausgewählt.',
  },
  es: {
    eyebrow: 'La selección de esta semana',
    cta: 'Leer la selección semanal',
    latest: 'Ver mi último video',
    note: 'Una lectura útil de mi archivo, diferente cada semana.',
  },
  pt: {
    eyebrow: 'A escolha desta semana',
    cta: 'Ler a escolha da semana',
    latest: 'Ver meu vídeo mais recente',
    note: 'Uma leitura útil do meu arquivo, diferente a cada semana.',
  },
  hi: {
    eyebrow: 'इस हफ़्ते की पसंद',
    cta: 'इस हफ़्ते की पसंद पढ़ें',
    latest: 'मेरा नवीनतम वीडियो देखें',
    note: 'मेरे संग्रह से एक उपयोगी लेख, हर हफ़्ते बदलता है।',
  },
};

export default function Hero({ lang = 'en', feature, latestVideo }) {
  const l = t[lang] || t.en;
  const labels = weeklyLabels[lang] || weeklyLabels.en;

  const pillarIcons = [Dumbbell, Users, TrendingDown];
  const pillarHrefs = ['/videos/#speediance', '/videos/#bjj', '/about/'];
  const pillars = l.pillars.map((p, i) => ({ ...p, icon: pillarIcons[i], href: pillarHrefs[i] }));

  return (
    <section className="relative overflow-hidden bg-neutral-950 pt-24 pb-16 md:pt-36 md:pb-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-300 text-sm font-semibold mb-6">
            <BookOpen size={15} aria-hidden="true" />
            {labels.eyebrow}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            {l.heading1}
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {l.heading2}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
            {l.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start flex-wrap">
            <a
              href={feature.href}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-900/50"
              data-analytics-event="content_card_click"
              data-analytics-content-type="blog"
              data-analytics-position="homepage_weekly_pick"
              data-analytics-content-slug={feature.slug}
              data-analytics-content-title={feature.title}
              data-analytics-item-position="1"
            >
              <BookOpen size={20} aria-hidden="true" /> {labels.cta}
            </a>
            {latestVideo && (
              <a
                href={latestVideo.href}
                title={latestVideo.title}
                className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-full transition-colors font-medium flex items-center gap-2"
                data-analytics-event="content_card_click"
                data-analytics-content-type="video"
                data-analytics-content-slug={latestVideo.id}
                data-analytics-content-title={latestVideo.title}
                data-analytics-position="homepage_latest_video"
                data-analytics-item-position="3"
              >
                <Play size={18} aria-hidden="true" /> {labels.latest}
              </a>
            )}
            <a
              href="/about/"
              className="px-4 py-3 text-neutral-400 hover:text-white font-medium flex items-center gap-2"
            >
              {l.aboutMe} <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Weekly article, rendered with the same selection in every locale. */}
        <a
          href={feature.href}
          className="flex-1 w-full max-w-xl relative group block"
          aria-label={feature.title}
          data-analytics-event="content_card_click"
          data-analytics-content-type="blog"
          data-analytics-position="homepage_weekly_pick"
          data-analytics-content-slug={feature.slug}
          data-analytics-content-title={feature.title}
          data-analytics-item-position="2"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
          <article
            className="relative rounded-xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800"
            data-weekly-pick={feature.week}
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={feature.image}
                alt={feature.imageAlt}
                width="640"
                height="360"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <div className="p-5 md:p-6">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wide">
                {labels.eyebrow}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-2 mb-3 leading-snug">
                {feature.title}
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed">{feature.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-blue-400 font-semibold text-sm">
                {labels.cta} <ArrowRight size={16} aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs text-neutral-400">{labels.note}</p>
            </div>
          </article>
        </a>
      </div>

      {/* Pillars Section */}
      <div className="container mx-auto px-4 mt-10 md:mt-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <a
              key={pillar.name}
              href={pillar.href}
              className="group relative bg-neutral-900/50 border border-neutral-800 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-300 hover:bg-neutral-800/50"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                  <pillar.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {pillar.name}
                  </h3>
                  <p className="text-sm text-neutral-400">{pillar.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
