/**
 * Quote an operator-entered value as a URScript string literal. The Command node
 * accepts free text, so a stray quote or backslash must not break out of the
 * literal and into the generated script.
 */
export const toUrScriptString = (value: string): string => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
