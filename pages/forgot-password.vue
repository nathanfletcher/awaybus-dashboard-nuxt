<template>
    <div >
      <v-container>
        <v-row>
            <v-col></v-col>
            <v-col>
                <h1>Station Master</h1>
                <h3 >Forgot password</h3>
                <form @submit.prevent="resetPassword">
                    <ErrorAlert :error-msg="authError" @clearError="clearError" />
                    <SuccessAlert :success-msg="authSuccess" @clearSuccess="clearSuccess" />
                    <div >
                    <label >
                        <div >
                        <v-text-field type="text" placeholder="Email address" v-model="email"></v-text-field>
                        </div>
                    </label>
                    </div>
                    <v-btn type="submit" :disabled="loading">
                     <div :class="{loading: loading}">Request password reset</div>
                    </v-btn>
                </form>
            </v-col>
            <v-col></v-col>
        </v-row>
      </v-container>
    </div>
  </template>
  
  <script setup >
  definePageMeta({
    
  })
  useHead({
    title: 'Forgot Password | supaAuth'
  })
  const email = ref('')
  const client = useSupabaseAuthClient()
  const loading = ref(false)
  const authSuccess = ref('')
  const authError = ref('')
  
  const resetPassword = async () => {
    loading.value = true
    const { error }  = await client.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/new-password`
    })
    if (error) {
      loading.value = false
      authError.value = 'Invalid email credential'
      setTimeout(() => {
        authError.value = ''
      }, 5000)
    }
    else {
      loading.value = false
      authSuccess.value = `We've sent your an email.`
      setTimeout(() => {
        authSuccess.value = ''
      }, 5000)
    }
  }
  
  const clearError = () => {
    authError.value = '';
  };
  
  const clearSuccess = () => {
    authSuccess.value = '';
  };
  </script>