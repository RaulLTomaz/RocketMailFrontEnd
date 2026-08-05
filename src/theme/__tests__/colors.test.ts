import { colorsFor, darkColors, lightColors, ThemeMode } from "../colors";

describe("theme colors", () => {
    it("defaults dark palette has brand-like background and accent", () => {
        expect(darkColors.background).toBe("#070B14");
        expect(darkColors.accent).toBe("#3B9EFF");
        expect(darkColors.like).toBe("#F97316");
    });

    it("resolves light and dark via colorsFor", () => {
        expect(colorsFor("dark")).toBe(darkColors);
        expect(colorsFor("light")).toBe(lightColors);
        const mode: ThemeMode = "light";
        expect(colorsFor(mode).text).toBe(lightColors.text);
    });
});
