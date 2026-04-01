import React from 'react';
import { Play, Dumbbell, Users, TrendingDown, ArrowRight } from 'lucide-react';
import { videos as allVideos } from '../data/youtube.js';
import homepageHeroVideoData from '../data/homepageHeroVideo.json';
import { isLiveVideo, selectFeaturedVideo } from '../lib/videoMeta.js';

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
      { name: 'Speediance User', description: '1,000,000+ lbs lifted. The definitive independent Speediance resource.' },
      { name: 'BJJ Insight', description: 'Thoughtful commentary on grappling culture and match analysis.' },
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
      { name: 'Usuario Speediance', description: 'Más de 1,000,000 lbs levantadas. El recurso independiente definitivo de Speediance.' },
      { name: 'Análisis BJJ', description: 'Comentarios reflexivos sobre la cultura del grappling y análisis de combates.' },
      { name: 'Transformación', description: '242 → 188 lbs. Números reales, progreso documentado.' },
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
      { name: 'Speediance-Nutzer', description: 'Über 1.000.000 lbs gehoben. Die definitive unabhängige Speediance-Ressource.' },
      { name: 'BJJ-Einblicke', description: 'Durchdachte Kommentare zu Grappling-Kultur und Kampfanalysen.' },
      { name: 'Transformation', description: '242 → 188 lbs. Echte Zahlen, dokumentierter Fortschritt.' },
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
      { name: 'Usuário Speediance', description: 'Mais de 1.000.000 lbs levantadas. O recurso independente definitivo sobre Speediance.' },
      { name: 'Análise BJJ', description: 'Comentários reflexivos sobre cultura de grappling e análise de lutas.' },
      { name: 'Transformação', description: '242 → 188 lbs. Números reais, progresso documentado.' },
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
      { name: 'Speediance उपयोगकर्ता', description: '10 लाख+ lbs उठाए। Speediance का निश्चित स्वतंत्र संसाधन।' },
      { name: 'BJJ विश्लेषण', description: 'ग्रैपलिंग संस्कृति और मैच विश्लेषण पर विचारशील टिप्पणी।' },
      { name: 'ट्रांसफ़ॉर्मेशन', description: '242 → 188 lbs. असली नंबर, प्रलेखित प्रगति।' },
    ],
  },
};

export default function Hero({ lang = 'en' }) {
  const l = t[lang] || t.en;
  // Homepage hero is pinned to a generated latest long-form upload when available.
  const featuredVideo = homepageHeroVideoData?.video ?? selectFeaturedVideo(allVideos);
  const featuredVideoIsLive = isLiveVideo(featuredVideo);
  const featuredVideoHref = featuredVideo ? `/video/${featuredVideo.id}/` : '/videos/';

  const pillarIcons = [Dumbbell, Users, TrendingDown];
  const pillarHrefs = ['/videos?category=speediance', '/videos?category=bjj', '/about/'];
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
          {featuredVideoIsLive ? (
            <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-500/30 px-4 py-1.5 rounded-full text-red-300 text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {l.liveStream}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-300 text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              {l.featuredVideo}
            </div>
          )}

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            {l.heading1}<br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{l.heading2}</span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
            {l.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <a href={featuredVideoHref} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-900/50">
              <Play size={20} fill="currentColor" /> {featuredVideoIsLive ? l.liveStream : l.watchFeatured}
            </a>
            <a href="/about/" className="px-8 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-full transition-all hover:border-neutral-600 font-medium flex items-center gap-2">
              {l.aboutMe} <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Featured Video Card */}
        {featuredVideo && (
            <a href={featuredVideoHref} className="flex-1 w-full max-w-xl relative group block">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-800">
                <img src={featuredVideo.thumbnail} alt={featuredVideo.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500" loading="lazy" />
                {featuredVideoIsLive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Live Feb 19 · 6:30 PM ET
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{l.featured}</span>
                    <h3 className="text-xl font-bold text-white mb-1">{featuredVideo.title}</h3>
                    <p className="text-sm text-neutral-300 line-clamp-1">{featuredVideo.description?.slice(0, 80)}...</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/30 hover:scale-110 transition-transform">
                    <Play size={32} fill="white" className="text-white ml-1" />
                    </div>
                </div>
                </div>
            </div>
            </a>
        )}
      </div>

      {/* Pillars Section */}
      <div className="container mx-auto px-4 mt-10 md:mt-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <a key={pillar.name} href={pillar.href} className="group relative bg-neutral-900/50 border border-neutral-800 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-300 hover:bg-neutral-800/50">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                  <pillar.icon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{pillar.name}</h3>
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
