/**
 * Entry module for the interview routes. The pages live in their own files;
 * this keeps the route and test import path (`features/interviews/InterviewPage`)
 * stable while the implementation stays under the per-file size limit.
 */
export { InterviewsPage, NewInterviewPage } from "./InterviewsListPage";
export { InterviewPage } from "./InterviewSessionPage";
export { selectInterviewAudioType } from "./components/VoiceAnswer";
