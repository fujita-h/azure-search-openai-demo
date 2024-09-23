import { ChatAppResponse } from "../../../api";

export type ApproachType = "IndexedDB" | undefined | null;
export type Answers = [user: string, response: ChatAppResponse][];

export interface IApproach {
    addHistory(id: string, answers: Answers): Promise<void>;
}
