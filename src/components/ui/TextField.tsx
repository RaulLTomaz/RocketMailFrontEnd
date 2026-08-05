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

export default function TextField({ style, ...rest }: Props) {
    const { colors } = useTheme();

    return (
        <TextInput
            placeholderTextColor={colors.placeholder}
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
