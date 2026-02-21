<template>
    <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4" style="min-height: 100vh;">
        <v-card width="100%" max-width="450" class="pa-6 rounded-xl" elevation="4">
            <div class="text-center mb-6">
                <v-icon icon="mdi-bus" size="48" color="primary" class="mb-2"></v-icon>
                <h1 class="text-h4 font-weight-bold text-primary">AwayBus</h1>
                <p class="text-subtitle-1 text-medium-emphasis">Station Master Dashboard</p>
            </div>

            <v-card-text>
                <h3 class="text-h6 font-weight-medium mb-4 text-center">Reset your password</h3>
                <form @submit.prevent="resetPassword">
                    <ErrorAlert v-if="authError" :error-msg="authError" @clearError="clearError" class="mb-4" />
                    <SuccessAlert v-if="authSuccess" :success-msg="authSuccess" @clearSuccess="clearSuccess" class="mb-4" />

                    <v-text-field 
                        type="email" 
                        label="Email address" 
                        v-model="email"
                        prepend-inner-icon="mdi-email-outline"
                        variant="outlined"
                        color="primary"
                        required
                    ></v-text-field>

                    <v-btn 
                        type="submit" 
                        color="primary" 
                        size="large" 
                        block 
                        class="mt-2 mb-4"
                        :loading="loading"
                    >
                        Request password reset
                    </v-btn>
                    
                    <div class="text-center">
                        <NuxtLink to="/login" class="text-decoration-none text-medium-emphasis">
                            <v-icon icon="mdi-arrow-left" size="small" class="mr-1"></v-icon> Back to login
                        </NuxtLink>
                    </div>
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