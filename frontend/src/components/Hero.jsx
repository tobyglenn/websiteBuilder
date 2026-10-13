import React from 'react';
import { ArrowRight } from 'lucide-react';

const copy = {
  en: {title:'Fitness tech. Real experience.', intro:'Independent reviews of smart gyms, wearables and the training behind them.', gyms:'Compare smart gyms', wearables:'Compare wearables', reviews:'Latest reviews', pick:'This week’s pick', read:'Read the review'},
  es: {title:'Tecnología fitness. Experiencia real.', intro:'Análisis independientes de gimnasios inteligentes, wearables y el entrenamiento con ellos.', gyms:'Comparar gimnasios', wearables:'Comparar wearables', reviews:'Últimos análisis', pick:'La selección de esta semana', read:'Leer el análisis'},
  de: {title:'Fitness-Technik. Echte Erfahrung.', intro:'Unabhängige Tests von smarten Heimstudios, Wearables und dem Training damit.', gyms:'Heimstudios vergleichen', wearables:'Wearables vergleichen', reviews:'Aktuelle Tests', pick:'Tipp der Woche', read:'Test lesen'},
  pt: {title:'Tecnologia fitness. Experiência real.', intro:'Análises independentes de academias inteligentes, wearables e do treino com eles.', gyms:'Comparar academias', wearables:'Comparar wearables', reviews:'Análises recentes', pick:'A escolha desta semana', read:'Ler a análise'},
  hi: {title:'फिटनेस तकनीक। असली अनुभव।', intro:'स्मार्ट होम जिम, वियरेबल और उनके साथ प्रशिक्षण की स्वतंत्र समीक्षाएँ।', gyms:'स्मार्ट जिम की तुलना', wearables:'वियरेबल की तुलना', reviews:'नई समीक्षाएँ', pick:'इस हफ़्ते की पसंद', read:'समीक्षा पढ़ें'},
};

export default function Hero({lang='en', feature}) {
  const t=copy[lang] || copy.en;
  const prefix=lang==='en'?'':`/${lang}`;
  return <section className="home-intro" data-page-intro data-homepage-section="hero" data-homepage-title="Compact introduction and weekly pick" data-homepage-purpose="orientation" data-homepage-layout-version="compact-2026-10-13">
    <div className="home-intro-grid">
      <div className="home-intro-copy">
        <h1 data-page-title>{t.title}</h1>
        <p>{t.intro}</p>
        <nav className="home-intro-links" aria-label={t.title}>
          <a className="home-compare-link" href={`${prefix}/compare/`} data-analytics-event="content_card_click" data-analytics-content-type="comparison" data-analytics-content-slug="gym" data-analytics-position="homepage_intro">{t.gyms} <ArrowRight size={16} aria-hidden="true" /></a>
          <a className="home-compare-link" href={`${prefix}/compare/#wearables`} data-analytics-event="content_card_click" data-analytics-content-type="comparison" data-analytics-content-slug="wearables" data-analytics-position="homepage_intro">{t.wearables} <ArrowRight size={16} aria-hidden="true" /></a>
        </nav>
      </div>
      <a href={feature.href} className="weekly-pick-card" aria-label={`${t.pick}: ${feature.title}`} data-analytics-event="content_card_click" data-analytics-content-type="blog" data-analytics-position="homepage_weekly_pick" data-analytics-content-slug={feature.slug} data-analytics-content-title={feature.title} data-analytics-item-position="1">
        <img src={feature.image} alt={feature.imageAlt} width="160" height="120" loading="eager" decoding="async" />
        <article data-weekly-pick={feature.week}>
          <p className="weekly-pick-label">{t.pick}</p>
          <h2>{feature.title}</h2>
          <span>{t.read} <ArrowRight size={14} aria-hidden="true" /></span>
        </article>
      </a>
    </div>
  </section>;
}
