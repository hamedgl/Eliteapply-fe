/**
 * Entry module for the writing routes. The pages live in their own files
 * (WritingLibraryPage.tsx, WritingEditorPage.tsx) so each route lazy-loads
 * its own chunk instead of one bundle covering the whole feature; this
 * barrel keeps the route and test import path (`features/writing/WritingPages`)
 * stable while the implementation stays split.
 */
export { WritingLibrary, NewWriting } from "./WritingLibraryPage";
export { WritingEditor } from "./WritingEditorPage";
