import React from "react";
import { Text, Pressable } from "react-native";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import { ThemeProvider, useTheme } from "../ThemeContext";

function Probe() {
    const theme = useTheme();
    return (
        <>
            <Text testID="mode">{theme.mode}</Text>
            <Text testID="bg">{theme.colors.background}</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="toggle-theme"
                onPress={theme.toggleTheme}
            >
                <Text>toggle</Text>
            </Pressable>
        </>
    );
}

describe("ThemeProvider", () => {
    it("inicia em dark por padrão", async () => {
        render(
            <ThemeProvider>
                <Probe />
            </ThemeProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId("mode").props.children).toBe("dark");
        });
        expect(screen.getByTestId("bg").props.children).toBe("#070B14");
    });

    it("alterna para light e volta para dark", async () => {
        render(
            <ThemeProvider>
                <Probe />
            </ThemeProvider>
        );
        await waitFor(() => {
            expect(screen.getByTestId("mode").props.children).toBe("dark");
        });

        fireEvent.press(screen.getByLabelText("toggle-theme"));

        await waitFor(() => {
            expect(screen.getByTestId("mode").props.children).toBe("light");
        });
        expect(screen.getByTestId("bg").props.children).toBe("#F4F7FC");

        fireEvent.press(screen.getByLabelText("toggle-theme"));

        await waitFor(() => {
            expect(screen.getByTestId("mode").props.children).toBe("dark");
        });
    });
});
