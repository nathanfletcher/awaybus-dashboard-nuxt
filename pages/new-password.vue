<template>
    <v-container>
        <v-col> </v-col>
        <v-col>
            <div >
                <h1>Station Master</h1>
      <h3 >New password</h3>
      <form @submit.prevent="updatepassword">
        <ErrorAlert :error-msg="authError" @clearError="clearError" />
        <SuccessAlert :success-msg="authSuccess" @clearSuccess="clearSuccess" />
        
              <v-text-field type="password" label="Password" v-model="password" ></v-text-field>
            
              <v-text-field type="password" label="Repeat Password" v-model="passwordConfirm" ></v-text-field>
        
        <div >
          <v-btn type="submit" :disabled="loading">
            <div :class="{loading: loading}">Save</div>
            
          </v-btn>
        </div>
      </form>
    </div>
        </v-col>
        <v-col></v-col>
    </v-container>
  </template>
  
  <script setup >
  definePageMeta({
    layout: 'auth'
  })
  useHead({
    title: 'New Password | supaAuth'
  })
  const password = ref('')
  const passwordConfirm = ref('')
  const client = useSupabaseAuthClient()
  const loading = ref(false)
  const authSuccess = ref('')
  const authError = ref('')
  
  const updatepassword = async () => {
    if (password.value !== passwordConfirm.value) return authError.value = 'Password mismatch!';
    loading.value = true
    const { error }  = await client.auth.updateUser({
      password: password.value
    })
    await client.auth.signOut()
    if (error) {
      loading.value = false
      authError.value = 'Failed to fetch'
      setTimeout(() => {
        authError.value = ''
      }, 5000)
    }
    else {
      loading.value = false
      authSuccess.value = `Password changed`
      setTimeout(() => {
        authSuccess.value = ''
        navigateTo('/login')
      }, 5000)
    }
  }
  
  const clearError = () => {
    authError.value = '';
  };
  
  const clearSuccess = () => {
    authSuccess.value = ''
    navigateTo('/login')
  };
  </script>