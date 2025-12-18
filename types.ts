
export interface StoryNode {
  id: string;
  word: string;
  wordCN?: string; // Chinese translation of the word
  partOfSpeech?: string; // e.g. "noun", "verb", "adj"
  sentence: string; // Full sentence template containing {word} or implicitly at end
  sentenceCN?: string; // Chinese translation of the sentence
  type: 'start' | 'selected' | 'candidate';
  isLocked?: boolean;
}

export interface StoryContext {
  storyPath: StoryNode[];
  candidates: StoryNode[];
  isLoading: boolean;
  gameStatus: 'playing' | 'reading';
}

export enum NodeType {
  Start = 'start',
  Selected = 'selected',
  Candidate = 'candidate',
}

export interface SavedStory {
  id: string;
  title: string;
  date: string;
  nodes: StoryNode[];
  coverImage: string;
  unlocked: boolean; // Tracks if the illustration is unlocked
}

// For the upload feature
export type VocabularyGraph = Record<string, Array<{
  word: string;
  wordCN: string;
  partOfSpeech?: string;
  sentence: string; // Must include {word} placeholder or implied
  sentenceCN: string;
}>>;
