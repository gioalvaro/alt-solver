/**
 * Ambient declarations for the Apps Script host bridge injected into the
 * HtmlService iframe at runtime.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface GoogleScriptRunner { [fnName: string]: any }
  interface GoogleScriptHostEditor { focus(): void }
  interface GoogleScriptHost {
    editor: GoogleScriptHostEditor;
    close?: () => void;
  }
  interface GoogleScriptApi {
    run: GoogleScriptRunner & {
      withSuccessHandler(cb: (r: unknown) => void): GoogleScriptApi['run'];
      withFailureHandler(cb: (e: Error) => void): GoogleScriptApi['run'];
    };
    host?: GoogleScriptHost;
  }
  const google: { script: GoogleScriptApi };
}
export {};
