import {
    IsPresentInTrie,
    TrieLookupStatus,
    IsNotPresentInTrie,
    IsPartiallyPresentInTrie
} from "./types/trieLookupStatus.js";

export class Trie {

    static readonly isPresentInTrie: IsPresentInTrie = 2;
    static readonly isPartiallyPresentInTrie: IsPartiallyPresentInTrie = 1;
    static readonly isNotPresentInTrie: IsNotPresentInTrie = 0;

    static readonly dummyKeyMarkingPresenceInTrie = "0";

    [property: string]: Trie | boolean | Function;

    constructor(keywords: Array<string>) {
        for (const keyword of keywords) {
            let current: Trie = this;
            for (const char of keyword) {
                if (!(char in current)) {
                    current[char] = new Trie([]);
                }
                current = current[char] as Trie;
            }
            current[Trie.dummyKeyMarkingPresenceInTrie] = true;
        }
    }

    // Function to check if a key is in the Trie
    inTrie(key: string): [TrieLookupStatus, Trie] {
        if (!key) {
            return [Trie.isNotPresentInTrie, this];
        }

        let current: Trie = this;

        for (let char of key) {
            if (!(char in current)) {
                return [Trie.isNotPresentInTrie, current];
            }
            current = current[char] as Trie;
        }

        if (Trie.dummyKeyMarkingPresenceInTrie in current) {
            return [Trie.isPresentInTrie, current];
        }
        return [Trie.isPartiallyPresentInTrie, current];
    }

}
