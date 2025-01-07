import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, getAuth } from 'firebase/auth';

const useGoogleAuth = () => {

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: '817455873090-vj8qgftod0msnuo65l7v0d4pp2fiia3c.apps.googleusercontent.com',
        iosClientId: '817455873090-4fa79a7qg72nu5tbstivn9li6gg5okhl.apps.googleusercontent.com',
        webClientId: '817455873090-7321qin1jnaou6rmu4a6dfktprioirnr.apps.googleusercontent.com',

    });

    const signInWithGoogle = async () => {
        try {
            const result = await promptAsync();
            if (result.type === 'success') {
                const { id_token } = result.params;
                const auth = getAuth();
                const credential = GoogleAuthProvider.credential(id_token);
                return signInWithCredential(auth, credential);
            }
        } catch (error) {
            throw error;
        }
    };

    return { signInWithGoogle, response };
};

export default useGoogleAuth;
