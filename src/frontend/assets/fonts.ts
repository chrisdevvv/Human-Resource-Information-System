import { Poppins } from "next/font/google";

// Component: poppins (font loader)
// Filename: fonts.ts
// Purpose: Expose Poppins font via next/font to be used in the app layout
export const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});
