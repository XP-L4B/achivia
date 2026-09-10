import logoUrl from '../../assets/logo_xpl4b.png';

// Marchio XP-L4B: il simbolo del logo ufficiale, ritagliato dal file
// logo_XP_L4B_rgb_trasp_vert_col.png senza la scritta "XP-L4B" che gli sta
// sotto. Prima era un SVG ridisegnato a mano campionando i colori dagli
// screenshot; ora è il marchio vero.
export default function AchiviaLogo({ size = 42, className = '' }) {
  return (
    <img
      src={logoUrl}
      className={className}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      alt=""
      aria-hidden="true"
    />
  );
}
