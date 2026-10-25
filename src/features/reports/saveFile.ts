/** Saves a downloaded file under a name of its own: the backend's file name header is not readable across origins. */
export function saveFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Revoked on the next task: some browsers drop the download when the URL goes away during the click.
  setTimeout(() => URL.revokeObjectURL(url))
}
