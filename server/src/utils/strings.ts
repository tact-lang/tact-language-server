export function trimSuffix(text: string, prefix: string): string {
    if (text.endsWith(prefix)) {
        return text.slice(0, -prefix.length)
    }
    return text
}

export function trimPrefix(text: string, prefix: string): string {
    if (text.startsWith(prefix)) {
        return text.slice(prefix.length)
    }
    return text
}

/**
 * Converts any case (snake_case, kebab-case, camelCase) to PascalCase
 */
export function toPascalCase(text: string): string {
    const withSpaces = text.replace(/[_-]/g, " ")
    const normalized = withSpaces.replace(/([A-Z])/g, " $1")
    return normalized
        .split(" ")
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("")
}
