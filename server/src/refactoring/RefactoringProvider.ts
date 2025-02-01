import {Refactoring, RefactoringContext, RefactoringResult} from "./Refactoring"
import {ExtractVariableRefactoring} from "./ExtractVariable"
import {Logger} from "../utils/logger"

export class RefactoringProvider {
    private static instance: RefactoringProvider | null = null
    private refactorings: Map<string, Refactoring> = new Map()

    private constructor() {
        this.registerRefactoring("extract.variable", new ExtractVariableRefactoring())
    }

    static getInstance(): RefactoringProvider {
        if (!RefactoringProvider.instance) {
            RefactoringProvider.instance = new RefactoringProvider()
        }
        return RefactoringProvider.instance
    }

    registerRefactoring(id: string, refactoring: Refactoring) {
        this.refactorings.set(id, refactoring)
    }

    async executeRefactoring(id: string, context: RefactoringContext): Promise<RefactoringResult> {
        const refactoring = this.refactorings.get(id)
        if (!refactoring) {
            return {
                edit: {changes: {}},
                error: `Unknown refactoring: ${id}`,
            }
        }

        try {
            return await refactoring.execute(context)
        } catch (e) {
            Logger.getInstance().error(`Error executing refactoring ${id}:`, e)
            return {
                edit: {changes: {}},
                error: `Internal error: ${e}`,
            }
        }
    }
}
