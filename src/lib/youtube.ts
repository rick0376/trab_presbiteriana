const PLAYER_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_PLAYER_CHANNEL_ID;

const ADMIN_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_ADMIN_CHANNEL_ID;

/* 🔊 Player da rádio */
export const YOUTUBE_EMBED_LIVE_URL = PLAYER_CHANNEL_ID
  ? `https://www.youtube.com/embed/live_stream?channel=${PLAYER_CHANNEL_ID}`
  : null;

/* 📱 Abrir app do YouTube (celular) */
export const YOUTUBE_CREATE_URL = "https://www.youtube.com/create";

/* 💻 Abrir YouTube Studio (canal do pastor/admin) */
export const YOUTUBE_STUDIO_URL = ADMIN_CHANNEL_ID
  ? `https://studio.youtube.com/channel/${ADMIN_CHANNEL_ID}/livestreaming`
  : null;
