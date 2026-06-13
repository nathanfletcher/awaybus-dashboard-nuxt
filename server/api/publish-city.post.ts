export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()

  const response = await $fetch<{
    success: boolean
    import_id?: number
    city_id?: number
    city_name?: string
    status?: string
    error?: string
  }>(`${config.public.supabaseUrl}/functions/v1/publish-city`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.public.supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  return response
})
