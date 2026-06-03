export const readResponseError = async (response, fallbackMessage) => {
  const fallback = fallbackMessage || 'Request failed.'
  const text = await response.text()

  if (!text) return fallback

  try {
    const data = JSON.parse(text)
    return data?.message || data?.title || fallback
  } catch {
    return text
  }
}

export const uploadImage = async (file, category) => {
  if (!file) return null

  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorMessage = await readResponseError(
      response,
      'Image upload failed.',
    )
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return data.imageUrl || null
}

// Uploads an arbitrary file (any type) for chat attachments.
// Returns { fileUrl, fileName }.
export const uploadFile = async (file, category = 'messages') => {
  if (!file) return null

  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorMessage = await readResponseError(response, 'File upload failed.')
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return { fileUrl: data.fileUrl || null, fileName: data.fileName || file.name }
}
