<!DOCTYPE html>
<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Design Tokens | Mandalay Morning Star</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&amp;family=Playfair+Display:ital,wght@0,400..900;1,400..900&amp;family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&amp;family=Padauk:wght@400;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#9B1B1E", // Bold Red from logo
                        "cta": "#F4D03F",     // Bright Gold from logo
                        "curry": "#8B4513",
                        "jade": "#2E8B57",
                        "cream": "#FFFEF7",
                        "charcoal": "#1A1A1A",
                        "border-sep": "#E5E2D9",
                        "background-light": "#FFFEF7",
                        "background-dark": "#1a0505",
                    },
                    fontFamily: {
                        "display": ["Manrope", "sans-serif"],
                        "serif": ["Playfair Display", "serif"],
                        "sans": ["DM Sans", "sans-serif"],
                        "burmese": ["Padauk", "serif"],
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    boxShadow: {
                        'deep-red': '0 20px 25px -5px rgba(74, 14, 14, 0.15), 0 8px 10px -6px rgba(74, 14, 14, 0.15)',
                        'xl-red': '0 25px 50px -12px rgba(74, 14, 14, 0.3)',
                    }
                },
            },
        }
    </script>
<style type="text/tailwindcss">
        :root {
            --primary-red: #9B1B1E;
            --shadow-color: rgba(74, 14, 14, 0.2);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        body {
            font-family: 'DM Sans', sans-serif;
        }
        .token-card {
            background-color: #FFFEF7;
            border: 1px solid #E5E2D9;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -4px var(--shadow-color);
        }
        .token-card:hover {
            box-shadow: 0 20px 25px -5px var(--shadow-color), 0 8px 10px -6px var(--shadow-color);
            transform: translateY(-2px);
        }
        .dark .token-card {
            background-color: #260a0a;
            border-color: #4a0e0e;
        }
    </style>
</head>
<body class="bg-background-light dark:bg-background-dark text-charcoal dark:text-cream min-h-screen">
<header class="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/10 dark:border-primary/20 px-6 lg:px-20 py-4">
<div class="max-w-[1200px] mx-auto flex items-center justify-between">
<div class="flex items-center gap-6">
<div class="flex items-center gap-3">
<div class="text-primary">
<span class="material-symbols-outlined text-3xl font-bold">star_rate</span>
</div>
<h1 class="font-serif text-xl font-bold tracking-tight text-primary">Mandalay Morning Star</h1>
</div>
<nav class="hidden md:flex items-center gap-8 ml-10">
<a class="text-sm font-bold hover:text-primary transition-colors text-charcoal/70 dark:text-cream/70" href="#colors">Colors</a>
<a class="text-sm font-bold hover:text-primary transition-colors text-charcoal/70 dark:text-cream/70" href="#typography">Typography</a>
<a class="text-sm font-bold hover:text-primary transition-colors text-charcoal/70 dark:text-cream/70" href="#components">Components</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="relative hidden sm:block">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 text-sm">search</span>
<input class="pl-10 pr-4 py-2 bg-stone-100 dark:bg-stone-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 w-64" placeholder="Search tokens..." type="text"/>
</div>
<button class="bg-cta text-primary px-5 py-2 rounded-lg font-bold text-sm tracking-wide shadow-md hover:shadow-lg hover:brightness-105 transition-all">
                Export JSON
            </button>
</div>
</div>
</header>
<main class="max-w-[1200px] mx-auto px-6 lg:px-20 py-16">
<section class="mb-24">
<div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
<div class="max-w-2xl">
<span class="text-primary font-black tracking-[0.2em] text-xs uppercase mb-4 block">System v2.0.0</span>
<h2 class="font-serif text-5xl md:text-7xl text-charcoal dark:text-white leading-[1.1] mb-8">Design Tokens &amp; Style Guide</h2>
<p class="text-xl text-charcoal/70 dark:text-stone-400 font-light leading-relaxed border-l-4 border-primary pl-6">
                    The Updated Design Language: A bold evolution of premium Burmese hospitality. Integrating deep crimson heritage with golden modern accents.
                </p>
</div>
<div class="flex gap-3">
<div class="p-6 border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-2xl text-center min-w-[140px] shadow-deep-red">
<p class="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">System Status</p>
<p class="font-black text-primary text-lg">REBRANDED</p>
</div>
</div>
</div>
</section>
<section class="mb-32" id="colors">
<div class="flex items-center gap-6 mb-12">
<h3 class="font-serif text-4xl font-medium italic text-primary">01. Color Palette</h3>
<div class="h-1 flex-1 bg-gradient-to-r from-primary/20 to-transparent rounded-full"></div>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
<div class="token-card p-5 rounded-2xl">
<div class="w-full aspect-square bg-[#9B1B1E] rounded-xl mb-5 flex items-end p-4 shadow-inner">
<span class="text-white/80 text-xs font-mono font-bold">#9B1B1E</span>
</div>
<p class="font-black text-charcoal dark:text-white text-lg mb-1">Morning Star Red</p>
<p class="text-[10px] text-primary/60 dark:text-primary/80 mb-4 font-mono font-bold uppercase tracking-widest">--color-primary</p>
<p class="text-sm text-charcoal/70 dark:text-stone-400 leading-relaxed">The core brand identity. Deep, bold, and authoritative. Used for key branding elements.</p>
</div>
<div class="token-card p-5 rounded-2xl">
<div class="w-full aspect-square bg-[#F4D03F] rounded-xl mb-5 flex items-end p-4 shadow-inner">
<span class="text-primary/80 text-xs font-mono font-bold">#F4D03F</span>
</div>
<p class="font-black text-charcoal dark:text-white text-lg mb-1">Heritage Gold</p>
<p class="text-[10px] text-primary/60 dark:text-primary/80 mb-4 font-mono font-bold uppercase tracking-widest">--color-cta</p>
<p class="text-sm text-charcoal/70 dark:text-stone-400 leading-relaxed">Bright and inviting. Reserved for primary CTAs, highlights, and promotional accents.</p>
</div>
<div class="token-card p-5 rounded-2xl">
<div class="w-full aspect-square bg-[#2E8B57] rounded-xl mb-5 flex items-end p-4 shadow-inner">
<span class="text-white/80 text-xs font-mono font-bold">#2E8B57</span>
</div>
<p class="font-black text-charcoal dark:text-white text-lg mb-1">Jade</p>
<p class="text-[10px] text-primary/60 dark:text-primary/80 mb-4 font-mono font-bold uppercase tracking-widest">--color-jade</p>
<p class="text-sm text-charcoal/70 dark:text-stone-400 leading-relaxed">A secondary accent representing freshness, organic ingredients, and success states.</p>
</div>
<div class="token-card p-5 rounded-2xl">
<div class="w-full aspect-square bg-[#FFFEF7] border border-border-sep rounded-xl mb-5 flex items-end p-4 shadow-inner">
<span class="text-charcoal/40 text-xs font-mono font-bold">#FFFEF7</span>
</div>
<p class="font-black text-charcoal dark:text-white text-lg mb-1">Cream Background</p>
<p class="text-[10px] text-primary/60 dark:text-primary/80 mb-4 font-mono font-bold uppercase tracking-widest">--color-cream</p>
<p class="text-sm text-charcoal/70 dark:text-stone-400 leading-relaxed">The canvas of the platform. Maintains the elevated fast-casual atmosphere.</p>
</div>
</div>
</section>
<section class="mb-32" id="typography">
<div class="flex items-center gap-6 mb-12">
<h3 class="font-serif text-4xl font-medium italic text-primary">02. Typography Specimen</h3>
<div class="h-1 flex-1 bg-gradient-to-r from-primary/20 to-transparent rounded-full"></div>
</div>
<div class="token-card rounded-3xl overflow-hidden border-2 border-primary/5">
<div class="p-10 border-b border-border-sep dark:border-primary/20 flex flex-col md:flex-row gap-16 bg-white/30 dark:bg-black/10">
<div class="flex-1">
<p class="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-6">Display Serif</p>
<p class="font-serif text-5xl mb-3 text-charcoal dark:text-white">Playfair Display</p>
<p class="text-sm text-charcoal/60 dark:text-stone-400 leading-relaxed">Sophisticated and timeless. Used for all editorial headings and brand storytelling.</p>
</div>
<div class="flex-1">
<p class="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-6">Interface Sans</p>
<p class="font-sans text-5xl mb-3 text-charcoal dark:text-white">DM Sans</p>
<p class="text-sm text-charcoal/60 dark:text-stone-400 leading-relaxed">Clean, geometric, and legible. The workhorse for all UI and functional reading.</p>
</div>
<div class="flex-1">
<p class="text-[10px] uppercase tracking-[0.2em] text-primary font-black mb-6">Native Script</p>
<p class="font-burmese text-5xl mb-3 text-charcoal dark:text-white">Padauk</p>
<p class="text-sm text-charcoal/60 dark:text-stone-400 leading-relaxed">Authentic rendering for the Myanmar local language experience.</p>
</div>
</div>
<div class="p-10 space-y-16">
<div class="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-24">
<div class="w-40 shrink-0">
<p class="text-[10px] font-mono font-bold text-primary/40 tracking-wider">Heading 4XL<br/>48px / 1.1 / -1%</p>
</div>
<div class="flex-1">
<h4 class="font-serif text-6xl text-charcoal dark:text-white mb-4 leading-tight tracking-tight">Tradition Reimagined</h4>
<p class="font-burmese text-4xl text-primary/80 dark:text-cta/80">ရိုးရာကို အသစ်ပြန်လည်ဖန်တီးခြင်း</p>
</div>
</div>
<div class="h-px w-full bg-primary/5 dark:bg-primary/10"></div>
<div class="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-24">
<div class="w-40 shrink-0 pt-1">
<p class="text-[10px] font-mono font-bold text-primary/40 tracking-wider">Body Base<br/>16px / 1.6 / 0%</p>
</div>
<div class="flex-1">
<p class="font-sans text-lg text-charcoal/80 dark:text-stone-300 max-w-3xl leading-relaxed">
                            Mandalay Morning Star delivers the vibrant soul of Burmese cuisine. Our updated design system reflects the bold flavors and warm hospitality that define our culture, now presented with a deeper sense of premium heritage.
                        </p>
</div>
</div>
</div>
</div>
</section>
<section class="mb-32" id="components">
<div class="flex items-center gap-6 mb-12">
<h3 class="font-serif text-4xl font-medium italic text-primary">03. UI Components Preview</h3>
<div class="h-1 flex-1 bg-gradient-to-r from-primary/20 to-transparent rounded-full"></div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
<div class="space-y-12">
<div>
<p class="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-black mb-8">Buttons &amp; Interaction</p>
<div class="flex flex-wrap gap-6 items-center">
<button class="bg-cta text-primary px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-deep-red hover:shadow-xl-red hover:-translate-y-0.5 transition-all">
                            Order Now
                        </button>
<button class="border-2 border-primary text-primary px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:bg-primary/5 transition-all">
                            Menu View
                        </button>
<button class="text-primary/70 font-black text-xs uppercase tracking-[0.15em] hover:text-primary hover:underline underline-offset-8 transition-all">
                            Learn More
                        </button>
</div>
</div>
<div>
<div class="max-w-md space-y-6">
<div class="space-y-2">
<label class="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">Preferred Name</label>
<input class="w-full bg-primary/5 dark:bg-primary/10 border-2 border-transparent focus:border-primary/20 focus:ring-0 rounded-xl p-4 text-sm font-medium" placeholder="E.g. Aung San" type="text"/>
</div>
<div class="space-y-2">
<label class="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60">Dietary Preferences</label>
<textarea class="w-full bg-primary/5 dark:bg-primary/10 border-2 border-transparent focus:border-primary/20 focus:ring-0 rounded-xl p-4 text-sm font-medium" placeholder="No spicy, gluten-free options..." rows="3"></textarea>
</div>
</div>
</div>
</div>
<div>
<p class="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-black mb-8">Component Elevation (Enhanced Shadows)</p>
<div class="token-card bg-cream dark:bg-[#260a0a] rounded-3xl overflow-hidden shadow-xl-red max-w-sm group border-0 ring-1 ring-primary/10">
<div class="h-64 bg-stone-200 overflow-hidden relative">
<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOCtx1HNpOn24seNFRNHOoAcNkX4OPHwNGtfEGAWLfo1j5zoieI2-wIBIKNht94IRruU5sTOb2ZfbGzZPoDslADTaSLQYAHqudnHfPbic8G52m9W0oFCnIZC0ROnvk-YqSNLT3D2Z0IkQvU2sArVvF5YJi8bR9CjEuVmfk4TTDWmPa2V3rnaxcmsjDliFfMouN4smpNJLoYUOQxIExdWcsLcrpGr3uTVKVy8z97lXZFAJHmOt4XIhM21veL6fKLWIrYWtp5SOgDfg"/>
<div class="absolute top-6 right-6 bg-cta text-primary px-4 py-1.5 rounded-full shadow-lg">
<span class="font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
<span class="material-symbols-outlined text-sm font-bold">eco</span> Fresh Catch
                            </span>
</div>
</div>
<div class="p-8">
<div class="flex justify-between items-start mb-4">
<div>
<h5 class="font-serif text-3xl text-charcoal dark:text-white mb-1">Mohinga Supreme</h5>
<p class="text-[10px] font-bold text-primary tracking-widest uppercase">Chef's Selection</p>
</div>
<span class="text-primary font-black text-xl">$14.50</span>
</div>
<p class="text-sm text-charcoal/60 dark:text-stone-400 mb-8 leading-relaxed">
                            A legendary catfish chowder with thin rice noodles, soft-boiled egg, and our signature crispy lentil crackers.
                        </p>
<button class="w-full py-4 bg-primary text-cta rounded-xl font-black text-xs uppercase tracking-[0.2em] group-hover:brightness-110 shadow-deep-red transition-all">
                            Add to Cart
                        </button>
</div>
</div>
</div>
</div>
</section>
<footer class="mt-40 pb-20 border-t-2 border-primary/10 flex flex-col items-center">
<div class="bg-primary -mt-8 p-4 rounded-full shadow-xl-red mb-12">
<span class="material-symbols-outlined text-4xl text-cta">star_rate</span>
</div>
<div class="text-center space-y-6">
<h4 class="font-serif italic text-3xl text-primary/40">"A Star Rising in Every Morning"</h4>
<div class="h-8 w-px bg-primary/20 mx-auto"></div>
<div class="text-[10px] text-primary/50 uppercase tracking-[0.4em] font-black">
                © 2024 Mandalay Morning Star • Brand Architecture v2.0
            </div>
</div>
</footer>
</main>

</body></html>