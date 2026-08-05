/** Regras básicas de senha no cadastro / troca. */
export type PasswordCheck = {
    ok: boolean;
    message: string | null;
    rules: {
        minLength: boolean;
        uppercase: boolean;
        number: boolean;
        symbol: boolean;
    };
};

const MIN_LEN = 8;
const SYMBOL_RE = /[^A-Za-z0-9]/;

export function checkPassword(senha: string): PasswordCheck {
    const rules = {
        minLength: senha.length >= MIN_LEN,
        uppercase: /[A-Z]/.test(senha),
        number: /[0-9]/.test(senha),
        symbol: SYMBOL_RE.test(senha),
    };
    const ok = rules.minLength && rules.uppercase && rules.number && rules.symbol;
    let message: string | null = null;
    if (!ok) {
        const missing: string[] = [];
        if (!rules.minLength) missing.push(`pelo menos ${MIN_LEN} caracteres`);
        if (!rules.uppercase) missing.push("uma letra maiúscula");
        if (!rules.number) missing.push("um número");
        if (!rules.symbol) missing.push("um símbolo (ex.: !@#$%)");
        message = `A senha precisa ter ${missing.join(", ")}.`;
    }
    return { ok, message, rules };
}
