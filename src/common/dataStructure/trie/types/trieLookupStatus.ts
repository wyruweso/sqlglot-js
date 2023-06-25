export type IsPresentInTrie = 2;

export type IsPartiallyPresentInTrie = 1;

export type IsNotPresentInTrie = 0;

export type TrieLookupStatus =
  | IsPresentInTrie
  | IsPartiallyPresentInTrie
  | IsNotPresentInTrie;
