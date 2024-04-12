import { join } from "path";
import * as fs from "fs";

const { VERCEL_URL } = process.env;

export const APP_URL = VERCEL_URL
  ? `https://becomeagi.com`
  : "http://localhost:3000";

const fontRegularPath = join(process.cwd(), "./app/font/LondrinaSolid-Regular.ttf");
const fontBoldPath = join(process.cwd(), "./app/font/LondrinaSolid-Black.ttf");
export const fontDataRegular = fs.readFileSync(fontRegularPath);
export const fontDataBold = fs.readFileSync(fontBoldPath);

export const defaultImageOptions = {
  fonts: [
    {
      data: fontDataRegular,
      name: "Londrina Solid",
      style: "normal",
      weight: 400,
    },
    {
      data: fontDataBold,
      name: "Londrina Solid",
      style: "normal",
      weight: 700,
    },
  ],
} as any;