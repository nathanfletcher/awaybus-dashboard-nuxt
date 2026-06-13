<template>
    <div class="d-flex align-center justify-center fill-height bg-grey-lighten-4" style="min-height: 100vh;">
        <v-card width="100%" max-width="450" class="pa-6 rounded-xl" elevation="4">
            <div class="text-center mb-6">
                <v-icon icon="mdi-bus" size="48" color="primary" class="mb-2"></v-icon>
                <h1 class="text-h4 font-weight-bold text-primary">AwayBus</h1>
                <p class="text-subtitle-1 text-medium-emphasis">Station Master Dashboard</p>
            </div>

            <v-card-text>
                <h3 class="text-h6 font-weight-medium mb-4 text-center">Sign in to your account</h3>
                <form @submit.prevent="login">
                    <ErrorAlert v-if="authError" :error-msg="authError" @clearError="clearError" class="mb-4" />

                    <v-text-field 
                        v-model="email"
                        label="Email address" 
                        prepend-inner-icon="mdi-email-outline"
                        variant="outlined"
                        color="primary"
                        density="comfortable"
                        autofocus
                        :rules="[v => !!v || 'Required']"
                    ></v-text-field>

                    <v-text-field 
                        v-model="password"
                        label="Password"
                        type="password"
                        prepend-inner-icon="mdi-lock-outline"
                        variant="outlined"
                        color="primary"
                        density="comfortable"
                        :rules="[v => !!v || 'Required']"
                    ></v-text-field>

                    <v-btn 
                        type="submit" 
                        color="primary" 
                        size="large" 
                        block 
                        class="mt-2 mb-4"
                        :loading="loading"
                    >
                        Sign in
                    </v-btn>
                    
                    <div class="text-center">
                        <NuxtLink to="/forgot-password" class="text-decoration-none text-primary">Forgot your password?</NuxtLink>
                    </div>
                </form>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup>
    definePageMeta({
        layout: "default",
    });
    useHead({
        title: "Login | AwayBus Station Master",
    });
    const user = useSupabaseUser();
    const loading = ref(false);
    const authError = ref("");
    const email = ref("");
    const password = ref("");
    const client = useSupabaseClient();
    const router = useRouter();

    watchEffect(async () => {
        if (user.value) {
            router.push("/");
        }
    });

    const login = async () => {
        loading.value = true;
        authError.value = "";
        try {
            const { data, error } = await client.auth.signInWithPassword({
                email: email.value,
                password: password.value,
            });
            if (error) {
                authError.value = error.message || "Invalid login credentials";
                loading.value = false;
            } else if (data?.user) {
                router.push("/");
            }
        } catch (e) {
            authError.value = e.message || "Connection failed. Is Supabase running?";
            loading.value = false;
        }
    };

    const clearError = () => {
        authError.value = "";
    };
</script>
