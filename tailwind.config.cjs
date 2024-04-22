const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {
			colors: {
				primary: colors[process.env.PUBLIC_APP_COLOR],
			},
			fontSize: {
				xxs: "0.625rem",
				smd: "0.94rem",
			},
			fontFamily: {
				'sans': ['"Proxima Nova"', ...defaultTheme.fontFamily.sans],
			},
		},
	},
	plugins: [
		require("tailwind-scrollbar")({ nocompatible: true }),
		require("@tailwindcss/typography"),
	],
};
