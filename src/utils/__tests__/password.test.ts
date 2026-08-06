import { checkPassword } from "../password";

describe("checkPassword", () => {
    it("rejects weak passwords", () => {
        expect(checkPassword("abc").ok).toBe(false);
        expect(checkPassword("abcdefgh").ok).toBe(false);
        expect(checkPassword("Abcdefgh").ok).toBe(false);
        expect(checkPassword("Abcdefg1").ok).toBe(false);
        expect(checkPassword("abcdefg1!").ok).toBe(false);
    });

    it("lists missing rules in message", () => {
        const r = checkPassword("short");
        expect(r.ok).toBe(false);
        expect(r.message).toMatch(/maiúscula/i);
        expect(r.message).toMatch(/número/i);
        expect(r.message).toMatch(/símbolo/i);
    });

    it("accepts password with upper, number and symbol", () => {
        const r = checkPassword("Senha@123");
        expect(r.ok).toBe(true);
        expect(r.message).toBeNull();
        expect(r.rules).toEqual({
            minLength: true,
            uppercase: true,
            number: true,
            symbol: true,
        });
    });
});
