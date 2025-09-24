import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage service for React Native
class TokenService {
  private static TOKEN_KEY = 'auth_token';

  static async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  static async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
}

export default TokenService;
