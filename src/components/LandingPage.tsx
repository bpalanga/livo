import React, { useState, useEffect } from 'react';
import { Home, Search, MessageSquare, ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
}

interface ShowcaseListing {
  id: number | string;
  title: string;
  price: number;
  location: string;
  imageUrl?: string;
}

// Shown if the database has no listings yet, so the landing page never looks empty
// on a fresh install.
const FALLBACK_LISTINGS: ShowcaseListing[] = [
  { id: 'f1', title: 'Modern Studio Apartment', price: 450, location: 'Kilimani, Nairobi', imageUrl: 'https://picsum.photos/seed/landing1/900/600' },
  { id: 'f2', title: 'Cozy 2-Bedroom Home', price: 720, location: 'Kitwe, Zambia', imageUrl: 'https://picsum.photos/seed/landing2/900/600' },
  { id: 'f3', title: 'Lakeview Family House', price: 980, location: 'Lusaka, Zambia', imageUrl: 'https://picsum.photos/seed/landing3/900/600' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [listings, setListings] = useState<ShowcaseListing[]>(FALLBACK_LISTINGS);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data: ShowcaseListing[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setListings(data.slice(0, 6));
        }
      })
      .catch(() => {
        // Keep the fallback listings — the landing page should never break
        // just because the API isn't reachable yet.
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % listings.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [listings.length]);

  const current = listings[index] || FALLBACK_LISTINGS[0];

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-2 rounded-xl">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Livo</span>
        </div>
        <button
          onClick={onGetStarted}
          className="px-5 py-2 rounded-xl border border-brand-600 text-brand-700 font-medium hover:bg-brand-50 transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-8 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: copy + CTA */}
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
            Find your next home, <span className="text-brand-600">without the hassle.</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-md">
            Browse verified listings, message agents directly, and manage the entire rental process — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Value props */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="bg-brand-100 p-2 rounded-lg shrink-0">
                <Search className="w-5 h-5 text-brand-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Verified Listings</p>
                <p className="text-xs text-gray-500 mt-0.5">Real properties from real agents</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-100 p-2 rounded-lg shrink-0">
                <MessageSquare className="w-5 h-5 text-brand-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Direct Messaging</p>
                <p className="text-xs text-gray-500 mt-0.5">Chat with agents in-app</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-brand-100 p-2 rounded-lg shrink-0">
                <ShieldCheck className="w-5 h-5 text-brand-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Secure by Design</p>
                <p className="text-xs text-gray-500 mt-0.5">Your data stays protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: animated listing showcase */}
        <div className="relative h-[420px] sm:h-[480px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-black/5"
            >
              <img
                src={current.imageUrl || `https://picsum.photos/seed/${current.id}/900/600`}
                alt={current.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-2xl font-bold">${current.price}<span className="text-sm font-normal">/mo</span></p>
                <p className="text-lg font-semibold mt-1">{current.title}</p>
                <p className="flex items-center gap-1 text-sm text-white/80 mt-1">
                  <MapPin className="w-4 h-4" /> {current.location}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
            {listings.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setIndex(i)}
                aria-label={`Show listing ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-brand-600' : 'w-1.5 bg-brand-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
