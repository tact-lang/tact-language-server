import {Logger} from "./logger"

export interface Metric {
    name: string
    value: number
    timestamp: number
    labels: Record<string, string> | undefined
}

export class Metrics {
    private static instance: Metrics | null = null
    private metrics: Map<string, Metric[]> = new Map()
    private startTimes: Map<string, number> = new Map()

    private constructor() {}

    static getInstance(): Metrics {
        if (!Metrics.instance) {
            Metrics.instance = new Metrics()
        }
        return Metrics.instance
    }

    startTimer(name: string, labels: Record<string, string> | undefined = undefined) {
        this.startTimes.set(this.getKey(name, labels), performance.now())
    }

    endTimer(name: string, labels: Record<string, string> | undefined = undefined) {
        const key = this.getKey(name, labels)
        const startTime = this.startTimes.get(key)
        if (!startTime) {
            Logger.getInstance().warn(`Timer "${name}" was not started`)
            return
        }

        const duration = performance.now() - startTime
        this.record(name, duration, labels)
        this.startTimes.delete(key)
    }

    record(name: string, value: number, labels: Record<string, string> | undefined = undefined) {
        const metric: Metric = {
            name,
            value,
            timestamp: Date.now(),
            labels,
        }

        const key = this.getKey(name, labels)
        if (!this.metrics.has(key)) {
            this.metrics.set(key, [])
        }
        this.metrics.get(key)!.push(metric)

        const labelsStr = labels ? ` ${JSON.stringify(labels)}` : ""
        Logger.getInstance().info(`Metric: ${name}=${value}${labelsStr}`)
    }

    getMetrics(): Metric[] {
        return Array.from(this.metrics.values()).flat()
    }

    getAverage(
        name: string,
        labels: Record<string, string> | undefined = undefined,
    ): number | null {
        const key = this.getKey(name, labels)
        const metrics = this.metrics.get(key)
        if (!metrics || metrics.length === 0) return null

        const sum = metrics.reduce((acc, m) => acc + m.value, 0)
        return sum / metrics.length
    }

    clear() {
        this.metrics.clear()
        this.startTimes.clear()
    }

    private getKey(name: string, labels: Record<string, string> | undefined): string {
        return labels ? `${name}:${JSON.stringify(labels)}` : name
    }
}
