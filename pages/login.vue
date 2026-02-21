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
                        type="email" 
                        label="Email address" 
                        v-model="email"
                        prepend-inner-icon="mdi-email-outline"
                        variant="outlined"
                        color="primary"
                        required
                    ></v-text-field>

                    <v-text-field 
                        type="password" 
                        label="Password"
                        v-model="password"
                        prepend-inner-icon="mdi-lock-outline"
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
        layout: "auth",
    });
    useHead({
        title: "Login | supaAuth",
    });
    const user = useSupabaseUser();
    const loading = ref(false);
    const authError = ref("");
    const email = ref("");
    const password = ref("");
    const client = useSupabaseAuthClient();
    const router = useRouter();

    watchEffect(async () => {
        if (user.value) {
            console.log("User is logged in");
            console.log(user)
            router.push("/");
        }
    });

    const login = async () => {
        console.log("Logging in user");
        loading.value = true;
        const { error } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        });
        console.log("Login in user");
        if (error) {
            loading.value = false;
            authError.value = "Invalid login credentials";
            setTimeout(() => {
                authError.value = "";
            }, 5000);
        }
    };

    const clearError = () => {
        authError.value = "";
    };
</script>
