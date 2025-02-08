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
