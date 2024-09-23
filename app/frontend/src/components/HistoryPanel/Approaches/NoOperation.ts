import { IApproach, Answers } from "./IApproach";

export class NoOperationApproach implements IApproach {
    async addHistory(id: string, answers: Answers): Promise<void> {
        return;
    }
}
