import React from "react";
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    StyleProp,
    TextStyle,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";

type Props = TextInputProps & {
    style?: StyleProp<TextStyle>;
};

export default function TextField({ style, accessibilityLabel, placeholder, ...rest }: Props) {
    const { colors } = useTheme();

    return (
        <TextInput
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={
                accessibilityLabel ??
                (typeof placeholder === "string" ? placeholder : undefined)
            }
            {...rest}
            style={[
                styles.input,
                {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                    color: colors.text,
                },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    },
});
