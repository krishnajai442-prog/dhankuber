/**
 * "PANDIT जी ऑनलाइन खाईवाल" promo card.
 * Set NEXT_PUBLIC_WHATSAPP_NUMBER (e.g. 919876543210) in .env.local AND Vercel.
 * Button styling lives in globals.css (.wa-cta — glossy obsidian + emerald glow).
 */
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";

const GAME_LINES = [
  "😵‍💫𝗗𝗘𝗟𝗛𝗜 𝗕𝗔𝗝𝗔𝗥✍️.. 3:00 PM",
  "😵‍💫𝗦𝗛𝗥𝗜 𝗚𝗔𝗡𝗘𝗦𝗛✍️.4:30 PM",
  "😵‍💫𝗙𝗔𝗥𝗜𝗗𝗔𝗕𝗔𝗗✍️.....5:45 PM",
  "😵‍💫𝗚𝗛𝗔𝗭𝗜𝗔𝗕𝗔𝗗✍️....9:30 PM",
  "😵‍💫𝗚𝗔𝗟𝗜 𝗖𝗛𝗢𝗥✍️... 11:30 PM",
  "😵‍💫 𝗗𝗶𝗦𝗔𝗪𝗔𝗥✍️ .... 01:30 AM",
];

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M12 5l7 7-7 7" />
    </svg>
  );
}

export function PanditPromo() {
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "🕉️ PANDIT जी ऑनलाइन खाईवाल — मुझे अपनी गेम खेलनी है।"
  )}`;

  return (
    <section
      aria-label="Pandit ji online khaiwal"
      className="overflow-hidden rounded-xl border-2 border-[#075E54] bg-white shadow-md"
    >
      {/* header */}
      <div className="bg-[#075E54] px-4 py-3 text-center">
        <h2 className="text-lg font-extrabold text-[#FFD54F] sm:text-xl">
          🕉️ PANDIT जी ऑनलाइन खाईवाल 🕉️
        </h2>
        <p className="mt-1 text-sm tracking-widest text-white">✳️🔆 🔆✳️</p>
      </div>

      <div className="space-y-4 px-4 py-5 sm:px-6">
        <p className="text-center text-base font-bold text-gray-900 sm:text-lg">
          🕉️ अब घर बैठे प्ले करे अपनी गेम
        </p>
        <p className="text-center text-lg font-extrabold text-[#d81b60]">💘गेम टाइम💘</p>

        <div className="space-y-1 text-center text-sm font-bold text-gray-800 sm:text-base">
          <p>❤️ जोड़ी रेट 100🔻9500 </p>
          <p>❤️ हरूप रेट 100🔻950 </p>
        </div>

        {/* game times */}
        <ul className="mx-auto max-w-md space-y-1.5 rounded-lg bg-[#f0fdf4] p-4 text-sm font-semibold text-gray-900 sm:text-base">
          {GAME_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {/* notes */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-extrabold">नोट 🚫</p>
          <div className="mt-2 space-y-2">
            <p>1.👉अपना टोटल जरूर चेक करे गलत होने पर भुगतान नहीं मिलेगा</p>
            <p>2.👉ok का ही हिसाब होगा अपना गेम जरूर ok करवा लेना</p>
          </div>
          <p className="mt-2 font-semibold">एक पर्चे में बस एक पासिंग मानी जाएगी जो सबसे बड़ी होगी</p>
        </div>

        <p className="text-center text-base font-extrabold text-[#075E54] sm:text-lg">
          आपका अपना पंडित जी खाईवाल 🔥🔥
        </p>

        {/* GLOSSY DARK WHATSAPP CTA */}
        <div className="flex justify-center pt-2">
          <span className="wa-cta-wrap">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-cta"
              aria-label="WhatsApp पर पंडित जी खाईवाल से संपर्क करें"
            >
              <span className="wa-cta__sheen" aria-hidden="true" />

              <span className="wa-cta__icon" aria-hidden="true">
                <WhatsAppIcon />
                <span className="wa-cta__icon-gloss" />
              </span>

              <span className="wa-cta__text">
                <span className="wa-cta__title">WhatsApp पर संपर्क करें</span>
                <span className="wa-cta__sub">
                  <span className="wa-cta__dot" aria-hidden="true" />
                  ऑनलाइन अभी · तुरंत जवाब
                </span>
              </span>

              <span className="wa-cta__arrow" aria-hidden="true">
                <ArrowIcon />
              </span>
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}