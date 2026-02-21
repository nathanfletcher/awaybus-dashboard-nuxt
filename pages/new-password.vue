<template>
    <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4" style="min-height: 100vh;">
        <v-card width="100%" max-width="450" class="pa-6 rounded-xl" elevation="4">
            <div class="text-center mb-6">
                <v-icon icon="mdi-bus" size="48" color="primary" class="mb-2"></v-icon>
                <h1 class="text-h4 font-weight-bold text-primary">AwayBus</h1>
                <p class="text-subtitle-1 text-medium-emphasis">Station Master Dashboard</p>
            </div>

            <v-card-text>
                <h3 class="text-h6 font-weight-medium mb-4 text-center">Set your new password</h3>
                <form @submit.prevent="updatepassword">
                    <ErrorAlert v-if="authError" :error-msg="authError" @clearError="clearError" class="mb-4" />
                    <SuccessAlert v-if="authSuccess" :success-msg="authSuccess" @clearSuccess="clearSuccess" class="mb-4" />
                    
                    <v-text-field 
                        type="password" 
                        label="New Password" 
                        v-model="password"
                        prepend-inner-icon="mdi-lock-outline"
                        variant="outlined"
                        color="primary"
                        required
                    ></v-text-field>
                    
                    <v-text-field 
                        type="password" 
                        label="Confirm Password" 
                        v-model="passwordConfirm"
                        prepend-inner-icon="mdi-lock-check-outline"
                        variant="outlined"
                        color="primary"
                        required
                    ></v-text-field>
                    
                    <v-btn 
                        type="submit" 
                        color="primary" 
                        size="large" 
                        block 
                        class="mt-2"
                        :loading="loading"
                    >
                        Save new password
                    </v-btn>
                </form>
            </v-card-text>
        </v-card>
    </div>
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