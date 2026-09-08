const fs = require('fs');

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Replace colors
content = content.replace(/text-\[\#1F1F1F\]/g, 'text-slate-900');
content = content.replace(/text-\[\#444746\]/g, 'text-slate-600');
content = content.replace(/text-\[\#5F6368\]/g, 'text-slate-500');
content = content.replace(/text-\[\#70777A\]/g, 'text-slate-400');
content = content.replace(/border-\[\#DADCE0\]/g, 'border-slate-200');
content = content.replace(/border-\[\#F1F3F4\]/g, 'border-slate-100');
content = content.replace(/bg-\[\#F8FAFC\]/g, 'bg-slate-50');
content = content.replace(/bg-\[\#F1F3F4\]/g, 'bg-slate-50');
content = content.replace(/hover:bg-\[\#F8FAFC\]/g, 'hover:bg-slate-50');
content = content.replace(/hover:bg-\[\#F1F3F4\]/g, 'hover:bg-slate-100');
content = content.replace(/bg-\[\#E8F0FE\]/g, 'bg-blue-50'); // Usually with #0B57D0

// Replace container sizing & padding
content = content.replace(
  /<div className="min-h-screen flex flex-col w-full text-slate-900 relative bg-slate-50 font-sans">/g,
  '<div className="min-h-screen flex flex-col w-full text-slate-900 relative bg-white font-sans justify-between">'
);
content = content.replace(
  /<div className="min-h-screen flex flex-col w-full text-\[\#1F1F1F\] relative bg-\[\#F8FAFC\] font-sans">/g,
  '<div className="min-h-screen flex flex-col w-full text-slate-900 relative bg-white font-sans justify-between">'
);
content = content.replace(
  /nav className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs"/g,
  'nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"'
);
content = content.replace(
  /max-w-\[1536px\] w-full mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-12/g,
  'max-w-7xl w-full mx-auto flex items-center justify-between px-6 md:px-12'
);
content = content.replace(
  /px-4 sm:px-8 lg:px-12 pt-12 sm:pt-16 pb-16/g,
  'px-6 md:px-12 pt-16 md:pt-24 pb-16 md:pb-24 max-w-7xl mx-auto'
);
content = content.replace(
  /w-full max-w-\[1100px\] mx-auto flex flex-col items-center justify-center/g,
  'w-full max-w-4xl mx-auto flex flex-col items-center justify-center'
);
content = content.replace(
  /w-full bg-slate-50 py-16 flex flex-col items-center/g,
  'w-full bg-slate-50 py-16 md:py-24 flex flex-col items-center'
);
content = content.replace(
  /w-full max-w-\[1100px\] mx-auto px-4 sm:px-6 lg:px-8 mb-16/g,
  'w-full max-w-7xl mx-auto px-6 md:px-12 mb-16 md:mb-24'
);
content = content.replace(
  /px-4 sm:px-8 lg:px-12 py-6 sm:py-8/g,
  'px-6 md:px-12 py-6 md:py-8'
);
content = content.replace(
  /w-full max-w-\[1100px\] mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24 text-left/g,
  'w-full max-w-7xl mx-auto px-6 md:px-12 mb-16 md:mb-24 text-left'
);
content = content.replace(
  /w-full max-w-\[880px\] mx-auto px-4 sm:px-6 lg:px-8 text-left/g,
  'w-full max-w-3xl mx-auto px-6 md:px-12 text-left'
);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log('Styles updated.');
