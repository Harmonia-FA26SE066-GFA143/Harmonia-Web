/** ".pdf", ".mp3": the extension of a file name, lower-cased, with its dot. */
export const fileExtension = (fileName: string) => fileName.slice(fileName.lastIndexOf('.')).toLowerCase()

/** "2:05": a playing time in minutes and seconds. */
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
