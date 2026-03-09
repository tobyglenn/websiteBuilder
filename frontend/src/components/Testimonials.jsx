import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "This is the most helpful fitness content on YouTube",
    author: "Mike T.",
    context: "YouTube Subscriber"
  },
  {
    quote: "I went from 240 to 195 thanks to your advice",
    author: "Sarah J.",
    context: "Community Member"
  },
  {
    quote: "Best Speediance review I've found - actually shows real workouts",
    author: "Derek M.",
    context: "Speediance Owner"
  },
  {
    quote: "Your transformation story is what got me started",
    author: "Chris P.",
    context: "Viewer"
  },
  {
    quote: "Finally someone honest about weight loss medications",
    author: "Anonymous",
    context: "Community Member"
  },
  {
    quote: "The whoop vs garmin video saved me $200",
    author: "Tom R.",
    context: "YouTube Subscriber"
  },
  {
    quote: "Your BJJ content is incredibly authentic",
    author: "Jiu-Jitsu Fan",
    context: "BJJ Practitioner"
  }
];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getColor(index) {
  const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600', 'bg-cyan-600', 'bg-pink-600'];
  return colors[index % colors.length];
}

export default function Testimonials() {
  return (
    <section className="py-16 bg-neutral-950 border-t border-neutral-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-2 block">Community Voices</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">What People Are Saying</h2>
          <p className="text-neutral-400 mt-3 max-w-xl mx-auto">Feedback from the community I've been lucky enough to build.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-neutral-900 rounded-lg p-4 border border-neutral-800 hover:border-blue-500/50 transition-all"
            >
              <Quote className="w-6 h-6 text-blue-500 mb-3" />
              <p className="text-white text-sm leading-relaxed mb-4">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${getColor(index)} flex items-center justify-center text-white font-bold text-xs`}>
                  {getInitials(testimonial.author)}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{testimonial.author}</div>
                  <div className="text-neutral-500 text-xs">{testimonial.context}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
