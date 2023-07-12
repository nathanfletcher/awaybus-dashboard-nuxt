<template>
    <div>
        <v-container>
            <v-row no-gutters>
                <v-col></v-col>
                <v-col>
                    <v-sheet class="ma-2 pa-2">
                        <div>
                            <h1>Sign in</h1>
                            <form @submit.prevent="login">
                                <ErrorAlert :error-msg="authError" @clearError="clearError" />

                                <v-text-field type="text" label="Email address" v-model="email"></v-text-field>
                                <v-text-field class="cmCuLh" type="password" label="Password"
                                    v-model="password"></v-text-field>

                                <div>
                                    <v-btn type="submit" :disabled="loading">
                                        <div :class="{ loading: loading }">Sign in</div>
                                    </v-btn>
                                    <br />
                                    <NuxtLink to="/forgot-password" class="me-4">Forgot your password?</NuxtLink>
                                </div>
                            </form>
                            <div class="jGQTZC">
                                <p class="dEDhcH">Don’t have a SupaAuth account?</p>
                                <NuxtLink to="/register">
                                    <v-btn class="me-4"> Create new account </v-btn>
                                </NuxtLink>
                            </div>
                        </div>
                    </v-sheet>
                </v-col>
                <v-col></v-col>
            </v-row>
        </v-container>
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

    watchEffect(async () => {
        if (user.value) {
            await navigateTo("/");
        }
    });

    const login = async () => {
        loading.value = true;
        const { error } = await client.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        });
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
